import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { colors, font } from "../theme";

type Props = {
  lat: number;
  lng: number;
  nama: string;
  kategori: string;
  aktif?: boolean;
  onPress?: (e: any) => void;
};

export default function PinKuliner({ lat, lng, nama, kategori, aktif, onPress }: Props) {
  const keduanya = kategori === "Keduanya";
  const minuman = kategori === "Minuman";
  const warna = keduanya ? colors.success : minuman ? colors.primary : colors.accent;

  // di Android, tampilan custom perlu digambar dulu baru "dibekukan"
  const [lacak, setLacak] = useState(true);
    useEffect(() => {
        setLacak(true);
        const id = setTimeout(() => setLacak(false), 600);
        return () => clearTimeout(id);
    }, [aktif, nama]);

  return (
    <Marker
      coordinate={{ latitude: lat, longitude: lng }}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={lacak}
      onPress={onPress}
    >
      <View style={s.wadah}>
        <View style={s.label}>
          <Text style={s.labelTeks} numberOfLines={1}>{nama}</Text>
        </View>
        <View style={[s.bulat, { backgroundColor: warna }, aktif && s.bulatAktif]}>
          <Ionicons
          name={keduanya ? "fast-food" : minuman ? "cafe" : "restaurant"}
          size={aktif ? 22 : 18}
          color={colors.white}
          />
        </View>
        <View style={[s.ekor, { borderTopColor: warna }]} />
      </View>
    </Marker>
  );
}

const s = StyleSheet.create({
  wadah: { width: 130, alignItems: "center" },
  label: {
    maxWidth: 126, paddingHorizontal: 8, height: 20, borderRadius: 10, marginBottom: 4,
    backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
    justifyContent: "center",
  },
  labelTeks: { fontFamily: font.bold, fontSize: 10, color: colors.primary },
  bulat: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: colors.white,
    alignItems: "center", justifyContent: "center",
  },
  bulatAktif: { width: 44, height: 44, borderRadius: 22 },
  ekor: {
    width: 0, height: 0, marginTop: -2,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 9,
    borderLeftColor: "transparent", borderRightColor: "transparent",
  },
});