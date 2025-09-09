import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useStorageState(key: string) {
  const [state, setState] = useState<[boolean, string | null]>([true, null]);

  useEffect(() => {
    AsyncStorage.getItem(key).then((value) => {
      setState([false, value]);
    });
  }, [key]);

  const setValue = async (value: string | null) => {
    setState([false, value]);
    if (value === null) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  };

  return [state, setValue] as const;
}
