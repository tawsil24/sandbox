const EXCHANGE_API_BASE = 'https://api.exchangerate-api.com/v4/latest';
const FALLBACK_API_BASE = 'https://open.er-api.com/v6/latest';

const CACHE_KEY = 'tawsil_exchange_rate';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

const HARDCODED_RATE = 15000;

export const currencyAPI = {
    async getUSDExchangeRate() {
        try {
            // Check cache first
            const cached = this.getCachedRate();
            if (cached) {
                return cached;
            }

            // Try primary API
            let rate = await this.fetchFromPrimaryAPI();

            // Fallback to secondary API if primary fails
            if (!rate) {
                rate = await this.fetchFromFallbackAPI();
            }

            // Use hardcoded fallback if all APIs fail
            if (!rate) {
                console.warn('All currency APIs failed, using fallback rate');
                rate = HARDCODED_RATE; // Approximate SYP to USD rate as fallback
            }

            // Cache the rate
            this.cacheRate(rate);

            return rate;
        } catch (error) {
            console.error('Error getting exchange rate:', error);
            // Return cached rate if available, otherwise fallback
            const cached = this.getCachedRate(true); // Allow expired cache as fallback
            return cached || HARDCODED_RATE;
        }
    },

    async fetchFromPrimaryAPI() {
        try {
            const response = await fetch(`${EXCHANGE_API_BASE}/USD`);
            if (!response.ok) throw new Error('Primary API failed');

            const data = await response.json();
            return data.rates?.SYP || null;
        } catch (error) {
            console.warn('Primary currency API failed:', error);
            return null;
        }
    },

    async fetchFromFallbackAPI() {
        try {
            const response = await fetch(`${FALLBACK_API_BASE}/USD`);
            if (!response.ok) throw new Error('Fallback API failed');

            const data = await response.json();
            return data.rates?.SYP || null;
        } catch (error) {
            console.warn('Fallback currency API failed:', error);
            return null;
        }
    },

    getCachedRate(allowExpired = false) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const { rate, timestamp } = JSON.parse(cached);
            const now = Date.now();

            if (!allowExpired && (now - timestamp) > CACHE_DURATION) {
                return null; // Cache expired
            }

            return rate;
        } catch (error) {
            console.error('Error reading cached rate:', error);
            return null;
        }
    },

    cacheRate(rate) {
        try {
            const cacheData = {
                rate,
                timestamp: Date.now()
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        } catch (error) {
            console.error('Error caching exchange rate:', error);
        }
    },

    convertSYPToUSD(sypAmount) {
        const rate = this.getCachedRate(true); // Allow expired cache for display
        if (!rate) return null;

        return sypAmount / rate;
    },

    // For development/testing - manually set rate
    setTestRate(rate) {
        this.cacheRate(rate);
    },

    // Clear cache (useful for testing)
    clearCache() {
        try {
            localStorage.removeItem(CACHE_KEY);
        } catch (error) {
            console.error('Error clearing currency cache:', error);
        }
    }
};