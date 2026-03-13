import { lazy, Suspense, ReactElement, PropsWithChildren } from 'react';
import { Outlet, RouteObject, RouterProps, createBrowserRouter } from 'react-router-dom';

import PageLoader from '@/nickelfox/components/loading/PageLoader';
import Splash from '@/nickelfox/components/loading/Splash';
import { rootPaths } from './paths';
import paths from './paths';

const App = lazy<() => ReactElement>(() => import('@/nickelfox/App'));

const MainLayout = lazy<({ children }: PropsWithChildren) => ReactElement>(
  () => import('@/nickelfox/layouts/main-layout'),
);
const AuthLayout = lazy<({ children }: PropsWithChildren) => ReactElement>(
  () => import('@/nickelfox/layouts/auth-layout'),
);

const Dashboard = lazy<() => ReactElement>(() => import('@/nickelfox/pages/dashboard/Dashboard'));
const Login = lazy<() => ReactElement>(() => import('@/nickelfox/pages/authentication/Login'));
const SignUp = lazy<() => ReactElement>(() => import('@/nickelfox/pages/authentication/SignUp'));
const ErrorPage = lazy<() => ReactElement>(() => import('@/nickelfox/pages/error/ErrorPage'));

const routes: RouteObject[] = [
  {
    element: (
      <Suspense fallback={<Splash />}>
        <App />
      </Suspense>
    ),
    children: [
      {
        path: paths.home,
        element: (
          <MainLayout>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </MainLayout>
        ),
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
        ],
      },
      {
        path: rootPaths.authRoot,
        element: (
          <AuthLayout>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </AuthLayout>
        ),
        children: [
          {
            path: paths.login,
            element: <Login />,
          },
          {
            path: paths.signup,
            element: <SignUp />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
];

const options: { basename: string } = {
  basename: '/nickelfox',
};

const router: Partial<RouterProps> = createBrowserRouter(routes, options);

export default router;
