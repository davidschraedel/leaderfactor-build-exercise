import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('commitment', 'routes/commitment.tsx'),
  route('onboarding', 'routes/onboarding.tsx'),
  route('checkin', 'routes/checkin.tsx'),
  route('confirmation', 'routes/confirmation.tsx'),
  route('admin', 'routes/admin.tsx'),
  route('preview/weekly-email', 'routes/preview/weekly-email.tsx'),
  route('preview/manager-email', 'routes/preview/manager-email.tsx'),
  route('preview/send-demo', 'routes/preview/send-demo.tsx'),
  route('api/seed', 'routes/api.seed.ts'),
] satisfies RouteConfig;
