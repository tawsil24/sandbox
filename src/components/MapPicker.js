import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { mapAPI } from '../services/mapAPI';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom draggable marker component
const DraggableMarker = ({ position, onPositionChange, onAddressChange }) => {
    const markerRef = useRef(null);

    const eventHandlers = {
        dragend() {
            const marker = markerRef.current;
            if (marker != null) {
                const newPosition = marker.getLatLng();
                onPositionChange(newPosition);
                // Reverse geocode the new position
                handleReverseGeocode(newPosition);
            }
        },
    };

    const handleReverseGeocode = async (latlng) => {
        try {
            const addressData = await mapAPI.reverseGeocode(latlng.lat, latlng.lng);
            const formattedAddress = mapAPI.formatAddressForDisplay(addressData);
            onAddressChange(formattedAddress);
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            onAddressChange(`موقع GPS: ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
        }
    };

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
        />
    );
};

// Component to handle map clicks
const MapClickHandler = ({ onMapClick }) => {
    useMapEvents({
        click(e) {
            onMapClick(e.latlng);
        },
    });
    return null;
};

const MapPicker = ({
    isOpen,
    onClose,
    onLocationSelect,
    initialPosition = { lat: 33.5138, lng: 36.2765 }, // Damascus center
    title = "اختر الموقع على الخريطة"
}) => {
    const [position, setPosition] = useState(initialPosition);
    const [address, setAddress] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && initialPosition) {
            setPosition(initialPosition);
            // Get initial address
            handleReverseGeocode(initialPosition);
        }
    }, [isOpen, initialPosition]);

    const handleReverseGeocode = async (latlng) => {
        setIsLoading(true);
        try {
            const addressData = await mapAPI.reverseGeocode(latlng.lat, latlng.lng);
            const formattedAddress = mapAPI.formatAddressForDisplay(addressData);
            setAddress(formattedAddress);
        } catch (error) {
            console.error('Reverse geocoding failed:', error);
            setAddress(`موقع GPS: ${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePositionChange = (newPosition) => {
        setPosition(newPosition);
    };

    const handleAddressChange = (newAddress) => {
        setAddress(newAddress);
    };

    const handleMapClick = (latlng) => {
        setPosition(latlng);
        handleReverseGeocode(latlng);
    };

    const handleConfirm = () => {
        onLocationSelect({
            lat: position.lat,
            lon: position.lng,
            address: address
        });
        onClose();
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('متصفحك لا يدعم تحديد الموقع');
            return;
        }

        setIsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const newPos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                setPosition(newPos);
                handleReverseGeocode(newPos);
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('فشل في تحديد الموقع الحالي');
                setIsLoading(false);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 300000
            }
        );
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '800px',
                height: '80%',
                maxHeight: '600px',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '15px',
                    borderBottom: '1px solid #ddd',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h3 style={{ margin: 0 }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '24px',
                            cursor: 'pointer',
                            color: '#666'
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Map Container */}
                <div style={{ flex: 1, position: 'relative' }}>
                    <MapContainer
                        center={position}
                        zoom={13}
                        style={{ height: '100%', width: '100%' }}
                        key={`${position.lat}-${position.lng}`} // Force re-render when position changes
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <DraggableMarker
                            position={position}
                            onPositionChange={handlePositionChange}
                            onAddressChange={handleAddressChange}
                        />
                        <MapClickHandler onMapClick={handleMapClick} />
                    </MapContainer>
                </div>

                {/* Address Display */}
                <div style={{
                    padding: '15px',
                    borderTop: '1px solid #ddd',
                    backgroundColor: '#f8f9fa'
                }}>
                    <div style={{ marginBottom: '10px' }}>
                        <strong>العنوان المحدد:</strong>
                        <div style={{
                            marginTop: '5px',
                            padding: '8px',
                            backgroundColor: 'white',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            minHeight: '20px'
                        }}>
                            {isLoading ? 'جاري تحديد العنوان...' : address || 'انقر على الخريطة لتحديد الموقع'}
                        </div>
                    </div>

                    <div style={{
                        fontSize: '12px',
                        color: '#666',
                        marginBottom: '10px'
                    }}>
                        الإحداثيات: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                    </div>

                    <div style={{
                        fontSize: '14px',
                        color: '#666',
                        marginBottom: '15px'
                    }}>
                        💡 يمكنك سحب الدبوس أو النقر على الخريطة لتحديد الموقع بدقة
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
                        <button
                            onClick={handleCurrentLocation}
                            disabled={isLoading}
                            className="btn"
                            style={{ flex: 1 }}
                        >
                            📍 موقعي الحالي
                        </button>

                        <button
                            onClick={onClose}
                            className="btn"
                            style={{ flex: 1 }}
                        >
                            إلغاء
                        </button>

                        <button
                            onClick={handleConfirm}
                            disabled={!address || isLoading}
                            className="btn btn-success"
                            style={{ flex: 1 }}
                        >
                            تأكيد الموقع
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapPicker;