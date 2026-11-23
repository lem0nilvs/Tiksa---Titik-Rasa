import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font } from "../theme";

type Props = { jenis: "galat" | "info"; children: React.ReactNode };

export default function Pesan({ jenis, children }: Props) {
  const galat = jenis === "galat";
  return (
    <View style={[s.box, galat ? s.galat : s.info]}>
      <Ionicons
        name={galat ? "alert-circle" : "checkmark-circle"}
        size={18}
        color={galat ? colors.danger : colors.success}
      />
      <Text style={[s.teks, { color: galat ? colors.danger : colors.success }]}>{children}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { flexDirection: "row", gap: 8, padding: 12, borderRadius: 12, marginBottom: 14, borderWidth: 1 },
  galat: { backgroundColor: "#fef2f2", borderColor: "#fecaca" },
  info: { backgroundColor: "#f0fdf4", borderColor: "#bbf7d0" },
  teks: { flex: 1, fontFamily: font.medium, fontSize: 12, lineHeight: 17 },
});