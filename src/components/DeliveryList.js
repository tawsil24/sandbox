import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { deliveryAPI } from '../services/deliveryAPI';
import {
    formatSYP,
    formatDeliveryMode,
    formatParcelSize,
    formatDateTime,
    formatDeliveryStatus,
    getStatusColor
} from '../utils/helpers';
import { DELIVERY_STATUS } from '../utils/constants';

const DeliveryList = () => {
    const [deliveries, setDeliveries] = useState([]);
    const [filteredDeliveries, setFilteredDeliveries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDeliveries();

        const subscription = deliveryAPI.subscribeToDeliveries((payload) => {
            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
                loadDeliveries();
            }
        });

        return () => {
            if (subscription) {
                subscription.unsubscribe();
            }
        };
    }, []);

    useEffect(() => {
        filterDeliveries();
    }, [deliveries, statusFilter]);

    const loadDeliveries = async () => {
        try {
            const data = await deliveryAPI.getDeliveries();
            setDeliveries(data || []);
        } catch (error) {
            console.error('Error loading deliveries:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    const filterDeliveries = () => {
        if (statusFilter === 'all') {
            setFilteredDeliveries(deliveries);
        } else {
            setFilteredDeliveries(deliveries.filter(d => d.status === statusFilter));
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        loadDeliveries();
    };

    const getDeliveryStats = () => {
        const stats = {
            total: deliveries.length,
            pending: deliveries.filter(d => d.status === DELIVERY_STATUS.PENDING).length,
            assigned: deliveries.filter(d => d.status === DELIVERY_STATUS.ASSIGNED).length,
            in_transit: deliveries.filter(d => d.status === DELIVERY_STATUS.PICKED_UP || d.status === DELIVERY_STATUS.IN_TRANSIT).length,
            delivered: deliveries.filter(d => d.status === DELIVERY_STATUS.DELIVERED).length,
            cancelled: deliveries.filter(d => d.status === DELIVERY_STATUS.CANCELLED).length
        };
        return stats;
    };

    if (isLoading) {
        return (
            <div className="form-container">
                <p>جاري التحميل...</p>
            </div>
        );
    }

    const stats = getDeliveryStats();

    return (
        <div className="form-container">
            <div className="navigation">
                <Link to="/">← العودة للرئيسية</Link>
                <Link to="/send">إرسال طرد جديد</Link>
                <Link to="/driver">لوحة السائق</Link>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>📋 قائمة الطلبات</h2>
                <button
                    className="btn"
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    {refreshing ? '🔄 جاري التحديث...' : '🔄 تحديث'}
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '10px',
                marginBottom: '20px'
            }}>
                <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', textAlign: 'center' }}>
                    <strong>{stats.total}</strong><br />
                    <small>المجموع</small>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '4px', textAlign: 'center' }}>
                    <strong>{stats.pending}</strong><br />
                    <small>في الانتظار</small>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#cce7ff', borderRadius: '4px', textAlign: 'center' }}>
                    <strong>{stats.assigned}</strong><br />
                    <small>مُسند</small>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#ffe0b3', borderRadius: '4px', textAlign: 'center' }}>
                    <strong>{stats.in_transit}</strong><br />
                    <small>في الطريق</small>
                </div>
                <div style={{ padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px', textAlign: 'center' }}>
                    <strong>{stats.delivered}</strong><br />
                    <small>مُسلّم</small>
                </div>
            </div>

            <div className="form-group">
                <label>تصفية حسب الحالة:</label>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{ maxWidth: '200px' }}
                >
                    <option value="all">جميع الطلبات</option>
                    <option value={DELIVERY_STATUS.PENDING}>في الانتظار</option>
                    <option value={DELIVERY_STATUS.ASSIGNED}>مُسند للسائق</option>
                    <option value={DELIVERY_STATUS.PICKED_UP}>تم الاستلام</option>
                    <option value={DELIVERY_STATUS.IN_TRANSIT}>في الطريق</option>
                    <option value={DELIVERY_STATUS.DELIVERED}>تم التوصيل</option>
                    <option value={DELIVERY_STATUS.CANCELLED}>ملغي</option>
                </select>
            </div>

            {filteredDeliveries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    <p>لا توجد طلبات {statusFilter !== 'all' ? 'بهذه الحالة' : ''}</p>
                </div>
            ) : (
                <div>
                    {filteredDeliveries.map(delivery => (
                        <div key={delivery.id} className={`delivery-card status-${delivery.status}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{
                                        margin: '0 0 10px 0',
                                        color: getStatusColor(delivery.status),
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}>
                                        كود: {delivery.delivery_code}
                                        <span style={{
                                            fontSize: '12px',
                                            padding: '2px 8px',
                                            backgroundColor: getStatusColor(delivery.status),
                                            color: 'white',
                                            borderRadius: '12px'
                                        }}>
                                            {formatDeliveryStatus(delivery.status)}
                                        </span>
                                    </h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                                        <div>
                                            <p><strong>من:</strong> {delivery.pickup_address}</p>
                                            <p><strong>إلى:</strong> {delivery.delivery_address}</p>
                                            <p><strong>النوع:</strong> {formatDeliveryMode(delivery.delivery_mode)}</p>
                                        </div>
                                        <div>
                                            <p><strong>الحجم:</strong> {formatParcelSize(delivery.parcel_size)}</p>
                                            <p><strong>المبلغ:</strong> {formatSYP(delivery.total_price)}</p>
                                            <p><strong>التاريخ:</strong> {formatDateTime(delivery.created_at)}</p>
                                        </div>
                                    </div>

                                    {delivery.description && (
                                        <p><strong>الوصف:</strong> {delivery.description}</p>
                                    )}

                                    <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#666' }}>
                                        <span><strong>المرسل:</strong> {delivery.sender?.full_name || 'غير محدد'}</span>
                                        {delivery.driver && (
                                            <span><strong>السائق:</strong> {delivery.driver.full_name}</span>
                                        )}
                                    </div>

                                    {(delivery.pickup_instructions || delivery.delivery_instructions) && (
                                        <div style={{ marginTop: '10px', fontSize: '14px' }}>
                                            {delivery.pickup_instructions && (
                                                <p><strong>تعليمات الاستلام:</strong> {delivery.pickup_instructions}</p>
                                            )}
                                            {delivery.delivery_instructions && (
                                                <p><strong>تعليمات التوصيل:</strong> {delivery.delivery_instructions}</p>
                                            )}
                                        </div>
                                    )}

                                    {(delivery.picked_up_at || delivery.delivered_at) && (
                                        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                            {delivery.picked_up_at && (
                                                <span>تم الاستلام: {formatDateTime(delivery.picked_up_at)} | </span>
                                            )}
                                            {delivery.delivered_at && (
                                                <span>تم التوصيل: {formatDateTime(delivery.delivered_at)}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {filteredDeliveries.length > 0 && (
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    textAlign: 'center',
                    fontSize: '14px',
                    color: '#666'
                }}>
                    عرض {filteredDeliveries.length} من أصل {deliveries.length} طلب
                </div>
            )}
        </div>
    );
};

export default DeliveryList;