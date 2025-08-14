// Simple API test utility
import { api } from '../store/authStore';

export const testAPI = {
  // Test if the backend is reachable
  async ping() {
    try {
      const response = await api.get('/');
      console.log('API Ping Success:', response.status);
      return true;
    } catch (error) {
      console.log('API Ping Failed:', error.message);
      return false;
    }
  },

  // Test register endpoint
  async testRegister() {
    try {
      const testUser = {
        name: 'Test User',
        username: 'testuser' + Date.now(),
        email: 'test' + Date.now() + '@example.com',
        password: 'password123',
        noHandphone: '08123456789'
      };

      const response = await api.post('/register', testUser);
      console.log('Register Test Success:', response.data);
      return response.data;
    } catch (error) {
      console.log('Register Test Failed:', error.response?.data || error.message);
      return null;
    }
  },

  // Test login endpoint
  async testLogin(emailOrUsername = 'testuser', password = 'password123') {
    try {
      const response = await api.post('/login', {
        emailOrUsername,
        password
      });
      console.log('Login Test Success:', response.data);
      return response.data;
    } catch (error) {
      console.log('Login Test Failed:', error.response?.data || error.message);
      return null;
    }
  }
};
