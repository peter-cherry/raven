import { supabase } from "../utils/supabase.js";
import axios from "axios";

interface ImportArgs {
  user_id: string;
  platform_name: string;
}

export async function importTechnicians(args: ImportArgs) {
  const { user_id, platform_name } = args;

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

    // Step 2: Get user's credentials for this platform
    const { data: credentials, error: credError } = await supabase
      .from("integration_credentials")
      .select("*")
      .eq("user_id", user_id)
      .eq("platform_id", platform.id)
      .single();

    if (credError || !credentials) {
      throw new Error(`No credentials found for ${platform_name}. Please connect first.`);
    }

    // Step 3: Fetch users from the platform
    const usersEndpoint = platform.endpoints.users?.list;
    if (!usersEndpoint) {
      throw new Error(`Platform ${platform_name} does not support user listing`);
    }

    const apiUrl = `${platform.api_base_url}${usersEndpoint.path}`;
    const authHeader = platform.auth_config.type === "bearer"
      ? `Bearer ${credentials.credentials.api_key}`
      : credentials.credentials.api_key;

    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
    });

    const users = response.data.users || response.data || [];

    // Step 4: Import users as technicians
    const imported = [];
    const skipped = [];

    for (const user of users) {
      // Map MaintainX user fields to Raven technician schema
      const technicianData = {
        user_id,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email,
        email: user.email,
        phone: user.phoneNumber,
        external_systems: {
          [platform_name]: user.id.toString(),
        },
        imported_from: platform_name,
        imported_at: new Date().toISOString(),
      };

      // Check if technician already exists by email or external ID
      const { data: existing } = await supabase
        .from("technicians")
        .select("id, external_systems")
        .eq("user_id", user_id)
        .or(`email.eq.${user.email},external_systems->>maintainx.eq.${user.id}`)
        .single();

      if (existing) {
        // Update external_systems mapping
        const updatedExternalSystems = {
          ...existing.external_systems,
          [platform_name]: user.id.toString(),
        };

        await supabase
          .from("technicians")
          .update({ external_systems: updatedExternalSystems })
          .eq("id", existing.id);

        skipped.push({
          name: technicianData.name,
          reason: "already_exists",
          external_id: user.id,
        });
      } else {
        // Insert new technician
        const { data: inserted, error: insertError } = await supabase
          .from("technicians")
          .insert(technicianData)
          .select()
          .single();

        if (insertError) {
          skipped.push({
            name: technicianData.name,
            reason: insertError.message,
            external_id: user.id,
          });
        } else {
          imported.push({
            id: inserted.id,
            name: technicianData.name,
            external_id: user.id,
          });
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
      operation: "import_technicians",
      status: imported.length > 0 ? "success" : "partial",
      records_processed: users.length,
      records_successful: imported.length,
      records_failed: skipped.length,
      details: {
        duration_ms: duration,
        imported: imported,
        skipped: skipped,
      },
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              imported_count: imported.length,
              skipped_count: skipped.length,
              total_processed: users.length,
              duration_ms: duration,
              technicians: imported,
              skipped: skipped,
              message: `✅ Imported ${imported.length} technicians from ${platform.display_name}`,
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
      operation: "import_technicians",
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
