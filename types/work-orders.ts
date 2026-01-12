export interface RawWorkOrder {
  id: string
  raw_text: string
  parsed_data: any
  source: string
  status: string
  error_message?: string
  job_id?: string
  created_at: string
  updated_at: string
}

export type RawWorkOrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'parsed' | 'job_created'

export interface ParsedWorkOrderData {
  trade?: string
  urgency?: string
  address?: string
  description?: string
  [key: string]: any
}
