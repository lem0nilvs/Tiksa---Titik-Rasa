import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator, Image, Pressable, StyleSheet, Text, View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MapView from "react-native-maps";
import { colors, font, radius } from "../../theme";
import { useLokasi } from "../../lib/useLokasi";
import PinKuliner from "../../components/PinKuliner";
import {
  ambilTerdekat, formatJarak, labelKategori,type Rekomendasi,
} from "../../lib/rekomendasi";

export default function Peta() {
  const router = useRouter();
  const { status, posisi, minta, daerah } = useLokasi();
  const petaRef = useRef<MapView>(null);
  const [data, setData] = useState<Rekomendasi[]>([]);
  const [pilih, setPilih] = useState<Rekomendasi | null>(null);
  const [memuat, setMemuat] = useState(false);

  const asalJarak = daerah ? "titik pencarian" : "lokasimu";

  const muat = useCallback(async () => {
    if (!posisi) return;
    setMemuat(true);
    try {
      setData(await ambilTerdekat(posisi, 5));
    } catch {
      setData([]);
    }
    setMemuat(false);
  }, [posisi]);

  // muat ulang tiap tab Peta dibuka, supaya rekomendasi baru langsung muncul
  useFocusEffect(
    useCallback(() => {
      setPilih(null);
      muat();
    }, [muat])
  );

  function keLokasiku() {
    if (!posisi) return;
    petaRef.current?.animateToRegion(
      { latitude: posisi.lat, longitude: posisi.lng, latitudeDelta: 0.06, longitudeDelta: 0.06 },
      400
    );
  }

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <Text style={s.eyebrow}>JELAJAH SEKITAR</Text>
        <Text style={s.judul}>Peta rekomendasi</Text>
        <Text style={s.sub}>
          {daerah ? `Titik kuliner di sekitar ${daerah.nama}` : "Titik kuliner dalam radius 5 km"}
        </Text>
      </View>

      {status === "memuat" && !posisi && (
        <View style={s.tengah}><ActivityIndicator size="large" color={colors.primary} /></View>
      )}

      {status === "ditolak" && !posisi && (
        <View style={s.tengah}>
          <Text style={s.pesanJudul}>Lokasi belum diizinkan</Text>
          <Text style={s.pesanIsi}>Izinkan akses lokasi agar peta menampilkan rekomendasi di sekitarmu.</Text>
          <Pressable style={s.tombol} onPress={minta}>
            <Text style={s.tombolTeks}>Izinkan lokasi</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/lokasi-manual" as any)}>
            <Text style={{ fontFamily: font.semibold, fontSize: 12, color: colors.accent, marginTop: 16 }}>
              Atau cari daerah secara manual
            </Text>
          </Pressable>
        </View>
      )}

      {posisi && (
        <View style={{ flex: 1 }}>
          <MapView
            ref={petaRef}
            style={StyleSheet.absoluteFill}
            initialRegion={{
              latitude: posisi.lat,
              longitude: posisi.lng,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            toolbarEnabled={false}
            onPress={() => setPilih(null)}
          >
            {data.map((r) => (
              <PinKuliner
                key={r.id}
                lat={r.lat}
                lng={r.lng}
                nama={r.nama_tempat}
                kategori={r.kategori}
                aktif={pilih?.id === r.id}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  setPilih(r);
                }}
              />
            ))}
          </MapView>

          <Pressable style={s.lokasiku} onPress={keLokasiku}>
            <Ionicons name="locate" size={22} color={colors.primary} />
          </Pressable>

          {!memuat && data.length === 0 && (
            <View style={s.kosong}>
              <Text style={s.kosongTeks}>Belum ada rekomendasi di sekitarmu</Text>
            </View>
          )}

          {/* legenda warna pin */}
          <View style={[s.legenda, { bottom: pilih ? 150 : 16 }]}>
            <View style={s.legendaItem}>
              <View style={[s.titik, { backgroundColor: colors.accent }]}>
                <Ionicons name="restaurant" size={9} color={colors.white} />
              </View>
              <Text style={s.legendaTeks}>Makanan</Text>
            </View>
            <View style={s.legendaItem}>
              <View style={[s.titik, { backgroundColor: colors.primary }]}>
                <Ionicons name="cafe" size={9} color={colors.white} />
              </View>
              <Text style={s.legendaTeks}>Minuman</Text>
            </View>
            <View style={s.legendaItem}>
              <View style={[s.titik, { backgroundColor: colors.success }]}>
                <Ionicons name="fast-food" size={9} color={colors.white} />
              </View>
              <Text style={s.legendaTeks}>Keduanya</Text>
            </View>
          </View>

          {pilih && (
            <Pressable style={s.kartu} onPress={() => router.push(`/rekomendasi/${pilih.id}` as any)}>
              <View style={s.foto}>
                {pilih.foto_url ? (
                  <Image source={{ uri: pilih.foto_url }} style={s.fotoImg} resizeMode="cover" />
                ) : (
                  <Ionicons name="restaurant-outline" size={28} color={colors.accent} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.nama} numberOfLines={1}>{pilih.nama_tempat}</Text>
                <Text style={s.tipe} numberOfLines={1}>{labelKategori(pilih.kategori)} • {pilih.menu}</Text>
                <Text style={s.jarak}>{formatJarak(pilih.jarakM ?? 0)} dari {asalJarak}</Text>
                <Text style={s.aksi}>Lihat detail  ›</Text>
              </View>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 14 },
  eyebrow: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1, color: colors.primary },
  judul: { fontFamily: font.bold, fontSize: 26, color: colors.primary, marginTop: 4 },
  sub: { fontFamily: font.regular, fontSize: 12, color: colors.primary, marginTop: 2 },
  tengah: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  pesanJudul: { fontFamily: font.bold, fontSize: 16, color: colors.primary },
  pesanIsi: { fontFamily: font.regular, fontSize: 12, color: colors.primary, textAlign: "center", marginTop: 8, lineHeight: 18 },
  tombol: { height: 48, alignSelf: "stretch", borderRadius: radius.button, backgroundColor: colors.primary, justifyContent: "center", marginTop: 22 },
  tombolTeks: { fontFamily: font.bold, fontSize: 14, color: colors.white, textAlign: "center" },
  lokasiku: {
    position: "absolute", top: 16, right: 18, width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.white, alignItems: "center", justifyContent: "center",
    elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  kosong: {
    position: "absolute", top: 16, left: 18, right: 84, paddingVertical: 12, paddingHorizontal: 14,
    backgroundColor: colors.white, borderRadius: 12, elevation: 4,
  },
  kosongTeks: { fontFamily: font.semibold, fontSize: 12, color: colors.primary },
  legenda: {
    position: "absolute", left: 16, flexDirection: "row", gap: 14,
    paddingVertical: 7, paddingHorizontal: 12, backgroundColor: colors.white,
    borderRadius: 16, elevation: 4,
    shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  legendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  titik: { width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  legendaTeks: { fontFamily: font.semibold, fontSize: 11, color: colors.primary },
  kartu: {
    position: "absolute", left: 16, right: 16, bottom: 16, flexDirection: "row", gap: 13, padding: 13,
    backgroundColor: colors.white, borderRadius: 16, elevation: 6,
    shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 3 },
  },
  foto: {
    width: 91, height: 99, borderRadius: 12, backgroundColor: colors.peach,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  fotoImg: { width: "100%", height: "100%" },
  nama: { fontFamily: font.bold, fontSize: 14, color: colors.primary },
  tipe: { fontFamily: font.regular, fontSize: 11, color: colors.accent, marginTop: 6 },
  jarak: { fontFamily: font.regular, fontSize: 11, color: colors.primary, marginTop: 8 },
  aksi: { fontFamily: font.bold, fontSize: 11, color: colors.accent, marginTop: 10 },
});