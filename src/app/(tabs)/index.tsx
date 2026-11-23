import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import TombolFavorit from "../../components/TombolFavorit";
import { useFavorit } from "../../lib/favorit";
import {
  ambilTerdekat,
  formatJarak,
  formatRupiah,
  labelKategori,
  teksHarga,
  type Rekomendasi,
} from "../../lib/rekomendasi";
import { useLokasi } from "../../lib/useLokasi";
import { colors, font, radius } from "../../theme";
import { ambilRingkasan, type Ringkasan } from "../../lib/rating";
import { RingkasBintang } from "../../components/Bintang";
import LoncengAdmin from "../../components/LoncengAdmin";

const FILTER = ["Terdekat", "Makanan", "Minuman"] as const;

const HARGA = [
  { k: "semua", label: "Semua harga", min: 0, max: Infinity },
  { k: "murah", label: "Di bawah Rp15 rb", min: 0, max: 14999 },
  { k: "sedang", label: "Rp15 – 30 rb", min: 15000, max: 30000 },
  { k: "mahal", label: "Di atas Rp30 rb", min: 30001, max: Infinity },
] as const;

export default function Beranda() {
  const router = useRouter();
  const fav = useFavorit();
  const { status, posisi, minta, daerah } = useLokasi();
  const [data, setData] = useState<Rekomendasi[]>([]);
  const [filter, setFilter] = useState<(typeof FILTER)[number]>("Terdekat");
  const [hargaK, setHargaK] = useState<(typeof HARGA)[number]["k"]>("semua");
  const [cari, setCari] = useState("");
  const [memuat, setMemuat] = useState(false);
  const [gagal, setGagal] = useState(false);
  const [panel, setPanel] = useState(false);
  const [ringkasan, setRingkasan] = useState<Record<number, Ringkasan>>({});

  const keManual = () => router.push("/lokasi-manual" as any);

  const muat = useCallback(async () => {
    if (!posisi) return;
    setMemuat(true);
    setGagal(false);
    try {
      const hasil = await ambilTerdekat(posisi, 5);
      setData(hasil);
      setRingkasan(await ambilRingkasan(hasil.map((r) => r.id)));
    } catch {
      setGagal(true);
    }
    setMemuat(false);
  }, [posisi]);

  // muat ulang setiap layar ini dibuka (supaya rekomendasi baru langsung muncul)
  useFocusEffect(
    useCallback(() => {
      muat();
    }, [muat]),
  );

  // ---- saring daftar: kategori, harga, lalu kata kunci ----
  const rentang = HARGA.find((h) => h.k === hargaK)!;
  const kata = cari.trim().toLowerCase();

  const tampil = data
    .filter(
      (r) =>
        filter === "Terdekat" ||
        r.kategori === filter ||
        r.kategori === "Keduanya",
    )
    .filter((r) =>
      hargaK === "semua"
        ? true
        : r.harga != null && r.harga >= rentang.min && r.harga <= rentang.max,
    )
    .filter((r) =>
      !kata
        ? true
        : r.nama_tempat.toLowerCase().includes(kata) ||
          r.menu.toLowerCase().includes(kata),
    );

  const adaFilter =
    filter !== "Terdekat" || hargaK !== "semua" || kata.length > 0;
  const jumlahFilter =
    (filter !== "Terdekat" ? 1 : 0) + (hargaK !== "semua" ? 1 : 0);
  const asalJarak = daerah ? "titik pencarian" : "lokasimu";

  function resetFilter() {
    setFilter("Terdekat");
    setHargaK("semua");
    setCari("");
  }

  const Header = (
    <View>
      <Text style={s.salam}>Halo, selamat datang 👋</Text>
      <Text style={s.judul}>Mau cari makanan atau minuman?</Text>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 }}>
        <Pressable style={[s.lokasi, { flex: 1, marginTop: 0 }]} onPress={keManual}>
          <Ionicons name="locate-outline" size={16} color={colors.primary} />
          <Text style={s.lokasiTeks} numberOfLines={1}>
            {daerah
              ? daerah.nama
              : status === "ok"
                ? "Lokasimu saat ini"
                : status === "memuat"
                  ? "Mencari lokasimu..."
                  : "Lokasi tidak aktif"}
          </Text>
          <Text style={s.ubah}>Ubah</Text>
        </Pressable>

        <LoncengAdmin />
      </View>

      <View style={s.seksiBaris}>
        <Text style={s.seksi}>Di dekatmu</Text>
        <Text style={s.radius}>• radius 5 km</Text>
      </View>

      <View style={s.cariBaris}>
        <View style={s.kotakCari}>
          <Ionicons name="search-outline" size={16} color={colors.primary} />
          <TextInput
            style={s.inputCari}
            value={cari}
            onChangeText={setCari}
            placeholder="Cari menu atau nama tempat"
            placeholderTextColor="#8ea0c8"
            maxLength={60}
            returnKeyType="search"
            autoCorrect={false}
          />
          {cari.length > 0 && (
            <Pressable onPress={() => setCari("")} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.primary} />
            </Pressable>
          )}
        </View>

        <Pressable
          style={[
            s.tombolFilter,
            (panel || jumlahFilter > 0) && s.tombolFilterAktif,
          ]}
          onPress={() => setPanel((p) => !p)}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={panel || jumlahFilter > 0 ? colors.white : colors.primary}
          />
          {jumlahFilter > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTeks}>{jumlahFilter}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {panel && (
        <View style={s.panel}>
          <Text style={s.panelLabel}>Kategori</Text>
          <View style={s.chipsWrap}>
            {FILTER.map((f) => (
              <Pressable
                key={f}
                onPress={() => setFilter(f)}
                style={[s.chip, filter === f && s.chipAktif]}
              >
                <Text
                  style={[s.chipTeks, filter === f && { color: colors.white }]}
                >
                  {f === "Terdekat" ? "Semua" : f}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[s.panelLabel, { marginTop: 14 }]}>Harga</Text>
          <View style={s.chipsWrap}>
            {HARGA.map((h) => (
              <Pressable
                key={h.k}
                onPress={() => setHargaK(h.k)}
                style={[s.chipHarga, hargaK === h.k && s.chipAktif]}
              >
                <Text
                  style={[
                    s.chipTeks,
                    hargaK === h.k && { color: colors.white },
                  ]}
                >
                  {h.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {data.length > 0 && (
        <View style={s.hasilBaris}>
          <Text style={s.hasilTeks}>{tampil.length} tempat ditemukan</Text>
          {adaFilter && (
            <Pressable onPress={resetFilter} hitSlop={8}>
              <Text style={s.resetTeks}>Reset filter</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );

  // data ada, tapi semua tersaring
  const tersaringHabis = data.length > 0 && tampil.length === 0;

  const Kosong = (
    <View style={s.kosong}>
      <View style={s.kosongLingkar}>
        <Ionicons name="search" size={40} color={colors.primary} />
      </View>
      <Text style={s.kosongJudul}>
        {tersaringHabis
          ? "Tidak ada hasil yang cocok"
          : status === "ditolak"
            ? "Lokasi belum diizinkan"
            : gagal
              ? "Gagal memuat data"
              : "Belum ada rekomendasi di sekitarmu"}
      </Text>
      <Text style={s.kosongIsi}>
        {tersaringHabis
          ? "Coba ganti kata kunci, kategori, atau rentang harganya."
          : status === "ditolak"
            ? "Izinkan akses lokasi agar kami bisa menampilkan rekomendasi terdekat."
            : gagal
              ? "Periksa koneksi internetmu lalu tarik layar ke bawah untuk mencoba lagi."
              : "Jadilah yang pertama membagikan tempat makan enak di daerahmu."}
      </Text>
      <Pressable
        style={s.tombol}
        onPress={() =>
          tersaringHabis
            ? resetFilter()
            : status === "ditolak"
              ? minta()
              : router.push("/(tabs)/tambah")
        }
      >
        <Text style={s.tombolTeks}>
          {tersaringHabis
            ? "Reset filter"
            : status === "ditolak"
              ? "Izinkan lokasi"
              : "Tambah rekomendasi"}
        </Text>
      </Pressable>
      {status === "ditolak" && !tersaringHabis && (
        <Pressable onPress={keManual}>
          <Text style={s.linkManual}>Atau cari daerah secara manual</Text>
        </Pressable>
      )}
    </View>
  );

  if (status === "memuat" && !posisi) {
    return (
      <View style={[s.wrap, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={s.wrap}>
      <FlatList
        data={status === "ditolak" ? [] : tampil}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={Header}
        ListEmptyComponent={memuat ? undefined : Kosong}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={memuat}
            onRefresh={muat}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 56,
          paddingBottom: 24,
        }}
        ItemSeparatorComponent={() => <View style={s.garis} />}
        renderItem={({ item }) => (
          <Pressable
            style={s.kartu}
            onPress={() => router.push(`/rekomendasi/${item.id}` as any)}
          >
            <View style={s.foto}>
              {item.foto_url ? (
                <Image
                  source={{ uri: item.foto_url }}
                  style={s.fotoImg}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons
                  name="restaurant-outline"
                  size={32}
                  color={colors.accent}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nama} numberOfLines={1}>
                {item.nama_tempat}
              </Text>
              <Text style={s.kategori} numberOfLines={1}>
                {labelKategori(item.kategori)} • {item.menu}
              </Text>
              <View style={s.hargaBaris}>
                <Text style={s.harga}>{teksHarga(item)}</Text>
                <RingkasBintang ringkasan={ringkasan[item.id]} sembunyiKosong />
              </View>
              <Text style={s.jarak}>
                ⌖ {formatJarak(item.jarakM ?? 0)} dari {asalJarak}
              </Text>
              {item.alamat && item.alamat !== "Alamat belum diketahui" ? (
                <Text style={s.alamat} numberOfLines={1}>
                  {item.alamat}
                </Text>
              ) : null}
            </View>
            <View style={s.favPos}>
              <TombolFavorit
                aktif={fav.ids.has(item.id)}
                onPress={() => fav.toggle(item.id)}
              />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  salam: { fontFamily: font.medium, fontSize: 12, color: colors.primary },
  judul: {
    fontFamily: font.bold,
    fontSize: 20,
    color: colors.primary,
    marginTop: 6,
  },
  lokasi: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 44,
    marginTop: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
  },
  lokasiTeks: {
    flex: 1,
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.primary,
  },
  ubah: { fontFamily: font.bold, fontSize: 11, color: colors.primary },
  seksiBaris: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    marginTop: 22,
  },
  seksi: { fontFamily: font.bold, fontSize: 19, color: colors.primary },
  radius: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.primary,
    marginBottom: 3,
  },
  cariBaris: { flexDirection: "row", gap: 10, marginTop: 12 },
  kotakCari: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    backgroundColor: colors.mint,
  },
  inputCari: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.primary,
    paddingVertical: 0,
  },
  tombolFilter: {
    width: 46,
    height: 46,
    borderRadius: radius.input,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  tombolFilterAktif: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -5,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeTeks: { fontFamily: font.bold, fontSize: 10, color: colors.white },
  panel: {
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
  },
  panelLabel: {
    fontFamily: font.bold,
    fontSize: 11,
    color: colors.primary,
    marginBottom: 8,
  },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    height: 30,
    minWidth: 90,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipHarga: {
    height: 30,
    paddingHorizontal: 14,
    borderRadius: radius.chip,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  chipAktif: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTeks: { fontFamily: font.semibold, fontSize: 11, color: colors.primary },
  hasilBaris: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 6,
  },
  hasilTeks: { fontFamily: font.regular, fontSize: 11, color: colors.primary },
  resetTeks: { fontFamily: font.bold, fontSize: 11, color: colors.accent },
  kartu: { flexDirection: "row", gap: 15, paddingVertical: 14 },
  foto: {
    width: 112,
    height: 104,
    borderRadius: radius.card,
    backgroundColor: colors.peach,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  fotoImg: { width: "100%", height: "100%" },
  favPos: { position: "absolute", top: 6, right: -6 },
  nama: {
    fontFamily: font.bold,
    fontSize: 15,
    color: colors.primary,
    paddingRight: 26,
  },
  kategori: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.accent,
    marginTop: 6,
  },
  hargaBaris: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    marginTop: 8, 
  },
  harga: { 
    fontFamily: font.bold, 
    fontSize: 13, 
    color: colors.primary 
  },
  jarak: {
    fontFamily: font.regular,
    fontSize: 11,
    color: colors.primary,
    marginTop: 8,
  },
  alamat: {
    fontFamily: font.regular,
    fontSize: 10,
    color: colors.primary,
    opacity: 0.7,
    marginTop: 6,
  },
  garis: { height: 1, backgroundColor: colors.border },
  kosong: { alignItems: "center", paddingTop: 30, paddingHorizontal: 16 },
  kosongLingkar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  kosongJudul: {
    fontFamily: font.bold,
    fontSize: 16,
    color: colors.primary,
    marginTop: 24,
    textAlign: "center",
  },
  kosongIsi: {
    fontFamily: font.regular,
    fontSize: 12,
    color: colors.primary,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 18,
  },
  tombol: {
    height: 50,
    alignSelf: "stretch",
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    justifyContent: "center",
    marginTop: 28,
  },
  tombolTeks: {
    fontFamily: font.bold,
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
  },
  linkManual: {
    fontFamily: font.semibold,
    fontSize: 12,
    color: colors.accent,
    marginTop: 16,
    textAlign: "center",
  },
});
