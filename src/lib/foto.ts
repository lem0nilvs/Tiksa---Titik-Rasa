import { decode } from "base64-arraybuffer";
import { supabase } from "./supabase";

export async function unggahFoto(b64: string, userId: string) {
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;

  const { data: sesi } = await supabase.auth.getSession();
  const token = sesi.session?.access_token;
  if (!token) throw new Error("Sesi habis, silakan masuk lagi.");

  const url = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/foto/${path}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: process.env.EXPO_PUBLIC_SUPABASE_KEY as string,
      "Content-Type": "image/jpeg",
      "x-upsert": "false",
    },
    body: decode(b64),
  });
  if (!res.ok) {
    const teks = await res.text();
    console.log("ERROR UPLOAD:", res.status, teks);
    throw new Error(`Upload foto gagal (${res.status}): ${teks}`);
  }
  return supabase.storage.from("foto").getPublicUrl(path).data.publicUrl;
}

// hapus satu file foto dari Storage (best effort, tidak melempar error)
export async function hapusFoto(url?: string | null) {
  if (!url) return;
  const kunci = "/object/public/foto/";
  const i = url.indexOf(kunci);
  if (i < 0) return;
  const path = decodeURIComponent(url.slice(i + kunci.length));
  await supabase.storage.from("foto").remove([path]);
}

export async function hapusBanyakFoto(urls: (string | null | undefined)[]) {
  for (const u of urls) await hapusFoto(u);
}