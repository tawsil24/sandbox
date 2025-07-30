import { supabase, handleSupabaseError } from './supabaseClient';
import { generateDeliveryCode, calculatePrice } from '../utils/helpers';

export const deliveryAPI = {
    async createDelivery(deliveryData) {
        try {
            const deliveryCode = generateDeliveryCode();
            const totalPrice = calculatePrice(deliveryData);
            const driverEarnings = Math.floor(totalPrice * 0.70);

            const delivery = {
                delivery_code: deliveryCode,
                sender_id: deliveryData.senderId,
                recipient_id: deliveryData.recipientId,
                parcel_size: deliveryData.parcelSize,
                delivery_mode: deliveryData.deliveryMode,
                pickup_address: deliveryData.pickupAddress,
                delivery_address: deliveryData.deliveryAddress,
                base_price: totalPrice,
                total_price: totalPrice,
                driver_earnings: driverEarnings,
                description: deliveryData.description,
                pickup_instructions: deliveryData.pickupInstructions,
                delivery_instructions: deliveryData.deliveryInstructions,
                status: 'pending'
            };

            const { data, error } = await supabase
                .from('deliveries')
                .insert([delivery])
                .select()
                .single();

            if (error) handleSupabaseError(error);
            return data;
        } catch (error) {
            handleSupabaseError(error);
        }
    },

    async getDeliveries(filters = {}) {
        try {
            let query = supabase
                .from('deliveries')
                .select(`
          *,
          sender:users!deliveries_sender_id_fkey(full_name, phone),
          driver:users!deliveries_driver_id_fkey(full_name, phone)
        `)
                .order('created_at', { ascending: false });

            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.driverId) {
                query = query.eq('driver_id', filters.driverId);
            }
            if (filters.senderId) {
                query = query.eq('sender_id', filters.senderId);
            }

            const { data, error } = await query;

            if (error) handleSupabaseError(error);
            return data;
        } catch (error) {
            handleSupabaseError(error);
        }
    },

    async updateDeliveryStatus(deliveryId, status, driverId = null) {
        try {
            const updateData = { status };

            if (driverId) {
                updateData.driver_id = driverId;
            }

            if (status === 'picked_up') {
                updateData.picked_up_at = new Date().toISOString();
            } else if (status === 'delivered') {
                updateData.delivered_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('deliveries')
                .update(updateData)
                .eq('id', deliveryId)
                .select()
                .single();

            if (error) handleSupabaseError(error);
            return data;
        } catch (error) {
            handleSupabaseError(error);
        }
    },

    async getPendingDeliveries() {
        try {
            const { data, error } = await supabase
                .from('deliveries')
                .select(`
          *,
          sender:users!deliveries_sender_id_fkey(full_name, phone)
        `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) handleSupabaseError(error);
            return data;
        } catch (error) {
            handleSupabaseError(error);
        }
    },

    subscribeToDeliveries(callback) {
        const subscription = supabase
            .channel('deliveries')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'deliveries'
                },
                callback
            )
            .subscribe();

        return subscription;
    }
};