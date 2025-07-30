import React from 'react';
import { useNavigate } from 'react-router-dom';
import DemoDataGenerator from './DemoDataGenerator';

const UserSelector = () => {
    const navigate = useNavigate();

    return (
        <div className="form-container">
            <h2>مرحباً بك في تطبيق توصيل</h2>
            <p>اختر نوع المستخدم للمتابعة:</p>

            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button
                    className="btn"
                    onClick={() => navigate('/send')}
                    style={{ margin: '10px', padding: '15px 30px', fontSize: '16px' }}
                >
                    📦 إرسال طرد (بسيط)
                </button>

                <button
                    className="btn"
                    onClick={() => navigate('/send-with-map')}
                    style={{ margin: '10px', padding: '15px 30px', fontSize: '16px', backgroundColor: '#8e44ad' }}
                >
                    📍 إرسال طرد (بالخريطة)
                </button>

                <button
                    className="btn btn-success"
                    onClick={() => navigate('/driver')}
                    style={{ margin: '10px', padding: '15px 30px', fontSize: '16px' }}
                >
                    🚗 سائق توصيل
                </button>

                <button
                    className="btn"
                    onClick={() => navigate('/deliveries')}
                    style={{ margin: '10px', padding: '15px 30px', fontSize: '16px' }}
                >
                    📋 عرض الطلبات
                </button>
            </div>

            <DemoDataGenerator />

            <div style={{ marginTop: '40px', fontSize: '14px', color: '#666' }}>
                <p><strong>ملاحظة:</strong> هذا عرض توضيحي للمنصة</p>
                <p>تأكد من إعداد متغيرات البيئة في ملف .env.local</p>
            </div>
        </div>
    );
};

export default UserSelector;