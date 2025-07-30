import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deliveryAPI } from '../services/deliveryAPI';
import { driverAPI } from '../services/driverAPI';
import { DEMO_USERS } from '../utils/constants';
import { formatSYP, formatDeliveryMode, formatParcelSize, formatDateTime } from '../utils/helpers';

const DriverDashboard = () => {
    const [pendingDeliveries, setPendingDeliveries] = useState([]);
    const [assignedDeliveries, setAssignedDeliveries] = useState([]);
    const [isAvailable, setIsAvailable] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState('');

    let CURRENT_USER = DEMO_USERS.DRIVER;
    // CURRENT_USER = DEMO_USERS.SENDER;
    const driverId = CURRENT_USER.id;

    useEffect(() => {
        loadDeliveries();

        const subscription = deliveryAPI.subscribeToDeliveries((payload) => {
            if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
                setNotification('🔔 طلب توصيل جديد!');
                loadPendingDeliveries();
                setTimeout(() => setNotification(''), 5000);
            }
        });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    const loadDeliveries = async () => {
        try {
            const [pending, assigned] = await Promise.all([
                deliveryAPI.getPendingDeliveries(),
                deliveryAPI.getDeliveries({ driverId })
            ]);

            setPendingDeliveries(pending || []);
            setAssignedDeliveries(assigned || []);
        } catch (error) {
            console.error('Error loading deliveries:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadPendingDeliveries = async () => {
        try {
            const pending = await deliveryAPI.getPendingDeliveries();
            setPendingDeliveries(pending || []);
        } catch (error) {
            console.error('Error loading pending deliveries:', error);
        }
    };

    const handleAcceptDelivery = async (deliveryId) => {
        try {
            await driverAPI.acceptDelivery(deliveryId, driverId);
            setNotification('✅ تم قبول الطلب بنجاح!');
            loadDeliveries();
            setTimeout(() => setNotification(''), 3000);
        } catch (error) {
            alert('حدث خطأ أثناء قبول الطلب: ' + error.message);
        }
    };

    const handleStatusUpdate = async (deliveryId, newStatus) => {
        try {
            await deliveryAPI.updateDeliveryStatus(deliveryId, newStatus);
            setNotification('✅ تم تحديث حالة الطلب!');
            loadDeliveries();
            setTimeout(() => setNotification(''), 3000);
        } catch (error) {
            alert('حدث خطأ أثناء تحديث الحالة: ' + error.message);
        }
    };

    const toggleAvailability = async () => {
        try {
            await driverAPI.updateDriverAvailability(driverId, !isAvailable);
            setIsAvailable(!isAvailable);
            setNotification(isAvailable ? '⏸️ تم إيقاف التوفر' : '▶️ تم تفعيل التوفر');
            setTimeout(() => setNotification(''), 3000);
        } catch (error) {
            console.error('Error updating availability:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="form-container">
                <p>جاري التحميل...</p>
            </div>
        );
    }

    return (
        <div className="form-container">
            <div className="navigation">
                <Link to="/">← العودة للرئيسية</Link>
                <Link to="/deliveries">عرض جميع الطلبات</Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>🚗 لوحة السائق</h2>
                <button
                    className={`btn ${isAvailable ? 'btn-success' : 'btn-danger'}`}
                    onClick={toggleAvailability}
                >
                    {isAvailable ? '🟢 متاح' : '🔴 غير متاح'}
                </button>
            </div>

            <p>مرحباً {CURRENT_USER.full_name}</p>

            {notification && (
                <div style={{
                    padding: '10px',
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    color: '#155724'
                }}>
                    {notification}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                    <h3>طلبات جديدة ({pendingDeliveries.length})</h3>
                    {pendingDeliveries.length === 0 ? (
                        <p>لا توجد طلبات جديدة</p>
                    ) : (
                        pendingDeliveries.map(delivery => (
                            <div key={delivery.id} className="delivery-card status-pending">
                                <h4>كود: {delivery.delivery_code}</h4>
                                <p><strong>من:</strong> {delivery.pickup_address}</p>
                                <p><strong>إلى:</strong> {delivery.delivery_address}</p>
                                <p><strong>النوع:</strong> {formatDeliveryMode(delivery.delivery_mode)}</p>
                                <p><strong>الحجم:</strong> {formatParcelSize(delivery.parcel_size)}</p>
                                <p><strong>المبلغ:</strong> {formatSYP(delivery.total_price)}</p>
                                <p><strong>أرباحك:</strong> {formatSYP(delivery.driver_earnings || Math.floor(delivery.total_price * 0.70))}</p>
                                <p><strong>المرسل:</strong> {delivery.sender?.full_name}</p>
                                <p><strong>الوقت:</strong> {formatDateTime(delivery.created_at)}</p>

                                {delivery.description && (
                                    <p><strong>الوصف:</strong> {delivery.description}</p>
                                )}

                                <button
                                    className="btn btn-success"
                                    onClick={() => handleAcceptDelivery(delivery.id)}
                                    disabled={!isAvailable}
                                >
                                    قبول الطلب
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div>
                    <h3>طلباتي ({assignedDeliveries.length})</h3>
                    {assignedDeliveries.length === 0 ? (
                        <p>لا توجد طلبات مُسندة إليك</p>
                    ) : (
                        assignedDeliveries.map(delivery => (
                            <div key={delivery.id} className={`delivery-card status-${delivery.status}`}>
                                <h4>كود: {delivery.delivery_code}</h4>
                                <p><strong>من:</strong> {delivery.pickup_address}</p>
                                <p><strong>إلى:</strong> {delivery.delivery_address}</p>
                                <p><strong>الحالة:</strong> {delivery.status}</p>
                                <p><strong>المبلغ:</strong> {formatSYP(delivery.total_price)}</p>

                                {delivery.pickup_instructions && (
                                    <p><strong>تعليمات الاستلام:</strong> {delivery.pickup_instructions}</p>
                                )}

                                {delivery.delivery_instructions && (
                                    <p><strong>تعليمات التوصيل:</strong> {delivery.delivery_instructions}</p>
                                )}

                                <div style={{ marginTop: '10px' }}>
                                    {delivery.status === 'assigned' && (
                                        <button
                                            className="btn"
                                            onClick={() => handleStatusUpdate(delivery.id, 'picked_up')}
                                        >
                                            تم الاستلام
                                        </button>
                                    )}

                                    {delivery.status === 'picked_up' && (
                                        <button
                                            className="btn"
                                            onClick={() => handleStatusUpdate(delivery.id, 'in_transit')}
                                        >
                                            في الطريق
                                        </button>
                                    )}

                                    {delivery.status === 'in_transit' && (
                                        <button
                                            className="btn btn-success"
                                            onClick={() => handleStatusUpdate(delivery.id, 'delivered')}
                                        >
                                            تم التوصيل
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverDashboard;