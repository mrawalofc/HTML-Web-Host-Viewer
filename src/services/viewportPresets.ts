import { ViewportDevice } from '../types';

export interface DevicePreset {
  id: string;
  name: string;
  shortName: string;
  category: 'mobile' | 'tablet' | 'laptop' | 'desktop' | 'responsive';
  width: number; // in pixels (0 = 100% fluid)
  height: number; // in pixels (0 = 100% fluid)
  deviceType: ViewportDevice;
  description: string;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  {
    id: 'responsive',
    name: 'Responsive (Fluid 100%)',
    shortName: 'Fluid',
    category: 'responsive',
    width: 0,
    height: 0,
    deviceType: 'responsive',
    description: '100% full container fluid layout',
  },
  {
    id: 'mobile-standard',
    name: 'Mobile (iPhone / 375×667)',
    shortName: 'iPhone (375×667)',
    category: 'mobile',
    width: 375,
    height: 667,
    deviceType: 'mobile',
    description: 'Standard smartphone portrait screen',
  },
  {
    id: 'mobile-large',
    name: 'Mobile Large (414×896)',
    shortName: 'Pro Max (414×896)',
    category: 'mobile',
    width: 414,
    height: 896,
    deviceType: 'mobile',
    description: 'Modern tall large smartphone screen',
  },
  {
    id: 'mobile-compact',
    name: 'Mobile Compact (360×740)',
    shortName: 'Compact (360×740)',
    category: 'mobile',
    width: 360,
    height: 740,
    deviceType: 'mobile',
    description: 'Android standard compact screen',
  },
  {
    id: 'tablet-standard',
    name: 'Tablet (iPad / 768×1024)',
    shortName: 'iPad (768×1024)',
    category: 'tablet',
    width: 768,
    height: 1024,
    deviceType: 'tablet',
    description: 'Standard 768px tablet layout',
  },
  {
    id: 'tablet-pro',
    name: 'Tablet Pro (834×1194)',
    shortName: 'iPad Pro (834×1194)',
    category: 'tablet',
    width: 834,
    height: 1194,
    deviceType: 'tablet',
    description: 'Large 11" tablet screen',
  },
  {
    id: 'laptop-standard',
    name: 'Laptop (1024×680)',
    shortName: 'Laptop (1024×680)',
    category: 'laptop',
    width: 1024,
    height: 680,
    deviceType: 'laptop',
    description: 'Compact ultrabook / laptop viewport',
  },
  {
    id: 'laptop-hd',
    name: 'Laptop HD (1366×768)',
    shortName: 'Laptop HD (1366×768)',
    category: 'laptop',
    width: 1366,
    height: 768,
    deviceType: 'laptop',
    description: 'Standard 1366px widescreen laptop',
  },
  {
    id: 'desktop-standard',
    name: 'Desktop (1280×800)',
    shortName: 'Desktop (1280×800)',
    category: 'desktop',
    width: 1280,
    height: 800,
    deviceType: 'desktop',
    description: 'Standard desktop monitor display',
  },
  {
    id: 'desktop-fhd',
    name: 'Desktop 1080p (1920×1080)',
    shortName: '1080p (1920×1080)',
    category: 'desktop',
    width: 1920,
    height: 1080,
    deviceType: 'desktop',
    description: 'Full HD widescreen desktop display',
  },
];

export const DEFAULT_PRESET_FOR_DEVICE: Record<ViewportDevice, DevicePreset> = {
  responsive: DEVICE_PRESETS[0],
  mobile: DEVICE_PRESETS[1],
  tablet: DEVICE_PRESETS[4],
  laptop: DEVICE_PRESETS[6],
  desktop: DEVICE_PRESETS[8],
};
