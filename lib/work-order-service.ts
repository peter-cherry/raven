import { supabase } from './supabaseClient';
import type { RawWorkOrder, RawWorkOrderStatus, ParsedWorkOrderData } from '@/types/work-orders';

export const workOrderService = {
  /**
   * Submit a raw work order string for parsing
   */
  async submitRawWorkOrder(
    rawText: string,
    orgId: string,
    source: 'email' | 'api' | 'manual' | 'search_input' = 'search_input'
  ): Promise<RawWorkOrder> {
    const { data, error } = await supabase
      .from('raw_work_orders')
      .insert({
        org_id: orgId,
        raw_text: rawText.trim(),
        source,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data as RawWorkOrder;
  },

  /**
   * Get all raw work orders for an organization
   */
  async getRawWorkOrders(
    orgId: string,
    status?: RawWorkOrderStatus
  ): Promise<RawWorkOrder[]> {
    let query = supabase
      .from('raw_work_orders')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as RawWorkOrder[];
  },

  /**
   * Get a single raw work order by ID
   */
  async getRawWorkOrder(id: string): Promise<RawWorkOrder | null> {
    const { data, error } = await supabase
      .from('raw_work_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code === 'PGRST116') return null; // Not found
    if (error) throw error;
    return (data || null) as RawWorkOrder | null;
  },

  /**
   * Update raw work order status (e.g., after parsing)
   */
  async updateRawWorkOrderStatus(
    id: string,
    status: RawWorkOrderStatus,
    updates?: Partial<RawWorkOrder>
  ): Promise<RawWorkOrder> {
    const { data, error } = await supabase
      .from('raw_work_orders')
      .update({ status, ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as RawWorkOrder;
  },

  /**
   * Update parsed data after parsing completes
   */
  async updateParsedData(
    id: string,
    parsedData: ParsedWorkOrderData
  ): Promise<RawWorkOrder> {
    return this.updateRawWorkOrderStatus(id, 'parsed', { parsed_data: parsedData });
  },

  /**
   * Mark raw work order as failed during parsing
   */
  async markParseFailed(id: string, errorMessage: string): Promise<RawWorkOrder> {
    return this.updateRawWorkOrderStatus(id, 'failed', { error_message: errorMessage });
  },

  /**
   * Link raw work order to created job
   */
  async linkToJob(rawWorkOrderId: string, jobId: string): Promise<RawWorkOrder> {
    return this.updateRawWorkOrderStatus(rawWorkOrderId, 'job_created', { job_id: jobId });
  },

  /**
   * Get all pending work orders ready for parsing
   */
  async getPendingWorkOrders(orgId: string): Promise<RawWorkOrder[]> {
    return this.getRawWorkOrders(orgId, 'pending');
  },

  /**
   * Get statistics for raw work orders
   */
  async getWorkOrderStats(orgId: string): Promise<{
    total: number;
    pending: number;
    parsed: number;
    created: number;
    failed: number;
  }> {
    const orders = await this.getRawWorkOrders(orgId);
    
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      parsed: orders.filter(o => o.status === 'parsed').length,
      created: orders.filter(o => o.status === 'job_created').length,
      failed: orders.filter(o => o.status === 'failed').length,
    };
  },
};
