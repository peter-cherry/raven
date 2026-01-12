/**
 * Instantly.ai API Client
 * Documentation: https://developer.instantly.ai/
 */

const INSTANTLY_API_BASE = 'https://api.instantly.ai/api/v1';

interface InstantlyLead {
  email: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  phone_number?: string;
  website?: string;
  custom_variables?: Record<string, string>;
}

interface InstantlyCampaign {
  id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  total_leads: number;
  emails_sent: number;
  opens: number;
  clicks: number;
  replies: number;
  bounces: number;
}

export class InstantlyClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.INSTANTLY_API_KEY || '';

    if (!this.apiKey) {
      console.warn('[Instantly Client] No API key provided. Set INSTANTLY_API_KEY environment variable.');
    }
  }

  /**
   * Validate a campaign exists and get its details
   */
  async getCampaign(campaignId: string): Promise<InstantlyCampaign | null> {
    try {
      const response = await fetch(`${INSTANTLY_API_BASE}/campaign/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          campaign_id: campaignId
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Instantly] Get campaign failed:', error);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Instantly] Get campaign error:', error);
      return null;
    }
  }

  /**
   * Add leads to a campaign
   */
  async addLeads(campaignId: string, leads: InstantlyLead[]): Promise<{ success: boolean; added: number; errors?: any[] }> {
    try {
      const response = await fetch(`${INSTANTLY_API_BASE}/lead/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          campaign_id: campaignId,
          leads: leads
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Instantly] Add leads failed:', error);
        return { success: false, added: 0, errors: [error] };
      }

      const data = await response.json();

      return {
        success: true,
        added: leads.length,
        errors: data.errors || []
      };
    } catch (error) {
      console.error('[Instantly] Add leads error:', error);
      return { success: false, added: 0, errors: [error] };
    }
  }

  /**
   * Get campaign analytics/stats
   */
  async getCampaignAnalytics(campaignId: string): Promise<any> {
    try {
      const response = await fetch(`${INSTANTLY_API_BASE}/analytics/campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          campaign_id: campaignId
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Instantly] Get analytics failed:', error);
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Instantly] Get analytics error:', error);
      return null;
    }
  }

  /**
   * List all campaigns
   */
  async listCampaigns(): Promise<InstantlyCampaign[]> {
    try {
      const response = await fetch(`${INSTANTLY_API_BASE}/campaign/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[Instantly] List campaigns failed:', error);
        return [];
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Instantly] List campaigns error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const instantlyClient = new InstantlyClient();
