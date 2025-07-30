const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

export const mapAPI = {
    async searchAddress(query) {
        try {
            const response = await fetch(
                `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=sy`
            );

            if (!response.ok) {
                throw new Error('Failed to search address');
            }

            const data = await response.json();

            return data.map(item => ({
                display_name: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                address: {
                    city: item.address?.city || item.address?.town || item.address?.village || '',
                    road: item.address?.road || '',
                    house_number: item.address?.house_number || '',
                    suburb: item.address?.suburb || '',
                    state: item.address?.state || ''
                }
            }));
        } catch (error) {
            console.error('Error searching address:', error);
            throw error;
        }
    },

    async reverseGeocode(lat, lon) {
        try {
            const response = await fetch(
                `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`
            );

            if (!response.ok) {
                throw new Error('Failed to reverse geocode');
            }

            const data = await response.json();

            return {
                display_name: data.display_name,
                lat: parseFloat(data.lat),
                lon: parseFloat(data.lon),
                address: {
                    city: data.address?.city || data.address?.town || data.address?.village || '',
                    road: data.address?.road || '',
                    house_number: data.address?.house_number || '',
                    suburb: data.address?.suburb || '',
                    state: data.address?.state || ''
                }
            };
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            throw error;
        }
    },

    formatAddressForDisplay(addressData) {
        const parts = [];

        if (addressData.address.house_number) {
            parts.push(addressData.address.house_number);
        }
        if (addressData.address.road) {
            parts.push(addressData.address.road);
        }
        if (addressData.address.suburb) {
            parts.push(addressData.address.suburb);
        }
        if (addressData.address.city) {
            parts.push(addressData.address.city);
        }

        return parts.join(', ') || addressData.display_name;
    },

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    },

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
};