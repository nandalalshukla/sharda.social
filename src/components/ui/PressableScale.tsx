import * as Haptics from "expo-haptics";
import React from "react";
import { GestureResponderEvent, Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressableScaleProps extends Omit<PressableProps, "style"> {
  style?: StyleProp<ViewStyle>;
  /** How far it shrinks while pressed. */
  scaleTo?: number;
  haptic?: boolean;
}

/**
 * Every tappable surface in the app uses this, so the whole UI gives the same
 * small, springy acknowledgement of a touch. The animation runs on the UI
 * thread, so it stays smooth while the JS thread is busy.
 */
export function PressableScale({
  scaleTo = 0.97,
  haptic = false,
  onPress,
  onPressIn,
  onPressOut,
  style,
  disabled,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={(e: GestureResponderEvent) => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 400 });
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 300 });
        onPressOut?.(e);
      }}
      onPress={(e: GestureResponderEvent) => {
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        onPress?.(e);
      }}
      style={[animated, style]}
    />
  );
}
