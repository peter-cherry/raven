import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface SignupData {
  full_name: string;
  email: string;
  phone: string;
  trade_needed: string;
  address_text: string;
  city: string;
  state: string;
  years_experience?: number;
  license_number?: string;
  profile_picture?: string;
}

// Helper function to geocode full address using Google Maps API
async function geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.warn('[Technician Signup] Google Maps API key not configured');
    return null;
  }

  try {
    // Use full address if provided, otherwise fall back to city/state
    const fullAddress = address
      ? `${address}, ${city}, ${state}`
      : `${city}, ${state}`;

    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }

    console.warn('[Technician Signup] Geocoding failed:', data.status);
    return null;
  } catch (error) {
    console.error('[Technician Signup] Geocoding error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Parse request body
    const body: SignupData = await request.json();

    // Validate required fields
    const { full_name, email, phone, trade_needed, address_text, city, state } = body;

    if (!full_name || !email || !phone || !trade_needed || !address_text || !city || !state) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingTech } = await supabase
      .from('technicians')
      .select('id')
      .eq('email', email)
      .single();

    if (existingTech) {
      return NextResponse.json(
        { error: 'A technician with this email already exists' },
        { status: 409 }
      );
    }

    // Geocode full address to get lat/lng
    const coordinates = await geocodeAddress(address_text, city, state);

    // For self-signup, we need to determine which org they belong to
    // Option 1: Create a default "Public Technicians Pool" org
    // Option 2: Leave org_id NULL until they're claimed by an organization
    // Option 3: Get org_id from authenticated user (if they're logged in)

    let org_id: string | null = null;

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // If logged in, get their org_id
      const { data: membership } = await supabase
        .from('org_memberships')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      if (membership) {
        org_id = membership.org_id;
      }
    }

    // If no org_id from user, look for default "Public Pool" org
    if (!org_id) {
      const { data: defaultOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'Public Technicians Pool')
        .single();

      // Use fixed UUID for public pool (from migration)
      org_id = defaultOrg?.id || '00000000-0000-0000-0000-000000000001';
    }

    // Insert technician record
    const { data: technician, error: insertError } = await supabase
      .from('technicians')
      .insert({
        org_id,
        full_name,
        email,
        phone,
        trade_needed,
        address_text,
        city,
        state,
        lat: coordinates?.lat || null,
        lng: coordinates?.lng || null,
        profile_picture: body.profile_picture || null,
        years_experience: body.years_experience || null,
        license_number: body.license_number || null,
        signed_up: true, // Mark as signed up (warm lead)
        is_available: true,
        service_area_radius: 50, // Default 50 miles
        average_rating: null, // No rating yet
        created_by: user?.id || null
      })
      .select()
      .single();

    if (insertError) {
      console.error('[Technician Signup] Insert error:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      technician: {
        id: technician.id,
        full_name: technician.full_name,
        email: technician.email,
        trade_needed: technician.trade_needed
      },
      message: 'Technician profile created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('[Technician Signup] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
