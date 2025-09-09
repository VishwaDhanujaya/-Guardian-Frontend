import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { use, useState } from 'react';
import { View } from 'react-native';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { AuthContext } from '@/context/AuthContext';
import { apiService } from '@/services/apiService';
import { LoginPayload, LoginResponse } from '@/types/responses';

export default function Screen() {
  const router = useRouter();
  const { login } = use(AuthContext);

  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const [loginError, setLoginError] = useState<string>('');

  async function submitLogin() {
    if (!username || !password) {
      setLoginError('Please enter both a username and password');
      return;
    }

    const request = await apiService.post<LoginResponse>('/api/v1/auth/login', {
      username,
      password,
    });

    const requestData = request.data;

    if (request.status === 200 && requestData.status === 'success') {
      const payload = requestData.data as LoginPayload;

      await login(payload.accessToken, payload.refreshToken);
      router.replace('/');
      return;
    }

    setLoginError(requestData.message);
  }

  return (
    <View className="flex-1 justify-center items-center gap-5 p-6 bg-secondary/30">
      <Card className="w-full max-w-sm p-6 rounded-2xl h-fit">
        <CardHeader className="items-center">
          <CardTitle className="pb-2 text-center">Login</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          {loginError && (
            <Alert icon={AlertTriangle} variant="destructive" className="max-w-xl">
              <AlertTitle>{loginError}</AlertTitle>
            </Alert>
          )}

          <View className="flex-col gap-3 items-center w-full">
            <Input
              placeholder="username"
              className="w-full"
              value={username}
              onChangeText={(newUsername) => setUsername(newUsername)}
            />
            <Input
              placeholder="password"
              className="w-full"
              value={password}
              onChangeText={(newPassword) => setPassword(newPassword)}
            />
          </View>
        </CardContent>
        <CardFooter className="flex-col gap-3 pb-0">
          <Button
            variant="outline"
            className="shadow shadow-foreground/5"
            onPress={submitLogin}
          >
            <Text>Login</Text>
          </Button>
          <Button
            variant="secondary"
            className="shadow shadow-foreground/5"
            onPress={() => router.navigate('/authentication/register')}
          >
            <Text>Register</Text>
          </Button>
        </CardFooter>
      </Card>
    </View>
  );
}
