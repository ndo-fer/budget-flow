const readEnv = (key: string) => {
  const value = import.meta.env[key];
  return typeof value === "string" ? value : "";
};

export const env = {
  supabaseUrl: readEnv("VITE_SUPABASE_URL"),
  supabaseAnonKey: readEnv("VITE_SUPABASE_ANON_KEY"),
  apiUrl: readEnv("VITE_API_URL"),
  apiTimeout: Number(readEnv("VITE_API_TIMEOUT") || "10000"),
};

export const missingEnvKeys = Object.entries({
  VITE_SUPABASE_URL: env.supabaseUrl,
  VITE_SUPABASE_ANON_KEY: env.supabaseAnonKey,
})
  .filter(([, value]) => !value)
  .map(([key]) => key);
