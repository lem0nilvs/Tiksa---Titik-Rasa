import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font } from "../theme";

type Props = {
  visible: boolean;
  ikon: React.ReactNode;
  judul: string;
  isi: string;
  labelOk: string;
  warnaOk?: string;
  tengah?: boolean;
  busy?: boolean;
  onBatal: () => void;
  onOk: () => void;
};

export default function KonfirmasiModal({
  visible, ikon, judul, isi, labelOk, warnaOk = colors.primary,
  tengah, busy, onBatal, onOk,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onBatal}>
      <View style={s.latar}>
        <View style={s.kotak}>
          <View style={tengah ? { alignItems: "center" } : undefined}>{ikon}</View>
          <Text style={[s.judul, tengah && s.tengah]}>{judul}</Text>
          <Text style={[s.isi, tengah && s.tengah]}>{isi}</Text>
          <View style={s.baris}>
            <Pressable style={[s.tombol, { backgroundColor: colors.mint }]} onPress={onBatal} disabled={busy}>
              <Text style={[s.tombolTeks, { color: colors.primary }]}>Batal</Text>
            </Pressable>
            <Pressable
              style={[s.tombol, { backgroundColor: warnaOk, opacity: busy ? 0.7 : 1 }]}
              onPress={onOk}
              disabled={busy}
            >
              {busy ? <ActivityIndicator color="#fff" /> : <Text style={[s.tombolTeks, { color: "#fff" }]}>{labelOk}</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  latar: { flex: 1, backgroundColor: "rgba(4,44,143,0.45)", justifyContent: "center", paddingHorizontal: 24 },
  kotak: { backgroundColor: colors.white, borderRadius: 20, padding: 24, gap: 14 },
  judul: { fontFamily: font.bold, fontSize: 20, color: colors.primary },
  isi: { fontFamily: font.regular, fontSize: 13, lineHeight: 19.5, color: colors.primary },
  tengah: { textAlign: "center" },
  baris: { flexDirection: "row", gap: 12, marginTop: 6 },
  tombol: { flex: 1, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  tombolTeks: { fontFamily: font.semibold, fontSize: 13 },
});