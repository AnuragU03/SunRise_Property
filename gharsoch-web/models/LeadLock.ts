export interface LeadLock {
  _id?: any;
  lead_id: any;
  acquired_by: string;
  reason: string;
  acquired_at: Date;
  expires_at: Date;
}
