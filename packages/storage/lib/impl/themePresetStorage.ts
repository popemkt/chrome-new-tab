import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

export type ThemePresetName = 'sunset-horizon' | 'catppuccin' | 'claymorphism' | 'vintage-paper';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  'card-foreground': string;
  popover: string;
  'popover-foreground': string;
  primary: string;
  'primary-foreground': string;
  secondary: string;
  'secondary-foreground': string;
  muted: string;
  'muted-foreground': string;
  accent: string;
  'accent-foreground': string;
  destructive: string;
  'destructive-foreground': string;
  border: string;
  input: string;
  ring: string;
  'chart-1': string;
  'chart-2': string;
  'chart-3': string;
  'chart-4': string;
  'chart-5': string;
  radius: string;
  sidebar: string;
  'sidebar-foreground': string;
  'sidebar-primary': string;
  'sidebar-primary-foreground': string;
  'sidebar-accent': string;
  'sidebar-accent-foreground': string;
  'sidebar-border': string;
  'sidebar-ring': string;
}

export interface ThemePreset {
  name: ThemePresetName;
  label: string;
  light: ThemeColors;
  dark: ThemeColors;
}

// All theme data sourced from https://tweakcn.com/r/themes/{name}.json
export const themePresets: ThemePreset[] = [
  {
    name: 'sunset-horizon',
    label: 'Sunset Horizon',
    light: {
      background: 'oklch(0.9856 0.0084 56.3169)',
      foreground: 'oklch(0.3353 0.0132 2.7676)',
      card: 'oklch(1.0000 0 0)',
      'card-foreground': 'oklch(0.3353 0.0132 2.7676)',
      popover: 'oklch(1.0000 0 0)',
      'popover-foreground': 'oklch(0.3353 0.0132 2.7676)',
      primary: 'oklch(0.7357 0.1641 34.7091)',
      'primary-foreground': 'oklch(1.0000 0 0)',
      secondary: 'oklch(0.9596 0.0200 28.9029)',
      'secondary-foreground': 'oklch(0.5587 0.1294 32.7364)',
      muted: 'oklch(0.9656 0.0176 39.4009)',
      'muted-foreground': 'oklch(0.5534 0.0116 58.0708)',
      accent: 'oklch(0.8278 0.1131 57.9984)',
      'accent-foreground': 'oklch(0.3353 0.0132 2.7676)',
      destructive: 'oklch(0.6122 0.2082 22.2410)',
      'destructive-foreground': 'oklch(1.0000 0 0)',
      border: 'oklch(0.9296 0.0370 38.6868)',
      input: 'oklch(0.9296 0.0370 38.6868)',
      ring: 'oklch(0.7357 0.1641 34.7091)',
      'chart-1': 'oklch(0.7357 0.1641 34.7091)',
      'chart-2': 'oklch(0.8278 0.1131 57.9984)',
      'chart-3': 'oklch(0.8773 0.0763 54.9314)',
      'chart-4': 'oklch(0.8200 0.1054 40.8859)',
      'chart-5': 'oklch(0.6368 0.1306 32.0721)',
      radius: '0.625rem',
      sidebar: 'oklch(0.9656 0.0176 39.4009)',
      'sidebar-foreground': 'oklch(0.3353 0.0132 2.7676)',
      'sidebar-primary': 'oklch(0.7357 0.1641 34.7091)',
      'sidebar-primary-foreground': 'oklch(1.0000 0 0)',
      'sidebar-accent': 'oklch(0.8278 0.1131 57.9984)',
      'sidebar-accent-foreground': 'oklch(0.3353 0.0132 2.7676)',
      'sidebar-border': 'oklch(0.9296 0.0370 38.6868)',
      'sidebar-ring': 'oklch(0.7357 0.1641 34.7091)',
    },
    dark: {
      background: 'oklch(0.2569 0.0169 352.4042)',
      foreground: 'oklch(0.9397 0.0119 51.3156)',
      card: 'oklch(0.3184 0.0176 341.4465)',
      'card-foreground': 'oklch(0.9397 0.0119 51.3156)',
      popover: 'oklch(0.3184 0.0176 341.4465)',
      'popover-foreground': 'oklch(0.9397 0.0119 51.3156)',
      primary: 'oklch(0.7357 0.1641 34.7091)',
      'primary-foreground': 'oklch(1.0000 0 0)',
      secondary: 'oklch(0.3637 0.0203 342.2664)',
      'secondary-foreground': 'oklch(0.9397 0.0119 51.3156)',
      muted: 'oklch(0.2848 0.0159 343.6554)',
      'muted-foreground': 'oklch(0.8378 0.0237 52.6346)',
      accent: 'oklch(0.8278 0.1131 57.9984)',
      'accent-foreground': 'oklch(0.2569 0.0169 352.4042)',
      destructive: 'oklch(0.6122 0.2082 22.2410)',
      'destructive-foreground': 'oklch(1.0000 0 0)',
      border: 'oklch(0.3637 0.0203 342.2664)',
      input: 'oklch(0.3637 0.0203 342.2664)',
      ring: 'oklch(0.7357 0.1641 34.7091)',
      'chart-1': 'oklch(0.7357 0.1641 34.7091)',
      'chart-2': 'oklch(0.8278 0.1131 57.9984)',
      'chart-3': 'oklch(0.8773 0.0763 54.9314)',
      'chart-4': 'oklch(0.8200 0.1054 40.8859)',
      'chart-5': 'oklch(0.6368 0.1306 32.0721)',
      radius: '0.625rem',
      sidebar: 'oklch(0.2569 0.0169 352.4042)',
      'sidebar-foreground': 'oklch(0.9397 0.0119 51.3156)',
      'sidebar-primary': 'oklch(0.7357 0.1641 34.7091)',
      'sidebar-primary-foreground': 'oklch(1.0000 0 0)',
      'sidebar-accent': 'oklch(0.8278 0.1131 57.9984)',
      'sidebar-accent-foreground': 'oklch(0.2569 0.0169 352.4042)',
      'sidebar-border': 'oklch(0.3637 0.0203 342.2664)',
      'sidebar-ring': 'oklch(0.7357 0.1641 34.7091)',
    },
  },
  {
    name: 'catppuccin',
    label: 'Catppuccin',
    light: {
      background: 'oklch(0.9578 0.0058 264.5321)',
      foreground: 'oklch(0.4355 0.0430 279.3250)',
      card: 'oklch(1.0000 0 0)',
      'card-foreground': 'oklch(0.4355 0.0430 279.3250)',
      popover: 'oklch(0.8575 0.0145 268.4756)',
      'popover-foreground': 'oklch(0.4355 0.0430 279.3250)',
      primary: 'oklch(0.5547 0.2503 297.0156)',
      'primary-foreground': 'oklch(1.0000 0 0)',
      secondary: 'oklch(0.8575 0.0145 268.4756)',
      'secondary-foreground': 'oklch(0.4355 0.0430 279.3250)',
      muted: 'oklch(0.9060 0.0117 264.5071)',
      'muted-foreground': 'oklch(0.5471 0.0343 279.0837)',
      accent: 'oklch(0.6820 0.1448 235.3822)',
      'accent-foreground': 'oklch(1.0000 0 0)',
      destructive: 'oklch(0.5505 0.2155 19.8095)',
      'destructive-foreground': 'oklch(1.0000 0 0)',
      border: 'oklch(0.8083 0.0174 271.1982)',
      input: 'oklch(0.8575 0.0145 268.4756)',
      ring: 'oklch(0.5547 0.2503 297.0156)',
      'chart-1': 'oklch(0.5547 0.2503 297.0156)',
      'chart-2': 'oklch(0.6820 0.1448 235.3822)',
      'chart-3': 'oklch(0.6250 0.1772 140.4448)',
      'chart-4': 'oklch(0.6920 0.2041 42.4293)',
      'chart-5': 'oklch(0.7141 0.1045 33.0967)',
      radius: '0.35rem',
      sidebar: 'oklch(0.9335 0.0087 264.5206)',
      'sidebar-foreground': 'oklch(0.4355 0.0430 279.3250)',
      'sidebar-primary': 'oklch(0.5547 0.2503 297.0156)',
      'sidebar-primary-foreground': 'oklch(1.0000 0 0)',
      'sidebar-accent': 'oklch(0.6820 0.1448 235.3822)',
      'sidebar-accent-foreground': 'oklch(1.0000 0 0)',
      'sidebar-border': 'oklch(0.8083 0.0174 271.1982)',
      'sidebar-ring': 'oklch(0.5547 0.2503 297.0156)',
    },
    dark: {
      background: 'oklch(0.2155 0.0254 284.0647)',
      foreground: 'oklch(0.8787 0.0426 272.2767)',
      card: 'oklch(0.2429 0.0304 283.9110)',
      'card-foreground': 'oklch(0.8787 0.0426 272.2767)',
      popover: 'oklch(0.4037 0.0320 280.1520)',
      'popover-foreground': 'oklch(0.8787 0.0426 272.2767)',
      primary: 'oklch(0.7871 0.1187 304.7693)',
      'primary-foreground': 'oklch(0.2429 0.0304 283.9110)',
      secondary: 'oklch(0.4765 0.0340 278.6430)',
      'secondary-foreground': 'oklch(0.8787 0.0426 272.2767)',
      muted: 'oklch(0.2973 0.0294 276.2144)',
      'muted-foreground': 'oklch(0.7510 0.0396 273.9320)',
      accent: 'oklch(0.8467 0.0833 210.2545)',
      'accent-foreground': 'oklch(0.2429 0.0304 283.9110)',
      destructive: 'oklch(0.7556 0.1297 2.7642)',
      'destructive-foreground': 'oklch(0.2429 0.0304 283.9110)',
      border: 'oklch(0.3240 0.0319 281.9784)',
      input: 'oklch(0.3240 0.0319 281.9784)',
      ring: 'oklch(0.7871 0.1187 304.7693)',
      'chart-1': 'oklch(0.7871 0.1187 304.7693)',
      'chart-2': 'oklch(0.8467 0.0833 210.2545)',
      'chart-3': 'oklch(0.8577 0.1092 142.7153)',
      'chart-4': 'oklch(0.8237 0.1015 52.6294)',
      'chart-5': 'oklch(0.9226 0.0238 30.4919)',
      radius: '0.35rem',
      sidebar: 'oklch(0.1828 0.0204 284.2039)',
      'sidebar-foreground': 'oklch(0.8787 0.0426 272.2767)',
      'sidebar-primary': 'oklch(0.7871 0.1187 304.7693)',
      'sidebar-primary-foreground': 'oklch(0.2429 0.0304 283.9110)',
      'sidebar-accent': 'oklch(0.8467 0.0833 210.2545)',
      'sidebar-accent-foreground': 'oklch(0.2429 0.0304 283.9110)',
      'sidebar-border': 'oklch(0.4037 0.0320 280.1520)',
      'sidebar-ring': 'oklch(0.7871 0.1187 304.7693)',
    },
  },
  {
    name: 'claymorphism',
    label: 'Claymorphism',
    light: {
      background: 'oklch(0.9232 0.0026 48.7171)',
      foreground: 'oklch(0.2795 0.0368 260.0310)',
      card: 'oklch(0.9699 0.0013 106.4238)',
      'card-foreground': 'oklch(0.2795 0.0368 260.0310)',
      popover: 'oklch(0.9699 0.0013 106.4238)',
      'popover-foreground': 'oklch(0.2795 0.0368 260.0310)',
      primary: 'oklch(0.5854 0.2041 277.1173)',
      'primary-foreground': 'oklch(1.0000 0 0)',
      secondary: 'oklch(0.8687 0.0043 56.3660)',
      'secondary-foreground': 'oklch(0.4461 0.0263 256.8018)',
      muted: 'oklch(0.9232 0.0026 48.7171)',
      'muted-foreground': 'oklch(0.5510 0.0234 264.3637)',
      accent: 'oklch(0.9376 0.0260 321.9388)',
      'accent-foreground': 'oklch(0.3729 0.0306 259.7328)',
      destructive: 'oklch(0.6368 0.2078 25.3313)',
      'destructive-foreground': 'oklch(1.0000 0 0)',
      border: 'oklch(0.8687 0.0043 56.3660)',
      input: 'oklch(0.8687 0.0043 56.3660)',
      ring: 'oklch(0.5854 0.2041 277.1173)',
      'chart-1': 'oklch(0.5854 0.2041 277.1173)',
      'chart-2': 'oklch(0.5106 0.2301 276.9656)',
      'chart-3': 'oklch(0.4568 0.2146 277.0229)',
      'chart-4': 'oklch(0.3984 0.1773 277.3662)',
      'chart-5': 'oklch(0.3588 0.1354 278.6973)',
      radius: '1.25rem',
      sidebar: 'oklch(0.8687 0.0043 56.3660)',
      'sidebar-foreground': 'oklch(0.2795 0.0368 260.0310)',
      'sidebar-primary': 'oklch(0.5854 0.2041 277.1173)',
      'sidebar-primary-foreground': 'oklch(1.0000 0 0)',
      'sidebar-accent': 'oklch(0.9376 0.0260 321.9388)',
      'sidebar-accent-foreground': 'oklch(0.3729 0.0306 259.7328)',
      'sidebar-border': 'oklch(0.8687 0.0043 56.3660)',
      'sidebar-ring': 'oklch(0.5854 0.2041 277.1173)',
    },
    dark: {
      background: 'oklch(0.2244 0.0074 67.4370)',
      foreground: 'oklch(0.9288 0.0126 255.5078)',
      card: 'oklch(0.2801 0.0080 59.3379)',
      'card-foreground': 'oklch(0.9288 0.0126 255.5078)',
      popover: 'oklch(0.2801 0.0080 59.3379)',
      'popover-foreground': 'oklch(0.9288 0.0126 255.5078)',
      primary: 'oklch(0.6801 0.1583 276.9349)',
      'primary-foreground': 'oklch(0.2244 0.0074 67.4370)',
      secondary: 'oklch(0.3359 0.0077 59.4197)',
      'secondary-foreground': 'oklch(0.8717 0.0093 258.3382)',
      muted: 'oklch(0.2287 0.0074 67.4469)',
      'muted-foreground': 'oklch(0.7137 0.0192 261.3246)',
      accent: 'oklch(0.3896 0.0074 59.4734)',
      'accent-foreground': 'oklch(0.8717 0.0093 258.3382)',
      destructive: 'oklch(0.6368 0.2078 25.3313)',
      'destructive-foreground': 'oklch(0.2244 0.0074 67.4370)',
      border: 'oklch(0.3359 0.0077 59.4197)',
      input: 'oklch(0.3359 0.0077 59.4197)',
      ring: 'oklch(0.6801 0.1583 276.9349)',
      'chart-1': 'oklch(0.6801 0.1583 276.9349)',
      'chart-2': 'oklch(0.5854 0.2041 277.1173)',
      'chart-3': 'oklch(0.5106 0.2301 276.9656)',
      'chart-4': 'oklch(0.4568 0.2146 277.0229)',
      'chart-5': 'oklch(0.3984 0.1773 277.3662)',
      radius: '1.25rem',
      sidebar: 'oklch(0.3359 0.0077 59.4197)',
      'sidebar-foreground': 'oklch(0.9288 0.0126 255.5078)',
      'sidebar-primary': 'oklch(0.6801 0.1583 276.9349)',
      'sidebar-primary-foreground': 'oklch(0.2244 0.0074 67.4370)',
      'sidebar-accent': 'oklch(0.3896 0.0074 59.4734)',
      'sidebar-accent-foreground': 'oklch(0.8717 0.0093 258.3382)',
      'sidebar-border': 'oklch(0.3359 0.0077 59.4197)',
      'sidebar-ring': 'oklch(0.6801 0.1583 276.9349)',
    },
  },
  {
    name: 'vintage-paper',
    label: 'Vintage Paper',
    light: {
      background: 'oklch(0.9582 0.0152 90.2357)',
      foreground: 'oklch(0.3760 0.0225 64.3434)',
      card: 'oklch(0.9914 0.0098 87.4695)',
      'card-foreground': 'oklch(0.3760 0.0225 64.3434)',
      popover: 'oklch(0.9914 0.0098 87.4695)',
      'popover-foreground': 'oklch(0.3760 0.0225 64.3434)',
      primary: 'oklch(0.6180 0.0778 65.5444)',
      'primary-foreground': 'oklch(1.0000 0 0)',
      secondary: 'oklch(0.8846 0.0302 85.5655)',
      'secondary-foreground': 'oklch(0.4313 0.0300 64.9288)',
      muted: 'oklch(0.9239 0.0190 83.0636)',
      'muted-foreground': 'oklch(0.5391 0.0387 71.1655)',
      accent: 'oklch(0.8348 0.0426 88.8064)',
      'accent-foreground': 'oklch(0.3760 0.0225 64.3434)',
      destructive: 'oklch(0.5471 0.1438 32.9149)',
      'destructive-foreground': 'oklch(1.0000 0 0)',
      border: 'oklch(0.8606 0.0321 84.5881)',
      input: 'oklch(0.8606 0.0321 84.5881)',
      ring: 'oklch(0.6180 0.0778 65.5444)',
      'chart-1': 'oklch(0.6180 0.0778 65.5444)',
      'chart-2': 'oklch(0.5604 0.0624 68.5805)',
      'chart-3': 'oklch(0.4851 0.0570 72.6827)',
      'chart-4': 'oklch(0.6777 0.0624 64.7755)',
      'chart-5': 'oklch(0.7264 0.0581 66.6967)',
      radius: '0.25rem',
      sidebar: 'oklch(0.9239 0.0190 83.0636)',
      'sidebar-foreground': 'oklch(0.3760 0.0225 64.3434)',
      'sidebar-primary': 'oklch(0.6180 0.0778 65.5444)',
      'sidebar-primary-foreground': 'oklch(1.0000 0 0)',
      'sidebar-accent': 'oklch(0.8348 0.0426 88.8064)',
      'sidebar-accent-foreground': 'oklch(0.3760 0.0225 64.3434)',
      'sidebar-border': 'oklch(0.8606 0.0321 84.5881)',
      'sidebar-ring': 'oklch(0.6180 0.0778 65.5444)',
    },
    dark: {
      background: 'oklch(0.2747 0.0139 57.6523)',
      foreground: 'oklch(0.9239 0.0190 83.0636)',
      card: 'oklch(0.3237 0.0155 59.0603)',
      'card-foreground': 'oklch(0.9239 0.0190 83.0636)',
      popover: 'oklch(0.3237 0.0155 59.0603)',
      'popover-foreground': 'oklch(0.9239 0.0190 83.0636)',
      primary: 'oklch(0.7264 0.0581 66.6967)',
      'primary-foreground': 'oklch(0.2747 0.0139 57.6523)',
      secondary: 'oklch(0.3795 0.0181 57.1280)',
      'secondary-foreground': 'oklch(0.9239 0.0190 83.0636)',
      muted: 'oklch(0.2939 0.0125 62.1298)',
      'muted-foreground': 'oklch(0.7982 0.0243 82.1078)',
      accent: 'oklch(0.4186 0.0281 56.3404)',
      'accent-foreground': 'oklch(0.9239 0.0190 83.0636)',
      destructive: 'oklch(0.5471 0.1438 32.9149)',
      'destructive-foreground': 'oklch(1.0000 0 0)',
      border: 'oklch(0.3795 0.0181 57.1280)',
      input: 'oklch(0.3795 0.0181 57.1280)',
      ring: 'oklch(0.7264 0.0581 66.6967)',
      'chart-1': 'oklch(0.7264 0.0581 66.6967)',
      'chart-2': 'oklch(0.6777 0.0624 64.7755)',
      'chart-3': 'oklch(0.6180 0.0778 65.5444)',
      'chart-4': 'oklch(0.5604 0.0624 68.5805)',
      'chart-5': 'oklch(0.4851 0.0570 72.6827)',
      radius: '0.25rem',
      sidebar: 'oklch(0.2747 0.0139 57.6523)',
      'sidebar-foreground': 'oklch(0.9239 0.0190 83.0636)',
      'sidebar-primary': 'oklch(0.7264 0.0581 66.6967)',
      'sidebar-primary-foreground': 'oklch(0.2747 0.0139 57.6523)',
      'sidebar-accent': 'oklch(0.4186 0.0281 56.3404)',
      'sidebar-accent-foreground': 'oklch(0.9239 0.0190 83.0636)',
      'sidebar-border': 'oklch(0.3795 0.0181 57.1280)',
      'sidebar-ring': 'oklch(0.7264 0.0581 66.6967)',
    },
  },
];

type ThemePresetStorage = BaseStorage<ThemePresetName> & {
  setPreset: (name: ThemePresetName) => Promise<void>;
};

const storage = createStorage<ThemePresetName>('theme-preset-key', 'sunset-horizon', {
  storageEnum: StorageEnum.Sync,
  liveUpdate: true,
});

export const themePresetStorage: ThemePresetStorage = {
  ...storage,
  setPreset: async (name: ThemePresetName) => {
    await storage.set(name);
  },
};

/** Apply a theme preset's CSS variables to a root element */
export function applyThemePreset(
  presetName: ThemePresetName,
  mode: 'light' | 'dark',
  root: HTMLElement = document.documentElement,
) {
  const preset = themePresets.find(p => p.name === presetName);
  if (!preset) return;

  const colors = preset[mode];
  for (const [key, value] of Object.entries(colors)) {
    root.style.setProperty(`--${key}`, value);
  }
}
