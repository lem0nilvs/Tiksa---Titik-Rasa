import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { colors, font, radius } from "../../theme";
import Field from "../../components/Field";
import Pesan from "../../components/Pesan";
import LayarForm from "../../components/LayarForm";
import { aturanSandi, cekEmail, cekSandi, cekUlang } from "../../lib/validasi";

type Langkah = 1 | 2 | 3;

const JUDUL: Record<Langkah, string> = {
  1: "Atur ulang sandi",
  2: "Masukkan kode",
  3: "Buat sandi baru",
};

export default function LupaSandi() {
  const router = useRouter();
  const [langkah, setLangkah] = useState<Langkah>(1);
  const [email, setEmail] = useState("");
  const [kode, setKode] = useState("");
  const [baru, setBaru] = useState("");
  const [ulang, setUlang] = useState("");
  const [t, setT] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [galat, setGalat] = useState("");
  const [kodeSalah, setKodeSalah] = useState(false);
  const [info, setInfo] = useState("");
  const [jeda, setJeda] = useState(0); // hitung mundur kirim ulang kode

  useEffect(() => {
    if (jeda <= 0) return;
    const id = setTimeout(() => setJeda((j) => j - 1), 1000);
    return () => clearTimeout(id);
  }, [jeda]);

  const sentuh = (k: string) => setT((p) => ({ ...p, [k]: true }));
  const err = {
    email: t.email ? cekEmail(email) : "",
    kode: t.kode ? (!kode.trim() ? "Kode wajib diisi" : !/^\d+$/.test(kode.trim()) ? "Kode hanya berisi angka" : "") : "",
    baru: t.baru ? cekSandi(baru) : "",
    ulang: t.ulang ? cekUlang(baru, ulang) : "",
  };

  async function kirimKode() {
    sentuh("email");
    setGalat(""); setInfo("");
    if (cekEmail(email)) return;

    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    setBusy(false);

    if (error) {
      return setGalat(
        /network|fetch/i.test(error.message)
          ? "Tidak bisa terhubung. Periksa koneksi internetmu."
          : "Gagal mengirim kode. Tunggu sebentar lalu coba lagi."
      );
    }
    setLangkah(2);
    setJeda(60);
    setInfo("Jika emailnya terdaftar, kode sudah dikirim. Cek juga folder spam.");
  }

  async function verifikasiKode() {
    sentuh("kode");
    setGalat(""); setInfo(""); setKodeSalah(false);
    if (!kode.trim() || !/^\d+$/.test(kode.trim())) return;

    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: kode.trim(),
      type: "recovery",
    });
    setBusy(false);

    if (error) {
      setKodeSalah(true);
      return setGalat("Kode salah atau sudah kedaluwarsa. Periksa lagi atau kirim ulang kode.");
    }
    setLangkah(3);
  }

  async function simpanSandi() {
    setT((p) => ({ ...p, baru: true, ulang: true }));
    setGalat("");
    if (cekSandi(baru) || cekUlang(baru, ulang)) return;

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: baru });
    setBusy(false);

    if (error) {
      return setGalat(
        error.code === "same_password"
          ? "Kata sandi baru tidak boleh sama dengan yang lama."
          : "Kata sandi gagal diubah. Coba kata sandi yang berbeda."
      );
    }
    router.replace("/(tabs)");
  }

  async function kembali() {
    if (langkah === 1) return router.back();
    if (langkah === 3) {
      // batal di langkah 3: keluarkan sesi sementara dari kode tadi
      await supabase.auth.signOut();
      setBaru(""); setUlang(""); setT({});
    }
    setKode(""); setGalat(""); setInfo(""); setKodeSalah(false);
    setLangkah(1);
  }

  const aturan = aturanSandi(baru);

  return (
    <LayarForm isiStyle={s.wrap}>
      <Pressable onPress={kembali} hitSlop={12}>
        <Text style={s.back}>‹</Text>
      </Pressable>
      <Text style={s.eyebrow}>LUPA KATA SANDI  •  LANGKAH {langkah} DARI 3</Text>
      <Text style={s.heading}>{JUDUL[langkah]}</Text>
      <Text style={s.desc}>
        {langkah === 1 && "Masukkan emailmu, kami kirim kode untuk membuat kata sandi baru."}
        {langkah === 2 && `Kode dikirim ke ${email.trim()}. Masukkan kode tersebut untuk melanjutkan.`}
        {langkah === 3 && "Kode benar. Sekarang buat kata sandi barumu."}
      </Text>

      {langkah === 1 && (
        <>
          <Field label="Email" placeholder="nama@email.com" keyboardType="email-address"
            autoCapitalize="none" autoCorrect={false} autoComplete="email"
            value={email}
            onChangeText={(v) => { setEmail(v); setGalat(""); sentuh("email"); }}
            onBlur={() => sentuh("email")} error={err.email} />

          {galat ? <Pesan jenis="galat">{galat}</Pesan> : null}

          <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={kirimKode} disabled={busy}>
            <Text style={s.btnText}>{busy ? "Mengirim..." : "Kirim kode"}</Text>
          </Pressable>
        </>
      )}

      {langkah === 2 && (
        <>
          {info ? <Pesan jenis="info">{info}</Pesan> : null}

          <Field label="Kode dari email" placeholder="Kode angka" keyboardType="number-pad" maxLength={8}
            invalid={kodeSalah}
            value={kode}
            onChangeText={(v) => { setKode(v); setKodeSalah(false); setGalat(""); sentuh("kode"); }}
            onBlur={() => sentuh("kode")} error={err.kode} />

          {galat ? <Pesan jenis="galat">{galat}</Pesan> : null}

          <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={verifikasiKode} disabled={busy}>
            <Text style={s.btnText}>{busy ? "Memeriksa..." : "Verifikasi kode"}</Text>
          </Pressable>

          <Pressable onPress={kirimKode} disabled={jeda > 0 || busy}>
            <Text style={[s.link, jeda > 0 && { opacity: 0.5 }]}>
              {jeda > 0 ? `Kirim ulang kode (${jeda} dtk)` : "Kirim ulang kode"}
            </Text>
          </Pressable>
          <Pressable onPress={kembali}>
            <Text style={[s.link, { marginTop: 14, color: colors.accent }]}>Ganti email</Text>
          </Pressable>
        </>
      )}

      {langkah === 3 && (
        <>
          <Field label="Kata sandi baru" placeholder="Contoh: Tiksa#2026" password invalid={!!err.baru}
            autoComplete="new-password" textContentType="newPassword" importantForAutofill="yes"
            value={baru} onChangeText={(v) => { setBaru(v); setGalat(""); sentuh("baru"); }} onBlur={() => sentuh("baru")} />
          <View style={s.aturan}>
            {aturan.map((a) => {
              const warna = !t.baru ? "#8aa0d6" : a.ok ? colors.success : colors.danger;
              return (
                <View key={a.teks} style={s.aturanBaris}>
                  <Ionicons name={a.ok ? "checkmark-circle" : "ellipse-outline"} size={14} color={warna} />
                  <Text style={[s.aturanTeks, { color: warna }]}>{a.teks}</Text>
                </View>
              );
            })}
          </View>

          <Field label="Konfirmasi kata sandi baru" placeholder="Ulangi kata sandi" password
            autoComplete="new-password" textContentType="newPassword" importantForAutofill="yes"
            value={ulang} onChangeText={(v) => { setUlang(v); sentuh("ulang"); }} onBlur={() => sentuh("ulang")} error={err.ulang} />

          {galat ? <Pesan jenis="galat">{galat}</Pesan> : null}

          <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={simpanSandi} disabled={busy}>
            <Text style={s.btnText}>{busy ? "Menyimpan..." : "Simpan kata sandi"}</Text>
          </Pressable>
        </>
      )}
    </LayarForm>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
  back: { fontFamily: font.regular, fontSize: 34, color: colors.primary, lineHeight: 38 },
  eyebrow: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1, color: colors.primary, marginTop: 8 },
  heading: { fontFamily: font.bold, fontSize: 28, color: colors.primary, marginTop: 4 },
  desc: { fontFamily: font.regular, fontSize: 13, color: colors.primary, marginTop: 4, marginBottom: 28, lineHeight: 19.5 },
  aturan: { marginTop: -8, marginBottom: 16, gap: 3, marginLeft: 2 },
  aturanBaris: { flexDirection: "row", alignItems: "center", gap: 6 },
  aturanTeks: { fontFamily: font.regular, fontSize: 11 },
  btn: { height: 52, borderRadius: radius.button, backgroundColor: colors.primary, justifyContent: "center", marginTop: 8 },
  btnText: { fontFamily: font.bold, fontSize: 15, color: colors.white, textAlign: "center" },
  link: { fontFamily: font.semibold, fontSize: 13, color: colors.primary, textAlign: "center", marginTop: 26 },
});