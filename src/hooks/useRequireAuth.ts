import { useRouter } from "expo-router";
import { useCallback } from "react";
import { toast } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";

/**
 * Guests can browse the whole app, as on the website. Anything that writes
 * goes through this: it returns true when signed in, otherwise nudges to the
 * sign-in screen and returns false.
 *
 *   if (!requireAuth("like posts")) return;
 */
export function useRequireAuth() {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  return useCallback(
    (reason: string) => {
      if (status === "authed") return true;
      toast.info(`Sign in to ${reason}`);
      router.push("/login");
      return false;
    },
    [status, router],
  );
}
