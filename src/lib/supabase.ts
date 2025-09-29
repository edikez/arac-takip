import { createClient } from '@supabase/supabase-js';

// Ortam değişkenlerini kontrol ediyoruz
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

// Supabase istemcisini oluşturuyoruz
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);