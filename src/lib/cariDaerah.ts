import type { Daerah } from "./LokasiContext";

const cache = new Map<string, Daerah[]>();
let terakhir = 0;

function singkat(nama: string) {
  return nama.split(",").map((x) => x.trim()).slice(0, 3).join(", ");
}

export async function cariDaerah(kata: string): Promise<Daerah[]> {
  const q = kata.trim().toLowerCase();
  if (cache.has(q)) return cache.get(q)!;

  // maksimal 1 permintaan per detik (aturan Nominatim)
  const tunggu = 1100 - (Date.now() - terakhir);
  if (tunggu > 0) await new Promise((r) => setTimeout(r, tunggu));
  terakhir = Date.now();

  const url =
    "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=id&q=" +
    encodeURIComponent(q);

  const res = await fetch(url, {
    headers: { "User-Agent": "Tiksa/1.0 (tugas kuliah PBP UIN K.H. Abdurrahman Wahid Pekalongan)" },
  });
  if (!res.ok) throw new Error("Nominatim " + res.status);

  const json = (await res.json()) as any[];
  const hasil: Daerah[] = json.map((r) => ({
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    nama: singkat(r.display_name),
  }));
  cache.set(q, hasil);
  return hasil;
}