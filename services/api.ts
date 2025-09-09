import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:2699',
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            '/refresh',
            { refreshToken },
            { baseURL: api.defaults.baseURL }
          );
          const newToken = refreshResponse.data.accessToken;
          await AsyncStorage.setItem('accessToken', newToken);
          error.config.headers = error.config.headers ?? {};
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
