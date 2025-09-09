import api from '@/services/api';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('token123')),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

describe('api service', () => {
  it('attaches Authorization header from storage', async () => {
    const interceptor: any = (api.interceptors.request as any).handlers[0];
    const config = await interceptor.fulfilled({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer token123');
  });
});
