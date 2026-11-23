import { useState } from "react";
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius } from "../theme";
import Field from "../components/Field";
import Pesan from "../components/Pesan";
import { useLokasi, type Daerah } from "../lib/LokasiContext";
import { cariDaerah } from "../lib/cariDaerah";

export default function LokasiManual() {
  const router = useRouter();
  const { status, setDaerah, minta } = useLokasi();
  const [kata, setKata] = useState("");
  const [t, setT] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hasil, setHasil] = useState<Daerah[] | null>(null);
  const [galat, setGalat] = useState("");

  const errKata = t
    ? !kata.trim() ? "Nama daerah wajib diisi"
      : kata.trim().length < 3 ? "Minimal 3 huruf"
      : hasil && hasil.length === 0 ? "Daerah tidak ditemukan. Coba nama lain."
      : ""
    : "";

  async function cari() {
    setT(true);
    setGalat("");
    if (kata.trim().length < 3) return;
    setBusy(true);
    try {
      setHasil(await cariDaerah(kata));
    } catch {
      setHasil(null);
      setGalat("Gagal mencari. Periksa koneksi internetmu lalu coba lagi.");
    }
    setBusy(false);
  }

  function pilih(d: Daerah) {
    setDaerah(d);
    router.replace("/(tabs)");
  }

  async function pakaiGps() {
    setGalat("");
    const ok = await minta();
    if (ok) router.replace("/(tabs)");
    else setGalat("Lokasi GPS belum diizinkan. Izinkan di pengaturan HP, atau cari daerah secara manual.");
  }

  const kembali = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
        <Pressable onPress={kembali} hitSlop={12}>
          <Text style={s.back}>‹</Text>
        </Pressable>
        <Text style={s.eyebrow}>ATUR LOKASI</Text>
        <Text style={s.heading}>{status === "ditolak" ? "Lokasi belum diizinkan" : "Pilih daerah"}</Text>
        <Text style={s.desc}>
          Kamu tetap bisa mencari rekomendasi dengan memilih daerah secara manual.
        </Text>

        <View style={s.ilustrasi}>
          <View style={s.lingkar}>
            <Ionicons name="locate-outline" size={42} color={colors.primary} />
          </View>
        </View>

        <Text style={s.judul}>Cari daerah</Text>
        <Text style={s.isi}>Masukkan nama kota atau daerah, lalu tekan Cari.</Text>

        <Field label="Nama daerah" placeholder="Contoh: Pekalongan" autoCapitalize="words"
          returnKeyType="search" onSubmitEditing={cari}
          value={kata} onChangeText={(v) => { setKata(v); setHasil(null); setGalat(""); setT(true); }}
          error={errKata} />

        {galat ? <Pesan jenis="galat">{galat}</Pesan> : null}

        <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={cari} disabled={busy}>
          <Text style={s.btnTeks}>{busy ? "Mencari..." : "Cari daerah"}</Text>
        </Pressable>

        {hasil && hasil.length > 0 && (
          <View style={{ marginTop: 20 }}>
            <Text style={s.label}>Pilih salah satu hasil</Text>
            {hasil.map((d, i) => (
              <Pressable key={i} style={s.hasilBaris} onPress={() => pilih(d)}>
                <Ionicons name="location-outline" size={18} color={colors.accent} />
                <Text style={s.hasilTeks}>{d.nama}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable style={s.gps} onPress={pakaiGps}>
          <Ionicons name="navigate-outline" size={16} color={colors.primary} />
          <Text style={s.gpsTeks}>Pakai lokasi GPS saya</Text>
        </Pressable>

        <Text style={s.atribusi}>Pencarian lokasi menggunakan data © OpenStreetMap contributors.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
  back: { fontFamily: font.regular, fontSize: 34, color: colors.primary, lineHeight: 38 },
  eyebrow: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1, color: colors.primary, marginTop: 8 },
  heading: { fontFamily: font.bold, fontSize: 26, color: colors.primary, marginTop: 4 },
  desc: { fontFamily: font.regular, fontSize: 13, lineHeight: 19.5, color: colors.primary, marginTop: 6 },
  ilustrasi: { alignItems: "center", marginVertical: 26 },
  lingkar: {
    width: 150, height: 120, borderRadius: 24, backgroundColor: colors.mint,
    alignItems: "center", justifyContent: "center",
  },
  judul: { fontFamily: font.bold, fontSize: 18, color: colors.primary },
  isi: { fontFamily: font.regular, fontSize: 13, color: colors.primary, marginTop: 4, marginBottom: 20 },
  btn: { height: 50, borderRadius: radius.button, backgroundColor: colors.primary, justifyContent: "center", marginTop: 4 },
  btnTeks: { fontFamily: font.bold, fontSize: 14, color: colors.white, textAlign: "center" },
  label: { fontFamily: font.semibold, fontSize: 12, color: colors.primary, marginBottom: 6 },
  hasilBaris: {
    flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  hasilTeks: { flex: 1, fontFamily: font.medium, fontSize: 13, color: colors.primary },
  gps: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46,
    borderRadius: radius.button, backgroundColor: colors.mint, marginTop: 20,
  },
  gpsTeks: { fontFamily: font.semibold, fontSize: 13, color: colors.primary },
  atribusi: { fontFamily: font.regular, fontSize: 10, color: colors.primary, marginTop: 20 },
});