"use client";

import { SimpleModeProvider } from "@/hooks/use-simple-mode";
import { NotificationsProvider } from "@/hooks/useNotifications";

interface DashboardProvidersProps {
  children: React.ReactNode;
}

export function DashboardProviders({ children }: DashboardProvidersProps) {
  return (
    <SimpleModeProvider>
      <NotificationsProvider>{children}</NotificationsProvider>
    </SimpleModeProvider>
  );
}
