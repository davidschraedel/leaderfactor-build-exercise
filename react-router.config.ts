import type { Config } from '@react-router/dev/config';
import { vercelPreset } from '@vercel/react-router/vite';

export default {
  // SSR required for loaders/actions against Neon on Vercel Functions.
  ssr: true,
  presets: [vercelPreset()],
} satisfies Config;
