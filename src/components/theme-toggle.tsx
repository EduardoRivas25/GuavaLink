/* eslint-disable react-hooks/refs */
import { useRef } from "react";
import { Animated, Pressable, Text } from "react-native";

export function ThemeToggle({
  isDarkMode,
  onPress,
  showLabel = false,
}: {
  isDarkMode: boolean;
  onPress: () => void;
  showLabel?: boolean;
}) {
  const rotation = useRef(new Animated.Value(0)).current;
  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handlePress = () => {
    rotation.stopAnimation();
    rotation.setValue(0);
    Animated.timing(rotation, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isDarkMode ? "Activar tema claro" : "Activar tema oscuro"}
      onPress={handlePress}
      style={{
        minWidth: 42,
        minHeight: 42,
        paddingHorizontal: showLabel ? 10 : 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: isDarkMode ? "#333336" : "#cbd5e1",
        backgroundColor: isDarkMode ? "#1d1d1f" : "#ffffff",
      }}
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Text style={{ fontSize: 23, lineHeight: 29 }}>
          {isDarkMode ? "☀️" : "🌙"}
        </Text>
      </Animated.View>
      {showLabel ? (
        <Text style={{ color: isDarkMode ? "#f5f5f7" : "#0f172a", fontSize: 12 }}>
          {isDarkMode ? "Claro" : "Oscuro"}
        </Text>
      ) : null}
    </Pressable>
  );
}
