'use server';

import { revalidatePath } from 'next/cache';
import { ObjectId } from 'mongodb';

import { auth, requireRole } from '@/lib/auth';
import { requireBrokerId, BrokerScopeMissingError } from '@/lib/auth/requireBroker';
import { getCollection } from '@/lib/mongodb';
import { clientService, softDeleteClientCascade } from '@/lib/services/clientService';

export async function createClientAction(formData: FormData) {
  await requireRole(['admin', 'tech']);
  const session = await auth();

  let brokerId: string;
  try {
    brokerId = requireBrokerId(session);
  } catch (e) {
    if (e instanceof BrokerScopeMissingError) {
      return {
        success: false,
        error: 'broker_scope_missing',
        message: 'Your account is not provisioned for a brokerage. Contact admin.',
      };
    }
    throw e;
  }

  // Phase 11.5: stamp and filter clients by session.user.brokerage_id.
  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string | null;
  const source = formData.get('source') as string;
  const property_type = formData.get('property_type') as string;
  const budget_range = formData.get('budget_range') as string;
  const location_pref = formData.get('location_pref') as string;
  const notes = formData.get('notes') as string | null;

  // Requirement-spec fields (call corpus)
  const purpose = String(formData.get('purpose') || '').trim();
  const min_carpet_raw = String(formData.get('min_carpet_sqft') || '').trim();
  const facing_pref = String(formData.get('facing_pref') || '').trim();
  const area_reason = String(formData.get('area_reason') || '').trim();
  // Warm contact = existing relationship → routes to the generic warm agent.
  const is_warm_lead = String(formData.get('is_warm_lead') || '') === 'true';

  // G7: engagement fields
  const last_visit_type = formData.get('last_visit_type') as string | null;
  const last_visit_property_id = formData.get('last_visit_property_id') as string | null;
  const last_visit_date = formData.get('last_visit_date') as string | null;
  const last_visit_property = formData.get('last_visit_property') as string | null;
  const last_visit_summary = formData.get('last_visit_summary') as string | null;

  if (!name || !phone) {
    return { success: false, error: 'Name and phone are required.' };
  }

  const payload: Record<string, any> = {
    name,
    phone,
    email: email || '',
    source: source || 'manual',
    property_type: property_type || '',
    budget_range: budget_range || '',
    location_pref: location_pref || '',
    notes: notes || '',
    ...(purpose === 'buy' || purpose === 'rent' ? { purpose } : {}),
    ...(min_carpet_raw && Number.isFinite(Number(min_carpet_raw)) ? { min_carpet_sqft: Number(min_carpet_raw) } : {}),
    ...(facing_pref ? { facing_pref } : {}),
    ...(area_reason ? { area_reason } : {}),
    ...(is_warm_lead ? { is_warm_lead: true } : {}),
  };

  // G7: attach engagement fields if all 3 required fields present
  if (last_visit_type && last_visit_property_id && last_visit_date) {
    payload.last_visit_type = last_visit_type;
    payload.last_visit_property_id = last_visit_property_id;
    payload.last_visit_date = new Date(last_visit_date + 'T11:00:00+05:30');
    payload.last_visit_property = last_visit_property || '';
    payload.last_visit_summary = last_visit_summary || '';
  }

  try {
    // Dedup check: query directly to ensure broker-scoping (listClients doesn't support it yet)
    const clientsCol = await getCollection('clients');
    const existing = await clientsCol.findOne({
      phone,
      broker_id: brokerId,
      is_deleted: { $ne: true },
    });

    if (existing) {
      return { success: false, error: 'A client with this phone number already exists.' };
    }

    const client = await clientService.createClient({
      ...payload,
      broker_id: brokerId,
    });

    // Orchestrator-governed fan-out: converter qualifies → emits lead.qualified →
    // confidence gate decides the matchmaker dial. (Replaces the inline
    // converter→matchmaker chain so this action isn't a second routing authority.)
    const { dispatchEvent } = await import('@/lib/orchestrator');
    dispatchEvent({ type: 'client.created', clientId: client._id!.toString() });

    revalidatePath('/clients');
    revalidatePath('/ai-operations');

    return { success: true };
  } catch (error: any) {
    console.error('Server action error:', error);
    return { success: false, error: 'Internal server error during client creation.' };
  }
}

export async function updateClientAction(formData: FormData) {
  await requireRole(['admin', 'tech']);
  const session = await auth();

  let brokerId: string;
  try {
    brokerId = requireBrokerId(session);
  } catch (e) {
    if (e instanceof BrokerScopeMissingError) {
      return {
        ok: false,
        error: 'broker_scope_missing',
        message: 'Your account is not provisioned for a brokerage. Contact admin.',
      };
    }
    throw e;
  }

  const clientId = String(formData.get('id') || '').trim();
  if (!ObjectId.isValid(clientId)) {
    return { ok: false, error: 'Invalid client ID' };
  }

  const updates: Record<string, unknown> = {};
  const allowedFields = ['name', 'phone', 'email', 'budget_range', 'location_pref', 'property_type', 'notes'] as const;

  allowedFields.forEach((field) => {
    if (!formData.has(field)) return;
    const value = String(formData.get(field) || '').trim();
    updates[field] = value;
  });

  if (Object.keys(updates).length === 0) {
    return { ok: false, error: 'No valid client fields provided for update.' };
  }

  try {
    const col = await getCollection('clients');
    const result = await col.updateOne(
      {
        _id: new ObjectId(clientId),
        broker_id: brokerId,
        is_deleted: { $ne: true },
      },
      {
        $set: {
          ...updates,
          updated_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return { ok: false, error: 'Client not found or access denied' };
    }

    revalidatePath('/clients');
    revalidatePath('/ai-operations');
    return { ok: true };
  } catch (error: any) {
    console.error('[UPDATE_CLIENT]', error);
    return { ok: false, error: error?.message || 'Failed to update client.' };
  }
}

export async function deleteClientAction(clientId: string) {
  await requireRole(['admin', 'tech']);
  const session = await auth();

  let brokerId: string;
  try {
    brokerId = requireBrokerId(session);
  } catch (e) {
    if (e instanceof BrokerScopeMissingError) {
      return {
        ok: false,
        error: 'broker_scope_missing',
        message: 'Your account is not provisioned for a brokerage. Contact admin.',
      };
    }
    throw e;
  }

  if (!ObjectId.isValid(clientId)) {
    return { ok: false, error: 'Invalid client ID' };
  }

  try {
    const result = await softDeleteClientCascade(clientId, brokerId);

    if (!result.ok) {
      const errorMsg = result.error === 'client_not_found_or_access_denied'
        ? 'Client not found or access denied'
        : `Failed to delete client: ${result.error}`;
      return { ok: false, error: errorMsg };
    }

    revalidatePath('/clients');
    revalidatePath('/leads');
    revalidatePath('/ai-operations');
    return {
      ok: true,
      leads_deleted: result.leads_deleted,
      appointments_deleted: result.appointments_deleted,
      calls_superseded: result.calls_superseded,
    };
  } catch (err) {
    console.error('[DELETE_CLIENT_CASCADE]', err);
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
