import { createBrowserRouter, Navigate } from "react-router";
import { LandingPage } from "./components/LandingPage";
import { SignInScreen } from "./components/SignInScreen";
import { SignUpScreen } from "./components/SignUpScreen";
import { ForgotPasswordScreen } from "./components/ForgotPasswordScreen";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { RootLayout } from "./components/RootLayout";
import { PremiumHomeDashboard } from "./components/PremiumHomeDashboard";
import { TasksScreen } from "./components/TasksScreen";
import { FocusSessionScreen } from "./components/FocusSessionScreen";
import { AnalyticsScreen } from "./components/AnalyticsScreen";
import { EnergyHubScreen } from "./components/EnergyHubScreen";
import { ProfileScreen } from "./components/ProfileScreen";
import { SettingsScreen } from "./components/SettingsScreen";
import { KaalAgentScreenSimplified as KaalAgentScreen } from "./components/KaalAgentScreenSimplified";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/login",
        element: <SignInScreen />,
      },
      {
        path: "/signin",
        element: <SignInScreen />,
      },
      {
        path: "/signup",
        element: <SignUpScreen />,
      },
      {
        path: "/forgot-password",
        element: <ForgotPasswordScreen />,
      },
      {
        path: "/dashboard",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <PremiumHomeDashboard />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "/tasks",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <TasksScreen />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "/focus",
        Component: FocusSessionScreen,
      },
      {
        path: "/analytics",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <AnalyticsScreen />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "/energy",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <EnergyHubScreen />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "/profile",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <ProfileScreen />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "/settings",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <SettingsScreen />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      {
        path: "/agent",
        element: (
          <ProtectedRoute>
            <AppLayout>
              <KaalAgentScreen />
            </AppLayout>
          </ProtectedRoute>
        ),
      },
      // Redirect any other routes to landing page
      {
        path: "*",
        element: <LandingPage />,
      },
    ],
  },
]);