// Environment configuration helper
// This file helps you switch between emulator and physical device easily

// Get your computer's network IP by running: ipconfig | findstr "IPv4"
// Update this IP address based on your active network connection:
// Wi-Fi Network: 10.162.0.14 (recommended for phone connection)
// ZeroTier VPN: 192.168.191.178
const WIFI_IP = '10.162.0.14';          // Your Wi-Fi network IP (recommended)
const ZEROTIER_IP = '192.168.191.178';   // Your ZeroTier VPN IP (alternative)

// Configuration for different environments
const configs = {
  // For Android emulator
  emulator: {
    appName: 'AHA Karaoke',
    baseURL: 'http://10.0.2.2:3000',
  },

  // For physical Android device on Wi-Fi
  device: {
    appName: 'AHA Karaoke',
    baseURL: `http://${WIFI_IP}:3000`,
  },

  // For physical Android device on ZeroTier (alternative)
  deviceZeroTier: {
    appName: 'AHA Karaoke',
    baseURL: `http://${ZEROTIER_IP}:3000`,
  },

  // For production
  production: {
    appName: 'AHA Karaoke',
    baseURL: 'https://your-production-domain.com', // Replace with your production URL
  }
};

// Current environment - change this to switch between configurations
const CURRENT_ENV = 'device'; // Options: 'emulator', 'device', 'production'

// Export the selected configuration
export const config = configs[CURRENT_ENV];

export default config;

// Instructions:
// 1. For emulator: Set CURRENT_ENV = 'emulator'
// 2. For physical device: Set CURRENT_ENV = 'device' and update COMPUTER_IP
// 3. For production: Set CURRENT_ENV = 'production' and update production baseURL
