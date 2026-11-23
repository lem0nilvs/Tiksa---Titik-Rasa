import { supabase } from "./supabase";

export const ALASAN = [
  "Spam atau iklan",
  "Informasi tidak sesuai",
  "Konten tidak pantas",
  "Lainnya",
];

export async function kirimLaporan(opsi: {
  rekomendasiId?: number;
  komentarId?: number;
  alasan: string;
  catatan?: string;
}) {
  const { error } = await supabase.from("laporan").insert({
    rekomendasi_id: opsi.rekomendasiId ?? null,
    komentar_id: opsi.komentarId ?? null,
    alasan: opsi.alasan,
    catatan: opsi.catatan?.trim() || null,
  });
  if (error) {
    if ((error as any).code === "23505") throw new Error("SUDAH_LAPOR");
    throw error;
  }
}