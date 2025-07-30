import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deliveryAPI } from '../services/deliveryAPI';
import { driverAPI } from '../services/driverAPI';
import { DEMO_USERS, DELIVERY_STATUS } from '../utils/constants';
import { formatSYP, formatDeliveryMode, formatParcelSize, formatDateTime, initializeCurrency } from '../utils/helpers';
import PriceDisplay from './PriceDisplay';

const DriverDashboard = () => {
    const [deliveriesByStatus, setDeliveriesByStatus] = useState({
        pending: [],
        assigned: [],
        picked_up: [],
        in_transit: [],
        delivered: []
    });
    const [isAvailable, setIsAvailable] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState('');

    const driverId = DEMO_USERS.DRIVER.id;

    const kanbanColumns = [
        {
            status: 'pending',
            title: 'طلبات جديدة',
            color: '#f39c12',
            icon: '📦',
            actions: ['accept']
        },
        {
            status: 'assigned',
            title: 'مُسندة إليّ',
            color: '#3498db',
            icon: '✅',
            actions: ['pickup']
        },
        {
            status: 'picked_up',
            title: 'تم الاستلام',
            color: '#9b59b6',
            icon: '📮',
            actions: ['in_transit']
        },
        {
            status: 'in_transit',
            title: 'في الطريق',
            color: '#e67e22',
            icon: '🚚',
            actions: ['deliver']
        },
        {
            status: 'delivered',
            title: 'تم التوصيل',
            color: '#27ae60',
            icon: '✅',
            actions: []
        }
    ];

    useEffect(() => {
        loadDeliveries();

        // Initialize currency rates
        initializeCurrency();

        const subscription = deliveryAPI.subscribeToDeliveries((payload) => {
            if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
                setNotification('🔔 طلب توصيل جديد!');
                loadDeliveries();
                setTimeout(() => setNotification(''), 5000);
            } else if (payload.eventType === 'UPDATE') {
                loadDeliveries();
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
            const [pending, myDeliveries] = await Promise.all([
                deliveryAPI.getPendingDeliveries(),
                deliveryAPI.getDeliveries({ driverId })
            ]);

            // Group deliveries by status
            const grouped = {
                pending: pending || [],
                assigned: [],
                picked_up: [],
                in_transit: [],
                delivered: []
            };

            if (myDeliveries) {
                myDeliveries.forEach(delivery => {
                    if (grouped[delivery.status]) {
                        grouped[delivery.status].push(delivery);
                    }
                });
            }

            setDeliveriesByStatus(grouped);
        } catch (error) {
            console.error('Error loading deliveries:', error);
        } finally {
            setIsLoading(false);
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

    const getActionButton = (delivery, actions) => {
        if (!actions.length) return null;

        const actionConfig = {
            accept: {
                text: 'قبول الطلب',
                className: 'btn-success',
                onClick: () => handleAcceptDelivery(delivery.id),
                disabled: !isAvailable
            },
            pickup: {
                text: 'تم الاستلام',
                className: 'btn',
                onClick: () => handleStatusUpdate(delivery.id, 'picked_up')
            },
            in_transit: {
                text: 'في الطريق',
                className: 'btn',
                onClick: () => handleStatusUpdate(delivery.id, 'in_transit')
            },
            deliver: {
                text: 'تم التوصيل',
                className: 'btn-success',
                onClick: () => handleStatusUpdate(delivery.id, 'delivered')
            }
        };

        const action = actionConfig[actions[0]];
        if (!action) return null;

        return (
            <button
                className={`btn ${action.className}`}
                onClick={action.onClick}
                disabled={action.disabled}
                style={{ width: '100%', marginTop: '10px' }}
            >
                {action.text}
            </button>
        );
    };

    const DeliveryCard = ({ delivery, actions }) => (
        <div
            style={{
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '10px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s',
                cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold' }}>
                    {delivery.delivery_code}
                </h4>
                <span style={{ fontSize: '12px', color: '#666' }}>
                    {formatParcelSize(delivery.parcel_size)}
                </span>
            </div>

            <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                <div style={{ marginBottom: '4px' }}>
                    <strong>من:</strong> {delivery.pickup_address?.substring(0, 30)}...
                </div>
                <div style={{ marginBottom: '4px' }}>
                    <strong>إلى:</strong> {delivery.delivery_address?.substring(0, 30)}...
                </div>
                <div style={{ marginBottom: '4px' }}>
                    <strong>المبلغ:</strong> <PriceDisplay amount={delivery.total_price} />
                </div>
                <div style={{ marginBottom: '4px' }}>
                    <strong>أرباحك:</strong> <PriceDisplay amount={delivery.driver_earnings || Math.floor(delivery.total_price * 0.70)} />
                </div>
            </div>

            {delivery.sender && (
                <div style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                    <strong>المرسل:</strong> {delivery.sender.full_name}
                </div>
            )}

            <div style={{ fontSize: '10px', color: '#999' }}>
                {formatDateTime(delivery.created_at)}
            </div>

            {delivery.description && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', fontStyle: 'italic' }}>
                    "{delivery.description.substring(0, 50)}..."
                </div>
            )}

            {(delivery.pickup_instructions || delivery.delivery_instructions) && (
                <div style={{ fontSize: '10px', color: '#e67e22', marginTop: '6px' }}>
                    {delivery.pickup_instructions && '📝 تعليمات استلام '}
                    {delivery.delivery_instructions && '📝 تعليمات توصيل'}
                </div>
            )}

            {getActionButton(delivery, actions)}
        </div>
    );

    if (isLoading) {
        return (
            <div className="form-container">
                <p>جاري التحميل...</p>
            </div>
        );
    }

    const totalDeliveries = Object.values(deliveriesByStatus).reduce((sum, arr) => sum + arr.length, 0);

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
            <div className="navigation" style={{ marginBottom: '20px' }}>
                <Link to="/">← العودة للرئيسية</Link>
                <Link to="/deliveries">عرض جميع الطلبات</Link>
            </div>

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                padding: '15px',
                backgroundColor: '#2c3e50',
                color: 'white',
                borderRadius: '8px'
            }}>
                <div>
                    <h2 style={{ margin: 0 }}>🚗 لوحة السائق</h2>
                    <p style={{ margin: '5px 0 0 0' }}>مرحباً {DEMO_USERS.DRIVER.full_name}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{totalDeliveries}</div>
                    <div style={{ fontSize: '12px' }}>إجمالي الطلبات</div>
                </div>
                <button
                    className={`btn ${isAvailable ? 'btn-success' : 'btn-danger'}`}
                    onClick={toggleAvailability}
                    style={{ fontSize: '16px', padding: '10px 20px' }}
                >
                    {isAvailable ? '🟢 متاح' : '🔴 غير متاح'}
                </button>
            </div>

            {/* Notification */}
            {notification && (
                <div style={{
                    padding: '10px',
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    marginBottom: '20px',
                    color: '#155724',
                    textAlign: 'center',
                    fontSize: '16px'
                }}>
                    {notification}
                </div>
            )}

            {/* Kanban Board */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '15px',
                minHeight: '600px'
            }}>
                {kanbanColumns.map(column => (
                    <div
                        key={column.status}
                        style={{
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            padding: '15px',
                            border: `3px solid ${column.color}`,
                            minHeight: '500px'
                        }}
                    >
                        {/* Column Header */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '15px',
                            paddingBottom: '10px',
                            borderBottom: `2px solid ${column.color}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '20px' }}>{column.icon}</span>
                                <h3 style={{
                                    margin: 0,
                                    color: column.color,
                                    fontSize: '16px',
                                    fontWeight: 'bold'
                                }}>
                                    {column.title}
                                </h3>
                            </div>
                            <span style={{
                                backgroundColor: column.color,
                                color: 'white',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}>
                                {deliveriesByStatus[column.status].length}
                            </span>
                        </div>

                        {/* Column Content */}
                        <div style={{ minHeight: '400px' }}>
                            {deliveriesByStatus[column.status].length === 0 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '200px',
                                    color: '#999',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '40px', marginBottom: '10px', opacity: 0.3 }}>
                                        {column.icon}
                                    </div>
                                    <div>لا توجد طلبات</div>
                                </div>
                            ) : (
                                deliveriesByStatus[column.status].map(delivery => (
                                    <DeliveryCard
                                        key={delivery.id}
                                        delivery={delivery}
                                        actions={column.actions}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Stats */}
            <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#ecf0f1',
                borderRadius: '8px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                textAlign: 'center'
            }}>
                {kanbanColumns.map(column => (
                    <div key={column.status}>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: column.color
                        }}>
                            {deliveriesByStatus[column.status].length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                            {column.title}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DriverDashboard;