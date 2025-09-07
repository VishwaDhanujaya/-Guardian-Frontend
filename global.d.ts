// global.d.ts
declare module '*.png' {
  const src: import('react-native').ImageSourcePropType;
  export default src;
}
declare module '*.jpg' {
  const src: import('react-native').ImageSourcePropType;
  export default src;
}
declare module '*.jpeg' {
  const src: import('react-native').ImageSourcePropType;
  export default src;
}
declare module '*.gif' {
  const src: import('react-native').ImageSourcePropType;
  export default src;
}
declare module '*.webp' {
  const src: import('react-native').ImageSourcePropType;
  export default src;
}
declare module '*.svg' {
  import * as React from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: React.FC<SvgProps>;
  export default content;
}

declare module '@react-native-async-storage/async-storage';
declare module 'expo-symbols';
declare module 'expo-blur';
