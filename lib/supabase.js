import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("🔍 Supabase Config Check:");
console.log("- URL:", supabaseUrl ? "✅ Présente" : "❌ MANQUANTE");
console.log("- ANON KEY:", supabaseAnonKey ? "✅ Présente" : "❌ MANQUANTE");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Variables Supabase manquantes ! Vérifie tes variables d'environnement sur Vercel.");
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Client admin (pour les API routes)
export const supabaseAdmin = createClient(
  supabaseUrl || '', 
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);
