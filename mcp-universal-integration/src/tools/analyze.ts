import { supabase } from "../utils/supabase.js";
import axios from "axios";

interface AnalyzeArgs {
  user_id: string;
  platform_name: string;
}

interface VendorAnalysis {
  total_vendors: number;
  vendors_with_addresses: number;
  vendors_without_addresses: number;
  detected_address_fields: string[];
  detected_trade_fields: string[];
  sample_vendor_with_address?: any;
  ready_to_import: boolean;
  recommendations: string[];
}

export async function analyzeIntegration(args: AnalyzeArgs): Promise<any> {
  const { user_id, platform_name } = args;

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

    // Step 4: Analyze vendor data structure
    const analysis: VendorAnalysis = {
      total_vendors: vendors.length,
      vendors_with_addresses: 0,
      vendors_without_addresses: 0,
      detected_address_fields: [],
      detected_trade_fields: [],
      ready_to_import: false,
      recommendations: [],
    };

    // Common address field variations
    const addressFieldVariations = [
      "address", "street", "street_address", "location", "vendor_address",
      "physical_address", "mailing_address", "business_address"
    ];

    const cityFieldVariations = [
      "city", "town", "municipality"
    ];

    const stateFieldVariations = [
      "state", "province", "region"
    ];

    const zipFieldVariations = [
      "zip", "zipcode", "zip_code", "postal_code", "postcode"
    ];

    const tradeFieldVariations = [
      "trade", "trade_type", "specialty", "service_type", "category",
      "primary_trade", "skill", "profession"
    ];

    // Analyze each vendor
    const detectedFields = new Set<string>();
    const detectedTradeFields = new Set<string>();

    for (const vendor of vendors) {
      const extraFields = vendor.extraFields || {};
      let hasAddress = false;

      // Check for address fields
      for (const variation of addressFieldVariations) {
        if (extraFields[variation] && typeof extraFields[variation] === 'string' && extraFields[variation].trim()) {
          detectedFields.add(variation);
          hasAddress = true;
        }
      }

      // Also check if city+state combination exists
      let hasCity = false;
      let hasState = false;

      for (const variation of cityFieldVariations) {
        if (extraFields[variation] && extraFields[variation].trim()) {
          detectedFields.add(variation);
          hasCity = true;
        }
      }

      for (const variation of stateFieldVariations) {
        if (extraFields[variation] && extraFields[variation].trim()) {
          detectedFields.add(variation);
          hasState = true;
        }
      }

      // If we have city+state, that's good enough
      if (hasCity && hasState) {
        hasAddress = true;
      }

      // Check for trade fields
      for (const variation of tradeFieldVariations) {
        if (extraFields[variation] && extraFields[variation].trim()) {
          detectedTradeFields.add(variation);
        }
      }

      if (hasAddress) {
        analysis.vendors_with_addresses++;
        if (!analysis.sample_vendor_with_address) {
          analysis.sample_vendor_with_address = {
            name: vendor.name,
            extraFields: extraFields
          };
        }
      } else {
        analysis.vendors_without_addresses++;
      }
    }

    analysis.detected_address_fields = Array.from(detectedFields);
    analysis.detected_trade_fields = Array.from(detectedTradeFields);

    // Determine if ready to import
    analysis.ready_to_import = analysis.vendors_with_addresses > 0;

    // Generate recommendations
    if (analysis.vendors_with_addresses === analysis.total_vendors) {
      analysis.recommendations.push("✅ Perfect! All vendors have address data. Ready for immediate import.");
    } else if (analysis.vendors_with_addresses > 0) {
      const percentage = Math.round((analysis.vendors_with_addresses / analysis.total_vendors) * 100);
      analysis.recommendations.push(
        `✅ ${percentage}% of vendors (${analysis.vendors_with_addresses}/${analysis.total_vendors}) have address data.`
      );
      analysis.recommendations.push(
        `⚠️ ${analysis.vendors_without_addresses} vendors are missing addresses. You can:`
      );
      analysis.recommendations.push(
        `   1. Add address custom fields in ${platform.display_name} for missing vendors`
      );
      analysis.recommendations.push(
        `   2. Import vendors with addresses now, add others later`
      );
    } else {
      analysis.recommendations.push(
        `⚠️ No vendors have address data in ${platform.display_name}.`
      );
      analysis.recommendations.push(
        `To enable geo-matching and dispatch, please:`
      );
      analysis.recommendations.push(
        `   1. Go to ${platform.display_name} → Settings → Vendor Settings → Custom Fields`
      );
      analysis.recommendations.push(
        `   2. Add custom field: "address" (Text)`
      );
      analysis.recommendations.push(
        `   3. Fill in vendor addresses`
      );
      analysis.recommendations.push(
        `   4. Re-run this analysis`
      );
    }

    if (analysis.detected_trade_fields.length === 0) {
      analysis.recommendations.push(
        `💡 Consider adding a "trade" or "specialty" custom field to auto-categorize vendors`
      );
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              platform_name,
              analysis,
              next_steps: analysis.ready_to_import
                ? "Ready to import vendors with addresses"
                : "Add address custom fields in platform first",
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: errorMessage,
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
