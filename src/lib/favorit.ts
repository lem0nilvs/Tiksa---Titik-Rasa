import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "./supabase";

// daftar id rekomendasi yang difavoritkan akun ini + fungsi tombol favorit
export function useFavorit() {
  const [ids, setIds] = useState<Set<number>>(new Set());

  const muat = useCallback(async () => {
    const { data } = await supabase.from("favorit").select("rekomendasi_id");
    setIds(new Set((data ?? []).map((d: any) => d.rekomendasi_id as number)));
  }, []);

  useFocusEffect(
    useCallback(() => {
      muat();
    }, [muat])
  );

  const toggle = useCallback(
    async (id: number) => {
      const sudah = ids.has(id);
      // tampilkan perubahan dulu supaya terasa cepat
      setIds((prev) => {
        const n = new Set(prev);
        if (sudah) n.delete(id);
        else n.add(id);
        return n;
      });

      const { error } = sudah
        ? await supabase.from("favorit").delete().eq("rekomendasi_id", id)
        : await supabase.from("favorit").insert({ rekomendasi_id: id });

      if (error) muat(); // gagal: kembalikan ke kondisi di server
    },
    [ids, muat]
  );

  return { ids, toggle };
}