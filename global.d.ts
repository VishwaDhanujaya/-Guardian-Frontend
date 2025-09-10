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
  import type { FC } from 'react';
  import { SvgProps } from 'react-native-svg';
  const content: FC<SvgProps>;
  export default content;
}

declare module '@react-native-async-storage/async-storage';
declare module 'expo-symbols' {
  import type { ComponentType } from 'react';
  import { ViewProps } from 'react-native';

  export type SymbolWeight =
    | 'ultralight'
    | 'thin'
    | 'light'
    | 'regular'
    | 'medium'
    | 'semibold'
    | 'bold'
    | 'heavy'
    | 'black';

  export interface SymbolViewProps extends ViewProps {
    name: string;
    size?: number;
    weight?: SymbolWeight;
    tintColor?: string;
    resizeMode?: string;
  }

  export const SymbolView: ComponentType<SymbolViewProps>;
}
declare module 'expo-blur';
