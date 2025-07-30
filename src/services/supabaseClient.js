import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;


if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const handleSupabaseError = (error) => {
    console.error('Supabase Error:', error);
    if (error.message) {
        throw new Error(error.message);
    }
    throw new Error('An unexpected error occurred');
};