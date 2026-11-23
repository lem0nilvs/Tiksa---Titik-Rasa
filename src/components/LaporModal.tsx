import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, font } from "../theme";
import { ALASAN, kirimLaporan } from "../lib/laporan";
import { pesanRamah } from "../lib/pesanError";

type Props = {
  visible: boolean;
  onTutup: () => void;
  rekomendasiId?: number;
  komentarId?: number;
  judul?: string;
};

export default function LaporModal({ visible, onTutup, rekomendasiId, komentarId, judul }: Props) {
  const [alasan, setAlasan] = useState("");
  const [catatan, setCatatan] = useState("");
  const [sentuh, setSentuh] = useState(false);
  const [busy, setBusy] = useState(false);
  const [galat, setGalat] = useState("");
  const [selesai, setSelesai] = useState(false);

  useEffect(() => {
    if (visible) {
      setAlasan(""); setCatatan(""); setSentuh(false); setGalat(""); setSelesai(false);
    }
  }, [visible]);

  async function kirim() {
    setSentuh(true);
    setGalat("");
    if (!alasan) return;
    setBusy(true);
    try {
      await kirimLaporan({ rekomendasiId, komentarId, alasan, catatan });
      setSelesai(true);
    } catch (e: any) {
      if (e?.message === "SUDAH_LAPOR") setGalat("Kamu sudah pernah melaporkan ini.");
      else {
        console.log("ERROR LAPOR:", e);
        setGalat(pesanRamah(e, "mengirim laporan"));
      }
    }
    setBusy(false);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onTutup}>
      <View style={s.latar}>
        <View style={s.kotak}>
          {selesai ? (
            <>
              <Text style={s.judul}>Terima kasih</Text>
              <Text style={s.isi}>Laporanmu sudah kami terima dan akan diperiksa oleh admin.</Text>
              <Pressable style={s.tombol} onPress={onTutup}>
                <Text style={s.tombolTeks}>Selesai</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.judul}>{judul ?? "Laporkan konten"}</Text>
              <Text style={s.isi}>Pilih alasan yang paling sesuai:</Text>

              {ALASAN.map((a) => (
                <Pressable key={a} style={[s.opsi, alasan === a && s.opsiAktif]} onPress={() => setAlasan(a)}>
                  <View style={[s.radio, alasan === a && s.radioAktif]}>
                    {alasan === a && <View style={s.radioDalam} />}
                  </View>
                  <Text style={s.opsiTeks}>{a}</Text>
                </Pressable>
              ))}
              {sentuh && !alasan ? <Text style={s.err}>Pilih salah satu alasan.</Text> : null}

              <TextInput
                style={s.input}
                value={catatan}
                onChangeText={setCatatan}
                placeholder="Catatan tambahan (opsional)"
                placeholderTextColor="#8ea0c8"
                multiline
                maxLength={300}
              />
              {galat ? <Text style={s.err}>{galat}</Text> : null}

              <View style={s.baris}>
                <Pressable style={[s.tombol, s.tombolLuar]} onPress={onTutup} disabled={busy}>
                  <Text style={[s.tombolTeks, { color: colors.primary }]}>Batal</Text>
                </Pressable>
                <Pressable style={[s.tombol, busy && { opacity: 0.6 }]} onPress={kirim} disabled={busy}>
                  <Text style={s.tombolTeks}>{busy ? "Mengirim..." : "Kirim laporan"}</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  latar: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 24 },
  kotak: { width: "100%", maxWidth: 420, backgroundColor: colors.bg, borderRadius: 20, padding: 20 },
  judul: { fontFamily: font.bold, fontSize: 16, color: colors.primary },
  isi: { fontFamily: font.regular, fontSize: 12, color: colors.primary, marginTop: 6, marginBottom: 12, lineHeight: 18 },
  opsi: {
    flexDirection: "row", alignItems: "center", gap: 12, height: 46, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border, borderRadius: 12, marginBottom: 8,
  },
  opsiAktif: { borderColor: colors.primary, backgroundColor: colors.mint },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  radioAktif: { borderColor: colors.primary },
  radioDalam: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  opsiTeks: { fontFamily: font.medium, fontSize: 13, color: colors.primary },
  input: {
    minHeight: 64, maxHeight: 110, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    padding: 12, fontFamily: font.regular, fontSize: 13, color: colors.primary, textAlignVertical: "top", marginTop: 4,
  },
  err: { fontFamily: font.regular, fontSize: 11, color: colors.danger, marginTop: 4, marginBottom: 4 },
  baris: { flexDirection: "row", gap: 10, marginTop: 14 },
  tombol: { flex: 1, height: 46, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginTop: 4 },
  tombolLuar: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
  tombolTeks: { fontFamily: font.bold, fontSize: 13, color: colors.white },
});