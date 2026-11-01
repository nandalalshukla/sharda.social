import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { Button, EmptyState, FeatherName } from "@/components/ui";

/** What a guest sees on a screen that needs an account. */
export function SignInPrompt({ icon, title, description }: { icon: FeatherName; title: string; description: string }) {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <EmptyState icon={icon} title={title} description={description} />
      <View style={{ alignItems: "center", gap: 10, marginTop: -24 }}>
        <Button title="Sign in" onPress={() => router.push("/login")} />
        <Button title="Create an account" variant="ghost" onPress={() => router.push("/register")} />
      </View>
    </View>
  );
}
