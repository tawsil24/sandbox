import React, { useState, useEffect } from 'react';
import { currencyAPI } from '../services/currencyAPI';
import { formatSYP, formatUSD } from '../utils/helpers';

const PriceDisplay = ({
    amount,
    showBoth = true,
    primaryCurrency = 'SYP',
    style = {},
    className = '',
    loading = false
}) => {
    const [usdAmount, setUsdAmount] = useState(null);
    const [isLoading, setIsLoading] = useState(loading);
    const [exchangeRate, setExchangeRate] = useState(null);

    useEffect(() => {
        if (showBoth && amount) {
            loadExchangeRate();
        }
    }, [amount, showBoth]);

    const loadExchangeRate = async () => {
        setIsLoading(true);
        try {
            const rate = await currencyAPI.getUSDExchangeRate();
            // const rate = 10000;
            setExchangeRate(rate);
            const converted = amount / rate;
            setUsdAmount(converted);
        } catch (error) {
            console.error('Failed to load exchange rate:', error);
            setUsdAmount(null);
        } finally {
            setIsLoading(false);
        }
    };

    const renderPrice = () => {
        if (isLoading) {
            return (
                <span style={{ color: '#666' }}>
                    {formatSYP(amount)} <small>(جاري تحديث السعر...)</small>
                </span>
            );
        }

        if (!showBoth || !usdAmount) {
            return formatSYP(amount);
        }

        if (primaryCurrency === 'USD') {
            return (
                <span>
                    {formatUSD(usdAmount)}
                    <small style={{ color: '#666', marginLeft: '8px' }}>
                        ({formatSYP(amount)})
                    </small>
                </span>
            );
        }

        // Default: SYP primary
        return (
            <span>
                {formatSYP(amount)}
                <small style={{ color: '#666', marginLeft: '8px' }}>
                    ({formatUSD(usdAmount)})
                </small>
            </span>
        );
    };

    return (
        <span className={className} style={style}>
            {renderPrice()}
            {exchangeRate && showBoth && (
                <div style={{
                    fontSize: '10px',
                    color: '#999',
                    marginTop: '2px'
                }}>
                    سعر الصرف: 1 USD = {formatSYP(exchangeRate)}
                </div>
            )}
        </span>
    );
};

// Hook for using currency conversion in components
export const useCurrency = () => {
    const [exchangeRate, setExchangeRate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadExchangeRate = async () => {
        setIsLoading(true);
        try {
            const rate = await currencyAPI.getUSDExchangeRate();
            setExchangeRate(rate);
            setLastUpdated(new Date());
            return rate;
        } catch (error) {
            console.error('Failed to load exchange rate:', error);
            return null;
        } finally {
            setIsLoading(false);
        }
    };

    const convertToUSD = (sypAmount) => {
        if (!exchangeRate) return null;
        return sypAmount / exchangeRate;
    };

    const formatDualPrice = (sypAmount) => {
        const usdAmount = convertToUSD(sypAmount);
        if (usdAmount) {
            return `${formatSYP(sypAmount)} (${formatUSD(usdAmount)})`;
        }
        return formatSYP(sypAmount);
    };

    useEffect(() => {
        loadExchangeRate();
    }, []);

    return {
        exchangeRate,
        isLoading,
        lastUpdated,
        loadExchangeRate,
        convertToUSD,
        formatDualPrice
    };
};

export default PriceDisplay;