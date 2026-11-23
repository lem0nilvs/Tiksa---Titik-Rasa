import { useCallback, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { colors, font } from "../../theme";
import { teksHarga, labelKategori, type Rekomendasi } from "../../lib/rekomendasi";
import { hapusBanyakFoto } from "../../lib/foto";
import { useAdmin } from "../../lib/admin";
import KonfirmasiModal from "../../components/KonfirmasiModal";
import Pesan from "../../components/Pesan";

function inisial(nama: string) {
  const k = nama.trim().split(/\s+/).slice(0, 2);
  return k.map((x) => x[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function Profil() {
  const router = useRouter();
  const admin = useAdmin();

  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [daftar, setDaftar] = useState<Rekomendasi[]>([]);
  const [galat, setGalat] = useState("");
  const [target, setTarget] = useState<Rekomendasi | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [modalKeluar, setModalKeluar] = useState(false);
  const [keluar, setKeluar] = useState(false);
  const [jumlahLaporan, setJumlahLaporan] = useState(0);

  const muat = useCallback(async () => {
    const { data: u } = await supabase.auth.getUser();
    const user = u.user;
    if (!user) return;
    setNama((user.user_metadata?.nama as string) ?? "Pengguna");
    setEmail(user.email ?? "");

    const { data, error } = await supabase
      .from("rekomendasi")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return setGalat("Gagal memuat rekomendasimu. Periksa koneksi internet.");
    setGalat("");
    setDaftar(data as Rekomendasi[]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      muat();
    }, [muat])
  );

  // hitung laporan baru (khusus admin) setiap layar ini tampil
  useFocusEffect(
    useCallback(() => {
      if (!admin) return;
      supabase
        .from("laporan")
        .select("id", { count: "exact", head: true })
        .eq("status", "baru")
        .then(({ count }) => setJumlahLaporan(count ?? 0));
    }, [admin])
  );

  async function hapus() {
    if (!target) return;
    setMenghapus(true);
    const { data, error } = await supabase
      .from("rekomendasi")
      .delete()
      .eq("id", target.id)
      .select("id");

    if (error || !data || data.length === 0) {
      setMenghapus(false);
      setTarget(null);
      return setGalat("Gagal menghapus. Kamu hanya bisa menghapus rekomendasi milikmu.");
    }
    // hapus juga semua fotonya (kalau gagal, tidak masalah)
    const urls = target.foto_urls?.length ? target.foto_urls : target.foto_url ? [target.foto_url] : [];
    await hapusBanyakFoto(urls);

    setDaftar((d) => d.filter((x) => x.id !== target.id));
    setGalat("");
    setMenghapus(false);
    setTarget(null);
  }

  async function keluarAkun() {
    setKeluar(true);
    await supabase.auth.signOut(); // _layout.tsx otomatis pindah ke Login
  }

  const Header = (
    <View>
      <Text style={s.eyebrow}>AKUN SAYA</Text>
      <Text style={s.judul}>Profil</Text>

      <View style={s.kartu}>
        <View style={s.avatar}><Text style={s.avatarTeks}>{inisial(nama)}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.nama} numberOfLines={1}>{nama}</Text>
          <Text style={s.email} numberOfLines={1}>{email}</Text>
        </View>
      </View>

      {/* menu */}
      <Pressable style={s.menuBaris} onPress={() => router.push("/favorit" as any)}>
        <Ionicons name="heart-outline" size={20} color={colors.primary} />
        <Text style={s.menuTeks}>Tempat favorit</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>

      {admin && (
        <Pressable style={s.menuBaris} onPress={() => router.push("/laporan" as any)}>
          <Ionicons name="flag-outline" size={20} color={colors.primary} />
          <Text style={s.menuTeks}>Laporan masuk</Text>
          {jumlahLaporan > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeTeks}>{jumlahLaporan > 99 ? "99+" : jumlahLaporan}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Pressable>
      )}

      <Text style={s.seksi}>Rekomendasi saya</Text>
      <Text style={s.hitung}>{daftar.length} tempat dibagikan</Text>
      {galat ? <View style={{ marginTop: 12 }}><Pesan jenis="galat">{galat}</Pesan></View> : null}
    </View>
  );

  const Footer = (
    <View>
      <Pressable style={s.keluarBaris} onPress={() => setModalKeluar(true)}>
        <Ionicons name="log-out-outline" size={22} color={colors.merah} />
        <Text style={s.keluarTeks}>Keluar dari akun</Text>
      </Pressable>
      <Text style={s.catatan}>Daftar ini hanya menampilkan rekomendasi milik akunmu.</Text>
    </View>
  );

  return (
    <View style={s.wrap}>
      <FlatList
        data={daftar}
        keyExtractor={(r) => String(r.id)}
        ListHeaderComponent={Header}
        ListFooterComponent={Footer}
        ListEmptyComponent={
          <View style={s.kosong}>
            <Text style={s.kosongTeks}>Kamu belum membagikan rekomendasi.</Text>
            <Pressable onPress={() => router.push("/(tabs)/tambah")}>
              <Text style={s.kosongLink}>Tambah rekomendasi pertamamu</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 56, paddingBottom: 30 }}
        ItemSeparatorComponent={() => <View style={s.garis} />}
        renderItem={({ item }) => (
          <Pressable style={s.baris} onPress={() => router.push(`/rekomendasi/${item.id}` as any)}>
            <View style={s.foto}>
              {item.foto_url ? (
                <Image source={{ uri: item.foto_url }} style={s.fotoImg} />
              ) : (
                <Ionicons name="restaurant-outline" size={26} color={colors.accent} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.itemNama} numberOfLines={1}>{item.nama_tempat}</Text>
              <Text style={s.itemInfo} numberOfLines={1}>
                {labelKategori(item.kategori)} • {teksHarga(item)}
              </Text>
              <View style={s.aksi}>
                <Pressable
                  style={s.aksiTombol}
                  onPress={() => router.push(`/edit/${item.id}` as any)}
                  hitSlop={10}
                >
                  <Ionicons name="create-outline" size={15} color={colors.primary} />
                  <Text style={s.aksiTeks}>Edit</Text>
                </Pressable>
                <Pressable style={s.aksiTombol} onPress={() => setTarget(item)} hitSlop={10}>
                  <Ionicons name="trash-outline" size={15} color={colors.merah} />
                  <Text style={[s.aksiTeks, { color: colors.merah }]}>Hapus</Text>
                </Pressable>
              </View>
            </View>
          </Pressable>
        )}
      />

      <KonfirmasiModal
        visible={!!target}
        tengah
        ikon={
          <View style={s.ikonBulat}>
            <Text style={s.ikonSeru}>!</Text>
          </View>
        }
        judul="Hapus rekomendasi?"
        isi="Rekomendasi ini akan dihapus dari daftar dan peta. Tindakan ini tidak dapat dibatalkan."
        labelOk="Ya, hapus"
        busy={menghapus}
        onBatal={() => setTarget(null)}
        onOk={hapus}
      />

      <KonfirmasiModal
        visible={modalKeluar}
        ikon={
          <View style={s.ikonKotak}>
            <Ionicons name="log-out-outline" size={24} color={colors.merah} />
          </View>
        }
        judul="Keluar dari akun?"
        isi="Kamu perlu masuk lagi untuk membagikan dan mengelola rekomendasimu. Rekomendasi yang sudah dibagikan tetap tersimpan."
        labelOk="Ya, keluar"
        warnaOk={colors.merah}
        busy={keluar}
        onBatal={() => setModalKeluar(false)}
        onOk={keluarAkun}
      />
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  eyebrow: { fontFamily: font.bold, fontSize: 10, color: colors.primary },
  judul: { fontFamily: font.bold, fontSize: 25, color: colors.primary, marginTop: 4, marginBottom: 28 },
  kartu: {
    flexDirection: "row", alignItems: "center", gap: 14, padding: 17,
    borderWidth: 1, borderColor: colors.border, borderRadius: 16,
  },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#d5ebe2", alignItems: "center", justifyContent: "center" },
  avatarTeks: { fontFamily: font.bold, fontSize: 18, color: colors.primary },
  nama: { fontFamily: font.bold, fontSize: 16, color: colors.primary },
  email: { fontFamily: font.regular, fontSize: 11, color: colors.primary, marginTop: 4 },
  menuBaris: {
    flexDirection: "row", alignItems: "center", gap: 12, height: 52, paddingHorizontal: 16, marginTop: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: 14,
  },
  menuTeks: { flex: 1, fontFamily: font.semibold, fontSize: 13, color: colors.primary },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
    backgroundColor: colors.merah, alignItems: "center", justifyContent: "center",
  },
  badgeTeks: { fontFamily: font.bold, fontSize: 11, color: colors.white },
  seksi: { fontFamily: font.bold, fontSize: 18, color: colors.primary, marginTop: 26 },
  hitung: { fontFamily: font.regular, fontSize: 11, color: colors.primary, marginTop: 2, marginBottom: 14 },
  baris: { flexDirection: "row", gap: 13, paddingVertical: 14 },
  foto: {
    width: 91, height: 84, borderRadius: 14, backgroundColor: colors.peach,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  fotoImg: { width: "100%", height: "100%" },
  itemNama: { fontFamily: font.bold, fontSize: 14, color: colors.primary },
  itemInfo: { fontFamily: font.regular, fontSize: 11, color: colors.primary, marginTop: 8 },
  aksi: { flexDirection: "row", alignSelf: "flex-end", gap: 18, marginTop: 14 },
  aksiTombol: { flexDirection: "row", alignItems: "center", gap: 4 },
  aksiTeks: { fontFamily: font.bold, fontSize: 11, color: colors.primary },
  garis: { height: 1, backgroundColor: colors.border },
  kosong: { alignItems: "center", paddingVertical: 30, gap: 8 },
  kosongTeks: { fontFamily: font.regular, fontSize: 12, color: colors.primary },
  kosongLink: { fontFamily: font.bold, fontSize: 12, color: colors.accent },
  keluarBaris: {
    flexDirection: "row", alignItems: "center", gap: 14, height: 51, paddingHorizontal: 16, marginTop: 28,
    backgroundColor: colors.merahBg, borderWidth: 1, borderColor: colors.merahBorder, borderRadius: 14,
  },
  keluarTeks: { fontFamily: font.semibold, fontSize: 13, color: colors.merah },
  catatan: { fontFamily: font.regular, fontSize: 10, color: colors.primary, marginTop: 20 },
  ikonBulat: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  ikonSeru: { fontFamily: font.bold, fontSize: 28, color: colors.primary },
  ikonKotak: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.merahBg, alignItems: "center", justifyContent: "center" },
});