import React, { useState, useEffect } from 'react';
import { currencyAPI } from '../services/currencyAPI';
import {
    formatSYP,
    formatUSD
} from '../utils/helpers';

const CostDisplay = ({
    distance = 10, // km
    parcelSize = 'medium',
    vehicleType = 'small_van',
    showDetails = true,
    style = {},
    className = ''
}) => {
    const [oilData, setOilData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showFuelDetails, setShowFuelDetails] = useState(false);
    const [selectedFuelType, setSelectedFuelType] = useState('diesel'); // diesel or gasoline
    const [exchangeRate, setExchangeRate] = useState(null);
    const [usdAmount, setUsdAmount] = useState(null);

    useEffect(() => {
        loadOilPrices();
        loadExchangeRate();
    }, []);

    const loadExchangeRate = async () => {
        setIsLoading(true);
        try {
            const rate = await currencyAPI.getUSDExchangeRate();
            // const rate = 10000;
            setExchangeRate(rate);
            // const converted = amount / rate;
            // setUsdAmount(converted);
        } catch (error) {
            console.error('Failed to load exchange rate:', error);
            // setUsdAmount(null);
        } finally {
            setIsLoading(false);
        }
    };

    const syp_to_usd = (amount = 0) => {
        return formatUSD(amount / exchangeRate);
    };

    const loadOilPrices = async () => {
        setIsLoading(true);
        try {
            const data = await currencyAPI.getOilPrices();

            console.log('============================================');
            console.log(data);
            console.log('============================================');



            setOilData(data);
        } catch (error) {
            console.error('Failed to load oil prices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getVehicleInfo = (type) => {
        const vehicles = {
            small_van: {
                name: 'شاحنة صغيرة (هيونداي H100)',
                gasoline_per_km: 0.11,
                diesel_per_km: 0.11,
                payload: '1,000 كغ',
                icon: '🚐'
            },
            medium_van: {
                name: 'شاحنة متوسطة (كيا بونغو)',
                gasoline_per_km: 0.12,
                diesel_per_km: 0.12,
                payload: '1,200 كغ',
                icon: '🚚'
            },
            large_van: {
                name: 'شاحنة كبيرة (مرسيدس سبرينتر)',
                gasoline_per_km: 0.14,
                diesel_per_km: 0.13,
                payload: '1,500 كغ',
                icon: '🚛'
            },
            car: {
                name: 'سيارة عادية (هيونداي أكسنت)',
                gasoline_per_km: 0.08,
                diesel_per_km: 0.07,
                payload: '500 كغ',
                icon: '🚗'
            }
        };
        return vehicles[type] || vehicles.small_van;
    };

    const getParcelSizeInfo = (size) => {
        const sizes = {
            small: { name: 'صغير', recommendedVehicle: 'car', icon: '📦' },
            medium: { name: 'متوسط', recommendedVehicle: 'car', icon: '📫' },
            large: { name: 'كبير', recommendedVehicle: 'small_van', icon: '📮' },
            extra_large: { name: 'كبير جداً', recommendedVehicle: 'medium_van', icon: '🗳️' },
            custom: { name: 'مخصص', recommendedVehicle: 'large_van', icon: '📋' }
        };
        return sizes[size] || sizes.medium;
    };

    const calculateFuelCost = (fuelType, vehicle, distance) => {
        if (!oilData || !oilData.syrian_prices) return null;

        const fuelKey = fuelType === 'gasoline' ? 'gasoline_per_km' : 'diesel_per_km';
        const consumption = vehicle[fuelKey];
        const fuelPrice = oilData.syrian_prices[fuelType];

        if (!fuelPrice) return null;

        const totalFuelNeeded = consumption * distance;
        const costSubsidized = totalFuelNeeded * fuelPrice.subsidized;
        const costMarket = totalFuelNeeded * fuelPrice.market;

        return {
            fuel_needed: totalFuelNeeded,
            cost_subsidized: costSubsidized,
            cost_market: costMarket,
            price_per_liter_subsidized: fuelPrice.subsidized,
            price_per_liter_market: fuelPrice.market,
            consumption_per_km: consumption
        };
    };

    const calculateRoundTripCost = (fuelType, vehicle, distance) => {
        const oneWay = calculateFuelCost(fuelType, vehicle, distance);
        if (!oneWay) return null;

        return {
            ...oneWay,
            fuel_needed: oneWay.fuel_needed * 2,
            cost_subsidized: oneWay.cost_subsidized * 2,
            cost_market: oneWay.cost_market * 2
        };
    };

    const vehicle = getVehicleInfo(vehicleType);
    const parcelInfo = getParcelSizeInfo(parcelSize);
    const dieselCost = calculateFuelCost('diesel', vehicle, distance);
    const gasolineCost = calculateFuelCost('gasoline', vehicle, distance);
    const roundTripDiesel = calculateRoundTripCost('diesel', vehicle, distance);
    const roundTripGasoline = calculateRoundTripCost('gasoline', vehicle, distance);

    if (isLoading) {
        return (
            <div className={className} style={style}>
                <div style={{ padding: '15px', textAlign: 'center', color: '#666' }}>
                    ⛽ جاري تحميل معلومات الوقود...
                </div>
            </div>
        );
    }

    if (!oilData) {
        return (
            <div className={className} style={style}>
                <div style={{ padding: '15px', textAlign: 'center', color: '#e74c3c' }}>
                    ❌ فشل في تحميل معلومات الوقود
                </div>
            </div>
        );
    }

    return (
        <div className={className} style={style}>
            <div style={{
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                padding: '15px',
                backgroundColor: '#f8f9fa'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '15px',
                    paddingBottom: '10px',
                    borderBottom: '2px solid #007bff'
                }}>
                    <h4 style={{ margin: 0, color: '#007bff' }}>
                        ⛽ تكلفة الوقود والنقل
                    </h4>
                    <button
                        onClick={() => setShowFuelDetails(!showFuelDetails)}
                        style={{
                            background: 'none',
                            border: '1px solid #007bff',
                            color: '#007bff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            padding: '4px 8px',
                            borderRadius: '4px'
                        }}
                    >
                        {showFuelDetails ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                    </button>
                </div>

                {/* Package and Vehicle Info */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px',
                    marginBottom: '15px'
                }}>
                    <div style={{
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6'
                    }}>
                        <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: '5px' }}>
                            {parcelInfo.icon} معلومات الطرد
                        </div>
                        <div style={{ fontSize: '12px' }}>
                            <div>الحجم: {parcelInfo.name}</div>
                            <div>المسافة: {distance} كم</div>
                            <div>المركبة المقترحة: {getVehicleInfo(parcelInfo.recommendedVehicle).name}</div>
                        </div>
                    </div>

                    <div style={{
                        padding: '10px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        border: '1px solid #dee2e6'
                    }}>
                        <div style={{ fontWeight: 'bold', color: '#495057', marginBottom: '5px' }}>
                            {vehicle.icon} المركبة المختارة
                        </div>
                        <div style={{ fontSize: '12px' }}>
                            <div>{vehicle.name}</div>
                            <div>الحمولة: {vehicle.payload}</div>
                            <div>استهلاك الديزل: {vehicle.diesel_per_km}L/كم</div>
                        </div>
                    </div>
                </div>

                {/* Fuel Type Selector */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
                        نوع الوقود:
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setSelectedFuelType('diesel')}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                backgroundColor: selectedFuelType === 'diesel' ? '#007bff' : 'white',
                                color: selectedFuelType === 'diesel' ? 'white' : '#495057',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            🛢️ ديزل
                        </button>
                        <button
                            onClick={() => setSelectedFuelType('gasoline')}
                            style={{
                                padding: '8px 16px',
                                border: '1px solid #dee2e6',
                                borderRadius: '4px',
                                backgroundColor: selectedFuelType === 'gasoline' ? '#007bff' : 'white',
                                color: selectedFuelType === 'gasoline' ? 'white' : '#495057',
                                cursor: 'pointer',
                                fontSize: '12px'
                            }}
                        >
                            ⛽ بنزين
                        </button>
                    </div>
                </div>

                {/* Current Fuel Costs */}
                <div style={{ marginBottom: '15px' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
                        تكلفة الوقود لهذا التوصيل:
                    </div>

                    {selectedFuelType === 'diesel' && dieselCost && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            marginBottom: '10px'
                        }}>
                            <div style={{
                                padding: '8px',
                                backgroundColor: '#d4edda',
                                border: '1px solid #c3e6cb',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#155724' }}>سعر مدعوم</div>
                                <div>الوقود المطلوب: {dieselCost.fuel_needed.toFixed(2)} لتر</div>
                                <div>التكلفة: {formatSYP(dieselCost.cost_subsidized)}
                                    <span style={{ color: '#666', marginLeft: '8px' }}>
                                        ({syp_to_usd(dieselCost.cost_subsidized)})
                                    </span>
                                </div>
                                <div>ذهاب وإياب: {formatSYP(roundTripDiesel?.cost_subsidized || 0)}  {syp_to_usd(roundTripDiesel?.cost_subsidized || 0)}</div>
                            </div>
                            <div style={{
                                padding: '8px',
                                backgroundColor: '#f8d7da',
                                border: '1px solid #f5c6cb',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#721c24' }}>سعر السوق</div>
                                <div>الوقود المطلوب: {dieselCost.fuel_needed.toFixed(2)} لتر</div>
                                <div>التكلفة: {formatSYP(dieselCost.cost_market)}
                                    <span style={{ color: '#666', marginLeft: '8px' }}>
                                        ({syp_to_usd(dieselCost.cost_market)})
                                    </span>
                                </div>
                                <div>ذهاب وإياب: {formatSYP(roundTripDiesel?.cost_market || 0)}  {syp_to_usd(roundTripDiesel?.cost_market || 0)}</div>
                            </div>
                        </div>
                    )}

                    {selectedFuelType === 'gasoline' && gasolineCost && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '10px',
                            marginBottom: '10px'
                        }}>
                            <div style={{
                                padding: '8px',
                                backgroundColor: '#d4edda',
                                border: '1px solid #c3e6cb',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#155724' }}>سعر مدعوم</div>
                                <div>الوقود المطلوب: {gasolineCost.fuel_needed.toFixed(2)} لتر</div>
                                <div>التكلفة: {formatSYP(gasolineCost.cost_subsidized)}

                                    <span style={{ color: '#666', marginLeft: '8px' }}>
                                        ({syp_to_usd(gasolineCost.cost_subsidized)})
                                    </span>
                                </div>
                                <div>ذهاب وإياب: {formatSYP(roundTripGasoline?.cost_subsidized || 0)}</div>
                            </div>
                            <div style={{
                                padding: '8px',
                                backgroundColor: '#f8d7da',
                                border: '1px solid #f5c6cb',
                                borderRadius: '4px',
                                fontSize: '12px'
                            }}>
                                <div style={{ fontWeight: 'bold', color: '#721c24' }}>سعر السوق</div>
                                <div>الوقود المطلوب: {gasolineCost.fuel_needed.toFixed(2)} لتر</div>
                                <div>التكلفة: {formatSYP(gasolineCost.cost_market)}

                                    <span style={{ color: '#666', marginLeft: '8px' }}>
                                        ({syp_to_usd(gasolineCost.cost_market)})
                                    </span>

                                </div>
                                <div>ذهاب وإياب: {formatSYP(roundTripGasoline?.cost_market || 0)}</div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Detailed Information */}
                {showFuelDetails && (
                    <div style={{
                        borderTop: '1px solid #dee2e6',
                        paddingTop: '15px'
                    }}>
                        {/* Current Oil Prices */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
                                أسعار الوقود الحالية:
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '8px',
                                fontSize: '11px'
                            }}>
                                <div style={{ padding: '6px', backgroundColor: 'white', borderRadius: '4px' }}>
                                    <strong>🛢️ ديزل:</strong>
                                    <div>مدعوم: {formatSYP(oilData.syrian_prices?.diesel?.subsidized || 1250)}/لتر</div>
                                    <div>السوق: {formatSYP(oilData.syrian_prices?.diesel?.market || 3500)}/لتر</div>
                                    <div>مدعوم: {syp_to_usd(oilData.syrian_prices?.diesel?.subsidized)}/لتر</div>
                                    <div>السوق: {syp_to_usd(oilData.syrian_prices?.diesel?.market.toFixed(0) || 3500)}/لتر</div>
                                </div>
                                <div style={{ padding: '6px', backgroundColor: 'white', borderRadius: '4px' }}>
                                    <strong>⛽ بنزين:</strong>
                                    <div>مدعوم: {formatSYP(oilData.syrian_prices?.gasoline?.subsidized || 1750)}/لتر</div>
                                    <div>السوق: {formatSYP(oilData.syrian_prices?.gasoline?.market || 4000)}/لتر</div>
                                    <div>مدعوم: {syp_to_usd(oilData.syrian_prices?.gasoline?.subsidized || 1750)}/لتر</div>
                                    <div>السوق: {syp_to_usd(oilData.syrian_prices?.gasoline?.market || 4000)}/لتر</div>
                                </div>
                            </div>
                        </div>

                        {/* International Prices */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
                                أسعار النفط العالمية:
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                gap: '8px',
                                fontSize: '11px'
                            }}>
                                <div style={{ padding: '6px', backgroundColor: 'white', borderRadius: '4px' }}>
                                    <strong>WTI خام:</strong> ${oilData.wti_crude?.toFixed(2) || '75.50'}/برميل
                                </div>
                                <div style={{ padding: '6px', backgroundColor: 'white', borderRadius: '4px' }}>
                                    <strong>Brent خام:</strong> ${oilData.brent_crude?.toFixed(2) || '79.20'}/برميل
                                </div>
                            </div>
                        </div>

                        {/* Vehicle Comparison */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
                                مقارنة المركبات (لمسافة {distance} كم):
                            </div>
                            <div style={{ fontSize: '10px' }}>
                                {['car', 'small_van', 'medium_van', 'large_van'].map(type => {
                                    const v = getVehicleInfo(type);
                                    const dCost = calculateFuelCost('diesel', v, distance);
                                    const gCost = calculateFuelCost('gasoline', v, distance);


                                    return (
                                        <div key={type} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '2fr 1fr 1fr',
                                            gap: '8px',
                                            padding: '4px',
                                            backgroundColor: type === vehicleType ? '#e3f2fd' : 'white',
                                            borderRadius: '4px',
                                            marginBottom: '4px',
                                            border: type === vehicleType ? '1px solid #2196f3' : '1px solid #dee2e6'
                                        }}>
                                            <div style={{ fontWeight: 'bold' }}>{v.icon} {v.name}</div>
                                            <div>ديزل: {formatSYP(dCost?.cost_market || 0)} ({syp_to_usd(dCost?.cost_market || 0)})</div>
                                            <div>بنزين: {formatSYP(gCost?.cost_market || 0)} ({syp_to_usd(gCost?.cost_market || 0)})</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Source and Update Info */}
                        <div style={{
                            fontSize: '9px',
                            color: '#6c757d',
                            textAlign: 'center',
                            paddingTop: '10px',
                            borderTop: '1px solid #dee2e6'
                        }}>
                            آخر تحديث: {new Date(oilData.timestamp || Date.now()).toLocaleString('ar-SY')}
                            {oilData.source && ` • المصدر: ${oilData.source}`}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CostDisplay;