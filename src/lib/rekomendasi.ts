import { supabase } from "./supabase";

export type ItemMenu = { nama: string; harga: number | null };

export type Rekomendasi = {
  id: number;
  user_id: string;
  nama_tempat: string;
  menu: string;
    kategori: "Makanan" | "Minuman" | "Keduanya";
  harga: number | null;
  ulasan: string | null;
  foto_url: string | null;
  lat: number;
  lng: number;
  alamat: string | null;
  created_at: string;
  jarakM?: number;
  foto_urls?: string[] | null;
  daftar_menu?: ItemMenu[] | null;
};

export type Koordinat = { lat: number; lng: number };

export function hitungJarakM(a: Koordinat, b: Koordinat) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function formatJarak(m: number) {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}

export function formatRupiah(n: number | null) {
  if (n == null) return "-";
  return "Rp" + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ambil rekomendasi dalam radius (km), diurutkan dari yang terdekat
export async function ambilTerdekat(posisi: Koordinat, radiusKm = 5) {
  const dLat = radiusKm / 111.32;
  const dLng = radiusKm / (111.32 * Math.cos((posisi.lat * Math.PI) / 180));

  const { data, error } = await supabase
    .from("rekomendasi")
    .select("*")
    .gte("lat", posisi.lat - dLat)
    .lte("lat", posisi.lat + dLat)
    .gte("lng", posisi.lng - dLng)
    .lte("lng", posisi.lng + dLng)
    .limit(100);

  if (error) throw error;

  return (data as Rekomendasi[])
    .map((r) => ({ ...r, jarakM: hitungJarakM(posisi, { lat: r.lat, lng: r.lng }) }))
    .filter((r) => r.jarakM! <= radiusKm * 1000)
    .sort((a, b) => a.jarakM! - b.jarakM!);
}

export const labelKategori = (k: string) => (k === "Keduanya" ? "Makanan & Minuman" : k);

type PunyaMenu = { daftar_menu?: ItemMenu[] | null; menu: string; harga: number | null };

// daftar menu; data lama (tanpa daftar_menu) dianggap 1 menu
export function daftarMenu(r: PunyaMenu): ItemMenu[] {
  return r.daftar_menu && r.daftar_menu.length > 0
    ? r.daftar_menu
    : [{ nama: r.menu, harga: r.harga }];
}

// teks harga untuk kartu: 1 menu = "Rp13.000", lebih dari 1 = "Mulai dari Rp3.000"
export function teksHarga(r: PunyaMenu): string {
  const d = daftarMenu(r);
  const angka = d.map((m) => m.harga).filter((h): h is number => h != null);
  if (angka.length === 0) return "Harga belum diisi";
  const termurah = formatRupiah(Math.min(...angka));
  return d.length > 1 ? `Mulai dari ${termurah}` : termurah;
}