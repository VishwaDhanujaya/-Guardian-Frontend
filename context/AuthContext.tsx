import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import api from '@/services/api';
import { useStorageState } from '@/hooks/useStorageState';

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

interface ProfileResponse {
  is_officer: boolean;
}

interface AuthContextValue {
  session: string | null;
  isOfficer: boolean;
  login: (identifier: string, password: string, role: 'citizen' | 'officer') => Promise<void>;
  logout: () => Promise<void>;
  checkAuthed: () => Promise<void>;
  refreshToken: (ignoreTimeCheck?: boolean) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  isOfficer: false,
  login: async () => {},
  logout: async () => {},
  checkAuthed: async () => {},
  refreshToken: async () => false,
});

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [[loadingAccess, accessToken], setAccessToken] = useStorageState('accessToken');
  const [[loadingRefresh, refreshTokenValue], setRefreshToken] = useStorageState('refreshToken');
  const [lastRefreshCheck, setLastRefreshCheck] = useState<number>(Date.now());
  const [isOfficer, setIsOfficer] = useState(false);

  const login = useCallback(
    async (identifier: string, password: string, role: 'citizen' | 'officer') => {
      const res = await api.post<{ data: RefreshResponse }>(
        '/api/v1/auth/login',
        { identifier, password, role }
      );
      setAccessToken(res.data.data.accessToken);
      setRefreshToken(res.data.data.refreshToken);
      const profile = await api.get<{ data: ProfileResponse }>('/api/v1/auth/profile');
      if (profile.status === 200) {
        setIsOfficer(profile.data.data.is_officer);
      }
    },
    [setAccessToken, setRefreshToken]
  );

  const logout = useCallback(async () => {
    await setAccessToken(null);
    await setRefreshToken(null);
    setIsOfficer(false);
  }, [setAccessToken, setRefreshToken]);

  const checkAuthed = useCallback(async () => {
    try {
      const request = await api.get('/api/v1/auth/is-authed');
      if (request.status !== 204) {
        await logout();
        if (await refreshToken(true)) {
          await checkAuthed();
        }
      }
    } catch {
      await logout();
    }
  }, [logout]);

  const refreshToken = useCallback(
    async (ignoreTimeCheck = false) => {
      const checkTokenEveryMs = 1000 * 5;
      const dateNow = Date.now();
      if (ignoreTimeCheck || dateNow > lastRefreshCheck + checkTokenEveryMs) {
        setLastRefreshCheck(dateNow);
        try {
          const response = await api.post<{ data: RefreshResponse }>(
            '/api/v1/auth/refresh',
            { refreshToken: refreshTokenValue }
          );
          if (response.status === 200) {
            setAccessToken(response.data.data.accessToken);
            setRefreshToken(response.data.data.refreshToken);
            return true;
          }
          await setRefreshToken(null);
        } catch {
          await setRefreshToken(null);
        }
      }
      return false;
    },
    [lastRefreshCheck, refreshTokenValue, setAccessToken, setRefreshToken]
  );

  useEffect(() => {
    if (!loadingAccess) {
      checkAuthed();
    }
  }, [loadingAccess, checkAuthed]);

  const value: AuthContextValue = {
    session: accessToken,
    isOfficer,
    login,
    logout,
    checkAuthed,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
