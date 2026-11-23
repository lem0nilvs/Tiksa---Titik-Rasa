import { supabase } from "./supabase";

export type Ringkasan = { rata: number; jumlah: number };

// rata-rata dan jumlah penilai untuk banyak tempat sekaligus
export async function ambilRingkasan(ids: number[]): Promise<Record<number, Ringkasan>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("ringkasan_rating")
    .select("rekomendasi_id, rata, jumlah")
    .in("rekomendasi_id", ids);
  const hasil: Record<number, Ringkasan> = {};
  for (const d of (data ?? []) as any[]) {
    hasil[d.rekomendasi_id] = { rata: Number(d.rata), jumlah: d.jumlah };
  }
  return hasil;
}

// nilai yang pernah kamu beri untuk tempat ini (0 = belum menilai)
export async function ambilRatingku(rekomendasiId: number): Promise<number> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return 0;
  const { data } = await supabase
    .from("rating")
    .select("bintang")
    .eq("rekomendasi_id", rekomendasiId)
    .eq("user_id", u.user.id)
    .maybeSingle();
  return data?.bintang ?? 0;
}

// simpan atau ubah nilaimu
export async function simpanRating(rekomendasiId: number, bintang: number) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Belum masuk");
  const { error } = await supabase.from("rating").upsert(
    {
      user_id: u.user.id,
      rekomendasi_id: rekomendasiId,
      bintang,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,rekomendasi_id" }
  );
  if (error) throw error;
}