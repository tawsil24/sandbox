import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { deliveryAPI } from '../services/deliveryAPI';
import { PARCEL_SIZES, DELIVERY_MODES, DEMO_USERS } from '../utils/constants';
import { calculatePrice, formatSYP, validateDeliveryForm } from '../utils/helpers';

const SendPackage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        senderId: DEMO_USERS.SENDER.id,
        parcelSize: '',
        deliveryMode: '',
        pickupAddress: '',
        deliveryAddress: '',
        description: '',
        pickupInstructions: '',
        deliveryInstructions: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [estimatedPrice, setEstimatedPrice] = useState(0);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (name === 'parcelSize' && value) {
            const price = calculatePrice({ ...formData, [name]: value });
            setEstimatedPrice(price);
        }

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validation = validateDeliveryForm(formData);
        if (!validation.isValid) {
            setErrors(validation.errors);
            return;
        }

        setIsSubmitting(true);
        try {
            const delivery = await deliveryAPI.createDelivery(formData);
            alert(`تم إنشاء طلب التوصيل بنجاح!\nرقم الطلب: ${delivery.delivery_code}`);
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
            </div>

            <h2>📦 إرسال طرد جديد</h2>
            <p>املأ النموذج أدناه لإنشاء طلب توصيل</p>

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
                    <label>عنوان الاستلام *</label>
                    <input
                        type="text"
                        name="pickupAddress"
                        value={formData.pickupAddress}
                        onChange={handleInputChange}
                        placeholder="أدخل عنوان استلام الطرد"
                        required
                    />
                    {errors.pickupAddress && <span style={{ color: 'red' }}>{errors.pickupAddress}</span>}
                </div>

                <div className="form-group">
                    <label>عنوان التوصيل *</label>
                    <input
                        type="text"
                        name="deliveryAddress"
                        value={formData.deliveryAddress}
                        onChange={handleInputChange}
                        placeholder="أدخل عنوان توصيل الطرد"
                        required
                    />
                    {errors.deliveryAddress && <span style={{ color: 'red' }}>{errors.deliveryAddress}</span>}
                </div>

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
                        <strong>التكلفة المقدرة: {formatSYP(estimatedPrice)}</strong>
                        <br />
                        <small>أرباح السائق: {formatSYP(Math.floor(estimatedPrice * 0.70))}</small>
                    </div>
                )}

                <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting}
                    style={{ width: '100%', padding: '12px' }}
                >
                    {isSubmitting ? 'جاري الإرسال...' : 'إنشاء طلب التوصيل'}
                </button>
            </form>
        </div>
    );
};

export default SendPackage;