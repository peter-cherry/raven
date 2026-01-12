import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from parent directory
// Works for both dist/utils/supabase.js and src/utils/supabase.ts
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    `Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.\n` +
    `Loaded from: ${path.join(__dirname, "../../.env")}\n` +
    `SUPABASE_URL: ${supabaseUrl ? "SET" : "MISSING"}\n` +
    `SUPABASE_SERVICE_KEY: ${supabaseServiceKey ? "SET" : "MISSING"}`
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
