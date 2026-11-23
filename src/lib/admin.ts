import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// true kalau akun yang sedang masuk terdaftar sebagai admin
export function useAdmin() {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    let batal = false;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase
        .from("admin")
        .select("user_id")
        .eq("user_id", u.user.id)
        .maybeSingle();
      if (!batal) setAdmin(!!data);
    })();
    return () => { batal = true; };
  }, []);
  return admin;
}

// kumpulan ID akun admin (untuk menampilkan tag "Admin" di komentar)
export function useDaftarAdmin() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    let batal = false;
    supabase
      .from("admin")
      .select("user_id")
      .then(({ data }) => {
        if (!batal && data) setIds(new Set(data.map((d: any) => d.user_id as string)));
      });
    return () => { batal = true; };
  }, []);
  return ids;
}