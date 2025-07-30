# Tawsil Demo

AI-Powered Local Delivery Platform Demo built with React and Supabase.

## 🚀 Quick Start

1. **Setup Environment Variables**
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── SendPackage.js   # User interface for sending packages
│   ├── DriverDashboard.js # Driver interface for receiving notifications
│   ├── DeliveryList.js  # Show list of deliveries
│   └── UserSelector.js  # Switch between user types
├── services/            # API layer
│   ├── supabaseClient.js # Supabase configuration
│   ├── deliveryAPI.js   # Delivery-related API calls
│   ├── userAPI.js       # User-related API calls
│   └── driverAPI.js     # Driver-related API calls
└── utils/               # Utilities
    ├── constants.js     # App constants
    └── helpers.js       # Utility functions
```

## 🔧 Environment Variables

Create a `.env.local` file in the root directory:

```env
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Features

- [ ] User package sending interface
- [ ] Driver dashboard with real-time notifications
- [ ] Delivery tracking and status updates
- [ ] QR code and OTP verification system
- [ ] Multi-delivery mode support
- [ ] Real-time updates via Supabase

## 📱 Demo Flow

1. Select user type (Sender/Driver)
2. Sender creates delivery request
3. Driver receives real-time notification
4. Driver accepts/rejects delivery
5. Track delivery status updates

## 🛠️ Next Steps

1. Configure your Supabase database using the provided schema
2. Update environment variables
3. Implement the component functionality
4. Test the real-time features
5. Add styling and UX improvements

---

Built with ❤️ for Syria 🇸🇾
