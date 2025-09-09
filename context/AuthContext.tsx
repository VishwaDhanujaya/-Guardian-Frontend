import {
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useStorageState } from '@/hooks/useStorageState';
import { apiService } from '@/services/apiService';

interface RefreshResponse {
  data: {
    accessToken: string;
    refreshToken: string;
  };
}

interface ProfileResponse {
  data: {
    is_officer: boolean;
  };
}

interface IAuthContext {
  session: string | null;
  isOfficer: boolean;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthed: () => Promise<void>;
  refreshToken: (ignoreTimeCheck?: boolean) => Promise<boolean>;
}

export const AuthContext = createContext<IAuthContext>({
  session: null,
  isOfficer: false,
  login: async () => {},
  logout: async () => {},
  checkAuthed: async () => {},
  refreshToken: async () => false,
});

async function accessTokenIsValid(): Promise<boolean> {
  try {
    const request = await apiService.get('/api/v1/auth/is-authed');
    return request.status === 204;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [[isLoadingAccess, accessTokenSession], setAccessTokenSession] =
    useStorageState('accessToken');
  const [[isLoadingRefresh, refreshTokenSession], setRefreshTokenSession] =
    useStorageState('refreshToken');
  const [lastRefreshCheck, setLastRefreshCheck] = useState<number>(Date.now());
  const [isOfficer, setIsOfficer] = useState<boolean>(false);

  const loading = isLoadingAccess || isLoadingRefresh;

  useEffect(() => {
    if (!loading && accessTokenSession) {
      accessTokenIsValid().then((valid) => {
        if (!valid) setAccessTokenSession(null);
      });
    }
  }, [loading, accessTokenSession, refreshTokenSession, setAccessTokenSession]);

  const login = useCallback(
    async (accessToken: string, refreshToken: string) => {
      await setAccessTokenSession(accessToken);
      await setRefreshTokenSession(refreshToken);

      const response = await apiService.get<ProfileResponse>(
        '/api/v1/auth/profile',
      );

      if (response.status === 200) {
        setIsOfficer(response.data.data.is_officer);
      }
    },
    [setAccessTokenSession, setRefreshTokenSession],
  );

  const logout = useCallback(async () => {
    await setAccessTokenSession(null);
    await setRefreshTokenSession(null);
    setIsOfficer(false);
  }, [setAccessTokenSession, setRefreshTokenSession]);

  const refreshToken = useCallback(
    async (ignoreTimeCheck: boolean = false) => {
      const checkTokenEveryMs = 1000 * 5;
      const dateNow = Date.now();

      if (ignoreTimeCheck || dateNow > lastRefreshCheck + checkTokenEveryMs) {
        setLastRefreshCheck(dateNow);
        try {
          const response = await apiService.post<RefreshResponse>(
            '/api/v1/auth/refresh',
          );

          if (response.status === 200) {
            await setAccessTokenSession(response.data.data.accessToken);
            await setRefreshTokenSession(response.data.data.refreshToken);
            return true;
          }
        } catch {
          await setRefreshTokenSession(null);
        }
      }

      return false;
    },
    [lastRefreshCheck, setAccessTokenSession, setRefreshTokenSession],
  );

  const checkAuthed = useCallback(async () => {
    try {
      const request = await apiService.get('/api/v1/auth/is-authed');
      if (request.status !== 204) {
        await setAccessTokenSession(null);
        if (await refreshToken(true)) {
          await checkAuthed();
        }
      }
    } catch {
      await setAccessTokenSession(null);
    }
  }, [refreshToken, setAccessTokenSession]);

  return (
    <AuthContext.Provider
      value={{
        session: accessTokenSession,
        isOfficer,
        login,
        logout,
        checkAuthed,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
