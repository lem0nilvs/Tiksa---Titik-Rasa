import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { colors, font } from "../theme";
import { hapusBanyakFoto } from "../lib/foto";
import { waktuRelatif } from "../lib/komentar";

type Lap = {
  id: number;
  alasan: string;
  catatan: string | null;
  created_at: string;
  rekomendasi_id: number | null;
  komentar_id: number | null;
  rekomendasi: { nama_tempat: string; foto_url: string | null; foto_urls: string[] | null } | null;
  komentar: { isi: string; nama: string; rekomendasi_id: number } | null;
};

export default function LaporanAdmin() {
  const router = useRouter();
  const [data, setData] = useState<Lap[]>([]);
  const [memuat, setMemuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [sibuk, setSibuk] = useState<number | null>(null);

  const muat = useCallback(async () => {
    setGalat("");
    const { data: d, error } = await supabase
      .from("laporan")
      .select("id, alasan, catatan, created_at, rekomendasi_id, komentar_id, rekomendasi(nama_tempat, foto_url, foto_urls), komentar(isi, nama, rekomendasi_id)")
      .eq("status", "baru")
      .order("created_at", { ascending: false });
    if (error) {
      console.log("ERROR LAPORAN:", error);
      setGalat("Gagal memuat laporan. Coba lagi sebentar.");
    } else {
      setData((d ?? []) as any);
    }
    setMemuat(false);
  }, []);

  useFocusEffect(useCallback(() => { muat(); }, [muat]));

  async function abaikan(l: Lap) {
    setSibuk(l.id);
    const { error } = await supabase.from("laporan").update({ status: "selesai" }).eq("id", l.id);
    if (error) setGalat("Gagal memperbarui laporan.");
    else setData((x) => x.filter((r) => r.id !== l.id));
    setSibuk(null);
  }

  async function hapusKonten(l: Lap) {
    setSibuk(l.id);
    setGalat("");
    try {
      if (l.rekomendasi_id) {
        const { data: h, error } = await supabase.from("rekomendasi").delete().eq("id", l.rekomendasi_id).select("id");
        if (error) throw error;
        if (!h || h.length === 0) throw new Error("Tidak diizinkan");
        const f = l.rekomendasi;
        if (f) await hapusBanyakFoto(f.foto_urls?.length ? f.foto_urls : f.foto_url ? [f.foto_url] : []);
      } else if (l.komentar_id) {
        const { data: h, error } = await supabase.from("komentar").delete().eq("id", l.komentar_id).select("id");
        if (error) throw error;
        if (!h || h.length === 0) throw new Error("Tidak diizinkan");
      }
      // laporan ikut terhapus otomatis; muat ulang agar laporan lain pada konten sama juga hilang
      await muat();
    } catch (e) {
      console.log("ERROR HAPUS KONTEN:", e);
      setGalat("Gagal menghapus konten. Coba lagi sebentar.");
    }
    setSibuk(null);
  }

  function lihat(l: Lap) {
    if (l.rekomendasi_id) router.push(`/rekomendasi/${l.rekomendasi_id}` as any);
    else if (l.komentar?.rekomendasi_id) router.push(`/komentar/${l.komentar.rekomendasi_id}` as any);
  }

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)"))} hitSlop={12}>
          <Text style={s.back}>‹</Text>
        </Pressable>
        <Text style={s.judul}>Laporan masuk{data.length ? ` (${data.length})` : ""}</Text>
      </View>

      {galat ? <Text style={s.err}>{galat}</Text> : null}

      {memuat ? (
        <View style={s.tengah}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(l) => String(l.id)}
          contentContainerStyle={{ padding: 24, paddingTop: 12, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={s.tengah}>
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.success} />
              <Text style={s.kosongJudul}>Tidak ada laporan baru</Text>
            </View>
          }
          renderItem={({ item: l }) => (
            <View style={s.kartu}>
              <View style={s.atas}>
                <View style={s.lencana}>
                  <Text style={s.lencanaTeks}>{l.rekomendasi_id ? "Rekomendasi" : "Komentar"}</Text>
                </View>
                <Text style={s.waktu}>{waktuRelatif(l.created_at)}</Text>
              </View>

              <Text style={s.target} numberOfLines={3}>
                {l.rekomendasi
                  ? l.rekomendasi.nama_tempat
                  : l.komentar
                  ? `"${l.komentar.isi}" — ${l.komentar.nama}`
                  : "Konten tidak ditemukan"}
              </Text>

              <Text style={s.alasan}>Alasan: <Text style={{ fontFamily: font.bold }}>{l.alasan}</Text></Text>
              {l.catatan ? <Text style={s.catatan}>{l.catatan}</Text> : null}

              <View style={s.aksi}>
                <Pressable style={s.tombolLuar} onPress={() => lihat(l)} disabled={sibuk === l.id}>
                  <Text style={s.tombolLuarTeks}>Lihat</Text>
                </Pressable>
                <Pressable style={s.tombolLuar} onPress={() => abaikan(l)} disabled={sibuk === l.id}>
                  <Text style={s.tombolLuarTeks}>Abaikan</Text>
                </Pressable>
                <Pressable style={[s.tombolHapus, sibuk === l.id && { opacity: 0.6 }]} onPress={() => hapusKonten(l)} disabled={sibuk === l.id}>
                  <Text style={s.tombolHapusTeks}>Hapus konten</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  back: { fontFamily: font.regular, fontSize: 34, color: colors.primary, lineHeight: 38 },
  judul: { fontFamily: font.bold, fontSize: 16, color: colors.primary },
  err: { fontFamily: font.regular, fontSize: 12, color: colors.danger, marginHorizontal: 24, marginTop: 10 },
  tengah: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  kosongJudul: { fontFamily: font.bold, fontSize: 14, color: colors.primary, marginTop: 12 },
  kartu: { borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 16, marginBottom: 12 },
  atas: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lencana: { paddingHorizontal: 10, height: 22, borderRadius: 11, backgroundColor: colors.peach, justifyContent: "center" },
  lencanaTeks: { fontFamily: font.bold, fontSize: 10, color: colors.accent },
  waktu: { fontFamily: font.regular, fontSize: 10, color: colors.primary, opacity: 0.7 },
  target: { fontFamily: font.semibold, fontSize: 13, color: colors.primary, marginTop: 10, lineHeight: 19 },
  alasan: { fontFamily: font.regular, fontSize: 12, color: colors.primary, marginTop: 8 },
  catatan: { fontFamily: font.regular, fontSize: 12, color: colors.primary, marginTop: 4, opacity: 0.8 },
  aksi: { flexDirection: "row", gap: 8, marginTop: 14 },
  tombolLuar: { flex: 1, height: 40, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  tombolLuarTeks: { fontFamily: font.semibold, fontSize: 12, color: colors.primary },
  tombolHapus: { flex: 1.4, height: 40, borderRadius: 12, backgroundColor: colors.merah, alignItems: "center", justifyContent: "center" },
  tombolHapusTeks: { fontFamily: font.bold, fontSize: 12, color: colors.white },
});