import { useCallback, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { colors, font } from "../theme";
import { formatRupiah, labelKategori, teksHarga, type Rekomendasi } from "../lib/rekomendasi";
import TombolFavorit from "../components/TombolFavorit";
import Pesan from "../components/Pesan";

export default function Favorit() {
  const router = useRouter();
  const [daftar, setDaftar] = useState<Rekomendasi[]>([]);
  const [galat, setGalat] = useState("");
  const [memuat, setMemuat] = useState(true);

  const muat = useCallback(async () => {
    const { data, error } = await supabase
      .from("favorit")
      .select("created_at, rekomendasi(*)")
      .order("created_at", { ascending: false });
    if (error) {
      setGalat("Gagal memuat favorit. Periksa koneksi internet.");
    } else {
      setGalat("");
      setDaftar(
        (data as any[]).map((d) => d.rekomendasi).filter(Boolean) as Rekomendasi[]
      );
    }
    setMemuat(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      muat();
    }, [muat])
  );

  async function lepas(id: number) {
    setDaftar((d) => d.filter((x) => x.id !== id)); // hilang dulu dari daftar
    const { error } = await supabase.from("favorit").delete().eq("rekomendasi_id", id);
    if (error) muat();
  }

  return (
    <View style={s.wrap}>
      <FlatList
        data={daftar}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 52, paddingBottom: 30 }}
        ItemSeparatorComponent={() => <View style={s.garis} />}
        ListHeaderComponent={
          <View>
            <Pressable onPress={() => router.back()} style={s.kembali} hitSlop={8}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
              <Text style={s.kembaliTeks}>Kembali</Text>
            </Pressable>
            <Text style={s.eyebrow}>KOLEKSI SAYA</Text>
            <Text style={s.judul}>Tempat favorit</Text>
            <Text style={s.hitung}>{daftar.length} tempat disimpan</Text>
            {galat ? <Pesan jenis="galat">{galat}</Pesan> : null}
          </View>
        }
        ListEmptyComponent={
          memuat ? undefined : (
            <View style={s.kosong}>
              <View style={s.kosongLingkar}>
                <Ionicons name="heart-outline" size={40} color={colors.primary} />
              </View>
              <Text style={s.kosongJudul}>Belum ada favorit</Text>
              <Text style={s.kosongIsi}>
                Ketuk ikon hati pada tempat yang kamu suka, nanti muncul di sini.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable style={s.baris} onPress={() => router.push(`/rekomendasi/${item.id}` as any)}>
            <View style={s.foto}>
              {item.foto_url ? (
                <Image source={{ uri: item.foto_url }} style={s.fotoImg} resizeMode="cover" />
              ) : (
                <Ionicons name="restaurant-outline" size={26} color={colors.accent} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nama} numberOfLines={1}>{item.nama_tempat}</Text>
              <Text style={s.info} numberOfLines={1}>{labelKategori(item.kategori)} • {item.menu}</Text>
              <Text style={s.harga}>{teksHarga(item)}</Text>
            </View>
            <TombolFavorit aktif onPress={() => lepas(item.id)} />
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  kembali: { flexDirection: "row", alignItems: "center", marginBottom: 14, marginLeft: -4 },
  kembaliTeks: { fontFamily: font.semibold, fontSize: 13, color: colors.primary },
  eyebrow: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1, color: colors.primary },
  judul: { fontFamily: font.bold, fontSize: 25, color: colors.primary, marginTop: 4 },
  hitung: { fontFamily: font.regular, fontSize: 11, color: colors.primary, marginTop: 2, marginBottom: 14 },
  baris: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 14 },
  foto: {
    width: 91, height: 84, borderRadius: 14, backgroundColor: colors.peach,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  fotoImg: { width: "100%", height: "100%" },
  nama: { fontFamily: font.bold, fontSize: 14, color: colors.primary },
  info: { fontFamily: font.regular, fontSize: 11, color: colors.accent, marginTop: 6 },
  harga: { fontFamily: font.bold, fontSize: 12, color: colors.primary, marginTop: 8 },
  garis: { height: 1, backgroundColor: colors.border },
  kosong: { alignItems: "center", paddingTop: 40, paddingHorizontal: 16 },
  kosongLingkar: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: colors.mint,
    alignItems: "center", justifyContent: "center",
  },
  kosongJudul: { fontFamily: font.bold, fontSize: 16, color: colors.primary, marginTop: 22 },
  kosongIsi: { fontFamily: font.regular, fontSize: 12, color: colors.primary, marginTop: 8, textAlign: "center", lineHeight: 18 },
});