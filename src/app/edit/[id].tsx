import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { daftarMenu, type Koordinat } from "../../lib/rekomendasi";
import { pesanRamah } from "../../lib/pesanError";

const KATEGORI = ["Makanan", "Minuman", "Keduanya"] as const;

export default function EditRekomendasi() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const petaRef = useRef<MapView>(null);

  const [memuat, setMemuat] = useState(true);
  const [titik, setTitik] = useState<Koordinat | null>(null);
  const [titikAsal, setTitikAsal] = useState<Koordinat | null>(null);
  const [alamatAsal, setAlamatAsal] = useState("");
  const [fotoAsal, setFotoAsal] = useState<string[]>([]);
  const [fotos, setFotos] = useState<ItemFoto[]>([]);
  const [nama, setNama] = useState("");
  const [barisMenu, setBarisMenu] = useState<BarisMenu[]>(BARIS_AWAL);
  const [paksaMenu, setPaksaMenu] = useState(false);
  const [kategori, setKategori] = useState<(typeof KATEGORI)[number]>("Makanan");
  const [ulasan, setUlasan] = useState("");
  const [t, setT] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [galat, setGalat] = useState("");

  // muat data lama ke form
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("rekomendasi").select("*").eq("id", id).single();
      if (error || !data) {
        setGalat("Rekomendasi tidak ditemukan.");
        setMemuat(false);
        return;
      }
      const { data: u } = await supabase.auth.getUser();
      if (data.user_id !== u.user?.id) {
        setGalat("Kamu hanya bisa mengubah rekomendasi milikmu sendiri.");
        setMemuat(false);
        return;
      }
      const daftarFoto: string[] = data.foto_urls?.length ? data.foto_urls : data.foto_url ? [data.foto_url] : [];
      setFotoAsal(daftarFoto);
      setFotos(daftarFoto.map((uri) => ({ uri, lama: true })));

      setNama(data.nama_tempat ?? "");
      setBarisMenu(
        daftarMenu(data).map((m) => ({ nama: m.nama, harga: m.harga != null ? String(m.harga) : "" }))
      );
      setKategori(data.kategori === "Minuman" ? "Minuman" : data.kategori === "Keduanya" ? "Keduanya" : "Makanan");
      setUlasan(data.ulasan ?? "");
      setTitik({ lat: data.lat, lng: data.lng });
      setTitikAsal({ lat: data.lat, lng: data.lng });
      setAlamatAsal(data.alamat ?? "");
      setMemuat(false);
    })();
  }, [id]);

  const sentuh = (k: string) => setT((p) => ({ ...p, [k]: true }));
  const err = {
    nama: t.nama && !nama.trim() ? "Nama tempat wajib diisi" : "",
  };

  async function simpan() {
    setT({ nama: true });
    setPaksaMenu(true);
    setGalat("");

    const cm = cekMenu(barisMenu);
    if (!nama.trim() || !cm.ok) return;
    if (!titik) return setGalat("Lokasi belum ada. Ketuk peta untuk menandai tempatnya.");

    setBusy(true);
    const baru: string[] = [];
    let tersimpan = false;
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      if (!userId) throw new Error("Belum masuk");

      // susun daftar foto akhir (urutan sesuai di layar)
      const urls: string[] = [];
      for (const f of fotos) {
        if (f.lama) urls.push(f.uri);
        else if (f.b64) {
          const url = await unggahFoto(f.b64, userId);
          baru.push(url);
          urls.push(url);
        }
      }

      // alamat: hanya dicari ulang kalau pin dipindah
      let alamat = alamatAsal;
      const pindah = !titikAsal || titik.lat !== titikAsal.lat || titik.lng !== titikAsal.lng;
      if (pindah) {
        alamat = "";
        try {
          const [a] = await Location.reverseGeocodeAsync({ latitude: titik.lat, longitude: titik.lng });
          if (a) alamat = [a.street, a.district, a.city].filter(Boolean).join(", ");
        } catch {}
        alamat = alamat || "Alamat belum diketahui";
      }

      const { menu, harga } = ringkasMenu(cm.terisi);

      const { data: hasil, error } = await supabase
        .from("rekomendasi")
        .update({
          nama_tempat: nama.trim(),
          menu,
          harga,
          daftar_menu: cm.terisi,
          kategori,
          ulasan: ulasan.trim() || null,
          foto_url: urls[0] ?? null,
          foto_urls: urls,
          lat: titik.lat,
          lng: titik.lng,
          alamat,
        })
        .eq("id", id)
        .select("id");

      if (error) throw new Error("Simpan gagal: " + error.message);
      if (!hasil || hasil.length === 0) throw new Error("Tidak bisa mengubah. Ini bukan rekomendasimu.");
      tersimpan = true;

      // bersihkan foto lama yang dibuang pengguna
      await hapusBanyakFoto(fotoAsal.filter((u) => !urls.includes(u)));

      Alert.alert("Tersimpan", "Perubahan sudah disimpan.");
      router.back();
    } catch (e: any) {
      console.log("ERROR EDIT:", e);
      if (!tersimpan) await hapusBanyakFoto(baru); // batalkan foto baru yang sudah terlanjur terunggah
      setGalat(pesanRamah(e, "menyimpan"));
    } finally {
      setBusy(false);
    }
  }

  if (memuat) {
    return (
      <View style={[s.wadah, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // gagal memuat / bukan pemilik
  if (!titik) {
    return (
      <View style={[s.wadah, { justifyContent: "center", padding: 32 }]}>
        <Pesan jenis="galat">{galat || "Data tidak tersedia."}</Pesan>
        <Pressable style={s.simpan} onPress={() => router.back()}>
          <Text style={s.simpanTeks}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <LayarForm isiStyle={s.wrap}>
      <Pressable onPress={() => router.back()} style={s.kembali} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
        <Text style={s.kembaliTeks}>Kembali</Text>
      </Pressable>

      <Text style={s.eyebrow}>UBAH REKOMENDASI</Text>
      <Text style={s.judul}>Edit tempat</Text>
      <Text style={s.sub}>Perbaiki data rekomendasimu di sini.</Text>

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
      <Text style={s.petaHint}>Ketuk peta atau geser pin kalau lokasinya perlu dikoreksi.</Text>
      <View style={s.peta}>
        <MapView
          ref={petaRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{ latitude: titik.lat, longitude: titik.lng, latitudeDelta: 0.004, longitudeDelta: 0.004 }}
          toolbarEnabled={false}
          onPress={(e) =>
            setTitik({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })
          }
        >
          <Marker
            draggable
            coordinate={{ latitude: titik.lat, longitude: titik.lng }}
            pinColor={colors.accent}
            onDragEnd={(e) =>
              setTitik({ lat: e.nativeEvent.coordinate.latitude, lng: e.nativeEvent.coordinate.longitude })
            }
          />
        </MapView>
      </View>

      {galat ? <Pesan jenis="galat">{galat}</Pesan> : null}

      <Pressable style={[s.simpan, busy && { opacity: 0.6 }]} onPress={simpan} disabled={busy}>
        <Text style={s.simpanTeks}>{busy ? "Menyimpan..." : "Simpan perubahan"}</Text>
      </Pressable>
    </LayarForm>
  );
}

const s = StyleSheet.create({
  wadah: { flex: 1, backgroundColor: colors.bg },
  wrap: { paddingHorizontal: 24, paddingTop: 52, paddingBottom: 40 },
  kembali: { flexDirection: "row", alignItems: "center", marginBottom: 14, marginLeft: -4 },
  kembaliTeks: { fontFamily: font.semibold, fontSize: 13, color: colors.primary },
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
  peta: { height: 190, borderRadius: radius.card, overflow: "hidden", backgroundColor: colors.mint, marginBottom: 16 },
  simpan: { height: 46, borderRadius: radius.button, backgroundColor: colors.primary, justifyContent: "center", marginTop: 4 },
  simpanTeks: { fontFamily: font.bold, fontSize: 14, color: colors.white, textAlign: "center" },
});