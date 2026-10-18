import { Image, type ImageStyle, type StyleProp } from "react-native";

export function AppBrand({
  isDarkMode,
  compact = false,
  style,
}: {
  isDarkMode: boolean;
  compact?: boolean;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      accessibilityLabel="GuavaLink"
      source={
        compact
          ? require("../../assets/images/guavalink-brand-mark.png")
          : isDarkMode
            ? require("../../assets/images/logo-horizontal-dark.png")
            : require("../../assets/images/guavalink-logo.png")
      }
      style={style}
      resizeMode="contain"
    />
  );
}
