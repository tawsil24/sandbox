import { PRICING_CONFIG, PARCEL_SIZES } from './constants';
import { currencyAPI } from '../services/currencyAPI';

export const generateDeliveryCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const calculatePrice = (deliveryData) => {
    const { parcelSize, distance = 5 } = deliveryData;

    if (parcelSize === PARCEL_SIZES.CUSTOM) {
        return 10000;
    }

    const config = PRICING_CONFIG[parcelSize];
    if (!config) return 2000;

    const calculatedPrice = config.basePrice * distance;
    return Math.max(calculatedPrice, config.minPrice);
};

export const formatSYP = (amount) => {
    return new Intl.NumberFormat('ar-SY', {
        style: 'currency',
        currency: 'SYP',
        minimumFractionDigits: 0
    }).format(amount);
};

export const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

export const formatDualCurrency = (sypAmount) => {
    const usdAmount = currencyAPI.convertSYPToUSD(sypAmount);

    if (usdAmount) {
        return `${formatSYP(sypAmount)} (${formatUSD(usdAmount)})`;
    }

    return formatSYP(sypAmount);
};

export const initializeCurrency = async () => {
    try {
        await currencyAPI.getUSDExchangeRate();
        return true;
    } catch (error) {
        console.error('Failed to initialize currency rates:', error);
        return false;
    }
};

export const formatDeliveryStatus = (status) => {
    const statusMap = {
        pending: 'في الانتظار',
        assigned: 'تم التعيين',
        picked_up: 'تم الاستلام',
        in_transit: 'في الطريق',
        delivered: 'تم التوصيل',
        cancelled: 'ملغي',
        failed: 'فشل'
    };

    return statusMap[status] || status;
};

export const formatParcelSize = (size) => {
    const sizeMap = {
        small: 'صغير',
        medium: 'متوسط',
        large: 'كبير',
        extra_large: 'كبير جداً',
        custom: 'مخصص'
    };

    return sizeMap[size] || size;
};

export const formatDeliveryMode = (mode) => {
    const modeMap = {
        door_to_door: 'من الباب إلى الباب',
        shop_to_door: 'من المتجر إلى الباب',
        door_to_shop: 'من الباب إلى المتجر',
        shop_to_shop: 'من متجر إلى متجر'
    };

    return modeMap[mode] || mode;
};

export const validateDeliveryForm = (formData) => {
    const errors = {};

    if (!formData.parcelSize) {
        errors.parcelSize = 'حجم الطرد مطلوب';
    }

    if (!formData.deliveryMode) {
        errors.deliveryMode = 'نوع التوصيل مطلوب';
    }

    if (!formData.pickupAddress || formData.pickupAddress.trim().length < 5) {
        errors.pickupAddress = 'عنوان الاستلام مطلوب (5 أحرف على الأقل)';
    }

    if (!formData.deliveryAddress || formData.deliveryAddress.trim().length < 5) {
        errors.deliveryAddress = 'عنوان التوصيل مطلوب (5 أحرف على الأقل)';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const calculateDriverEarnings = (totalPrice) => {
    return Math.floor(totalPrice * 0.70);
};

export const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\+963)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
};

export const formatDateTime = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SY', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

export const getStatusColor = (status) => {
    const colors = {
        pending: '#f39c12',
        assigned: '#3498db',
        picked_up: '#9b59b6',
        in_transit: '#e67e22',
        delivered: '#27ae60',
        cancelled: '#e74c3c',
        failed: '#e74c3c'
    };

    return colors[status] || '#95a5a6';
};

export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const validateOTP = (otp) => {
    return /^\d{6}$/.test(otp);
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

export const formatAddress = (address) => {
    if (!address) return '';
    return address.length > 50 ? address.substring(0, 50) + '...' : address;
};

export const getDeliveryModeIcon = (mode) => {
    const icons = {
        door_to_door: '🏠➡️🏠',
        shop_to_door: '🏪➡️🏠',
        door_to_shop: '🏠➡️🏪',
        shop_to_shop: '🏪➡️🏪'
    };

    return icons[mode] || '📦';
};

export const getParcelSizeIcon = (size) => {
    const icons = {
        small: '📦',
        medium: '📫',
        large: '📮',
        extra_large: '🗳️',
        custom: '📋'
    };

    return icons[size] || '📦';
};