import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Client factice en cas d'erreur
const dummyClient = {
  auth: {
    signInWithPassword: async () => ({ error: new Error("Supabase non configuré") }),
    signUp: async () => ({ error: new Error("Supabase non configuré") }),
    signOut: async () => ({ error: new Error("Supabase non configuré") }),
    getUser: async () => ({ data: { user: null } })
  },
  from: () => ({
    select: () => ({ data: [], error: null }),
    insert: async () => ({ data: null, error: new Error("Supabase non configuré") }),
    update: async () => ({ data: null, error: new Error("Supabase non configuré") })
  }),
  storage: {
    from: () => ({
      upload: async () => ({ error: new Error("Supabase non configuré") }),
      getPublicUrl: () => ({ data: { publicUrl: '' } })
    })
  }
};

// Client côté frontend
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : dummyClient;

// Client côté backend (admin)
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : dummyClient;

// Optionnel : Log si config manquante
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window === 'undefined') {
    console.warn('⚠️  Variables Supabase manquantes - utilisation du client factice');
  }
}
