import { useEffect, useRef } from "react";
import { Animated } from "react-native";

export function useMountAnimation(config: Partial<Animated.SpringAnimationConfig> = {}) {
  const value = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.spring(value, {
      toValue: 1,
      useNativeDriver: true,
      ...config,
    }).start();
  }, [value]);

  return {
    value,
    style: {
      opacity: value,
      transform: [{ scale: value }],
    },
  };
}

export default useMountAnimation;
