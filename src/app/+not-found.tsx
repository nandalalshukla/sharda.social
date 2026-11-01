import { useRouter } from "expo-router";
import React from "react";
import { EmptyState, Screen } from "@/components/ui";

export default function NotFound() {
  const router = useRouter();
  return (
    <Screen>
      <EmptyState
        icon="compass"
        title="Page not found"
        description="That link doesn't lead anywhere in the app."
        actionLabel="Go home"
        onAction={() => router.replace("/")}
      />
    </Screen>
  );
}
