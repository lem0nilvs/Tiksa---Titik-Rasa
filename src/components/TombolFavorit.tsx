import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

type Props = { aktif: boolean; onPress: () => void; ukuran?: number };

export default function TombolFavorit({ aktif, onPress, ukuran = 22 }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={s.tombol}>
      <Ionicons
        name={aktif ? "heart" : "heart-outline"}
        size={ukuran}
        color={aktif ? colors.accent : colors.primary}
      />
    </Pressable>
  );
}

const s = StyleSheet.create({
  tombol: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
});