import { createClient } from "@supabase/supabase-js";
import { env, missingEnvKeys } from "./env";

if (missingEnvKeys.length > 0) {
  throw new Error(`Missing required env: ${missingEnvKeys.join(", ")}`);
}

const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export default supabase;
