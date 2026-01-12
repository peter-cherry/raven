// Site Types - For managing service locations and multi-site operations

/**
 * Base Site interface matching database schema
 * Represents a physical location where work orders are performed
 */
export interface Site {
  id: string
  org_id: string

  // Basic Information
  name: string
  site_type: 'commercial' | 'residential' | 'industrial' | 'institutional'

  // Location Details
  address_text: string
  city: string | null
  state: string | null
  zip_code: string | null
  lat: number | null
  lng: number | null

  // Contact Information
  primary_contact_name: string | null
  primary_contact_phone: string | null
  primary_contact_email: string | null

  // Site Details
  square_footage: number | null
  building_age: number | null
  number_of_floors: number | null
  operating_hours: string | null

  // Metadata
  notes: string | null
  tags: string[] | null
  is_active: boolean

  // Timestamps
  created_at: string
  updated_at: string
  created_by: string | null
}

/**
 * Site with aggregated statistics
 * Extends base Site with work order metrics
 */
export interface SiteWithStats extends Site {
  // Work Order Statistics
  work_order_count: number
  pending_work_orders: number
  completed_work_orders: number

  // Cost Metrics
  total_cost: number
  avg_cost: number

  // Performance Metrics
  avg_completion_time: number | null // in days
  last_service_date: string | null
}

/**
 * Input type for creating new sites
 * Omits auto-generated fields (id, timestamps)
 */
export interface SiteCreateInput {
  org_id: string

  // Required fields
  name: string
  site_type: 'commercial' | 'residential' | 'industrial' | 'institutional'
  address_text: string

  // Location Details (optional)
  city?: string
  state?: string
  zip_code?: string
  lat?: number
  lng?: number

  // Contact Information (optional)
  primary_contact_name?: string
  primary_contact_phone?: string
  primary_contact_email?: string

  // Site Details (optional)
  square_footage?: number
  building_age?: number
  number_of_floors?: number
  operating_hours?: string

  // Metadata (optional)
  notes?: string
  tags?: string[]
  is_active?: boolean

  created_by?: string
}

/**
 * Input type for updating sites
 * All fields optional except id
 */
export interface SiteUpdateInput {
  id: string

  // Optional fields
  name?: string
  site_type?: 'commercial' | 'residential' | 'industrial' | 'institutional'
  address_text?: string
  city?: string
  state?: string
  zip_code?: string
  lat?: number
  lng?: number
  primary_contact_name?: string
  primary_contact_phone?: string
  primary_contact_email?: string
  square_footage?: number
  building_age?: number
  number_of_floors?: number
  operating_hours?: string
  notes?: string
  tags?: string[]
  is_active?: boolean
}

/**
 * Type for CSV import rows
 * Represents raw data from CSV files for bulk site imports
 */
export interface SiteImportRow {
  // Required
  name: string
  site_type: string // Will be validated against enum
  address: string

  // Location
  city?: string
  state?: string
  zip_code?: string

  // Contact
  contact_name?: string
  contact_phone?: string
  contact_email?: string

  // Details
  square_footage?: string | number
  building_age?: string | number
  floors?: string | number
  operating_hours?: string

  // Metadata
  notes?: string
  tags?: string // Comma-separated values
}

/**
 * Type for site validation errors during import
 */
export interface SiteImportError {
  row: number
  field: string
  message: string
  value?: any
}

/**
 * Result of bulk site import operation
 */
export interface SiteImportResult {
  success: boolean
  created_count: number
  error_count: number
  errors: SiteImportError[]
  created_sites: Site[]
}

/**
 * Site filter options for querying
 */
export interface SiteFilterOptions {
  org_id: string
  site_type?: 'commercial' | 'residential' | 'industrial' | 'institutional'
  is_active?: boolean
  state?: string
  city?: string
  tags?: string[]
  search?: string // Search across name, address, notes
}

/**
 * Site sort options
 */
export type SiteSortField =
  | 'name'
  | 'created_at'
  | 'updated_at'
  | 'work_order_count'
  | 'total_cost'
  | 'last_service_date'

export interface SiteSortOptions {
  field: SiteSortField
  direction: 'asc' | 'desc'
}
