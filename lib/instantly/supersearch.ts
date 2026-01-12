/**
 * Instantly SuperSearch Integration
 *
 * Uses Instantly's SuperSearch API (V2) to find B2B contacts
 * for cold outreach during job dispatch.
 *
 * Documentation: https://developer.instantly.ai/
 * Required: Growth plan ($37/mo) or higher with supersearch_enrichments:all scope
 */

const INSTANTLY_API_V2_BASE = 'https://api.instantly.ai/api/v2';

export interface SuperSearchLead {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  company_name?: string;
  job_title?: string;
  phone?: string;
  linkedin_url?: string;
  website?: string;
  city?: string;
  state?: string;
  country?: string;
  email_verified?: boolean;
}

export interface SuperSearchResult {
  success: boolean;
  leads: SuperSearchLead[];
  resource_id?: string;
  credits_used?: number;
  error?: string;
}

export interface JobContext {
  id: string;
  trade_needed: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
}

/**
 * Instantly V2 API Client with SuperSearch support
 */
export class InstantlyV2Client {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.INSTANTLY_API_KEY || '';

    if (!this.apiKey) {
      console.warn('[InstantlyV2] No API key provided. Set INSTANTLY_API_KEY environment variable.');
    }
  }

  /**
   * Make authenticated request to Instantly V2 API
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${INSTANTLY_API_V2_BASE}${endpoint}`;

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });
  }

  /**
   * Search for leads using SuperSearch AI
   * Uses natural language query to find B2B contacts
   *
   * @param query Natural language search (e.g., "HVAC contractors in Orlando FL")
   * @param limit Maximum results to return (default 50)
   */
  async superSearch(query: string, limit: number = 50): Promise<SuperSearchResult> {
    try {
      console.log(`[SuperSearch] Searching: "${query}" (limit: ${limit})`);

      const response = await this.request('/supersearch-enrichment/ai', {
        method: 'POST',
        body: JSON.stringify({
          query,
          limit,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SuperSearch] Search failed:', response.status, errorText);
        return {
          success: false,
          leads: [],
          error: `SuperSearch failed: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      // Map API response to our interface
      const leads: SuperSearchLead[] = (data.leads || data.results || []).map((lead: any) => ({
        id: lead.id || lead.lead_id,
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        full_name: lead.full_name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        company_name: lead.company_name || lead.company,
        job_title: lead.job_title || lead.title,
        phone: lead.phone || lead.phone_number,
        linkedin_url: lead.linkedin_url || lead.linkedin,
        website: lead.website,
        city: lead.city,
        state: lead.state,
        country: lead.country || 'US',
        email_verified: lead.email_verified || lead.verified,
      }));

      console.log(`[SuperSearch] Found ${leads.length} leads`);

      return {
        success: true,
        leads,
        resource_id: data.resource_id,
        credits_used: data.credits_used || leads.length * 1.5, // Estimate ~1.5 credits per lead
      };
    } catch (error) {
      console.error('[SuperSearch] Error:', error);
      return {
        success: false,
        leads: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Enrich leads with verified email addresses
   * Uses waterfall enrichment for best deliverability
   *
   * @param leadIds Array of lead IDs from superSearch
   */
  async enrichLeads(leadIds: string[]): Promise<SuperSearchResult> {
    try {
      console.log(`[SuperSearch] Enriching ${leadIds.length} leads`);

      const response = await this.request('/supersearch-enrichment/enrich-leads-from-supersearch', {
        method: 'POST',
        body: JSON.stringify({
          lead_ids: leadIds,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SuperSearch] Enrichment failed:', response.status, errorText);
        return {
          success: false,
          leads: [],
          error: `Enrichment failed: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();

      const leads: SuperSearchLead[] = (data.leads || []).map((lead: any) => ({
        id: lead.id,
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        full_name: lead.full_name,
        company_name: lead.company_name,
        job_title: lead.job_title,
        phone: lead.phone,
        email_verified: true, // Enriched leads are verified
      }));

      return {
        success: true,
        leads,
        resource_id: data.resource_id,
        credits_used: data.credits_used,
      };
    } catch (error) {
      console.error('[SuperSearch] Enrichment error:', error);
      return {
        success: false,
        leads: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Add leads to an Instantly campaign for email sending
   */
  async addLeadsToCampaign(
    campaignId: string,
    leads: SuperSearchLead[],
    customVariables?: Record<string, any>
  ): Promise<{ success: boolean; added: number; errors?: any[] }> {
    try {
      const formattedLeads = leads.map(lead => ({
        email: lead.email,
        first_name: lead.first_name,
        last_name: lead.last_name,
        company_name: lead.company_name,
        phone_number: lead.phone,
        website: lead.website,
        custom_variables: {
          ...customVariables,
          job_title: lead.job_title,
          linkedin_url: lead.linkedin_url,
        },
      }));

      const response = await this.request('/lead/add', {
        method: 'POST',
        body: JSON.stringify({
          campaign_id: campaignId,
          leads: formattedLeads,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Instantly] Add leads failed:', errorText);
        return { success: false, added: 0, errors: [errorText] };
      }

      const data = await response.json();

      return {
        success: true,
        added: formattedLeads.length,
        errors: data.errors || [],
      };
    } catch (error) {
      console.error('[Instantly] Add leads error:', error);
      return { success: false, added: 0, errors: [error] };
    }
  }

  /**
   * List unread emails (replies) for polling
   */
  async listUnreadEmails(limit: number = 100): Promise<any[]> {
    try {
      const response = await this.request(`/email/list?is_read=false&limit=${limit}`, {
        method: 'GET',
      });

      if (!response.ok) {
        console.error('[Instantly] List emails failed:', response.status);
        return [];
      }

      const data = await response.json();
      return data.emails || data || [];
    } catch (error) {
      console.error('[Instantly] List emails error:', error);
      return [];
    }
  }

  /**
   * Mark email as read
   */
  async markEmailRead(emailId: string): Promise<boolean> {
    try {
      const response = await this.request(`/email/${emailId}/read`, {
        method: 'POST',
      });

      return response.ok;
    } catch (error) {
      console.error('[Instantly] Mark read error:', error);
      return false;
    }
  }
}

/**
 * Find cold leads for a job using SuperSearch
 * Main entry point for cold dispatch
 */
export async function findColdLeads(
  job: JobContext,
  existingEmails: string[] = []
): Promise<SuperSearchLead[]> {
  const client = new InstantlyV2Client();

  // Build natural language query based on job context
  const location = job.city && job.state
    ? `${job.city}, ${job.state}`
    : job.state || 'United States';

  const query = `${job.trade_needed} contractors in ${location}`;

  console.log(`[findColdLeads] Query: "${query}" for job ${job.id}`);

  // Search for leads
  const searchResult = await client.superSearch(query, 50);

  if (!searchResult.success || searchResult.leads.length === 0) {
    console.log('[findColdLeads] No leads found or search failed');
    return [];
  }

  // Filter out leads we've already contacted
  const newLeads = searchResult.leads.filter(
    lead => !existingEmails.includes(lead.email.toLowerCase())
  );

  console.log(`[findColdLeads] Found ${newLeads.length} new leads (${searchResult.leads.length - newLeads.length} duplicates filtered)`);

  // Return only verified emails for better deliverability
  return newLeads.filter(lead => lead.email_verified !== false);
}

// Export singleton instance
export const instantlyV2Client = new InstantlyV2Client();
