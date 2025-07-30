import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { deliveryAPI } from '../services/deliveryAPI';
import { mapAPI } from '../services/mapAPI';
import { PARCEL_SIZES, DELIVERY_MODES, DEMO_USERS } from '../utils/constants';
import { calculatePrice, formatSYP, validateDeliveryForm, initializeCurrency } from '../utils/helpers';
import MapPicker from './MapPicker';
import PriceDisplay from './PriceDisplay';

const SendPackageWithMap = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        senderId: DEMO_USERS.SENDER.id,
        parcelSize: '',
        deliveryMode: '',
        pickupAddress: '',
        deliveryAddress: '',
        description: '',
        pickupInstructions: '',
        deliveryInstructions: '',
        pickupCoordinates: null,
        deliveryCoordinates: null
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [estimatedPrice, setEstimatedPrice] = useState(0);
    const [distance, setDistance] = useState(0);

    const [pickupSearchResults, setPickupSearchResults] = useState([]);
    const [deliverySearchResults, setDeliverySearchResults] = useState([]);
    const [pickupSearchQuery, setPickupSearchQuery] = useState('');
    const [deliverySearchQuery, setDeliverySearchQuery] = useState('');
    const [isSearchingPickup, setIsSearchingPickup] = useState(false);
    const [isSearchingDelivery, setIsSearchingDelivery] = useState(false);

    // Map picker states
    const [showPickupMap, setShowPickupMap] = useState(false);
    const [showDeliveryMap, setShowDeliveryMap] = useState(false);

    useEffect(() => {
        if (formData.pickupCoordinates && formData.deliveryCoordinates && formData.parcelSize) {
            const dist = mapAPI.calculateDistance(
                formData.pickupCoordinates.lat,
                formData.pickupCoordinates.lon,
                formData.deliveryCoordinates.lat,
                formData.deliveryCoordinates.lon
            );
            setDistance(dist);

            const price = calculatePrice({ ...formData, distance: dist });
            setEstimatedPrice(price);
        }
    }, [formData.pickupCoordinates, formData.deliveryCoordinates, formData.parcelSize]);

    useEffect(() => {
        // Initialize currency rates on component mount
        initializeCurrency();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const searchPickupAddress = async (query) => {
        if (query.length < 3) {
            setPickupSearchResults([]);
            return;
        }

        setIsSearchingPickup(true);
        try {
            const results = await mapAPI.searchAddress(query);
            setPickupSearchResults(results);
        } catch (error) {
            console.error('Error searching pickup address:', error);
            setPickupSearchResults([]);
        } finally {
            setIsSearchingPickup(false);
        }
    };

    const searchDeliveryAddress = async (query) => {
        if (query.length < 3) {
            setDeliverySearchResults([]);
            return;
        }

        setIsSearchingDelivery(true);
        try {
            const results = await mapAPI.searchAddress(query);
            setDeliverySearchResults(results);
        } catch (error) {
            console.error('Error searching delivery address:', error);
            setDeliverySearchResults([]);
        } finally {
            setIsSearchingDelivery(false);
        }
    };

    const handlePickupSearch = (e) => {
        const query = e.target.value;
        setPickupSearchQuery(query);
        searchPickupAddress(query);
    };

    const handleDeliverySearch = (e) => {
        const query = e.target.value;
        setDeliverySearchQuery(query);
        searchDeliveryAddress(query);
    };

    const selectPickupAddress = (addressData) => {
        const formattedAddress = mapAPI.formatAddressForDisplay(addressData);
        setFormData(prev => ({
            ...prev,
            pickupAddress: formattedAddress,
            pickupCoordinates: {
                lat: addressData.lat,
                lon: addressData.lon
            }
        }));
        setPickupSearchQuery(formattedAddress);
        setPickupSearchResults([]);
    };

    const selectDeliveryAddress = (addressData) => {
        const formattedAddress = mapAPI.formatAddressForDisplay(addressData);
        setFormData(prev => ({
            ...prev,
            deliveryAddress: formattedAddress,
            deliveryCoordinates: {
                lat: addressData.lat,
                lon: addressData.lon
            }
        }));
        setDeliverySearchQuery(formattedAddress);
        setDeliverySearchResults([]);
    };

    const getCurrentLocation = (isPickup = true) => {
        if (!navigator.geolocation) {
            alert('متصفحك لا يدعم تحديد الموقع');
            return;
        }

        // Show loading state
        const loadingMessage = isPickup ? 'جاري تحديد موقع الاستلام...' : 'جاري تحديد موقع التوصيل...';
        const originalButton = document.activeElement;
        originalButton.textContent = loadingMessage;
        originalButton.disabled = true;

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    const addressData = await mapAPI.reverseGeocode(latitude, longitude);
                    const formattedAddress = mapAPI.formatAddressForDisplay(addressData);

                    if (isPickup) {
                        setFormData(prev => ({
                            ...prev,
                            pickupAddress: formattedAddress,
                            pickupCoordinates: { lat: latitude, lon: longitude }
                        }));
                        setPickupSearchQuery(formattedAddress);
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            deliveryAddress: formattedAddress,
                            deliveryCoordinates: { lat: latitude, lon: longitude }
                        }));
                        setDeliverySearchQuery(formattedAddress);
                    }

                    alert('✅ تم تحديد الموقع بنجاح!');
                } catch (error) {
                    console.error('Reverse geocoding error:', error);
                    // Even if reverse geocoding fails, we can still use the coordinates
                    if (isPickup) {
                        setFormData(prev => ({
                            ...prev,
                            pickupAddress: `موقع GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                            pickupCoordinates: { lat: latitude, lon: longitude }
                        }));
                        setPickupSearchQuery(`موقع GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            deliveryAddress: `موقع GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
                            deliveryCoordinates: { lat: latitude, lon: longitude }
                        }));
                        setDeliverySearchQuery(`موقع GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
                    }
                    alert('تم تحديد الإحداثيات ولكن فشل في تحويلها لعنوان. يمكنك المتابعة.');
                } finally {
                    // Reset button
                    originalButton.textContent = '📍 موقعي الحالي';
                    originalButton.disabled = false;
                }
            },
            (error) => {
                console.error('Geolocation error:', error);

                let errorMessage = 'فشل في تحديد الموقع: ';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += 'تم رفض الإذن. يرجى السماح للموقع بالوصول لموقعك من إعدادات المتصفح.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += 'الموقع غير متاح. تأكد من تفعيل GPS أو الاتصال بالإنترنت.';
                        break;
                    case error.TIMEOUT:
                        errorMessage += 'انتهت مهلة الانتظار. يرجى المحاولة مرة أخرى.';
                        break;
                    default:
                        errorMessage += 'خطأ غير معروف.';
                        break;
                }

                // Suggest Damascus as fallback
                const damascusDefault = 'دمشق، سوريا';
                errorMessage += `\n\nيمكنك البحث يدوياً أو جرب البحث عن "${damascusDefault}"`;

                alert(errorMessage);

                // Reset button
                originalButton.textContent = '📍 موقعي الحالي';
                originalButton.disabled = false;

                // Auto-suggest Damascus for Syrian users
                if (isPickup) {
                    setPickupSearchQuery(damascusDefault);
                    searchPickupAddress(damascusDefault);
                } else {
                    setDeliverySearchQuery(damascusDefault);
                    searchDeliveryAddress(damascusDefault);
                }
            },
            {
                enableHighAccuracy: false, // Changed to false for better compatibility
                timeout: 15000, // Increased timeout
                maximumAge: 300000 // 5 minutes cache
            }
        );
    };

    // Development helper function for testing coordinates
    const useTestLocation = (isPickup = true) => {
        // Damascus center coordinates for testing
        const testCoordinates = {
            lat: 33.5138,
            lon: 36.2765
        };

        const testAddress = 'دمشق، سوريا (موقع تجريبي)';

        if (isPickup) {
            setFormData(prev => ({
                ...prev,
                pickupAddress: testAddress,
                pickupCoordinates: testCoordinates
            }));
            setPickupSearchQuery(testAddress);
        } else {
            setFormData(prev => ({
                ...prev,
                deliveryAddress: testAddress,
                deliveryCoordinates: testCoordinates
            }));
            setDeliverySearchQuery(testAddress);
        }

        alert('✅ تم استخدام موقع تجريبي للاختبار');
    };

    // Handle map picker selection
    const handlePickupMapSelect = (locationData) => {
        setFormData(prev => ({
            ...prev,
            pickupAddress: locationData.address,
            pickupCoordinates: {
                lat: locationData.lat,
                lon: locationData.lon
            }
        }));
        setPickupSearchQuery(locationData.address);
        setShowPickupMap(false);
    };

    const handleDeliveryMapSelect = (locationData) => {
        setFormData(prev => ({
            ...prev,
            deliveryAddress: locationData.address,
            deliveryCoordinates: {
                lat: locationData.lat,
                lon: locationData.lon
            }
        }));
        setDeliverySearchQuery(locationData.address);
        setShowDeliveryMap(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validation = validateDeliveryForm(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        if (!formData.pickupCoordinates || !formData.deliveryCoordinates) {
            alert('يرجى تحديد العناوين والإحداثيات للاستلام والتوصيل');
            return;
        }

        setIsSubmitting(true);
        try {
            const deliveryData = {
                ...formData,
                pickup_coordinates: `POINT(${formData.pickupCoordinates.lon} ${formData.pickupCoordinates.lat})`,
                delivery_coordinates: `POINT(${formData.deliveryCoordinates.lon} ${formData.deliveryCoordinates.lat})`,
                distance: distance
            };

            const delivery = await deliveryAPI.createDelivery(deliveryData);
            alert(`تم إنشاء طلب التوصيل بنجاح!\nرقم الطلب: ${delivery.delivery_code}\nالمسافة: ${distance.toFixed(2)} كم`);
            navigate('/deliveries');
        } catch (error) {
            alert('حدث خطأ أثناء إنشاء الطلب: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="form-container">
            <div className="navigation">
                <Link to="/">← العودة للرئيسية</Link>
                <Link to="/deliveries">عرض الطلبات</Link>
                <Link to="/send">النموذج البسيط</Link>
            </div>

            <h2>📍 إرسال طرد مع الخريطة</h2>
            <p>حدد مواقع الاستلام والتوصيل باستخدام الخريطة</p>

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>حجم الطرد *</label>
                    <select
                        name="parcelSize"
                        value={formData.parcelSize}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">اختر حجم الطرد</option>
                        <option value={PARCEL_SIZES.SMALL}>صغير (حتى 1 كغ)</option>
                        <option value={PARCEL_SIZES.MEDIUM}>متوسط (حتى 5 كغ)</option>
                        <option value={PARCEL_SIZES.LARGE}>كبير (حتى 15 كغ)</option>
                        <option value={PARCEL_SIZES.EXTRA_LARGE}>كبير جداً (حتى 30 كغ)</option>
                        <option value={PARCEL_SIZES.CUSTOM}>مخصص (اتصل بنا)</option>
                    </select>
                    {errors.parcelSize && <span style={{ color: 'red' }}>{errors.parcelSize}</span>}
                </div>

                <div className="form-group">
                    <label>نوع التوصيل *</label>
                    <select
                        name="deliveryMode"
                        value={formData.deliveryMode}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">اختر نوع التوصيل</option>
                        <option value={DELIVERY_MODES.DOOR_TO_DOOR}>من الباب إلى الباب</option>
                        <option value={DELIVERY_MODES.SHOP_TO_DOOR}>من المتجر إلى الباب</option>
                        <option value={DELIVERY_MODES.DOOR_TO_SHOP}>من الباب إلى المتجر</option>
                        <option value={DELIVERY_MODES.SHOP_TO_SHOP}>من متجر إلى متجر</option>
                    </select>
                    {errors.deliveryMode && <span style={{ color: 'red' }}>{errors.deliveryMode}</span>}
                </div>

                <div className="form-group">
                    <label>موقع الاستلام *</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                        <input
                            type="text"
                            value={pickupSearchQuery}
                            onChange={handlePickupSearch}
                            placeholder="ابحث عن عنوان الاستلام"
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            className="btn"
                            onClick={() => getCurrentLocation(true)}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            📍 موقعي الحالي
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => setShowPickupMap(true)}
                            style={{ whiteSpace: 'nowrap', backgroundColor: '#27ae60' }}
                        >
                            🗺️ اختر من الخريطة
                        </button>
                        {/* Development test button */}
                        {window.location.hostname === 'localhost' && (
                            <button
                                type="button"
                                className="btn"
                                onClick={() => { }}
                                style={{ whiteSpace: 'nowrap', backgroundColor: '#e74c3c', fontSize: '12px' }}
                                title="للاختبار على localhost"
                            >
                                🧪 موقع تجريبي
                            </button>
                        )}
                    </div>

                    {/* Quick location buttons */}
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        {['دمشق', 'حلب', 'حمص', 'اللاذقية', 'طرطوس', 'القنطرة'].map(city => (
                            <button
                                key={city}
                                type="button"
                                onClick={() => {
                                    setPickupSearchQuery(city + '، سوريا');
                                    searchPickupAddress(city + '، سوريا');
                                }}
                                style={{
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {city}
                            </button>
                        ))}
                    </div>

                    {isSearchingPickup && <div style={{ fontSize: '12px', color: '#666' }}>جاري البحث...</div>}

                    {pickupSearchResults.length > 0 && (
                        <div style={{
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            maxHeight: '150px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            position: 'relative',
                            zIndex: 10
                        }}>
                            {pickupSearchResults.map((result, index) => (
                                <div
                                    key={index}
                                    onClick={() => selectPickupAddress(result)}
                                    style={{
                                        padding: '8px',
                                        borderBottom: '1px solid #eee',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                >
                                    {mapAPI.formatAddressForDisplay(result)}
                                </div>
                            ))}
                        </div>
                    )}

                    {formData.pickupCoordinates && (
                        <div style={{ fontSize: '12px', color: '#27ae60', marginTop: '5px' }}>
                            ✅ تم تحديد الموقع: {formData.pickupCoordinates.lat.toFixed(6)}, {formData.pickupCoordinates.lon.toFixed(6)}
                        </div>
                    )}

                    {errors.pickupAddress && <span style={{ color: 'red' }}>{errors.pickupAddress}</span>}
                </div>

                <div className="form-group">
                    <label>موقع التوصيل *</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                        <input
                            type="text"
                            value={deliverySearchQuery}
                            onChange={handleDeliverySearch}
                            placeholder="ابحث عن عنوان التوصيل"
                            style={{ flex: 1 }}
                        />
                        <button
                            type="button"
                            className="btn"
                            onClick={() => getCurrentLocation(false)}
                            style={{ whiteSpace: 'nowrap' }}
                        >
                            📍 موقعي الحالي
                        </button>
                        <button
                            type="button"
                            className="btn"
                            onClick={() => setShowDeliveryMap(true)}
                            style={{ whiteSpace: 'nowrap', backgroundColor: '#27ae60' }}
                        >
                            🗺️ اختر من الخريطة
                        </button>
                        {/* Development test button */}
                        {window.location.hostname === 'localhost' && (
                            <button
                                type="button"
                                className="btn"
                                onClick={() => { }}
                                style={{ whiteSpace: 'nowrap', backgroundColor: '#e74c3c', fontSize: '12px' }}
                                title="للاختبار على localhost"
                            >
                                🧪 موقع تجريبي
                            </button>
                        )}
                    </div>

                    {/* Quick location buttons */}
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '5px', flexWrap: 'wrap' }}>
                        {['دمشق', 'حلب', 'حمص', 'اللاذقية', 'طرطوس', 'القنطرة'].map(city => (
                            <button
                                key={city}
                                type="button"
                                onClick={() => {
                                    setDeliverySearchQuery(city + '، سوريا');
                                    searchDeliveryAddress(city + '، سوريا');
                                }}
                                style={{
                                    fontSize: '12px',
                                    padding: '4px 8px',
                                    backgroundColor: '#f8f9fa',
                                    border: '1px solid #dee2e6',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {city}
                            </button>
                        ))}
                    </div>

                    {isSearchingDelivery && <div style={{ fontSize: '12px', color: '#666' }}>جاري البحث...</div>}

                    {deliverySearchResults.length > 0 && (
                        <div style={{
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            maxHeight: '150px',
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            position: 'relative',
                            zIndex: 10
                        }}>
                            {deliverySearchResults.map((result, index) => (
                                <div
                                    key={index}
                                    onClick={() => selectDeliveryAddress(result)}
                                    style={{
                                        padding: '8px',
                                        borderBottom: '1px solid #eee',
                                        cursor: 'pointer',
                                        fontSize: '14px'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                >
                                    {mapAPI.formatAddressForDisplay(result)}
                                </div>
                            ))}
                        </div>
                    )}

                    {formData.deliveryCoordinates && (
                        <div style={{ fontSize: '12px', color: '#27ae60', marginTop: '5px' }}>
                            ✅ تم تحديد الموقع: {formData.deliveryCoordinates.lat.toFixed(6)}, {formData.deliveryCoordinates.lon.toFixed(6)}
                        </div>
                    )}

                    {errors.deliveryAddress && <span style={{ color: 'red' }}>{errors.deliveryAddress}</span>}
                </div>

                {distance > 0 && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#e3f2fd',
                        border: '1px solid #2196f3',
                        borderRadius: '4px',
                        marginBottom: '15px'
                    }}>
                        <strong>المسافة المحسوبة: {distance.toFixed(2)} كم</strong>
                    </div>
                )}

                <div className="form-group">
                    <label>وصف الطرد</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="وصف مختصر للطرد (اختياري)"
                        rows="3"
                    />
                </div>

                <div className="form-group">
                    <label>تعليمات الاستلام</label>
                    <input
                        type="text"
                        name="pickupInstructions"
                        value={formData.pickupInstructions}
                        onChange={handleInputChange}
                        placeholder="تعليمات خاصة للاستلام (اختياري)"
                    />
                </div>

                <div className="form-group">
                    <label>تعليمات التوصيل</label>
                    <input
                        type="text"
                        name="deliveryInstructions"
                        value={formData.deliveryInstructions}
                        onChange={handleInputChange}
                        placeholder="تعليمات خاصة للتوصيل (اختياري)"
                    />
                </div>

                {estimatedPrice > 0 && (
                    <div style={{
                        padding: '15px',
                        backgroundColor: '#e8f5e8',
                        border: '1px solid #4caf50',
                        borderRadius: '4px',
                        marginBottom: '20px'
                    }}>
                        <div style={{ marginBottom: '8px' }}>
                            <strong>التكلفة المقدرة: </strong>
                            <PriceDisplay amount={estimatedPrice} />
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                            <strong>أرباح السائق: </strong>
                            <PriceDisplay amount={Math.floor(estimatedPrice * 0.70)} />
                        </div>
                        <small>المسافة: {distance.toFixed(2)} كم</small>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting || !formData.pickupCoordinates || !formData.deliveryCoordinates}
                    style={{ width: '100%', padding: '12px' }}
                >
                    {isSubmitting ? 'جاري الإرسال...' : 'إنشاء طلب التوصيل'}
                </button>
            </form>

            {/* Map Pickers */}
            <MapPicker
                isOpen={showPickupMap}
                onClose={() => setShowPickupMap(false)}
                onLocationSelect={handlePickupMapSelect}
                title="اختر موقع الاستلام"
                initialPosition={
                    formData.pickupCoordinates ?
                        { lat: formData.pickupCoordinates.lat, lng: formData.pickupCoordinates.lon } :
                        { lat: 33.5138, lng: 36.2765 }
                }
            />

            <MapPicker
                isOpen={showDeliveryMap}
                onClose={() => setShowDeliveryMap(false)}
                onLocationSelect={handleDeliveryMapSelect}
                title="اختر موقع التوصيل"
                initialPosition={
                    formData.deliveryCoordinates ?
                        { lat: formData.deliveryCoordinates.lat, lng: formData.deliveryCoordinates.lon } :
                        { lat: 33.5138, lng: 36.2765 }
                }
            />
        </div>
    );
};

export default SendPackageWithMap;