import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is missing from environment variables.');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from environment variables.');
}

if (!supabaseServiceRoleKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.');
}

// Create and export the service role client for server-side operations
export const getSupabaseServiceRoleClient = () => {
  const client = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  // Log the client configuration (without sensitive data)
  console.log('Supabase client initialized with URL:', supabaseUrl);
  
  return client;
};

// Create and export the anon client for client-side operations
export const getSupabaseAnonClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey);
}; 