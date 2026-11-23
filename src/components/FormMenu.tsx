import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius } from "../theme";

export type BarisMenu = { nama: string; harga: string };
export const MAKS_MENU = 10;
export const BARIS_AWAL: BarisMenu[] = [{ nama: "", harga: "" }];

// periksa semua baris; baris tambahan yang kosong sama sekali diabaikan
export function cekMenu(rows: BarisMenu[]) {
  const galat = rows.map((r, i) => {
    const nama = r.nama.trim();
    const harga = r.harga.trim();
    if (!nama && !harga && i > 0) return { nama: "", harga: "" };
    return {
      nama: !nama ? "Nama menu wajib diisi" : "",
      harga: !harga
        ? "Harga wajib diisi"
        : !/^\d+$/.test(harga)
        ? "Isi angka saja, contoh: 15000"
        : Number(harga) > 10000000
        ? "Maksimal Rp 10.000.000"
        : "",
    };
  });
  const ok = galat.every((g) => !g.nama && !g.harga);
  const terisi = rows
    .filter((r, i) => i === 0 || r.nama.trim() || r.harga.trim())
    .map((r) => ({ nama: r.nama.trim(), harga: Number(r.harga) }));
  return { ok, galat, terisi };
}

// nilai untuk kolom "menu" (nama digabung koma) dan "harga" (termurah)
export function ringkasMenu(items: { nama: string; harga: number }[]) {
  return {
    menu: items.map((m) => m.nama).join(", "),
    harga: Math.min(...items.map((m) => m.harga)),
  };
}

type Props = {
  value: BarisMenu[];
  onChange: (v: BarisMenu[]) => void;
  paksa?: boolean; // true = tampilkan semua error (setelah tombol Simpan ditekan)
};

export default function FormMenu({ value, onChange, paksa }: Props) {
  const [sentuh, setSentuh] = useState<Record<string, boolean>>({});
  const { galat } = cekMenu(value);

  const tandai = (i: number, k: keyof BarisMenu) =>
    setSentuh((p) => ({ ...p, [`${i}-${k}`]: true }));
  const tampil = (i: number, k: keyof BarisMenu) => paksa || sentuh[`${i}-${k}`];

  const ubah = (i: number, k: keyof BarisMenu, v: string) => {
    onChange(value.map((b, idx) => (idx === i ? { ...b, [k]: v } : b)));
    tandai(i, k);
  };
  const tambah = () => onChange([...value, { nama: "", harga: "" }]);
  const hapus = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
    setSentuh({});
  };

  return (
    <View style={s.wrap}>
      <Text style={s.label}>Menu yang direkomendasikan *</Text>

      {value.map((b, i) => {
        const gNama = tampil(i, "nama") ? galat[i].nama : "";
        const gHarga = tampil(i, "harga") ? galat[i].harga : "";
        return (
          <View key={i} style={s.blok}>
            <View style={s.baris}>
              <TextInput
                style={[s.input, s.nama, !!gNama && s.salah]}
                placeholder={i === 0 ? "Contoh: Soto ayam" : "Menu lain"}
                placeholderTextColor="#8ea0c8"
                value={b.nama}
                onChangeText={(v) => ubah(i, "nama", v)}
                onBlur={() => tandai(i, "nama")}
                maxLength={40}
                autoCapitalize="sentences"
              />
              <TextInput
                style={[s.input, s.harga, !!gHarga && s.salah]}
                placeholder="Harga"
                placeholderTextColor="#8ea0c8"
                value={b.harga}
                onChangeText={(v) => ubah(i, "harga", v)}
                onBlur={() => tandai(i, "harga")}
                keyboardType="number-pad"
                maxLength={8}
              />
              {i > 0 ? (
                <Pressable onPress={() => hapus(i)} hitSlop={8} style={s.hapus}>
                  <Ionicons name="close-circle" size={22} color={colors.primary} />
                </Pressable>
              ) : (
                <View style={s.hapus} />
              )}
            </View>
            {gNama || gHarga ? <Text style={s.err}>{gNama || gHarga}</Text> : null}
          </View>
        );
      })}

      {value.length < MAKS_MENU && (
        <Pressable style={s.tambah} onPress={tambah}>
          <Ionicons name="add" size={18} color={colors.primary} />
          <Text style={s.tambahTeks}>Tambah menu</Text>
        </Pressable>
      )}
      <Text style={s.hint}>Isi nama dan harga tiap menu. Maksimal {MAKS_MENU} menu.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontFamily: font.semibold, fontSize: 12, color: colors.primary, marginBottom: 6 },
  blok: { marginBottom: 10 },
  baris: { flexDirection: "row", alignItems: "center", gap: 8 },
  input: {
    height: 46, borderWidth: 1, borderColor: colors.border, borderRadius: radius.input,
    paddingHorizontal: 14, fontFamily: font.regular, fontSize: 14, color: colors.primary,
  },
  nama: { flex: 1 },
  harga: { width: 104 },
  salah: { borderColor: colors.danger },
  hapus: { width: 24, alignItems: "center", justifyContent: "center" },
  err: { fontFamily: font.regular, fontSize: 11, color: colors.danger, marginTop: 4, marginLeft: 4 },
  tambah: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, height: 34,
    paddingHorizontal: 14, borderRadius: 17, backgroundColor: colors.mint, marginTop: 2,
  },
  tambahTeks: { fontFamily: font.semibold, fontSize: 12, color: colors.primary },
  hint: { fontFamily: font.regular, fontSize: 10, color: colors.primary, marginTop: 8, marginLeft: 2 },
});