import { SupabaseClient } from '@supabase/supabase-js';

export type AuditEntityType = 'job' | 'credential' | 'membership' | 'organization' | 'technician';
export type AuditAction = 'created' | 'updated' | 'deleted' | 'assigned' | 'completed' | 'dispatched' | 'cancelled';

export interface AuditLogEntry {
  entity_type: AuditEntityType;
  entity_id: string;
  action: AuditAction;
  actor_id: string;
  org_id?: string;
  changes?: Record<string, [unknown, unknown]>; // { field: [old_value, new_value] }
  metadata?: Record<string, unknown>;
}

export interface AuditLogRecord extends AuditLogEntry {
  id: string;
  created_at: string;
}

/**
 * Service for creating audit log entries.
 * Provides a centralized way to track all business entity changes.
 */
export class AuditService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Log an audit entry for a business action.
   */
  async log(entry: AuditLogEntry): Promise<string | null> {
    try {
      const { data, error } = await this.supabase
        .from('audit_log')
        .insert({
          entity_type: entry.entity_type,
          entity_id: entry.entity_id,
          action: entry.action,
          actor_id: entry.actor_id,
          org_id: entry.org_id,
          changes: entry.changes || null,
          metadata: entry.metadata || null,
        })
        .select('id')
        .single();

      if (error) {
        // Log error but don't throw - audit logging should not break business operations
        console.error('[AuditService] Failed to create audit log:', error);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      console.error('[AuditService] Unexpected error:', err);
      return null;
    }
  }

  /**
   * Log a job creation event.
   */
  async logJobCreated(
    jobId: string,
    actorId: string,
    orgId: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.log({
      entity_type: 'job',
      entity_id: jobId,
      action: 'created',
      actor_id: actorId,
      org_id: orgId,
      metadata,
    });
  }

  /**
   * Log a job assignment event.
   */
  async logJobAssigned(
    jobId: string,
    actorId: string,
    orgId: string,
    technicianId: string,
    previousTechId?: string | null
  ): Promise<string | null> {
    return this.log({
      entity_type: 'job',
      entity_id: jobId,
      action: 'assigned',
      actor_id: actorId,
      org_id: orgId,
      changes: {
        assigned_tech_id: [previousTechId || null, technicianId],
      },
      metadata: { technician_id: technicianId },
    });
  }

  /**
   * Log a job completion event.
   */
  async logJobCompleted(
    jobId: string,
    actorId: string,
    orgId: string,
    metadata?: Record<string, unknown>
  ): Promise<string | null> {
    return this.log({
      entity_type: 'job',
      entity_id: jobId,
      action: 'completed',
      actor_id: actorId,
      org_id: orgId,
      metadata,
    });
  }

  /**
   * Log a job dispatch event.
   */
  async logJobDispatched(
    jobId: string,
    actorId: string,
    orgId: string,
    dispatchStats: { warm_sent: number; cold_sent: number; total_recipients: number }
  ): Promise<string | null> {
    return this.log({
      entity_type: 'job',
      entity_id: jobId,
      action: 'dispatched',
      actor_id: actorId,
      org_id: orgId,
      metadata: dispatchStats,
    });
  }

  /**
   * Log a credential change event.
   */
  async logCredentialChange(
    credentialType: 'license' | 'insurance' | 'certification',
    credentialId: string,
    action: 'created' | 'updated' | 'deleted',
    actorId: string,
    contractorId: string,
    changes?: Record<string, [unknown, unknown]>
  ): Promise<string | null> {
    return this.log({
      entity_type: 'credential',
      entity_id: credentialId,
      action,
      actor_id: actorId,
      metadata: {
        credential_type: credentialType,
        contractor_id: contractorId,
      },
      changes,
    });
  }

  /**
   * Get audit log entries for an entity.
   */
  async getEntityHistory(
    entityType: AuditEntityType,
    entityId: string,
    limit = 50
  ): Promise<AuditLogRecord[]> {
    const { data, error } = await this.supabase
      .from('audit_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[AuditService] Failed to fetch entity history:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get audit log entries for an organization.
   */
  async getOrgHistory(
    orgId: string,
    options: { limit?: number; entityType?: AuditEntityType } = {}
  ): Promise<AuditLogRecord[]> {
    let query = this.supabase
      .from('audit_log')
      .select('*')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })
      .limit(options.limit || 100);

    if (options.entityType) {
      query = query.eq('entity_type', options.entityType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AuditService] Failed to fetch org history:', error);
      return [];
    }

    return data || [];
  }
}

/**
 * Create an AuditService instance with the provided Supabase client.
 */
export function createAuditService(supabase: SupabaseClient): AuditService {
  return new AuditService(supabase);
}
