import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius } from "../theme";

export type ItemFoto = { uri: string; b64?: string; lama?: boolean };

type Props = {
  value: ItemFoto[];
  onChange: (v: ItemFoto[]) => void;
  onGalat?: (pesan: string) => void;
  max?: number;
};

export default function PilihFoto({ value, onChange, onGalat, max = 5 }: Props) {
  const sisa = max - value.length;

  async function dariGaleri() {
    const izin = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!izin.granted) {
      return onGalat?.("Izin galeri ditolak. Izinkan akses galeri di pengaturan untuk memilih foto.");
    }
    const hasil = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: sisa,
      quality: 0.5, // dikompres sebelum diunggah
      base64: true,
    });
    if (hasil.canceled) return;
    const baru = hasil.assets.slice(0, sisa).map((a) => ({ uri: a.uri, b64: a.base64 ?? undefined }));
    onChange([...value, ...baru]);
  }

  async function dariKamera() {
    const izin = await ImagePicker.requestCameraPermissionsAsync();
    if (!izin.granted) {
      return onGalat?.("Izin kamera ditolak. Izinkan akses kamera di pengaturan untuk mengambil foto.");
    }
    const hasil = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });
    if (hasil.canceled) return;
    const a = hasil.assets[0];
    onChange([...value, { uri: a.uri, b64: a.base64 ?? undefined }]);
  }

  function tambah() {
    onGalat?.("");
    Alert.alert("Tambah foto", `Ambil foto dari mana? (maksimal ${max} foto)`, [
      { text: "Kamera", onPress: dariKamera },
      { text: "Galeri", onPress: dariGaleri },
      { text: "Batal", style: "cancel" },
    ]);
  }

  function hapus(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  function jadikanSampul(i: number) {
    Alert.alert("Jadikan sampul?", "Foto ini akan tampil paling depan di daftar dan peta.", [
      { text: "Jadikan sampul", onPress: () => onChange([value[i], ...value.filter((_, idx) => idx !== i)]) },
      { text: "Batal", style: "cancel" },
    ]);
  }

  // belum ada foto: kotak besar seperti sebelumnya
  if (value.length === 0) {
    return (
      <Pressable style={s.kosong} onPress={tambah}>
        <View style={s.ikon}>
          <Ionicons name="add" size={30} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.judul}>Tambahkan foto</Text>
          <Text style={s.isi}>Maksimal {max} foto, foto pertama jadi sampul</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={{ marginBottom: 20 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.baris}>
        {value.map((f, i) => (
          <Pressable key={f.uri + i} style={s.kotak} onPress={() => i > 0 && jadikanSampul(i)}>
            <Image source={{ uri: f.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {i === 0 && (
              <View style={s.sampul}><Text style={s.sampulTeks}>Sampul</Text></View>
            )}
            <Pressable style={s.x} onPress={() => hapus(i)} hitSlop={6}>
              <Ionicons name="close" size={14} color={colors.white} />
            </Pressable>
          </Pressable>
        ))}
        {sisa > 0 && (
          <Pressable style={[s.kotak, s.tambah]} onPress={tambah}>
            <Ionicons name="add" size={26} color={colors.accent} />
            <Text style={s.tambahTeks}>Tambah</Text>
          </Pressable>
        )}
      </ScrollView>
      <Text style={s.info}>{value.length}/{max} foto • ketuk foto untuk jadikan sampul</Text>
    </View>
  );
}

const s = StyleSheet.create({
  kosong: {
    height: 105, flexDirection: "row", alignItems: "center", gap: 15, paddingHorizontal: 16,
    borderWidth: 1.5, borderStyle: "dashed", borderColor: colors.accent, borderRadius: radius.card,
    backgroundColor: colors.peach, marginBottom: 20,
  },
  ikon: { width: 55, height: 55, borderRadius: 12, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  judul: { fontFamily: font.bold, fontSize: 14, color: colors.primary },
  isi: { fontFamily: font.regular, fontSize: 11, color: colors.primary, marginTop: 4 },
  baris: { gap: 10, paddingVertical: 2 },
  kotak: {
    width: 128, height: 96, borderRadius: radius.card, backgroundColor: colors.peach, overflow: "hidden",
  },
  sampul: {
    position: "absolute", left: 6, bottom: 6, paddingHorizontal: 8, height: 20, borderRadius: 10,
    backgroundColor: colors.accent, justifyContent: "center",
  },
  sampulTeks: { fontFamily: font.bold, fontSize: 10, color: colors.white },
  x: {
    position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center",
  },
  tambah: {
    alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderStyle: "dashed",
    borderColor: colors.accent,
  },
  tambahTeks: { fontFamily: font.semibold, fontSize: 11, color: colors.accent, marginTop: 2 },
  info: { fontFamily: font.regular, fontSize: 10, color: colors.primary, marginTop: 8 },
});