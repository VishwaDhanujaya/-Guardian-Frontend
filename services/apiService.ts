import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const apiService = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:2699',
});

apiService.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

apiService.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (refreshToken) {
        try {
          const refreshResponse = await axios.post(
            `${apiService.defaults.baseURL}/api/v1/auth/refresh`,
            { refreshToken },
          );
          const { accessToken, refreshToken: newRefresh } = refreshResponse.data.data;
          await SecureStore.setItemAsync('accessToken', accessToken);
          await SecureStore.setItemAsync('refreshToken', newRefresh);
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return apiService.request(error.config);
        } catch (refreshError) {
          await SecureStore.deleteItemAsync('accessToken');
          await SecureStore.deleteItemAsync('refreshToken');
        }
      }
    }
    return Promise.reject(error);
  },
);

export default apiService;
