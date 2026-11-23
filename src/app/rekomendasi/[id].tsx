import { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from "react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker } from "react-native-maps";
import { supabase } from "../../lib/supabase";
import { colors, font } from "../../theme";
import {
  daftarMenu, formatRupiah, labelKategori, teksHarga, type Rekomendasi,
} from "../../lib/rekomendasi";
import { useFavorit } from "../../lib/favorit";
import { ambilRatingku, ambilRingkasan, simpanRating, type Ringkasan } from "../../lib/rating";
import { BarisBintang, InputBintang } from "../../components/Bintang";
import { hitungKomentar } from "../../lib/komentar";
import { useAdmin } from "../../lib/admin";
import { hapusBanyakFoto } from "../../lib/foto";
import KonfirmasiModal from "../../components/KonfirmasiModal";
import LaporModal from "../../components/LaporModal";

export default function Detail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const lebar = width - 48; // lebar area foto (padding 24 kiri-kanan)
  const fav = useFavorit();
  const admin = useAdmin();

  const [data, setData] = useState<Rekomendasi | null>(null);
  const [status, setStatus] = useState<"memuat" | "ok" | "gagal">("memuat");
  const [hal, setHal] = useState(0);

  const [uid, setUid] = useState<string | null>(null);
  const [ringkasan, setRingkasan] = useState<Ringkasan | undefined>();
  const [ratingku, setRatingku] = useState(0);
  const [pesanRating, setPesanRating] = useState("");
  const [rGalat, setRGalat] = useState(false);
  const [menyimpanRating, setMenyimpanRating] = useState(false);
  const [jumlahKomentar, setJumlahKomentar] = useState(0);

  const [laporBuka, setLaporBuka] = useState(false);
  const [hapusBuka, setHapusBuka] = useState(false);
  const [menghapus, setMenghapus] = useState(false);
  const [galatHapus, setGalatHapus] = useState("");

  // muat ulang jumlah komentar setiap layar ini tampil lagi
  useFocusEffect(
    useCallback(() => {
      if (id) hitungKomentar(Number(id)).then(setJumlahKomentar).catch(() => {});
    }, [id])
  );

  useEffect(() => {
    (async () => {
      const { data: row, error } = await supabase
        .from("rekomendasi")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error || !row) return setStatus("gagal");
      setData(row as Rekomendasi);
      setStatus("ok");

      const [r, mine, u] = await Promise.all([
        ambilRingkasan([row.id]),
        ambilRatingku(row.id),
        supabase.auth.getUser(),
      ]);
      setRingkasan(r[row.id]);
      setRatingku(mine);
      setUid(u.data.user?.id ?? null);
    })();
  }, [id]);

  async function hapusTempat() {
    if (!data) return;
    setMenghapus(true);
    setGalatHapus("");
    try {
      const { data: hasil, error } = await supabase
        .from("rekomendasi").delete().eq("id", data.id).select("id");
      if (error) throw error;
      if (!hasil || hasil.length === 0) throw new Error("Tidak diizinkan");
      await hapusBanyakFoto(data.foto_urls?.length ? data.foto_urls : [data.foto_url]);
      setHapusBuka(false);
      router.replace("/(tabs)");
    } catch (e) {
      console.log("ERROR HAPUS TEMPAT:", e);
      setGalatHapus("Gagal menghapus rekomendasi. Coba lagi sebentar.");
      setHapusBuka(false);
    }
    setMenghapus(false);
  }

  async function pilihBintang(n: number) {
    if (!data || menyimpanRating) return;
    const sebelum = ratingku;
    setRatingku(n); // tampilkan dulu supaya terasa cepat
    setPesanRating("");
    setRGalat(false);
    setMenyimpanRating(true);
    try {
      await simpanRating(data.id, n);
      const r = await ambilRingkasan([data.id]);
      setRingkasan(r[data.id]);
      setPesanRating("Terima kasih, nilaimu tersimpan.");
    } catch (e: any) {
      console.log("ERROR RATING:", e);
      setRatingku(sebelum);
      setRGalat(true);
      const m: string = e?.message ?? "";
      setPesanRating(
        /network request failed/i.test(m)
          ? "Tidak bisa terhubung. Periksa koneksi internetmu."
          : "Gagal menyimpan nilai. Coba lagi sebentar."
      );
    }
    setMenyimpanRating(false);
  }

  const kembali = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));

  const adaAlamat = !!data?.alamat && data.alamat !== "Alamat belum diketahui";
  const difavoritkan = data ? fav.ids.has(data.id) : false;
  const milikSendiri = !!uid && !!data && (data as any).user_id === uid;
  const fotos: string[] = data
    ? data.foto_urls?.length ? data.foto_urls : data.foto_url ? [data.foto_url] : []
    : [];

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Pressable onPress={kembali} hitSlop={12}>
          <Text style={s.back}>‹</Text>
        </Pressable>
        <Text style={s.headerJudul}>Detail rekomendasi</Text>
      </View>

      {status === "memuat" && (
        <View style={s.tengah}><ActivityIndicator size="large" color={colors.primary} /></View>
      )}

      {status === "gagal" && (
        <View style={s.tengah}>
          <Text style={s.gagalJudul}>Rekomendasi tidak ditemukan</Text>
          <Text style={s.gagalIsi}>Mungkin sudah dihapus oleh pembagi.</Text>
        </View>
      )}

      {status === "ok" && data && (
        <ScrollView contentContainerStyle={s.isiWrap} keyboardShouldPersistTaps="handled">
          <View style={s.foto}>
            {fotos.length > 0 ? (
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => setHal(Math.round(e.nativeEvent.contentOffset.x / lebar))}
              >
                {fotos.map((u) => (
                  <Image key={u} source={{ uri: u }} style={{ width: lebar, height: 205 }} resizeMode="cover" />
                ))}
              </ScrollView>
            ) : (
              <Ionicons name="restaurant-outline" size={64} color={colors.accent} />
            )}

            <Pressable style={s.hati} onPress={() => fav.toggle(data.id)} hitSlop={8}>
              <Ionicons
                name={difavoritkan ? "heart" : "heart-outline"}
                size={22}
                color={difavoritkan ? colors.accent : colors.primary}
              />
            </Pressable>

            {fotos.length > 1 && (
              <>
                <View style={s.hitung}>
                  <Text style={s.hitungTeks}>{hal + 1}/{fotos.length}</Text>
                </View>
                <View style={s.titikBaris}>
                  {fotos.map((_, i) => (
                    <View key={i} style={[s.titik, i === hal && s.titikAktif]} />
                  ))}
                </View>
              </>
            )}
          </View>

          <Text style={s.nama}>{data.nama_tempat}</Text>
          <Text style={s.kategori}>{labelKategori(data.kategori).toUpperCase()}</Text>

          <View style={s.hargaBaris}>
            <Text style={s.harga}>{teksHarga(data)}</Text>
            {ringkasan && ringkasan.jumlah > 0 && (
              <View style={s.ringkasBaris}>
                <Ionicons name="star" size={16} color={colors.accent} />
                <Text style={s.ringkasRata}>{String(ringkasan.rata).replace(".", ",")}</Text>
                <Text style={s.ringkasJumlah}>({ringkasan.jumlah})</Text>
              </View>
            )}
          </View>

          <View style={s.garis} />

          <Text style={s.label}>Menu rekomendasi</Text>
          <View style={s.menuList}>
            {daftarMenu(data).map((m, i) => (
              <View key={i} style={s.menuBaris}>
                <Text style={s.menuNama}>{m.nama}</Text>
                <Text style={s.menuHarga}>{m.harga != null ? formatRupiah(m.harga) : "-"}</Text>
              </View>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 18 }]}>Ulasan pembagi</Text>
          <Text style={s.ulasan}>{data.ulasan || "Pembagi belum menulis ulasan."}</Text>

          <Text style={s.pembagi}>Dibagikan oleh {(data as any).nama_pembagi ?? "Pengguna"}</Text>

          {/* ---------- penilaian ---------- */}
          <View style={s.kotakNilai}>
            <Text style={s.nilaiJudul}>Penilaian</Text>

            {ringkasan && ringkasan.jumlah > 0 ? (
              <View style={s.nilaiRingkas}>
                <Text style={s.nilaiAngka}>{String(ringkasan.rata).replace(".", ",")}</Text>
                <View>
                  <BarisBintang nilai={ringkasan.rata} />
                  <Text style={s.nilaiJumlah}>dari {ringkasan.jumlah} penilaian</Text>
                </View>
              </View>
            ) : (
              <Text style={s.nilaiKosong}>Belum ada yang menilai tempat ini.</Text>
            )}

            <View style={s.nilaiGaris} />

            {milikSendiri ? (
              <Text style={s.nilaiInfo}>Kamu tidak bisa menilai tempat yang kamu bagikan sendiri.</Text>
            ) : (
              <>
                <Text style={s.nilaiLabel}>
                  {ratingku > 0 ? "Nilaimu (ketuk untuk mengubah)" : "Beri nilaimu"}
                </Text>
                <InputBintang nilai={ratingku} onPilih={pilihBintang} nonaktif={menyimpanRating} />
                {pesanRating ? (
                  <Text style={[s.nilaiPesan, rGalat && { color: colors.danger }]}>{pesanRating}</Text>
                ) : null}
              </>
            )}
          </View>

          <Pressable
            style={s.komentarBaris}
            onPress={() => router.push(`/komentar/${data.id}` as any)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.primary} />
            <Text style={s.komentarTeks}>
              Komentar{jumlahKomentar > 0 ? ` (${jumlahKomentar})` : ""}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>

          <Text style={s.lokasi}>Lokasi tempat</Text>
          {adaAlamat && (
            <View style={s.alamatBaris}>
              <Ionicons name="location-outline" size={15} color={colors.primary} />
              <Text style={s.alamatTeks}>{data.alamat}</Text>
            </View>
          )}
          <View style={s.peta}>
            <MapView
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: data.lat,
                longitude: data.lng,
                latitudeDelta: 0.006,
                longitudeDelta: 0.006,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
            >
              <Marker coordinate={{ latitude: data.lat, longitude: data.lng }} pinColor={colors.accent} />
            </MapView>
          </View>

          {/* ---------- lapor (pengguna lain) ---------- */}
          {!milikSendiri && (
            <Pressable style={s.laporBaris} onPress={() => setLaporBuka(true)} hitSlop={8}>
              <Ionicons name="flag-outline" size={16} color={colors.primary} />
              <Text style={s.laporTeks}>Laporkan rekomendasi ini</Text>
            </Pressable>
          )}

          {/* ---------- hapus (khusus admin) ---------- */}
          {admin && (
            <View style={{ marginTop: 12 }}>
              {galatHapus ? <Text style={s.galatHapus}>{galatHapus}</Text> : null}
              <Pressable style={s.adminTombol} onPress={() => setHapusBuka(true)}>
                <Ionicons name="shield-checkmark-outline" size={18} color={colors.merah} />
                <Text style={s.adminTeks}>Hapus sebagai admin</Text>
              </Pressable>
            </View>
          )}
        </ScrollView>
      )}

      <LaporModal
        visible={laporBuka}
        onTutup={() => setLaporBuka(false)}
        rekomendasiId={data?.id}
        judul="Laporkan rekomendasi"
      />

      <KonfirmasiModal
        visible={hapusBuka}
        tengah
        ikon={
          <View style={s.ikonBulat}>
            <Text style={s.ikonSeru}>!</Text>
          </View>
        }
        judul="Hapus rekomendasi ini?"
        isi="Rekomendasi beserta foto, rating, dan komentarnya akan dihapus dan tidak dapat dikembalikan."
        labelOk="Ya, hapus"
        busy={menghapus}
        onBatal={() => setHapusBuka(false)}
        onOk={hapusTempat}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: "row", alignItems: "center", gap: 20, paddingHorizontal: 24, paddingTop: 50, paddingBottom: 14 },
  back: { fontFamily: font.regular, fontSize: 34, color: colors.primary, lineHeight: 38 },
  headerJudul: { fontFamily: font.bold, fontSize: 15, color: colors.primary },
  tengah: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  gagalJudul: { fontFamily: font.bold, fontSize: 16, color: colors.primary },
  gagalIsi: { fontFamily: font.regular, fontSize: 12, color: colors.primary, marginTop: 6 },
  isiWrap: { paddingHorizontal: 24, paddingBottom: 40 },
  foto: {
    height: 205, borderRadius: 14, backgroundColor: colors.peach,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  hati: {
    position: "absolute", top: 12, right: 12, width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.white, alignItems: "center", justifyContent: "center",
    elevation: 3, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  hitung: {
    position: "absolute", top: 12, left: 12, paddingHorizontal: 10, height: 26, borderRadius: 13,
    backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center",
  },
  hitungTeks: { fontFamily: font.bold, fontSize: 11, color: colors.white },
  titikBaris: { position: "absolute", bottom: 10, flexDirection: "row", gap: 6 },
  titik: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.55)" },
  titikAktif: { width: 18, backgroundColor: colors.white },
  nama: { fontFamily: font.bold, fontSize: 25, color: colors.primary, marginTop: 20 },
  kategori: { fontFamily: font.bold, fontSize: 10, letterSpacing: 0.5, color: colors.accent, marginTop: 6 },
  hargaBaris: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14 },
  harga: { fontFamily: font.bold, fontSize: 20, color: colors.primary },
  ringkasBaris: { flexDirection: "row", alignItems: "center", gap: 4 },
  ringkasRata: { fontFamily: font.bold, fontSize: 15, color: colors.primary },
  ringkasJumlah: { fontFamily: font.regular, fontSize: 12, color: colors.primary },
  garis: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  label: { fontFamily: font.medium, fontSize: 12, color: colors.primary },
  menuList: { marginTop: 6 },
  menuBaris: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  menuNama: { flex: 1, fontFamily: font.semibold, fontSize: 14, color: colors.primary, paddingRight: 12 },
  menuHarga: { fontFamily: font.bold, fontSize: 14, color: colors.primary },
  ulasan: { fontFamily: font.regular, fontSize: 13, lineHeight: 19.5, color: colors.primary, marginTop: 4 },
  pembagi: { fontFamily: font.regular, fontSize: 11, color: colors.primary, marginTop: 28 },
  kotakNilai: {
    marginTop: 18, padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 16,
  },
  nilaiJudul: { fontFamily: font.bold, fontSize: 14, color: colors.primary },
  nilaiRingkas: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 12 },
  nilaiAngka: { fontFamily: font.bold, fontSize: 36, color: colors.primary },
  nilaiJumlah: { fontFamily: font.regular, fontSize: 11, color: colors.primary, marginTop: 4 },
  nilaiKosong: { fontFamily: font.regular, fontSize: 12, color: colors.primary, marginTop: 10 },
  nilaiGaris: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  nilaiLabel: { fontFamily: font.semibold, fontSize: 12, color: colors.primary, marginBottom: 10 },
  nilaiInfo: { fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.primary },
  nilaiPesan: { fontFamily: font.regular, fontSize: 11, color: colors.success, marginTop: 10 },
  komentarBaris: {
    flexDirection: "row", alignItems: "center", gap: 12, height: 52, paddingHorizontal: 16, marginTop: 18,
    borderWidth: 1, borderColor: colors.border, borderRadius: 14,
  },
  komentarTeks: { flex: 1, fontFamily: font.semibold, fontSize: 13, color: colors.primary },
  lokasi: { fontFamily: font.bold, fontSize: 12, color: colors.primary, marginTop: 22, marginBottom: 8 },
  alamatBaris: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginBottom: 10 },
  alamatTeks: { flex: 1, fontFamily: font.regular, fontSize: 12, lineHeight: 18, color: colors.primary },
  peta: { height: 116, borderRadius: 13, overflow: "hidden", backgroundColor: colors.mint },
  laporBaris: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6,
    marginTop: 22, paddingVertical: 10,
  },
  laporTeks: { fontFamily: font.semibold, fontSize: 12, color: colors.primary },
  galatHapus: { fontFamily: font.regular, fontSize: 11, color: colors.danger, marginBottom: 8 },
  adminTombol: {
    height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.merah,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  adminTeks: { fontFamily: font.bold, fontSize: 13, color: colors.merah },
  ikonBulat: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  ikonSeru: { fontFamily: font.bold, fontSize: 28, color: colors.primary },
});