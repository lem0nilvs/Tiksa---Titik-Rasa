import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font } from "../theme";
import type { Ringkasan } from "../lib/rating";

// deretan 5 bintang untuk menampilkan nilai (mendukung setengah bintang)
export function BarisBintang({ nilai, ukuran = 16 }: { nilai: number; ukuran?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={nilai >= i ? "star" : nilai >= i - 0.5 ? "star-half" : "star-outline"}
          size={ukuran}
          color={colors.accent}
        />
      ))}
    </View>
  );
}

// ringkas satu baris: ★ 4,5 (12)
export function RingkasBintang({
  ringkasan, sembunyiKosong,
}: { ringkasan?: Ringkasan; sembunyiKosong?: boolean }) {
  if (!ringkasan || ringkasan.jumlah === 0) {
    return sembunyiKosong ? null : <Text style={s.belum}>Belum ada nilai</Text>;
  }
  return (
    <View style={s.baris}>
      <Ionicons name="star" size={13} color={colors.accent} />
      <Text style={s.rata}>{String(ringkasan.rata).replace(".", ",")}</Text>
      <Text style={s.jumlah}>({ringkasan.jumlah})</Text>
    </View>
  );
}

// 5 bintang yang bisa diketuk untuk memberi nilai
export function InputBintang({
  nilai, onPilih, nonaktif,
}: { nilai: number; onPilih: (n: number) => void; nonaktif?: boolean }) {
  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Pressable key={i} onPress={() => onPilih(i)} disabled={nonaktif} hitSlop={4}>
          <Ionicons
            name={nilai >= i ? "star" : "star-outline"}
            size={36}
            color={nonaktif ? colors.border : colors.accent}
          />
        </Pressable>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  baris: { flexDirection: "row", alignItems: "center", gap: 3 },
  rata: { fontFamily: font.bold, fontSize: 12, color: colors.primary },
  jumlah: { fontFamily: font.regular, fontSize: 11, color: colors.primary },
  belum: { fontFamily: font.regular, fontSize: 11, color: colors.primary, opacity: 0.6 },
});