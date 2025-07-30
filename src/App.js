import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserSelector from './components/UserSelector';
import SendPackage from './components/SendPackage';
import DriverDashboard from './components/DriverDashboard';
import DeliveryList from './components/DeliveryList';
import SendPackageWithMap from './components/SendPackageWithMap';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>🚚 Tawsil Demo</h1>
          <p>AI-Powered Local Delivery Platform</p>
        </header>

        <main className="App-main">
          <Routes>
            <Route path="/" element={<UserSelector />} />
            <Route path="/send" element={<SendPackage />} />
            <Route path="/send-with-map" element={<SendPackageWithMap />} />
            <Route path="/driver" element={<DriverDashboard />} />
            <Route path="/deliveries" element={<DeliveryList />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;