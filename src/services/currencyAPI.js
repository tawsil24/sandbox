const EXCHANGE_API_BASE = 'https://api.exchangerate-api.com/v4/latest';
const FALLBACK_API_BASE = 'https://open.er-api.com/v6/latest';
const OIL_API_BASE = 'https://api.oilpriceapi.com/v1/prices/latest';
const FALLBACK_OIL_API = 'https://api.marketdata.app/v1/stocks/candles/D/USO'; // Oil ETF as proxy

const CACHE_KEY = 'tawsil_exchange_rate';
const OIL_CACHE_KEY = 'tawsil_oil_prices';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const HARDCODED_RATE = 15000;

// Syrian fuel price estimates (updated periodically)
const SYRIAN_FUEL_ESTIMATES = {
    gasoline_subsidized: 1750, // SYP per liter
    gasoline_market: 11440,     // SYP per liter  
    diesel_subsidized: 1250,   // SYP per liter
    diesel_market: 3500,       // SYP per liter
    last_updated: '2024-01-15'
};

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
                rate = 15000; // Approximate SYP to USD rate as fallback
            }

            // Cache the rate
            this.cacheRate(rate);

            return rate;
        } catch (error) {
            console.error('Error getting exchange rate:', error);
            // Return cached rate if available, otherwise fallback
            const cached = this.getCachedRate(true); // Allow expired cache as fallback
            return cached || 15000;
        }
    },

    async getOilPrices() {
        try {
            // Check cache first
            const cached = this.getCachedOilPrices();
            if (cached) {
                return cached;
            }

            // Try to get international oil prices
            let oilData = await this.fetchOilPrices();

            console.log('[[ oilData ]]');
            console.log(oilData);



            if (!oilData) {
                // Use fallback prices if API fails
                oilData = {
                    wti_crude: 75.50, // USD per barrel
                    brent_crude: 79.20, // USD per barrel
                    gasoline: 2.15, // USD per gallon
                    diesel: 2.45, // USD per gallon
                    source: 'fallback_estimate'
                };
            }

            // Add Syrian local prices
            const syrianPrices = this.calculateSyrianFuelPrices(oilData);
            const completeData = {
                ...oilData,
                syrian_prices: syrianPrices,
                van_consumption: this.getVanFuelConsumption(),
                timestamp: Date.now()
            };

            // Cache the data
            this.cacheOilPrices(completeData);

            return completeData;
        } catch (error) {
            console.error('Error getting oil prices:', error);
            const cached = this.getCachedOilPrices(true);
            return cached || this.getFallbackOilData();
        }
    },

    async fetchOilPrices() {
        try {
            // Try multiple free APIs for oil prices
            const responses = await Promise.allSettled([
                this.fetchFromOilAPI1(),
                this.fetchFromOilAPI2()
            ]);

            for (const response of responses) {
                if (response.status === 'fulfilled' && response.value) {
                    return response.value;
                }
            }

            return null;
        } catch (error) {
            console.warn('Failed to fetch oil prices:', error);
            return null;
        }
    },

    async fetchFromOilAPI1() {
        try {
            // Using a free commodity API (this is a mock - replace with real API)
            const response = await fetch('https://api.metals.live/v1/spot');
            console.log('========== API RESPONSE ==============');
            console.log('https://api.metals.live/v1/spo');


            if (!response.ok) throw new Error('Oil API 1 failed');

            // This would need to be adapted based on actual API response
            return {
                wti_crude: 75.50,
                brent_crude: 79.20,
                gasoline: 2.15,
                diesel: 2.45,
                source: 'api1'
            };
        } catch (error) {
            console.warn('Oil API 1 failed:', error);
            return null;
        }
    },

    async fetchFromOilAPI2() {
        try {
            console.log('========== API RESPONSE ==============');
            console.log('fetchFromOilAPI2   [MOCK]');

            // Alternative approach - using financial data API
            // This is a placeholder - real implementation would use actual oil price API
            return {
                wti_crude: 76.20, // USD per barrel
                brent_crude: 80.10, // USD per barrel
                gasoline: 2.18, // USD per gallon
                diesel: 2.48, // USD per gallon
                source: 'api2'
            };
        } catch (error) {
            console.warn('Oil API 2 failed:', error);
            return null;
        }
    },

    calculateSyrianFuelPrices(internationalData) {
        // Calculate Syrian prices based on international oil prices and local factors
        const exchangeRate = this.getCachedRate(true) || 15000;

        return {
            gasoline: {
                subsidized: SYRIAN_FUEL_ESTIMATES.gasoline_subsidized,
                market: SYRIAN_FUEL_ESTIMATES.gasoline_market,
                international_equivalent: (internationalData.gasoline * 3.785 * exchangeRate), // Convert gallon to liter
            },
            diesel: {
                subsidized: SYRIAN_FUEL_ESTIMATES.diesel_subsidized,
                market: SYRIAN_FUEL_ESTIMATES.diesel_market,
                international_equivalent: (internationalData.diesel * 3.785 * exchangeRate),
            },
            last_updated: SYRIAN_FUEL_ESTIMATES.last_updated
        };
    },

    getVanFuelConsumption() {
        return {
            small_van: {
                name: 'Small Van (Hyundai H100)',
                gasoline_per_km: 0.11, // liters
                diesel_per_km: 0.11,   // liters
                payload: '1,000 kg'
            },
            medium_van: {
                name: 'Medium Van (Kia Bongo)',
                gasoline_per_km: 0.12,
                diesel_per_km: 0.12,
                payload: '1,200 kg'
            },
            large_van: {
                name: 'Large Van (Mercedes Sprinter)',
                gasoline_per_km: 0.14,
                diesel_per_km: 0.13,
                payload: '1,500 kg'
            }
        };
    },

    getFallbackOilData() {
        return {
            wti_crude: 75.00,
            brent_crude: 79.00,
            gasoline: 2.10,
            diesel: 2.40,
            syrian_prices: {
                gasoline: {
                    subsidized: SYRIAN_FUEL_ESTIMATES.gasoline_subsidized,
                    market: SYRIAN_FUEL_ESTIMATES.gasoline_market,
                    international_equivalent: 50250 // Rough estimate
                },
                diesel: {
                    subsidized: SYRIAN_FUEL_ESTIMATES.diesel_subsidized,
                    market: SYRIAN_FUEL_ESTIMATES.diesel_market,
                    international_equivalent: 54450
                }
            },
            van_consumption: this.getVanFuelConsumption(),
            source: 'fallback',
            timestamp: Date.now()
        };
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

    getCachedOilPrices(allowExpired = false) {
        try {
            const cached = localStorage.getItem(OIL_CACHE_KEY);
            if (!cached) return null;

            const data = JSON.parse(cached);
            const now = Date.now();

            if (!allowExpired && (now - data.timestamp) > CACHE_DURATION) {
                return null; // Cache expired
            }

            return data;
        } catch (error) {
            console.error('Error reading cached oil prices:', error);
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

    cacheOilPrices(data) {
        try {
            localStorage.setItem(OIL_CACHE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error caching oil prices:', error);
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
            localStorage.removeItem(OIL_CACHE_KEY);
        } catch (error) {
            console.error('Error clearing currency cache:', error);
        }
    }
};