import { Alert } from 'react-native';
import { api } from '../store/authStore';

/**
 * Utility functions for API calls and error handling
 */

export const handleApiError = (error, defaultMessage = 'Something went wrong') => {
  console.error('API Error:', error);

  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || defaultMessage;

    if (status === 401) {
      Alert.alert('Authentication Error', 'Please login again');
    } else if (status === 403) {
      Alert.alert('Access Denied', 'You do not have permission to perform this action');
    } else {
      Alert.alert('Error', message);
    }
    return message;
  } else if (error.request) {
    // Network error
    console.log('Network error details:', error.request);
    Alert.alert('Network Error', 'Please check your internet connection');
    return 'Network error';
  } else {
    // Other error
    Alert.alert('Error', defaultMessage);
    return defaultMessage;
  }
};

export const formatCurrency = (amount) => {
  return `Rp ${parseInt(amount || 0).toLocaleString('id-ID')}`;
};

export const formatDate = (dateString, options = {}) => {
  const defaultOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Date(dateString).toLocaleDateString('id-ID', {
    ...defaultOptions,
    ...options,
  });
};

export const getStatusDisplay = (status) => {
  const statusDisplayMap = {
    'draft': 'Draft',
    'pending': 'Menunggu Konfirmasi',
    'confirmed': 'Dikonfirmasi',
    'processing': 'Sedang Diproses',
    'ready': 'Siap Diambil',
    'completed': 'Selesai',
    'cancelled': 'Dibatalkan'
  };
  return statusDisplayMap[status] || status;
};

export const getStatusColor = (status, theme) => {
  const statusColors = {
    draft: theme.textSecondary,
    pending: theme.warning,
    confirmed: theme.info,
    processing: theme.primary,
    ready: theme.success,
    completed: theme.success,
    cancelled: theme.error,
  };
  return statusColors[status] || theme.textSecondary;
};

/**
 * Order API functions
 */
export const orderApi = {
  // Get all orders with optional filters
  getOrders: async (filters = {}) => {
    try {
      console.log('🔍 Fetching orders with filters:', filters);
      const response = await api.get('/orders', { params: filters });
      console.log('✅ Orders fetched successfully:', response.data.data?.length || 0, 'orders');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching orders:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    try {
      console.log('🔍 Fetching order detail for ID:', orderId);
      const response = await api.get(`/orders/${orderId}`);
      console.log('✅ Order detail fetched successfully for order:', orderId);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching order detail:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Create new order
  createOrder: async (orderData) => {
    try {
      console.log('📝 Creating new order:', orderData);
      const response = await api.post('/orders', orderData);
      console.log('✅ Order created successfully:', response.data.data?.id);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating order:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Update order status
  updateOrderStatus: async (orderId, statusData) => {
    try {
      console.log('🔄 Updating order status:', orderId, statusData);
      const response = await api.put(`/orders/${orderId}/status`, statusData);
      console.log('✅ Order status updated successfully:', orderId);
      return response.data;
    } catch (error) {
      console.error('❌ Error updating order status:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Submit order (draft to pending)
  submitOrder: async (orderId) => {
    try {
      console.log('📤 Submitting order:', orderId);
      const response = await api.put(`/orders/${orderId}/submit`);
      console.log('✅ Order submitted successfully:', orderId);
      return response.data;
    } catch (error) {
      console.error('❌ Error submitting order:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Cancel order
  cancelOrder: async (orderId, cancelReason = '') => {
    try {
      console.log('❌ Canceling order:', orderId, 'Reason:', cancelReason);
      const response = await api.put(`/orders/${orderId}/cancel`, {
        cancelReason
      });
      console.log('✅ Order canceled successfully:', orderId);
      return response.data;
    } catch (error) {
      console.error('❌ Error canceling order:', error.response?.status, error.response?.data);
      throw error;
    }
  },

  // Get order status flow
  getStatusFlow: async () => {
    try {
      console.log('🔍 Fetching order status flow');
      const response = await api.get('/orders/status-flow');
      console.log('✅ Order status flow fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching status flow:', error.response?.status, error.response?.data);
      throw error;
    }
  },
};

/**
 * Debug utility to check if token is properly attached
 */
export const debugAuthHeaders = () => {
  const authHeader = api.defaults.headers.common['Authorization'];
  console.log('🔍 Current Authorization header:', authHeader);

  if (authHeader && authHeader.startsWith('Bearer ')) {
    console.log('✅ Token format is correct');
    return true;
  } else {
    console.log('⚠️  No valid token found in headers');
    return false;
  }
};

/**
 * Test API connection with current token
 */
export const testApiConnection = async () => {
  try {
    console.log('🧪 Testing API connection...');
    debugAuthHeaders();

    const response = await api.get('/orders/status-flow');
    console.log('✅ API connection test successful');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ API connection test failed:', error.response?.status, error.response?.data);
    return { success: false, error: error.response?.data || error.message };
  }
};

export default {
  handleApiError,
  formatCurrency,
  formatDate,
  getStatusDisplay,
  getStatusColor,
  orderApi,
  debugAuthHeaders,
  testApiConnection,
};
