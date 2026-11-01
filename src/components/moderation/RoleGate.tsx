import { useRouter } from "expo-router";
import React from "react";
import type { Role } from "@/api/types";
import { SignInPrompt } from "@/components/SignInPrompt";
import { EmptyState } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";

/**
 * Renders children only for the allowed roles. The backend enforces this on
 * every route too — this just avoids showing a screen that can only error.
 */
export function RoleGate({ allow, children }: { allow: Role[]; children: React.ReactNode }) {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.user?.role);

  if (status !== "authed") {
    return <SignInPrompt icon="lock" title="Sign in required" description="Sign in with a moderator or admin account to use this dashboard." />;
  }
  if (!role || !allow.includes(role)) {
    return (
      <EmptyState
        icon="lock"
        title="You don't have access"
        description="This dashboard is for moderators and admins."
        actionLabel="Go back"
        onAction={() => router.back()}
      />
    );
  }
  return <>{children}</>;
}
