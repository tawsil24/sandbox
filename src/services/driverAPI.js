import { supabase, handleSupabaseError } from './supabaseClient';

export const driverAPI = {
    async acceptDelivery(deliveryId, driverId) {
        try {
            const { data, error } = await supabase
                .from('deliveries')
                .update({
                    driver_id: driverId,
                    status: 'assigned'
                })
                .eq('id', deliveryId)
                .eq('status', 'pending')
                .select()
                .single();

            if (error) handleSupabaseError(error);
            return data;
        } catch (error) {
            handleSupabaseError(error);
        }
    },

    async updateDriverAvailability(driverId, isAvailable) {
        try {
            const { data, error } = await supabase
                .from('driver_profiles')
                .update({ is_available: isAvailable })
                .eq('user_id', driverId)
                .select()
                .single();

            if (error) handleSupabaseError(error);
            return data;
        } catch (error) {
            handleSupabaseError(error);
        }
    },

    async getDriverProfile(driverId) {
        try {
            const { data, error } = await supabase
                .from('driver_profiles')
                .select(`
          *,
          user:users!driver_profiles_user_id_fkey(*)
        `)
                .eq('user_id', driverId)
                .single();

            if (error) handleSupabaseError(error);
            return data;
        } catch (error) {
            handleSupabaseError(error);
        }
    }
};