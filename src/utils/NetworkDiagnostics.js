// Network troubleshooting utility for React Native
import { Alert } from 'react-native';
import { api } from '../store/authStore';

export const NetworkDiagnostics = {
  // Test basic connectivity to different IP addresses
  async testConnections() {
    const testIPs = [
      'http://10.162.0.14:3000',    // Wi-Fi IP
      'http://192.168.191.178:3000', // ZeroTier IP
      'http://10.0.2.2:3000'        // Emulator fallback
    ];

    console.log('🔧 Starting network diagnostics...');

    for (const baseURL of testIPs) {
      try {
        console.log(`🧪 Testing connection to: ${baseURL}`);

        const response = await fetch(`${baseURL}/booths/available`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NywiZW1haWwiOiJjdXN0b21lcnNhdHVAY3VzdC5jb20iLCJyb2xlIjoiY3VzdG9tZXIiLCJpYXQiOjE3NTU1OTA5NzEsImV4cCI6MTc1NTY3NzM3MX0.5PzCXgXyagJAycvAqNiZN36VvcQ8F1UNZMYXjDqDSNM',
            'Content-Type': 'application/json',
          },
          timeout: 5000
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ SUCCESS: ${baseURL} - ${data.data.length} booths found`);
          return { success: true, workingIP: baseURL, boothCount: data.data.length };
        } else {
          console.log(`❌ HTTP Error: ${baseURL} - ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ FAILED: ${baseURL} - ${error.message}`);
      }
    }

    console.log('💥 All connection attempts failed');
    return { success: false, workingIP: null };
  },

  // Test current API configuration
  async testCurrentConfig() {
    try {
      console.log('🔍 Testing current API configuration...');
      const response = await api.get('/booths/available');

      console.log('✅ Current config works!', {
        status: response.status,
        boothCount: response.data.data?.length || 0
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Current config failed:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      });

      return { success: false, error: error.message };
    }
  },

  // Show network info to user
  async showNetworkDiagnostics() {
    Alert.alert(
      '🔧 Network Diagnostics',
      'Running network tests... Check console for details.',
      [
        {
          text: 'Test All IPs',
          onPress: async () => {
            const result = await this.testConnections();
            Alert.alert(
              'Network Test Results',
              result.success
                ? `✅ Working IP found: ${result.workingIP}\n${result.boothCount} booths available`
                : '❌ All connections failed. Check if backend server is running.'
            );
          }
        },
        {
          text: 'Test Current Config',
          onPress: async () => {
            const result = await this.testCurrentConfig();
            Alert.alert(
              'Current Config Test',
              result.success
                ? '✅ Current configuration is working!'
                : `❌ Current config failed: ${result.error}`
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  }
};

// Usage in your component:
// import { NetworkDiagnostics } from '../utils/NetworkDiagnostics';
// NetworkDiagnostics.showNetworkDiagnostics();

export default NetworkDiagnostics;
