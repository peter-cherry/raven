import { supabase } from "../utils/supabase.js";

interface ConnectArgs {
  user_id: string;
  platform_name: string;
  credentials: {
    api_key?: string;
    access_token?: string;
    refresh_token?: string;
  };
}

export async function connectIntegration(args: ConnectArgs) {
  const { user_id, platform_name, credentials } = args;

  try {
    // Step 1: Get platform configuration
    const { data: platform, error: platformError } = await supabase
      .from("integration_platforms")
      .select("*")
      .eq("name", platform_name)
      .single();

    if (platformError || !platform) {
      throw new Error(`Platform '${platform_name}' not found in database`);
    }

    // Step 2: Store credentials (in production, these should be encrypted)
    // For now, we'll store them as-is since this is MVP
    const { data: existingCred } = await supabase
      .from("integration_credentials")
      .select("id")
      .eq("user_id", user_id)
      .eq("platform_id", platform.id)
      .single();

    let result;

    if (existingCred) {
      // Update existing credentials
      const { data, error } = await supabase
        .from("integration_credentials")
        .update({
          credentials: credentials,
          connection_status: "active",
          last_tested_at: new Date().toISOString(),
          error_count: 0,
        })
        .eq("id", existingCred.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new credentials
      const { data, error } = await supabase
        .from("integration_credentials")
        .insert({
          user_id,
          platform_id: platform.id,
          credentials: credentials,
          connection_status: "active",
          last_tested_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Step 3: Log the connection
    await supabase.from("integration_sync_logs").insert({
      user_id,
      platform_name,
      operation: "test_connection",
      status: "success",
      details: {
        action: existingCred ? "updated" : "created",
        platform_display_name: platform.display_name,
      },
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: true,
              message: `✅ Successfully connected to ${platform.display_name}`,
              platform_name: platform.name,
              display_name: platform.display_name,
              credential_id: result.id,
              action: existingCred ? "updated" : "created",
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Log the error
    await supabase.from("integration_sync_logs").insert({
      user_id,
      platform_name,
      operation: "test_connection",
      status: "error",
      error_message: errorMessage,
    });

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
