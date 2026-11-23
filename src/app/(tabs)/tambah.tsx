import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import MapView, { Marker } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { unggahFoto, hapusBanyakFoto } from "../../lib/foto";
import { colors, font, radius } from "../../theme";
import Field from "../../components/Field";
import Pesan from "../../components/Pesan";
import LayarForm from "../../components/LayarForm";
import PilihFoto, { type ItemFoto } from "../../components/PilihFoto";
import FormMenu, { BARIS_AWAL, cekMenu, ringkasMenu, type BarisMenu } from "../../components/FormMenu";
import { useLokasi } from "../../lib/useLokasi";
import type { Koordinat } from "../../lib/rekomendasi";
import { pesanRamah } from "../../lib/pesanError";

const KATEGORI = ["Makanan", "Minuman", "Keduanya"] as const;

export default function Tambah() {
  const router = useRouter();
  const { status, posisi, minta } = useLokasi();
  const petaRef = useRef<MapView>(null);

  const [titik, setTitik] = useState<Koordinat | null>(null);
  const [fotos, setFotos] = useState<ItemFoto[]>([]);
  const [nama, setNama] = useState("");
  const [barisMenu, setBarisMenu] = useState<BarisMenu[]>(BARIS_AWAL);
  const [paksaMenu, setPaksaMenu] = useState(false);
  const [kategori, setKategori] = useState<(typeof KATEGORI)[number]>("Makanan");
  const [ulasan, setUlasan] = useState("");
  const [t, setT] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [galat, setGalat] = useState("");

  // titik awal pin = lokasimu, begitu posisi didapat
  useEffect(() => {
    if (posisi && !titik) setTitik(posisi);
  }, [posisi]);

  const sentuh = (k: string) => setT((p) => ({ ...p, [k]: true }));
  const err = {
    nama: t.nama && !nama.trim() ? "Nama tempat wajib diisi" : "",
  };

  function pakaiLokasiku() {
    if (!posisi) return;
    setTitik(posisi);
    petaRef.current?.animateToRegion(
      { latitude: posisi.lat, longitude: posisi.lng, latitudeDelta: 0.004, longitudeDelta: 0.004 },
      300
    );
  }

  async function simpan() {
    setT({ nama: true });
    setPaksaMenu(true);
    setGalat("");

    const cm = cekMenu(barisMenu);
    if (!nama.trim() || !cm.ok) return;

    const lokasi = titik ?? posisi;
    if (!lokasi) {
      return setGalat("Lokasi belum didapat. Aktifkan lokasi dulu agar tempatnya bisa ditandai.");
    }

    setBusy(true);
    const diunggah: string[] = [];
    let tersimpan = false;
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Belum masuk");

      // unggah semua foto satu per satu
      for (const f of fotos) {
        if (!f.b64) continue;
        diunggah.push(await unggahFoto(f.b64, userId));
      }

      // ubah koordinat jadi alamat singkat (kalau gagal, pakai teks cadangan)
      let alamat = "";
      try {
        const [a] = await Location.reverseGeocodeAsync({
          latitude: lokasi.lat,
          longitude: lokasi.lng,
        });
        if (a) alamat = [a.street, a.district, a.city].filter(Boolean).join(", ");
      } catch {}

      const { menu, harga } = ringkasMenu(cm.terisi);

      const { error } = await supabase.from("rekomendasi").insert({
        nama_tempat: nama.trim(),
        menu,                       // nama-nama menu digabung koma
        harga,                      // harga termurah
        daftar_menu: cm.terisi,     // daftar lengkap: [{nama, harga}]
        kategori,
        ulasan: ulasan.trim() || null,
        nama_pembagi: (u.user?.user_metadata?.nama as string) ?? "Pengguna",
        foto_url: diunggah[0] ?? null,
        foto_urls: diunggah,
        lat: lokasi.lat,
        lng: lokasi.lng,
        alamat: alamat || "Alamat belum diketahui",
      });
      if (error) {
        console.log("ERROR INSERT:", error);
        throw new Error("Simpan gagal: " + error.message);
      }
      tersimpan = true;

      setFotos([]);
      setNama(""); setBarisMenu(BARIS_AWAL); setPaksaMenu(false); setUlasan("");
      setKategori("Makanan"); setT({});
      Alert.alert("Tersimpan", "Rekomendasimu sudah ditambahkan.");
      router.replace("/(tabs)");
    } catch (e: any) {
      console.log("ERROR SIMPAN:", e);
      if (!tersimpan) await hapusBanyakFoto(diunggah); // jangan tinggalkan foto yatim
      setGalat(pesanRamah(e, "menyimpan"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <LayarForm isiStyle={s.wrap}>
      <Text style={s.eyebrow}>BAGIKAN REKOMENDASI</Text>
      <Text style={s.judul}>Tambah tempat</Text>
      <Text style={s.sub}>Bantu orang lain menemukan kuliner enak, yuk!</Text>

      <PilihFoto value={fotos} onChange={setFotos} onGalat={setGalat} />

      <Field label="Nama tempat *" placeholder="Contoh: Soto Bu Rini" autoCapitalize="words" maxLength={80}
        value={nama} onChangeText={(v) => { setNama(v); sentuh("nama"); }} onBlur={() => sentuh("nama")} error={err.nama} />

      <Text style={s.label}>Kategori</Text>
      <View style={s.chips}>
        {KATEGORI.map((k) => (
          <Pressable key={k} onPress={() => setKategori(k)} style={[s.chip, kategori === k && s.chipAktif]}>
            <Text style={[s.chipTeks, kategori === k && { color: colors.white }]}>{k}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.kategoriHint}>
        Pilih "Keduanya" jika tempat ini menjual makanan dan minuman yang sama-sama enak.
      </Text>

      <FormMenu value={barisMenu} onChange={setBarisMenu} paksa={paksaMenu} />

      <Field label="Ulasan singkat" placeholder="Ceritakan kenapa tempat ini enak..." multiline maxLength={500}
        autoCapitalize="sentences" value={ulasan} onChangeText={setUlasan} />

      <Text style={s.label}>Lokasi tempat</Text>
      <Text style={s.petaHint}>Ketuk peta atau geser pin ke lokasi tempat makannya.</Text>

      {titik ? (
        <View style={s.peta}>
          <MapView
            ref={petaRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: titik.lat, longitude: titik.lng,
              latitudeDelta: 0.004, longitudeDelta: 0.004,
            }}
            toolbarEnabled={false}
            onPress={(e) =>
              setTitik({
                lat: e.nativeEvent.coordinate.latitude,
                lng: e.nativeEvent.coordinate.longitude,
              })
            }
          >
            <Marker
              draggable
              coordinate={{ latitude: titik.lat, longitude: titik.lng }}
              pinColor={colors.accent}
              onDragEnd={(e) =>
                setTitik({
                  lat: e.nativeEvent.coordinate.latitude,
                  lng: e.nativeEvent.coordinate.longitude,
                })
              }
            />
          </MapView>
        </View>
      ) : (
        <View style={s.lokasi}>
          <Ionicons name="locate-outline" size={18} color={colors.primary} />
          <Text style={s.lokasiTeks}>
            {status === "memuat" ? "Mencari lokasimu..." : "Lokasi belum diizinkan"}
          </Text>
          {status === "ditolak" && (
            <Pressable onPress={minta} hitSlop={8}><Text style={s.ubah}>Aktifkan</Text></Pressable>
          )}
        </View>
      )}

      {titik && (
        <Pressable style={s.pakaiLokasi} onPress={pakaiLokasiku}>
          <Ionicons name="locate-outline" size={16} color={colors.primary} />
          <Text style={s.pakaiLokasiTeks}>Pakai lokasi saya</Text>
        </Pressable>
      )}

      {galat ? <Pesan jenis="galat">{galat}</Pesan> : null}

      <Pressable style={[s.simpan, busy && { opacity: 0.6 }]} onPress={simpan} disabled={busy}>
        <Text style={s.simpanTeks}>{busy ? "Menyimpan..." : "Simpan rekomendasi"}</Text>
      </Pressable>
    </LayarForm>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  eyebrow: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1, color: colors.primary },
  judul: { fontFamily: font.bold, fontSize: 26, color: colors.primary, marginTop: 4 },
  sub: { fontFamily: font.regular, fontSize: 12, color: colors.primary, marginTop: 4, marginBottom: 22 },
  label: { fontFamily: font.semibold, fontSize: 12, color: colors.primary, marginBottom: 6 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 8 },
  chip: {
    height: 30, minWidth: 90, paddingHorizontal: 14, borderRadius: radius.chip,
    borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center",
  },
  chipAktif: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipTeks: { fontFamily: font.semibold, fontSize: 11, color: colors.primary },
  kategoriHint: { fontFamily: font.regular, fontSize: 10, lineHeight: 15, color: colors.primary, marginBottom: 16 },
  petaHint: { fontFamily: font.regular, fontSize: 11, color: colors.primary, marginBottom: 8, marginTop: -2 },
  peta: { height: 190, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.mint, marginBottom: 10 },
  pakaiLokasi: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, height: 34,
    paddingHorizontal: 14, borderRadius: 17, backgroundColor: colors.mint, marginBottom: 16,
  },
  pakaiLokasiTeks: { fontFamily: font.semibold, fontSize: 12, color: colors.primary },
  lokasi: {
    flexDirection: "row", alignItems: "center", gap: 10, minHeight: 50, paddingHorizontal: 14,
    backgroundColor: colors.mint, borderRadius: radius.card, marginBottom: 14,
  },
  lokasiTeks: { flex: 1, fontFamily: font.semibold, fontSize: 12, color: colors.primary },
  ubah: { fontFamily: font.bold, fontSize: 11, color: colors.accent },
  simpan: { height: 46, borderRadius: radius.button, backgroundColor: colors.primary, justifyContent: "center", marginTop: 4 },
  simpanTeks: { fontFamily: font.bold, fontSize: 14, color: colors.white, textAlign: "center" },
});