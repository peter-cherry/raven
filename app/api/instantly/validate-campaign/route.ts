import { instantlyClient } from '@/lib/instantlyClient';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { campaignId } = await request.json();

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    console.log('[Validate Campaign] Checking:', campaignId);

    // Check if campaign exists in Instantly
    const campaign = await instantlyClient.getCampaign(campaignId);

    if (!campaign) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Campaign not found in Instantly. Please check the Campaign ID.'
        },
        { status: 404 }
      );
    }

    console.log('[Validate Campaign] Found:', campaign.name);

    return NextResponse.json({
      valid: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        total_leads: campaign.total_leads,
        emails_sent: campaign.emails_sent,
        opens: campaign.opens,
        replies: campaign.replies
      }
    });
  } catch (error) {
    console.error('[Validate Campaign] Error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Failed to validate campaign. Please try again.'
      },
      { status: 500 }
    );
  }
}
