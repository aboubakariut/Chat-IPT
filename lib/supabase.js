import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Supabase Config Check:");
console.log("- URL:", supabaseUrl ? "✅" : "❌");
console.log("- ANON KEY length:", supabaseAnonKey ? supabaseAnonKey.length : 0);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Variables Supabase manquantes");
}

// Création du client avec vérification stricte
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Client admin
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: { persistSession: false }
  }
);
