import React, { useState } from 'react';
import { deliveryAPI } from '../services/deliveryAPI';
import { PARCEL_SIZES, DELIVERY_MODES, DEMO_USERS } from '../utils/constants';

const DemoDataGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedCount, setGeneratedCount] = useState(0);

    const sampleDeliveries = [
        {
            senderId: DEMO_USERS.SENDER.id,
            parcelSize: PARCEL_SIZES.SMALL,
            deliveryMode: DELIVERY_MODES.DOOR_TO_DOOR,
            pickupAddress: 'دمشق - شارع بغداد - بناء رقم 45',
            deliveryAddress: 'القنطرة - الشارع الرئيسي - منزل أبو سامي',
            description: 'كتب ومجلات',
            pickupInstructions: 'الطابق الثاني - شقة رقم 8',
            deliveryInstructions: 'اتصل قبل الوصول'
        },
        {
            senderId: DEMO_USERS.SENDER.id,
            parcelSize: PARCEL_SIZES.MEDIUM,
            deliveryMode: DELIVERY_MODES.DOOR_TO_DOOR,
            pickupAddress: 'دمشق - المزة - شارع الأطباء - عمارة النور',
            deliveryAddress: 'القنطرة - حي السلام - فيلا رقم 23',
            description: 'أدوية وعلاجات',
            pickupInstructions: 'البواب موجود دائماً',
            deliveryInstructions: 'تسليم باليد فقط'
        },
        {
            senderId: DEMO_USERS.SENDER.id,
            parcelSize: PARCEL_SIZES.LARGE,
            deliveryMode: DELIVERY_MODES.DOOR_TO_DOOR,
            pickupAddress: 'دمشق - جرمانا - شارع التجارة - محل أبو أحمد',
            deliveryAddress: 'القنطرة - المنطقة الصناعية - مستودع رقم 12',
            description: 'قطع غيار سيارات',
            pickupInstructions: 'المحل مفتوح من 9 صباحاً حتى 8 مساءً',
            deliveryInstructions: 'المستودع مفتوح أيام العمل فقط'
        }
    ];

    const generateDemoDeliveries = async () => {
        setIsGenerating(true);
        setGeneratedCount(0);

        try {
            for (let i = 0; i < sampleDeliveries.length; i++) {
                await deliveryAPI.createDelivery(sampleDeliveries[i]);
                setGeneratedCount(i + 1);
                // Add small delay between requests
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            alert('تم إنشاء 3 طلبات توصيل تجريبية بنجاح!');
        } catch (error) {
            alert('حدث خطأ أثناء إنشاء الطلبات: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{
            margin: '20px 0',
            padding: '15px',
            border: '2px dashed #3498db',
            borderRadius: '8px',
            backgroundColor: '#f8f9fa'
        }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>
                🎯 مولد البيانات التجريبية
            </h4>
            <p style={{ fontSize: '14px', color: '#666', margin: '0 0 15px 0' }}>
                إنشاء 3 طلبات توصيل تجريبية من دمشق إلى القنطرة
            </p>

            <button
                className="btn btn-success"
                onClick={generateDemoDeliveries}
                disabled={isGenerating}
                style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    fontWeight: 'bold'
                }}
            >
                {isGenerating ?
                    `جاري الإنشاء... (${generatedCount}/3)` :
                    '🚀 إنشاء طلبات تجريبية'
                }
            </button>

            {isGenerating && (
                <div style={{
                    marginTop: '10px',
                    fontSize: '12px',
                    color: '#27ae60'
                }}>
                    ✅ تم إنشاء {generatedCount} من 3 طلبات
                </div>
            )}
        </div>
    );
};

export default DemoDataGenerator;