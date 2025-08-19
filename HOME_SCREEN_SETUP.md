# HomeScreen with Google Maps Setup

## Features Implemented

### 🗺️ Google Maps Integration
- **Real-time location** - Gets user's current location
- **Nearby booth markers** - Shows available booths on the map
- **Interactive markers** - Tap markers to see booth details
- **Distance calculation** - Shows distance to each booth

### 📍 Location-Based Features
- **Permission handling** - Requests location permissions
- **Fallback support** - Works without location permissions
- **Booth filtering** - Only shows available booths
- **Radius search** - Finds booths within 10km radius

### 🎯 UI Components
- **Booth info cards** - Detailed booth information overlay
- **Promotional banners** - Scrollable promotion cards
- **Quick actions** - Book Now and My Orders buttons
- **Statistics display** - Shows nearby and available booth counts

### 🔗 Navigation Integration
- **Deep linking** - Navigate to CreateOrder with pre-selected booth
- **Order management** - Quick access to customer orders
- **Booth booking** - Direct booking from map markers

## Setup Instructions

### 1. Google Maps API Key

You need to get a Google Maps API key and add it to your project:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Maps SDK for Android** API
4. Create API key in **Credentials**
5. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` in `android/app/src/main/AndroidManifest.xml`

### 2. Install Dependencies

```bash
npm install react-native-maps @react-native-community/geolocation
```

### 3. Android Configuration

The following files have been updated:
- `android/app/src/main/AndroidManifest.xml` - Added location permissions and API key
- `android/app/build.gradle` - Added Google Play Services dependencies

### 4. Rebuild the App

After installing dependencies, rebuild the app:

```bash
cd android && ./gradlew clean && cd .. && npx react-native run-android
```

## Backend API Integration

### Required Endpoints
- `GET /booths/nearby/radius` - Get booths within radius
- `GET /booths/available` - Fallback for available booths
- `GET /items` - Get menu items for ordering

### API Response Format
The HomeScreen expects booth data with coordinates:

```json
{
  "data": {
    "booths": [
      {
        "id": 1,
        "boothType": "A",
        "status": "available",
        "latitude": "-6.2088",
        "longitude": "106.8456",
        "landmark": "Central Mall",
        "address": "Jakarta, Indonesia",
        "distance": 1.5,
        "distanceFormatted": "1.50 km"
      }
    ]
  }
}
```

## Usage Flow

1. **App opens** → HomeScreen loads
2. **Permission request** → User grants location access
3. **Location fetch** → Gets current coordinates
4. **API call** → Fetches nearby booths
5. **Map display** → Shows booths as markers
6. **User interaction** → Tap marker to see details
7. **Booking flow** → Navigate to CreateOrder with pre-selected booth

## Troubleshooting

### Maps not showing
- Check if Google Maps API key is valid
- Ensure APIs are enabled in Google Cloud Console
- Verify app signing certificate matches API key restrictions

### Location not working
- Check location permissions in device settings
- Test on physical device (emulator location can be unreliable)
- Verify location services are enabled

### No booths appearing
- Check backend API is running
- Verify booth data includes latitude/longitude
- Test API endpoints manually to ensure data format is correct

## Features Overview

### Promotional Banners
- **Scrollable cards** with promotion details
- **Custom colors** and icons
- **Interactive taps** showing promotion details

### Statistics Panel
- **Nearby booths count** - Total booths in area
- **Available booths** - Currently bookable booths

### Quick Actions
- **Book Now** - Direct to order creation
- **My Orders** - View existing orders

### Map Features
- **User location** - Blue marker showing current position
- **Booth markers** - Green for available, orange for occupied
- **Info cards** - Slide-up details when marker is tapped
- **Auto-zoom** - Focuses on selected booth
