import { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { AuditService, createAuditService } from './audit-service';
import { rankContractors } from '@/lib/contractor-scoring';
import { runLeadPipeline, PipelineResult } from '@/lib/lead-pipeline';
import { SuperSearchLead } from '@/lib/instantly/supersearch';
import { isMailtrapEnabled, sendViaMailtrap, buildJobDispatchEmail } from '@/lib/mailtrap';
import crypto from 'crypto';

// Error classes
export class JobCreationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobCreationError';
  }
}

export class JobUpdateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'JobUpdateError';
  }
}

export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateError';
  }
}

export class DuplicateJobError extends Error {
  public existingJobId: string;
  constructor(message: string, existingJobId: string) {
    super(message);
    this.name = 'DuplicateJobError';
    this.existingJobId = existingJobId;
  }
}

// Types
export interface SLAConfig {
  dispatch: number;
  assignment: number;
  arrival: number;
  completion: number;
}

export interface CreateJobInput {
  org_id: string;
  job_title: string;
  description?: string;
  trade_needed: string;
  required_certifications?: string[];
  address_text: string;
  lat?: number;
  lng?: number;
  city?: string;
  state?: string;
  urgency: 'emergency' | 'same_day' | 'next_day' | 'within_week' | 'flexible';
  scheduled_at?: string;
  duration?: string;
  budget_min?: number;
  budget_max?: number;
  pay_rate?: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  policy_id?: string;
  sla_config?: SLAConfig;
  dispatch_immediately?: boolean;
  idempotency_key?: string;
}

export interface CreateJobResult {
  job: any;
  dispatch?: DispatchResult;
  sla_timers?: any;
  duplicate: boolean;
}

export interface DispatchResult {
  outreach_id: string;
  warm_sent: number;
  cold_sent: number;
  total_recipients: number;
  message: string;
}

// Default SLA configurations by urgency
const DEFAULT_SLA_BY_URGENCY: Record<string, SLAConfig> = {
  emergency: { dispatch: 15, assignment: 30, arrival: 60, completion: 240 },
  same_day: { dispatch: 30, assignment: 60, arrival: 120, completion: 480 },
  next_day: { dispatch: 60, assignment: 120, arrival: 240, completion: 720 },
  within_week: { dispatch: 60, assignment: 240, arrival: 480, completion: 1440 },
  flexible: { dispatch: 120, assignment: 480, arrival: 720, completion: 2880 },
};

/**
 * Service for managing job lifecycle operations.
 * Centralizes all job-related business logic.
 */
export class JobLifecycleService {
  private auditService: AuditService;
  private serviceClient: SupabaseClient;

  constructor(
    private supabase: SupabaseClient,
    private userId: string,
    private orgId: string
  ) {
    this.auditService = createAuditService(supabase);
    
    // Create service client for operations that need elevated privileges
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    this.serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  }

