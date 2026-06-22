import { getCollection } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export default async function getPropertyCollection() {
  return await getCollection('properties')
}

export interface Property {
  _id?: ObjectId
  title: string
  type: string
  city: string
  location: string
  price: number
  area_sqft: number
  bedrooms: number
  status: string
  builder: string
  images: string[]
  description: string
  amenities: string[]
  created_at: Date
  updated_at: Date

  // --- Call-corpus pitch fields (all optional) ---
  // What the real broker quotes on every call (voice-agent/call-corpus):
  // carpet sqft, floor, facing, ask price vs realistic close band, maintenance.
  /** Carpet area in sq ft (distinct from built-up area_sqft) — e.g. 690, 723 */
  carpet_area_sqft?: number | null
  /** Floor the unit is on — "27th floor" is part of the pitch */
  floor?: number | null
  /** Facing/vastu orientation, e.g. 'north-east' — sells against vastu objections */
  facing?: string | null
  /** Seller's asking price in INR (price stays the canonical listing price) */
  ask_price?: number | null
  /** Realistic closing band in INR — "they ask 205, closes around 185-190" */
  close_price_min?: number | null
  close_price_max?: number | null
  /** Monthly society maintenance in INR — a real differentiator (18k vs 8k in call 05) */
  maintenance_monthly?: number | null
  /** Furnishing summary, e.g. '3 ACs, modular kitchen, basic fittings' */
  furnishing?: string | null
  /** Number of balconies (0 is a sellable honest fact) */
  balconies?: number | null
  /** Seller urgency note — negotiation leverage ("sellers pressed for time") */
  seller_urgency?: string | null
  /** Monthly rent in INR when the unit is also/only a rental listing */
  rent_monthly?: number | null
}

export const DEFAULT_PROPERTY: Omit<Property, '_id'> = {
  title: '',
  type: '',
  city: '',
  location: '',
  price: 0,
  area_sqft: 0,
  bedrooms: 0,
  status: 'available',
  builder: '',
  images: [],
  description: '',
  amenities: [],
  created_at: new Date(),
  updated_at: new Date(),
}
