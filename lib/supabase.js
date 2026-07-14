import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

console.log("🔍 Supabase Final Check:");
console.log("- URL:", supabaseUrl ? "✅" : "❌");
console.log("- ANON KEY length:", supabaseAnonKey?.length || 0);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Impossible de créer Supabase client - variables manquantes");
  // On crée un client factice pour éviter le crash total
  export const supabase = {
    auth: { signInWithPassword: async () => ({ error: new Error("Supabase non configuré") }) },
    from: () => ({ select: () => ({ data: [], error: null }) })
  };
  export const supabaseAdmin = supabase;
} else {
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
  export const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || '');
}
