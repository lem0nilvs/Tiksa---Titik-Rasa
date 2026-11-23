import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { colors, font } from "../../theme";
import {
  ambilKomentar, hapusKomentar, hitungKomentar, kirimKomentar, waktuRelatif,
  type Komentar,
} from "../../lib/komentar";
import KonfirmasiModal from "../../components/KonfirmasiModal";
import LaporModal from "../../components/LaporModal";
import { useAdmin, useDaftarAdmin } from "../../lib/admin";

const HALAMAN = 10;
const MAKS = 300;

function inisial(nama: string) {
  const k = nama.trim().split(/\s+/).slice(0, 2);
  return k.map((x) => x[0]?.toUpperCase() ?? "").join("") || "?";
}

export default function LayarKomentar() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rid = Number(id);
  const daftarRef = useRef<FlatList<Komentar>>(null);

  const [info, setInfo] = useState<{ nama_tempat: string; user_id: string } | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [induk, setInduk] = useState<Komentar[]>([]);
  const [balasan, setBalasan] = useState<Record<number, Komentar[]>>({});
  const [total, setTotal] = useState(0);   // jumlah komentar utama
  const [semua, setSemua] = useState(0);   // utama + balasan
  const [buka, setBuka] = useState<Record<number, boolean>>({});
  const [memuat, setMemuat] = useState(true);
  const [gagalMuat, setGagalMuat] = useState(false);
  const [lagi, setLagi] = useState(false);

  const [teks, setTeks] = useState("");
  const [sentuh, setSentuh] = useState(false);
  const [mengirim, setMengirim] = useState(false);
  const [galat, setGalat] = useState("");
  const [membalas, setMembalas] = useState<Komentar | null>(null);

  const [target, setTarget] = useState<Komentar | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const [laporKomentar, setLaporKomentar] = useState<Komentar | null>(null);

  const admin = useAdmin();
  const daftarAdmin = useDaftarAdmin();

  useEffect(() => {
    (async () => {
      const [{ data: u }, { data: tempat }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("rekomendasi").select("nama_tempat, user_id").eq("id", rid).maybeSingle(),
      ]);
      setUid(u.user?.id ?? null);
      if (tempat) setInfo(tempat as any);
      try {
        const [r, n] = await Promise.all([ambilKomentar(rid, 0, HALAMAN), hitungKomentar(rid)]);
        setInduk(r.induk);
        setBalasan(r.balasan);
        setTotal(r.total);
        setSemua(n);
      } catch {
        setGagalMuat(true);
      }
      setMemuat(false);
    })();
  }, [rid]);

  async function muatLagi() {
    setLagi(true);
    try {
      const r = await ambilKomentar(rid, induk.length, HALAMAN);
      setInduk((d) => [...d, ...r.induk]);
      setBalasan((b) => ({ ...b, ...r.balasan }));
      setTotal(r.total);
    } catch {}
    setLagi(false);
  }

  const pesanKosong = sentuh && !teks.trim() ? "Tulis komentarmu dulu." : "";

  async function kirim() {
    setSentuh(true);
    setGalat("");
    const isi = teks.trim();
    if (!isi) return;
    setMengirim(true);
    try {
      const parentId = membalas ? membalas.id : null;
      const baru = await kirimKomentar(rid, isi, parentId);
      if (parentId) {
        setBalasan((b) => ({ ...b, [parentId]: [...(b[parentId] ?? []), baru] }));
        setBuka((o) => ({ ...o, [parentId]: true }));
      } else {
        setInduk((d) => [baru, ...d]);
        setTotal((t) => t + 1);
        daftarRef.current?.scrollToOffset({ offset: 0, animated: true });
      }
      setSemua((n) => n + 1);
      setTeks("");
      setSentuh(false);
      setMembalas(null);
    } catch (e: any) {
      console.log("ERROR KOMENTAR:", e);
      setGalat(
        /network request failed/i.test(e?.message ?? "")
          ? "Tidak bisa terhubung. Periksa koneksi internetmu."
          : "Gagal mengirim komentar. Coba lagi sebentar."
      );
    }
    setMengirim(false);
  }

  async function hapus() {
    if (!target) return;
    setMenghapus(true);
    try {
      await hapusKomentar(target.id);
      if (target.parent_id) {
        const p = target.parent_id;
        setBalasan((b) => ({ ...b, [p]: (b[p] ?? []).filter((x) => x.id !== target.id) }));
        setSemua((n) => Math.max(0, n - 1));
      } else {
        const jumlahBalasan = (balasan[target.id] ?? []).length;
        setInduk((d) => d.filter((x) => x.id !== target.id));
        setBalasan((b) => {
          const c = { ...b };
          delete c[target.id];
          return c;
        });
        setTotal((t) => Math.max(0, t - 1));
        setSemua((n) => Math.max(0, n - 1 - jumlahBalasan));
        if (membalas?.id === target.id) setMembalas(null);
      }
    } catch (e: any) {
      console.log("ERROR HAPUS KOMENTAR:", e);
      setGalat("Gagal menghapus komentar. Coba lagi sebentar.");
    }
    setMenghapus(false);
    setTarget(null);
  }

  const kembali = () => (router.canGoBack() ? router.back() : router.replace("/(tabs)"));
  const adaBalasanDihapus = target && !target.parent_id && (balasan[target.id] ?? []).length > 0;

  // avatar + nama + isi satu komentar (dipakai utama dan balasan)
  const badan = (k: Komentar, kecil?: boolean) => (
    <View style={s.baris}>
      <View style={[s.avatar, kecil && s.avatarKecil]}>
        <Text style={[s.avatarTeks, kecil && { fontSize: 10 }]}>{inisial(k.nama)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.atas}>
          <View style={s.namaBaris}>
            <Text style={s.nama} numberOfLines={1}>{k.nama}</Text>
            {info && k.user_id === info.user_id && (
              <View style={s.badge}><Text style={s.badgeTeks}>Pembagi</Text></View>
            )}
            {daftarAdmin.has(k.user_id) && (
              <View style={s.badgeAdmin}><Text style={s.badgeAdminTeks}>Admin</Text></View>
            )}
          </View>
          <Text style={s.waktu}>{waktuRelatif(k.created_at)}</Text>
        </View>
        <Text style={s.isi}>{k.isi}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={s.wrap}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={s.header}>
        <Pressable onPress={kembali} hitSlop={12}>
          <Text style={s.back}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={s.headerJudul}>Komentar{semua > 0 ? ` (${semua})` : ""}</Text>
          {info ? <Text style={s.headerSub} numberOfLines={1}>{info.nama_tempat}</Text> : null}
        </View>
      </View>

      {memuat ? (
        <View style={s.tengah}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : gagalMuat ? (
        <View style={s.tengah}>
          <Text style={s.kosongJudul}>Gagal memuat komentar</Text>
          <Text style={s.kosongIsi}>Periksa koneksi internetmu lalu buka lagi layar ini.</Text>
        </View>
      ) : (
        <FlatList
          ref={daftarRef}
          data={induk}
          keyExtractor={(k) => String(k.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View style={s.tengah}>
              <View style={s.kosongLingkar}>
                <Ionicons name="chatbubble-ellipses-outline" size={36} color={colors.primary} />
              </View>
              <Text style={s.kosongJudul}>Belum ada komentar</Text>
              <Text style={s.kosongIsi}>Jadilah yang pertama bertanya atau berbagi pengalaman.</Text>
            </View>
          }
          ListFooterComponent={
            induk.length < total ? (
              <Pressable style={s.lagi} onPress={muatLagi} disabled={lagi}>
                <Text style={s.lagiTeks}>{lagi ? "Memuat..." : "Lihat komentar lainnya"}</Text>
              </Pressable>
            ) : undefined
          }
          renderItem={({ item }) => {
            const anak = balasan[item.id] ?? [];
            const terbuka = !!buka[item.id];
            return (
              <View style={s.item}>
                {badan(item)}

                <View style={s.aksi}>
                  <Pressable
                    onPress={() => { setMembalas(item); setGalat(""); }}
                    hitSlop={8}
                    style={s.aksiTombol}
                  >
                    <Ionicons name="return-down-forward-outline" size={14} color={colors.primary} />
                    <Text style={s.aksiTeks}>Balas</Text>
                  </Pressable>
                  {item.user_id !== uid && (
                    <Pressable onPress={() => setLaporKomentar(item)} hitSlop={8} style={s.aksiTombol}>
                      <Ionicons name="flag-outline" size={14} color={colors.primary} />
                      <Text style={s.aksiTeks}>Lapor</Text>
                    </Pressable>
                  )}
                  {(item.user_id === uid || admin) && (
                    <Pressable onPress={() => setTarget(item)} hitSlop={8} style={s.aksiTombol}>
                      <Ionicons name="trash-outline" size={14} color={colors.merah} />
                      <Text style={[s.aksiTeks, { color: colors.merah }]}>Hapus</Text>
                    </Pressable>
                  )}
                </View>

                {anak.length > 0 && (
                  <Pressable
                    onPress={() => setBuka((o) => ({ ...o, [item.id]: !terbuka }))}
                    hitSlop={8}
                    style={s.toggle}
                  >
                    <View style={s.toggleGaris} />
                    <Text style={s.toggleTeks}>
                      {terbuka ? "Sembunyikan balasan" : `Lihat ${anak.length} balasan`}
                    </Text>
                  </Pressable>
                )}

                {terbuka &&
                  anak.map((r) => (
                    <View key={r.id} style={s.balasan}>
                      {badan(r, true)}
                      {(r.user_id !== uid || r.user_id === uid || admin) && (
                        <View style={s.aksiBalasan}>
                          {r.user_id !== uid && (
                            <Pressable onPress={() => setLaporKomentar(r)} hitSlop={8} style={s.aksiTombol}>
                              <Ionicons name="flag-outline" size={13} color={colors.primary} />
                              <Text style={s.aksiTeks}>Lapor</Text>
                            </Pressable>
                          )}
                          {(r.user_id === uid || admin) && (
                            <Pressable onPress={() => setTarget(r)} hitSlop={8} style={s.aksiTombol}>
                              <Ionicons name="trash-outline" size={13} color={colors.merah} />
                              <Text style={[s.aksiTeks, { color: colors.merah }]}>Hapus</Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
              </View>
            );
          }}
        />
      )}

      {/* kolom tulis menempel di bawah */}
      <View style={s.bar}>
        {membalas && (
          <View style={s.membalas}>
            <Text style={s.membalasTeks} numberOfLines={1}>
              Membalas <Text style={{ fontFamily: font.bold }}>{membalas.nama}</Text>
            </Text>
            <Pressable onPress={() => setMembalas(null)} hitSlop={10}>
              <Ionicons name="close" size={16} color={colors.primary} />
            </Pressable>
          </View>
        )}
        {pesanKosong ? <Text style={s.err}>{pesanKosong}</Text> : null}
        {galat ? <Text style={s.err}>{galat}</Text> : null}
        <View style={s.inputBaris}>
          <TextInput
            style={[s.input, !!pesanKosong && s.inputSalah]}
            value={teks}
            onChangeText={setTeks}
            placeholder={membalas ? "Tulis balasan..." : "Tulis komentar..."}
            placeholderTextColor="#8ea0c8"
            multiline
            maxLength={MAKS}
            autoCapitalize="sentences"
          />
          <Pressable style={[s.kirim, mengirim && { opacity: 0.6 }]} onPress={kirim} disabled={mengirim}>
            <Ionicons name="send" size={18} color={colors.white} />
          </Pressable>
        </View>
        {teks.length > MAKS - 60 && <Text style={s.hitung}>{teks.length}/{MAKS}</Text>}
      </View>

      <LaporModal
        visible={!!laporKomentar}
        onTutup={() => setLaporKomentar(null)}
        komentarId={laporKomentar?.id}
        judul="Laporkan komentar"
      />

      <KonfirmasiModal
        visible={!!target}
        tengah
        ikon={
          <View style={s.ikonBulat}>
            <Text style={s.ikonSeru}>!</Text>
          </View>
        }
        judul={target?.parent_id ? "Hapus balasan?" : "Hapus komentar?"}
        isi={
          adaBalasanDihapus
            ? "Komentar ini beserta semua balasannya akan dihapus dan tidak dapat dikembalikan."
            : "Ini akan dihapus dan tidak dapat dikembalikan."
        }
        labelOk="Ya, hapus"
        busy={menghapus}
        onBatal={() => setTarget(null)}
        onOk={hapus}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 24,
    paddingTop: 50, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  back: { fontFamily: font.regular, fontSize: 34, color: colors.primary, lineHeight: 38 },
  headerJudul: { fontFamily: font.bold, fontSize: 16, color: colors.primary },
  headerSub: { fontFamily: font.regular, fontSize: 11, color: colors.primary, marginTop: 2 },
  tengah: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  kosongLingkar: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: colors.mint,
    alignItems: "center", justifyContent: "center",
  },
  kosongJudul: { fontFamily: font.bold, fontSize: 15, color: colors.primary, marginTop: 18 },
  kosongIsi: { fontFamily: font.regular, fontSize: 12, color: colors.primary, marginTop: 6, textAlign: "center", lineHeight: 18 },
  item: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  baris: { flexDirection: "row", gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#d5ebe2", alignItems: "center", justifyContent: "center" },
  avatarKecil: { width: 28, height: 28, borderRadius: 14 },
  avatarTeks: { fontFamily: font.bold, fontSize: 12, color: colors.primary },
  atas: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  namaBaris: { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  nama: { flexShrink: 1, fontFamily: font.bold, fontSize: 12, color: colors.primary },
  badge: { paddingHorizontal: 8, height: 18, borderRadius: 9, backgroundColor: colors.peach, justifyContent: "center" },
  badgeTeks: { fontFamily: font.bold, fontSize: 9, color: colors.accent },
  badgeAdmin: { paddingHorizontal: 8, height: 18, borderRadius: 9, backgroundColor: colors.primary, justifyContent: "center" },
  badgeAdminTeks: { fontFamily: font.bold, fontSize: 9, color: colors.white },
  waktu: { fontFamily: font.regular, fontSize: 10, color: colors.primary, opacity: 0.7 },
  isi: { fontFamily: font.regular, fontSize: 13, lineHeight: 19, color: colors.primary, marginTop: 4 },
  aksi: { flexDirection: "row", gap: 18, marginTop: 8, marginLeft: 48 },
  aksiBalasan: { flexDirection: "row", gap: 18, marginTop: 6, marginLeft: 40 },
  aksiTombol: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
  aksiTeks: { fontFamily: font.semibold, fontSize: 11, color: colors.primary },
  toggle: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10, marginLeft: 48 },
  toggleGaris: { width: 22, height: 1, backgroundColor: colors.border },
  toggleTeks: { fontFamily: font.semibold, fontSize: 11, color: colors.accent },
  balasan: { marginTop: 12, marginLeft: 48 },
  lagi: { alignSelf: "center", marginTop: 14, paddingVertical: 8, paddingHorizontal: 16 },
  lagiTeks: { fontFamily: font.bold, fontSize: 12, color: colors.accent },
  bar: {
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 16, backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  membalas: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 12, height: 30, borderRadius: 10, backgroundColor: colors.mint, marginBottom: 8,
  },
  membalasTeks: { flex: 1, fontFamily: font.regular, fontSize: 11, color: colors.primary, paddingRight: 8 },
  err: { fontFamily: font.regular, fontSize: 11, color: colors.danger, marginBottom: 6, marginLeft: 4 },
  inputBaris: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  input: {
    flex: 1, minHeight: 44, maxHeight: 110, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: 22,
    fontFamily: font.regular, fontSize: 13, color: colors.primary, textAlignVertical: "center",
  },
  inputSalah: { borderColor: colors.danger },
  kirim: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  hitung: { fontFamily: font.regular, fontSize: 10, color: colors.primary, textAlign: "right", marginTop: 6 },
  ikonBulat: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.mint, alignItems: "center", justifyContent: "center" },
  ikonSeru: { fontFamily: font.bold, fontSize: 28, color: colors.primary },
});