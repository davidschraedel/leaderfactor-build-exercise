import type { Config } from '@react-router/dev/config';

export default {
  // SSR required for loaders/actions against Neon on Vercel Functions.
  ssr: true,
} satisfies Config;
