import { supabase } from "../utils/supabase.js";
import axios from "axios";

interface ImportVendorsArgs {
  user_id: string;
  platform_name: string;
  geocode_addresses?: boolean;  // Default true
  mark_as_warm?: boolean;  // Default true for imported vendors
}

interface GeocodedAddress {
  lat: number;
  lng: number;
  formatted_address: string;
}

// Geocode address using Google Maps Geocoding API
async function geocodeAddress(address: string): Promise<GeocodedAddress | null> {
  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

  if (!GOOGLE_API_KEY) {
    console.warn("Google Maps API key not configured, skipping geocoding");
    return null;
  }

  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address,
          key: GOOGLE_API_KEY,
        },
      }
    );

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const result = response.data.results[0];
      return {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        formatted_address: result.formatted_address,
      };
    }

    return null;
  } catch (error) {
    console.error(`Geocoding failed for address: ${address}`, error);
    return null;
  }
}

// Extract address from vendor extraFields with smart field detection
function extractAddress(vendor: any): string | null {
  const extraFields = vendor.extraFields || {};

  // Try to find address field (various naming conventions)
  const addressFieldVariations = [
    "address", "street", "street_address", "location", "vendor_address",
    "physical_address", "mailing_address", "business_address"
  ];

  for (const field of addressFieldVariations) {
    if (extraFields[field] && typeof extraFields[field] === 'string' && extraFields[field].trim()) {
      return extraFields[field].trim();
    }
  }

  // Try to build address from city+state+zip
  const cityFields = ["city", "town", "municipality"];
  const stateFields = ["state", "province", "region"];
  const zipFields = ["zip", "zipcode", "zip_code", "postal_code"];

  let city = null;
  let state = null;
  let zip = null;

  for (const field of cityFields) {
    if (extraFields[field]) {
      city = extraFields[field];
      break;
    }
  }

  for (const field of stateFields) {
    if (extraFields[field]) {
      state = extraFields[field];
      break;
    }
  }

  for (const field of zipFields) {
    if (extraFields[field]) {
      zip = extraFields[field];
      break;
    }
  }

  // Build address from components
  if (city && state) {
    const parts = [city, state];
    if (zip) parts.push(zip);
    return parts.join(", ");
  }

  return null;
}

// Extract trade/specialty from vendor extraFields
function extractTrade(vendor: any): string | null {
  const extraFields = vendor.extraFields || {};

  const tradeFieldVariations = [
    "trade", "trade_type", "specialty", "service_type", "category",
    "primary_trade", "skill", "profession", "service"
  ];

  for (const field of tradeFieldVariations) {
    if (extraFields[field] && typeof extraFields[field] === 'string' && extraFields[field].trim()) {
      return extraFields[field].trim();
    }
  }

  return null;
}

