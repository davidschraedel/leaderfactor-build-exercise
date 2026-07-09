import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('commitment', 'routes/commitment.tsx'),
  route('onboarding', 'routes/onboarding.tsx'),
  route('admin', 'routes/admin.tsx'),
  route('preview/manager-email', 'routes/preview/manager-email.tsx'),
] satisfies RouteConfig;
