import { supabase, handleSupabaseError } from './supabaseClient';

export const userAPI = {
    async getUser(userId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) handleSupabaseError(error);
            return data;
        } catch (error) {
            handleSupabaseError(error);
        }
    },

    async createUser(userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([userData])
                .select()
                .single();

            if (error) handleSupabaseError(error);
            return data;
        } catch (error) {
            handleSupabaseError(error);
        }
    },

    async getDrivers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select(`
          id,
          full_name,
          phone,
          driver_profiles (
            status,
            is_available,
            rating,
            total_deliveries
          )
        `)
                .eq('role', 'driver');

            if (error) handleSupabaseError(error);
            return data;
        } catch (error) {
            handleSupabaseError(error);
        }
    }
};