export async function importVendors(args: ImportVendorsArgs) {
  const {
    user_id,
    platform_name,
    geocode_addresses = true,
    mark_as_warm = true
  } = args;

  const startTime = Date.now();

  try {
    // Step 1: Get platform configuration
    const { data: platform, error: platformError } = await supabase
      .from("integration_platforms")
      .select("*")
      .eq("name", platform_name)
      .single();

    if (platformError || !platform) {
      throw new Error(`Platform '${platform_name}' not found`);
    }

    // Step 2: Get user's credentials
    const { data: credentials, error: credError } = await supabase
      .from("integration_credentials")
      .select("*")
      .eq("user_id", user_id)
      .eq("platform_id", platform.id)
      .single();

    if (credError || !credentials) {
      throw new Error(`No credentials found for ${platform_name}. Please connect first.`);
    }

    // Step 3: Fetch vendors from platform
    const vendorsEndpoint = platform.endpoints.vendors?.list;
    if (!vendorsEndpoint) {
      throw new Error(`Platform ${platform_name} does not support vendor listing`);
    }

    const apiUrl = `${platform.api_base_url}${vendorsEndpoint.path}`;
    const authHeader = platform.auth_config.type === "bearer"
      ? `Bearer ${credentials.credentials.api_key}`
      : credentials.credentials.api_key;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const vendors = response.data.vendors || response.data || [];

    // Step 4: Import vendors as technicians
    const imported = [];
    const skipped = [];
    const needsAddress = [];

    for (const vendor of vendors) {
      // Extract address from extraFields
      const addressText = extractAddress(vendor);
      const trade = extractTrade(vendor);

      // Extract contact info (vendors have arrays of emails/phones)
      const email = vendor.emails && vendor.emails.length > 0
        ? vendor.emails[0]
        : null;
      const phone = vendor.phoneNumbers && vendor.phoneNumbers.length > 0
        ? vendor.phoneNumbers[0]
        : null;

      let lat = null;
      let lng = null;
      let geocoded_address = null;

      // Try to geocode if address found
      if (addressText && geocode_addresses) {
        const geocoded = await geocodeAddress(addressText);
        if (geocoded) {
          lat = geocoded.lat;
          lng = geocoded.lng;
          geocoded_address = geocoded.formatted_address;
        }
      }

      const technicianData: any = {
        user_id,
        name: vendor.name,
        email,
        phone,
        address_text: geocoded_address || addressText || null,
        lat,
        lng,
        trade_needed: trade,
        is_available: true,
        signed_up: mark_as_warm,  // Mark as warm for dispatch
        signup_source: `${platform_name}_import`,
        external_systems: {
          [platform_name]: vendor.id.toString(),
        },
        imported_from: platform_name,
        imported_at: new Date().toISOString(),
      };

      // Track if vendor needs address
      if (!lat || !lng) {
        technicianData.needs_address_completion = true;
      }

      // Check if vendor already exists
      const { data: existing } = await supabase
        .from("technicians")
        .select("id, external_systems")
        .eq("user_id", user_id)
        .eq(`external_systems->>>${platform_name}`, vendor.id.toString())
        .maybeSingle();

      if (existing) {
        // Update existing vendor
        await supabase
          .from("technicians")
          .update(technicianData)
          .eq("id", existing.id);

        skipped.push({
          name: vendor.name,
          reason: "updated_existing",
          external_id: vendor.id,
          has_address: !!lat,
        });
      } else {
        // Insert new vendor
        const { data: inserted, error: insertError } = await supabase
          .from("technicians")
          .insert(technicianData)
          .select()
          .single();

        if (insertError) {
          skipped.push({
            name: vendor.name,
            reason: insertError.message,
            external_id: vendor.id,
            has_address: !!lat,
          });
        } else {
          imported.push({
            id: inserted.id,
            name: vendor.name,
            external_id: vendor.id,
            has_address: !!lat,
            trade: trade || "Unknown",
          });

          if (!lat || !lng) {
            needsAddress.push({
              id: inserted.id,
              name: vendor.name,
              external_id: vendor.id,
            });
          }
        }
      }
    }

    const duration = Date.now() - startTime;

    // Step 5: Update last_sync_at
    await supabase
      .from("integration_credentials")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", credentials.id);

    // Step 6: Log the import operation
    await supabase.from("integration_sync_logs").insert({
      user_id,
      platform_name,
      operation: "import_vendors",
      status: imported.length > 0 ? "success" : "partial",
      records_processed: vendors.length,
      records_successful: imported.length,
      records_failed: skipped.length,
      details: {
        duration_ms: duration,
        imported: imported,
        skipped: skipped,
        needs_address: needsAddress,
        vendors_with_addresses: imported.filter(v => v.has_address).length,
        vendors_without_addresses: needsAddress.length,
      },
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    });

    const withAddresses = imported.filter(v => v.has_address).length;
    const withoutAddresses = needsAddress.length;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              imported_count: imported.length,
              skipped_count: skipped.length,
              total_processed: vendors.length,
              vendors_with_addresses: withAddresses,
              vendors_without_addresses: withoutAddresses,
              duration_ms: duration,
              vendors: imported,
              needs_address: needsAddress,
              message: withoutAddresses === 0
                ? `✅ Imported ${imported.length} vendors from ${platform.display_name} - all with addresses!`
                : `✅ Imported ${imported.length} vendors from ${platform.display_name}\n⚠️ ${withoutAddresses} vendors need address completion`,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const duration = Date.now() - startTime;

    // Log the error
    await supabase.from("integration_sync_logs").insert({
      user_id,
      platform_name,
      operation: "import_vendors",
      status: "error",
      error_message: errorMessage,
      records_processed: 0,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
              duration_ms: duration,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
}