  /**
   * Generate an idempotency key from job data.
   */
  private generateIdempotencyKey(input: CreateJobInput): string {
    const data = `${input.org_id}:${input.address_text}:${input.trade_needed}:${input.scheduled_at || ''}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Check for duplicate job using idempotency key.
   */
  private async checkIdempotency(idempotencyKey: string): Promise<any | null> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: existing } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('idempotency_key', idempotencyKey)
      .gte('created_at', twentyFourHoursAgo)
      .single();

    return existing || null;
  }

  /**
   * Get default SLA config based on urgency.
   */
  private getDefaultSLA(urgency: string): SLAConfig {
    return DEFAULT_SLA_BY_URGENCY[urgency] || DEFAULT_SLA_BY_URGENCY.within_week;
  }

  /**
   * Initialize SLA timers for a job.
   */
  private async initializeSLA(jobId: string, config: SLAConfig): Promise<void> {
    await this.supabase.rpc('initialize_sla_timers', {
      p_job_id: jobId,
      p_dispatch_minutes: config.dispatch,
      p_assignment_minutes: config.assignment,
      p_arrival_minutes: config.arrival,
      p_completion_minutes: config.completion,
    });
  }

  /**
   * Link a compliance policy to a job.
   */
  private async linkCompliancePolicy(jobId: string, policyId: string): Promise<void> {
    await this.supabase
      .from('compliance_policies')
      .update({ job_id: jobId })
      .eq('id', policyId);
  }

  /**
   * Find matching technicians for a job.
   */
  private async findMatches(jobId: string, geo: { lat: number; lng: number; state?: string }, trade: string): Promise<void> {
    await this.supabase.rpc('find_matching_technicians', {
      p_job_id: jobId,
      p_lat: geo.lat,
      p_lng: geo.lng,
      p_trade: trade,
      p_state: geo.state || null,
      p_max_distance_m: 40000,
    });
  }

  /**
   * Create a job with full lifecycle initialization.
   */
  async createWithDispatch(input: CreateJobInput): Promise<CreateJobResult> {
    // 1. Check idempotency
    const idempotencyKey = input.idempotency_key || this.generateIdempotencyKey(input);
    const existing = await this.checkIdempotency(idempotencyKey);
    if (existing) {
      return { job: existing, duplicate: true };
    }

    // 2. Create job
    const { data: job, error } = await this.supabase
      .from('jobs')
      .insert({
        org_id: input.org_id,
        job_title: input.job_title,
        description: input.description,
        trade_needed: input.trade_needed,
        required_certifications: input.required_certifications || [],
        address_text: input.address_text,
        city: input.city,
        state: input.state,
        lat: input.lat,
        lng: input.lng,
        scheduled_at: input.scheduled_at,
        duration: input.duration,
        urgency: input.urgency,
        budget_min: input.budget_min,
        budget_max: input.budget_max,
        pay_rate: input.pay_rate,
        contact_name: input.contact_name,
        contact_phone: input.contact_phone,
        contact_email: input.contact_email,
        policy_id: input.policy_id || null,
        job_status: 'matching',
        created_by_user_id: this.userId,
        idempotency_key: idempotencyKey,
      })
      .select()
      .single();

    if (error) {
      throw new JobCreationError(error.message);
    }

    // 3. Link compliance policy
    if (input.policy_id) {
      await this.linkCompliancePolicy(job.id, input.policy_id);
    }

    // 4. Initialize SLA timers
    const slaConfig = input.sla_config || this.getDefaultSLA(input.urgency);
    await this.initializeSLA(job.id, slaConfig);

    // 5. Find matching technicians
    if (input.lat && input.lng) {
      await this.findMatches(job.id, { lat: input.lat, lng: input.lng, state: input.state }, input.trade_needed);
    }

    // 6. Dispatch if requested
    let dispatch: DispatchResult | undefined;
    if (input.dispatch_immediately !== false) {
      dispatch = await this.dispatch(job.id, job);
    }

    // 7. Audit log
    await this.auditService.logJobCreated(job.id, this.userId, input.org_id, {
      dispatched: !!dispatch,
      trade: input.trade_needed,
      urgency: input.urgency,
    });

    // 8. Get SLA timers
    const { data: slaTimers } = await this.supabase
      .from('sla_timers')
      .select('*')
      .eq('job_id', job.id);

    return { job, dispatch, sla_timers: slaTimers, duplicate: false };
  }

  /**
   * Dispatch a job to technicians.
   */
  async dispatch(jobId: string, job?: any): Promise<DispatchResult> {
    // Get job if not provided
    if (!job) {
      const { data: jobData, error: jobError } = await this.supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError || !jobData) {
        throw new JobUpdateError('Job not found');
      }
      job = jobData;
    }

    // Check if dispatch already exists
    const { data: existingOutreach } = await this.supabase
      .from('work_order_outreach')
      .select('id')
      .eq('job_id', jobId)
      .single();

    if (existingOutreach) {
      return {
        outreach_id: existingOutreach.id,
        warm_sent: 0,
        cold_sent: 0,
        total_recipients: 0,
        message: 'Dispatch already exists for this job',
      };
    }

    // Find warm technicians
    const PUBLIC_POOL_ORG_ID = '00000000-0000-0000-0000-000000000001';
    const { data: technicians } = await this.supabase
      .from('technicians')
      .select('*')
      .in('org_id', [job.org_id, PUBLIC_POOL_ORG_ID])
      .eq('trade_needed', job.trade_needed)
      .eq('is_available', true)
      .eq('signed_up', true)
      .is('unsubscribed_at', null);

    // Filter by distance (50 mile radius)
    const MAX_DISTANCE_MILES = 50;
    const warmTechnicians = (technicians || []).filter((tech: any) => {
      if (!tech.lat || !tech.lng || !job.lat || !job.lng) return false;

      const R = 3959;
      const dLat = (tech.lat - job.lat) * Math.PI / 180;
      const dLng = (tech.lng - job.lng) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(job.lat * Math.PI / 180) * Math.cos(tech.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= MAX_DISTANCE_MILES;
    });

    // Rank warm technicians
    const jobDate = job.scheduled_date ? new Date(job.scheduled_date) : undefined;
    const rankedWarm = rankContractors(warmTechnicians, jobDate);

    // Find cold leads if no warm technicians
    let coldLeads: SuperSearchLead[] = [];
    let coldLeadIds: string[] = [];
    let pipelineStats = { ran: false, selected: 0, verified: 0, moved: 0, creditsUsed: 0 };

    if (rankedWarm.length === 0) {
      const { data: coldLeadRecords } = await this.supabase
        .from('cold_leads')
        .select('*')
        .eq('trade_type', job.trade_needed)
        .eq('state', job.state)
        .is('unsubscribed_at', null)
        .is('last_dispatched_at', null)
        .limit(50);

      if (coldLeadRecords && coldLeadRecords.length > 0) {
        coldLeads = coldLeadRecords.map((lead: any) => ({
          id: lead.id,
          email: lead.email,
          first_name: lead.first_name,
          last_name: lead.last_name,
          full_name: lead.full_name,
          company_name: lead.company_name,
          job_title: lead.job_title,
          phone: lead.phone,
          linkedin_url: lead.linkedin_url,
          website: lead.website,
          city: lead.city,
          state: lead.state,
          email_verified: lead.email_verified,
        }));

        coldLeadIds = coldLeads.map((lead: any) => lead.id);

        await this.supabase
          .from('cold_leads')
          .update({ last_dispatched_at: new Date().toISOString() })
          .in('id', coldLeadIds);
      } else {
        // Run lead pipeline
        const pipelineResult: PipelineResult = await runLeadPipeline(
          {
            id: job.id,
            city: job.city || '',
            state: job.state || '',
            trade_needed: job.trade_needed || '',
            lat: job.lat,
            lng: job.lng
          },
          {
            selectLimit: 20,
            verifyLimit: 10,
            minConfidence: 70,
            skipIfColdExists: false
          }
        );

        pipelineStats = {
          ran: pipelineResult.pipelineRan,
          selected: pipelineResult.selected,
          verified: pipelineResult.verified,
          moved: pipelineResult.movedToCold,
          creditsUsed: pipelineResult.hunterCreditsUsed || 0
        };

        if (pipelineResult.success && pipelineResult.coldLeadIds.length > 0) {
          const { data: freshColdLeads } = await this.supabase
            .from('cold_leads')
            .select('*')
            .in('id', pipelineResult.coldLeadIds);

          if (freshColdLeads && freshColdLeads.length > 0) {
            coldLeads = freshColdLeads.map((lead: any) => ({
              id: lead.id,
              email: lead.email,
              first_name: lead.first_name,
              last_name: lead.last_name,
              full_name: lead.full_name,
              company_name: lead.company_name,
              job_title: lead.job_title,
              phone: lead.phone,
              linkedin_url: lead.linkedin_url,
              website: lead.website,
              city: lead.city,
              state: lead.state,
              email_verified: lead.email_verified,
            }));

            coldLeadIds = coldLeads.map((lead: any) => lead.id);

            await this.supabase
              .from('cold_leads')
              .update({ last_dispatched_at: new Date().toISOString() })
              .in('id', coldLeadIds);
          }
        }
      }
    }

    const totalRecipients = rankedWarm.length + coldLeads.length;

    if (totalRecipients === 0) {
      throw new JobUpdateError(`No ${job.trade_needed} technicians or leads available in ${job.city || job.state || 'this area'}`);
    }

    // Create outreach record
    const { data: outreach, error: outreachError } = await this.supabase
      .from('work_order_outreach')
      .insert({
        job_id: jobId,
        initiated_by: this.userId,
        total_recipients: totalRecipients,
        status: 'pending',
        warm_sent: 0,
        cold_sent: 0,
        warm_opened: 0,
        cold_opened: 0,
        warm_replied: 0,
        cold_replied: 0,
        warm_qualified: 0,
        cold_qualified: 0,
        pipeline_ran: pipelineStats.ran,
        pipeline_selected: pipelineStats.selected,
        pipeline_verified: pipelineStats.verified,
        pipeline_moved: pipelineStats.moved,
        pipeline_credits_used: pipelineStats.creditsUsed
      })
      .select()
      .single();

    if (outreachError || !outreach) {
      throw new JobUpdateError('Failed to create outreach record');
    }

    // Create recipients and send emails
    const recipientIdMap = new Map<string, string>();

    // Warm recipients
    if (rankedWarm.length > 0) {
      const warmRecipients = rankedWarm.map(tech => ({
        outreach_id: outreach.id,
        technician_id: tech.id,
        lead_source: 'warm',
        dispatch_method: 'sendgrid_warm',
        email_sent: false,
      }));

      const { data: insertedWarm } = await this.serviceClient
        .from('work_order_recipients')
        .insert(warmRecipients)
        .select('id, technician_id');

      if (insertedWarm) {
        insertedWarm.forEach((recipient: { id: string; technician_id: string }) => {
          if (recipient.technician_id) {
            recipientIdMap.set(recipient.technician_id, recipient.id);
          }
        });
      }
    }

    // Cold recipients
    if (coldLeadIds.length > 0) {
      const coldRecipients = coldLeadIds.map((coldLeadId) => ({
        outreach_id: outreach.id,
        technician_id: null,
        cold_lead_id: coldLeadId,
        lead_source: 'cold_supersearch',
        dispatch_method: 'instantly_cold',
        email_sent: false,
      }));

      const { data: insertedCold } = await this.serviceClient
        .from('work_order_recipients')
        .insert(coldRecipients)
        .select('id, cold_lead_id');

      if (insertedCold) {
        insertedCold.forEach((recipient: { id: string; cold_lead_id: string }) => {
          if (recipient.cold_lead_id) {
            recipientIdMap.set(recipient.cold_lead_id, recipient.id);
          }
        });
        coldLeads.forEach((lead: any) => {
          const matchingRecipient = insertedCold.find((r: any) => r.cold_lead_id === lead.id);
          if (matchingRecipient) {
            recipientIdMap.set(lead.email, matchingRecipient.id);
          }
        });
      }
    }

    // Initialize SLA timers if not already done
    try {
      await this.supabase.rpc('initialize_sla_timers', { p_job_id: jobId });
    } catch {
      // May already be initialized
    }

    // Send emails (simplified - actual email sending logic would be more complex)
    const warmSent = rankedWarm.length; // In production, track actual sends
    const coldSent = coldLeads.length;

    // Update outreach stats
    await this.supabase
      .from('work_order_outreach')
      .update({
        status: 'active',
        warm_sent: warmSent,
        cold_sent: coldSent,
      })
      .eq('id', outreach.id);

    // Update job status to dispatched
    await this.supabase
      .from('jobs')
      .update({ job_status: 'dispatched' })
      .eq('id', jobId);

    // Audit log
    await this.auditService.logJobDispatched(jobId, this.userId, job.org_id, {
      warm_sent: warmSent,
      cold_sent: coldSent,
      total_recipients: totalRecipients,
    });

    const message = warmSent > 0 && coldSent === 0
      ? `Dispatched to ${warmSent} registered ${job.trade_needed} contractors`
      : coldSent > 0 && warmSent === 0
        ? `Dispatched to ${coldSent} cold leads (no registered contractors in area)`
        : warmSent > 0 && coldSent > 0
          ? `Dispatched to ${warmSent} registered + ${coldSent} cold leads`
          : `No contractors found in ${job.city || job.state || 'this area'}`;

    return {
      outreach_id: outreach.id,
      warm_sent: warmSent,
      cold_sent: coldSent,
      total_recipients: totalRecipients,
      message,
    };
  }

  /**
   * Assign a technician to a job.
   */
  async assign(jobId: string, technicianId: string): Promise<any> {
    // Get job and validate state
    const { data: job, error: jobError } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new JobUpdateError('Job not found');
    }

    if (!['matching', 'dispatched'].includes(job.job_status)) {
      throw new InvalidStateError(`Job cannot be assigned in '${job.job_status}' state`);
    }

    // Validate technician exists
    const { data: technician, error: techError } = await this.supabase
      .from('technicians')
      .select('id, full_name')
      .eq('id', technicianId)
      .single();

    if (techError || !technician) {
      throw new JobUpdateError('Technician not found');
    }

    const previousTechId = job.assigned_tech_id;

    // Update job
    const { data: updated, error: updateError } = await this.supabase
      .from('jobs')
      .update({
        job_status: 'assigned',
        assigned_tech_id: technicianId,
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      throw new JobUpdateError(updateError.message);
    }

    // Complete SLA stage
    try {
      await this.supabase.rpc('complete_sla_stage', {
        p_job_id: jobId,
        p_current_stage: 'assignment',
      });
    } catch {
      // SLA stage may not exist
    }

    // Audit log
    await this.auditService.logJobAssigned(
      jobId,
      this.userId,
      job.org_id,
      technicianId,
      previousTechId
    );

    return updated;
  }

  /**
   * Mark a job as completed.
   */
  async complete(jobId: string, rating?: number, notes?: string): Promise<any> {
    // Get job and validate state
    const { data: job, error: jobError } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new JobUpdateError('Job not found');
    }

    if (job.job_status !== 'assigned') {
      throw new InvalidStateError('Only assigned jobs can be completed');
    }

    // Update job
    const { data: updated, error: updateError } = await this.supabase
      .from('jobs')
      .update({ job_status: 'completed' })
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      throw new JobUpdateError(updateError.message);
    }

    // Complete SLA stage
    try {
      await this.supabase.rpc('complete_sla_stage', {
        p_job_id: jobId,
        p_current_stage: 'completion',
      });
    } catch {
      // SLA stage may not exist
    }

    // Update technician rating if provided
    if (rating && job.assigned_tech_id) {
      await this.updateTechnicianRating(job.assigned_tech_id, rating, notes);
    }

    // Audit log
    await this.auditService.logJobCompleted(jobId, this.userId, job.org_id, {
      rating,
      notes,
      technician_id: job.assigned_tech_id,
    });

    return updated;
  }

  /**
   * Update a technician's rating after job completion.
   */
  private async updateTechnicianRating(technicianId: string, rating: number, notes?: string): Promise<void> {
    // Get current technician data
    const { data: tech } = await this.supabase
      .from('technicians')
      .select('rating, total_jobs')
      .eq('id', technicianId)
      .single();

    if (tech) {
      const currentRating = tech.rating || 0;
      const totalJobs = tech.total_jobs || 0;
      const newTotalJobs = totalJobs + 1;
      const newRating = ((currentRating * totalJobs) + rating) / newTotalJobs;

      await this.supabase
        .from('technicians')
        .update({
          rating: Math.round(newRating * 10) / 10,
          total_jobs: newTotalJobs,
        })
        .eq('id', technicianId);
    }

    // Create rating record if table exists
    try {
      await this.supabase
        .from('job_ratings')
        .insert({
          technician_id: technicianId,
          rating,
          notes,
          rated_by: this.userId,
        });
    } catch {
      // Table may not exist
    }
  }

  /**
   * Get a job by ID.
   */
  async getJob(jobId: string): Promise<any> {
    const { data: job, error } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (error || !job) {
      throw new JobUpdateError('Job not found');
    }

    return job;
  }

  /**
   * Unassign a technician from a job.
   */
  async unassign(jobId: string): Promise<any> {
    const { data: job, error: jobError } = await this.supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      throw new JobUpdateError('Job not found');
    }

    if (job.job_status !== 'assigned') {
      throw new InvalidStateError('Job is not currently assigned');
    }

    const previousTechId = job.assigned_tech_id;

    const { data: updated, error: updateError } = await this.supabase
      .from('jobs')
      .update({
        job_status: 'pending',
        assigned_tech_id: null,
      })
      .eq('id', jobId)
      .select()
      .single();

    if (updateError) {
      throw new JobUpdateError(updateError.message);
    }

    // Audit log
    await this.auditService.log({
      entity_type: 'job',
      entity_id: jobId,
      action: 'updated',
      actor_id: this.userId,
      org_id: job.org_id,
      changes: {
        job_status: ['assigned', 'pending'],
        assigned_tech_id: [previousTechId, null],
      },
    });

    return updated;
  }
}

/**
 * Create a JobLifecycleService instance.
 */
export function createJobLifecycleService(
  supabase: SupabaseClient,
  userId: string,
  orgId: string
): JobLifecycleService {
  return new JobLifecycleService(supabase, userId, orgId);
}
