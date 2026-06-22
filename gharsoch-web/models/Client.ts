import { ObjectId } from "mongodb";

export interface Client {
  _id?: ObjectId;
  broker_id: string;
  name: string;
  phone: string;
  email?: string;
  source: 'web_form' | 'csv_upload' | 'manual' | 'referral';
  property_type?: '1BHK' | '2BHK' | '3BHK' | '4BHK' | 'Villa' | string;
  budget_range?: string;
  location_pref?: string;
  notes?: string;
  conversion_status: 'pending' | 'converting' | 'converted' | 'rejected';
  conversion_reason?: string;
  lead_id?: ObjectId;
  lead_score?: number;
  created_at: Date;
  updated_at: Date;

  // Requirement-spec fields (call corpus) — copied onto the Lead at conversion
  purpose?: 'buy' | 'rent';
  min_carpet_sqft?: number;
  facing_pref?: string;
  area_reason?: string;
  /** Existing warm relationship — routes to the generic warm re-engage agent. */
  is_warm_lead?: boolean;

  // G7: Previous engagement fields (optional)
  last_visit_type?: 'site_visit' | 'office_walkin' | 'phone_enquiry' | 'online_form';
  last_visit_property_id?: string;
  last_visit_date?: Date | null;
  last_visit_property?: string;
  last_visit_summary?: string;
}
