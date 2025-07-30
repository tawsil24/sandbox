export const PARCEL_SIZES = {
    SMALL: 'small',
    MEDIUM: 'medium',
    LARGE: 'large',
    EXTRA_LARGE: 'extra_large',
    CUSTOM: 'custom'
};

export const DELIVERY_MODES = {
    DOOR_TO_DOOR: 'door_to_door',
    SHOP_TO_DOOR: 'shop_to_door',
    DOOR_TO_SHOP: 'door_to_shop',
    SHOP_TO_SHOP: 'shop_to_shop'
};

export const DELIVERY_STATUS = {
    PENDING: 'pending',
    ASSIGNED: 'assigned',
    PICKED_UP: 'picked_up',
    IN_TRANSIT: 'in_transit',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
    FAILED: 'failed'
};

export const USER_ROLES = {
    SENDER: 'sender',
    DRIVER: 'driver',
    SHOP_STAFF: 'shop_staff',
    CUSTOMER_SUPPORT: 'customer_support',
    ADMIN: 'admin'
};

export const PRICING_CONFIG = {
    [PARCEL_SIZES.SMALL]: { basePrice: 500, minPrice: 2000, maxWeight: 1.0 },
    [PARCEL_SIZES.MEDIUM]: { basePrice: 750, minPrice: 3000, maxWeight: 5.0 },
    [PARCEL_SIZES.LARGE]: { basePrice: 1000, minPrice: 5000, maxWeight: 15.0 },
    [PARCEL_SIZES.EXTRA_LARGE]: { basePrice: 1500, minPrice: 8000, maxWeight: 30.0 },
    [PARCEL_SIZES.CUSTOM]: { basePrice: 0, minPrice: 0, maxWeight: null }
};

export const DEMO_USERS = {
    SENDER: {
        id: '9c325adb-57d2-486c-8409-6c7967398959',
        full_name: 'أحمد محمد',
        phone: '+963991234567',
        role: USER_ROLES.SENDER
    },
    DRIVER: {
        id: '85711e22-53b7-42dd-a296-9c1127d65b91',
        full_name: 'محمد علي',
        phone: '+963991234568',
        role: USER_ROLES.DRIVER
    }
};

export const NOTIFICATION_TYPES = {
    SMS: 'sms',
    PUSH: 'push',
    EMAIL: 'email'
};

export const PAYMENT_METHODS = {
    CASH: 'cash',
    WALLET: 'wallet',
    CARD: 'card'
};

export const PAYMENT_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
};

export const DRIVER_STATUS = {
    PENDING: 'pending',
    ACTIVE: 'active',
    SUSPENDED: 'suspended',
    BANNED: 'banned'
};

export const VERIFICATION_METHODS = {
    QR_CODE: 'qr_code',
    OTP: 'otp'
};