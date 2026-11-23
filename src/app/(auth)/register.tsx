import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { colors, font, radius } from "../../theme";
import Field from "../../components/Field";
import Pesan from "../../components/Pesan";
import LayarForm from "../../components/LayarForm";
import { aturanSandi, cekEmail, cekSandi, cekUlang, cekUsername } from "../../lib/validasi";

export default function Register() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ulang, setUlang] = useState("");
  const [t, setT] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [emailServer, setEmailServer] = useState("");
  const [galat, setGalat] = useState("");
  const [info, setInfo] = useState("");

  const sentuh = (k: string) => setT((p) => ({ ...p, [k]: true }));

  const err = {
    nama: t.nama ? cekUsername(nama) : "",
    email: emailServer || (t.email ? cekEmail(email) : ""),
    sandi: t.password ? cekSandi(password) : "",
    ulang: t.ulang ? cekUlang(password, ulang) : "",
  };

  async function daftar() {
    setT({ nama: true, email: true, password: true, ulang: true });
    setGalat(""); setInfo(""); setEmailServer("");
    if (cekUsername(nama) || cekEmail(email) || cekSandi(password) || cekUlang(password, ulang)) return;

    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { nama: nama.trim().toLowerCase() } },
    });
    setBusy(false);

    if (error) {
      if (error.code === "user_already_exists" || /already/i.test(error.message)) {
        setEmailServer("Email ini sudah terdaftar. Silakan masuk.");
      } else if (error.code === "weak_password") {
        setGalat("Kata sandi terlalu lemah atau mudah ditebak. Coba kombinasi lain.");
      } else if (/network|fetch/i.test(error.message)) {
        setGalat("Tidak bisa terhubung. Periksa koneksi internetmu.");
      } else {
        setGalat("Pendaftaran gagal. Coba lagi sebentar.");
      }
      return;
    }
    if (data.user?.identities?.length === 0) {
      return setEmailServer("Email ini sudah terdaftar. Silakan masuk.");
    }
    if (!data.session) {
      setInfo("Pendaftaran berhasil. Cek emailmu untuk konfirmasi.");
    }
    // kalau Confirm email dimatikan, pengguna langsung masuk ke Beranda
  }

  const aturan = aturanSandi(password);

  return (
    <LayarForm isiStyle={s.wrap}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <Text style={s.back}>‹</Text>
      </Pressable>
      <Text style={s.eyebrow}>BUAT AKUN</Text>
      <Text style={s.heading}>Daftar akun</Text>
      <Text style={s.desc}>Mulai bagikan makanan dan minuman favoritmu.</Text>

      <Field label="Username" placeholder="Contoh: rahma_azizah" autoCapitalize="none" autoCorrect={false}
        autoComplete="off" textContentType="nickname" importantForAutofill="no" maxLength={20}
        value={nama} onChangeText={(v) => { setNama(v.replace(/\s/g, "")); sentuh("nama"); }}
        onBlur={() => sentuh("nama")} error={err.nama} />

      <Field label="Email" placeholder="nama@email.com" keyboardType="email-address"
        autoCapitalize="none" autoCorrect={false}
        autoComplete="email" textContentType="username" importantForAutofill="yes"
        value={email}
        onChangeText={(v) => { setEmail(v); setEmailServer(""); sentuh("email"); }}
        onBlur={() => sentuh("email")} error={err.email} />

      <Field label="Kata sandi" placeholder="Contoh: Tiksa#2026" password invalid={!!err.sandi}
        autoComplete="new-password" textContentType="newPassword" importantForAutofill="yes"
        value={password} onChangeText={(v) => { setPassword(v); sentuh("password"); }} onBlur={() => sentuh("password")} />
      <View style={s.aturan}>
        {aturan.map((a) => {
          const warna = !t.password ? "#8aa0d6" : a.ok ? colors.success : colors.danger;
          return (
            <View key={a.teks} style={s.aturanBaris}>
              <Ionicons name={a.ok ? "checkmark-circle" : "ellipse-outline"} size={14} color={warna} />
              <Text style={[s.aturanTeks, { color: warna }]}>{a.teks}</Text>
            </View>
          );
        })}
      </View>

      <Field label="Konfirmasi kata sandi" placeholder="Ulangi kata sandi" password
        autoComplete="new-password" textContentType="newPassword" importantForAutofill="yes"
        value={ulang} onChangeText={(v) => { setUlang(v); sentuh("ulang"); }} onBlur={() => sentuh("ulang")} error={err.ulang} />

      {galat ? <Pesan jenis="galat">{galat}</Pesan> : null}
      {info ? <Pesan jenis="info">{info}</Pesan> : null}

      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={daftar} disabled={busy}>
        <Text style={s.btnText}>{busy ? "Memproses..." : "Buat akun"}</Text>
      </Pressable>

      <Link href="/(auth)/login" style={s.link}>Sudah punya akun? Masuk</Link>
    </LayarForm>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 50, paddingBottom: 40 },
  back: { fontFamily: font.regular, fontSize: 34, color: colors.primary, lineHeight: 38 },
  eyebrow: { fontFamily: font.bold, fontSize: 10, letterSpacing: 1, color: colors.primary, marginTop: 8 },
  heading: { fontFamily: font.bold, fontSize: 28, color: colors.primary, marginTop: 4 },
  desc: { fontFamily: font.regular, fontSize: 13, color: colors.primary, marginTop: 4, marginBottom: 28 },
  aturan: { marginTop: -8, marginBottom: 16, gap: 3, marginLeft: 2 },
  aturanBaris: { flexDirection: "row", alignItems: "center", gap: 6 },
  aturanTeks: { fontFamily: font.regular, fontSize: 11 },
  btn: { height: 52, borderRadius: radius.button, backgroundColor: colors.primary, justifyContent: "center", marginTop: 8 },
  btnText: { fontFamily: font.bold, fontSize: 15, color: colors.white, textAlign: "center" },
  link: { fontFamily: font.semibold, fontSize: 13, color: colors.primary, textAlign: "center", marginTop: 26 },
});