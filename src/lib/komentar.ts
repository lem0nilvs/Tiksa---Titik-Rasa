import { supabase } from "./supabase";

export type Komentar = {
  id: number;
  rekomendasi_id: number;
  user_id: string;
  nama: string;
  isi: string;
  created_at: string;
  parent_id: number | null;
};

// jumlah seluruh komentar (utama + balasan) untuk satu tempat
export async function hitungKomentar(rekomendasiId: number) {
  const { count } = await supabase
    .from("komentar")
    .select("id", { count: "exact", head: true })
    .eq("rekomendasi_id", rekomendasiId);
  return count ?? 0;
}

// komentar utama (terbaru dulu, bertahap) beserta balasan-balasannya
export async function ambilKomentar(rekomendasiId: number, dari: number, jumlah: number) {
  const { data, count, error } = await supabase
    .from("komentar")
    .select("*", { count: "exact" })
    .eq("rekomendasi_id", rekomendasiId)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .range(dari, dari + jumlah - 1);
  if (error) throw error;

  const induk = (data ?? []) as Komentar[];
  const balasan: Record<number, Komentar[]> = {};
  if (induk.length > 0) {
    const { data: b, error: e2 } = await supabase
      .from("komentar")
      .select("*")
      .in("parent_id", induk.map((k) => k.id))
      .order("created_at", { ascending: true });
    if (e2) throw e2;
    for (const r of (b ?? []) as Komentar[]) {
      const kunci = r.parent_id as number;
      if (!balasan[kunci]) balasan[kunci] = [];
      balasan[kunci].push(r);
    }
  }
  return { induk, balasan, total: count ?? 0 };
}

export async function kirimKomentar(rekomendasiId: number, isi: string, parentId?: number | null) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Belum masuk");
  const nama = (u.user.user_metadata?.nama as string) || "Pengguna";
  const { data, error } = await supabase
    .from("komentar")
    .insert({ rekomendasi_id: rekomendasiId, nama, isi, parent_id: parentId ?? null })
    .select()
    .single();
  if (error) throw error;
  return data as Komentar;
}

export async function hapusKomentar(id: number) {
  const { data, error } = await supabase.from("komentar").delete().eq("id", id).select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Tidak bisa menghapus komentar ini.");
}

// "baru saja", "5 menit lalu", "3 jam lalu", "2 hari lalu", selebihnya tanggal
export function waktuRelatif(iso: string) {
  const detik = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (detik < 60) return "baru saja";
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`;
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`;
  if (detik < 86400 * 7) return `${Math.floor(detik / 86400)} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}