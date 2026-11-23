import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import { supabase } from "../../lib/supabase";
import { colors, font, radius } from "../../theme";
import Field from "../../components/Field";
import Pesan from "../../components/Pesan";
import LayarForm from "../../components/LayarForm";
import { cekEmail } from "../../lib/validasi";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [t, setT] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [galat, setGalat] = useState("");
  const [salahKredensial, setSalahKredensial] = useState(false);

  const sentuh = (k: string) => setT((p) => ({ ...p, [k]: true }));
  const bersih = () => { setGalat(""); setSalahKredensial(false); };

  const errEmail = t.email ? cekEmail(email) : "";
  const errSandi = t.password && !password ? "Kata sandi wajib diisi" : "";

  async function masuk() {
    setT({ email: true, password: true });
    bersih();
    if (cekEmail(email) || !password) return;

    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);

    if (error) {
      if (/network|fetch/i.test(error.message)) {
        setGalat("Tidak bisa terhubung. Periksa koneksi internetmu.");
      } else {
        setSalahKredensial(true);
        setGalat("Email atau kata sandi salah, atau akunmu belum terdaftar.");
      }
    }
  }

  return (
    <LayarForm isiStyle={s.wrap}>
      <View style={s.brandRow}>
        <View style={s.dot} />
        <Text style={s.brand}>Tiksa</Text>
      </View>

      <Text style={s.heading}>Selamat datang!</Text>
      <Text style={s.desc}>Masuk untuk menemukan dan berbagi rekomendasi kuliner di sekitarmu.</Text>

      <Field label="Email" placeholder="nama@email.com" keyboardType="email-address"
        autoCapitalize="none" autoCorrect={false}
        autoComplete="username" textContentType="username" importantForAutofill="yes"
        invalid={salahKredensial}
        value={email} onChangeText={(v) => { setEmail(v); bersih(); sentuh("email"); }}
        onBlur={() => sentuh("email")} error={errEmail} />

      <Field label="Kata sandi" placeholder="Masukkan kata sandi" password
        autoComplete="current-password" textContentType="password" importantForAutofill="yes"
        invalid={salahKredensial}
        value={password} onChangeText={(v) => { setPassword(v); bersih(); sentuh("password"); }}
        onBlur={() => sentuh("password")} error={errSandi} />

      <Link href="/(auth)/lupa-sandi" style={s.lupa}>Lupa kata sandi?</Link>

      {galat ? (
        <Pesan jenis="galat">
          {galat}
          {salahKredensial ? " Belum punya akun? Ketuk Daftar di bawah." : ""}
        </Pesan>
      ) : null}

      <Pressable style={[s.btn, busy && { opacity: 0.6 }]} onPress={masuk} disabled={busy}>
        <Text style={s.btnText}>{busy ? "Memproses..." : "Masuk"}</Text>
      </Pressable>

      <Link href="/(auth)/register" style={s.link}>Belum punya akun? Daftar</Link>
    </LayarForm>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 80 },
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary },
  brand: { fontFamily: font.extrabold, fontSize: 24, color: colors.primary },
  heading: { fontFamily: font.bold, fontSize: 29, color: colors.primary },
  desc: { fontFamily: font.regular, fontSize: 13, color: colors.primary, marginTop: 6, marginBottom: 40, lineHeight: 19.5 },
  lupa: { fontFamily: font.semibold, fontSize: 12, color: colors.accent, textAlign: "right", marginTop: -4, marginBottom: 14 },
  btn: { height: 52, borderRadius: radius.button, backgroundColor: colors.primary, justifyContent: "center", marginTop: 6 },
  btnText: { fontFamily: font.bold, fontSize: 15, color: colors.white, textAlign: "center" },
  link: { fontFamily: font.semibold, fontSize: 13, color: colors.primary, textAlign: "center", marginTop: 30 },
});