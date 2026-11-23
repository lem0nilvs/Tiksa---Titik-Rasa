export const cekNama = (v: string) => {
  const n = v.trim();
  if (!n) return "Nama lengkap wajib diisi";
  if (n.length < 2) return "Nama minimal 2 huruf";
  if (!/^[A-Za-z][A-Za-z\s.'-]*$/.test(n)) return "Nama hanya boleh berisi huruf";
  return "";
};

export const cekEmail = (v: string) => {
  const e = v.trim();
  if (!e) return "Email wajib diisi";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) {
    return "Format email tidak valid, contoh: nama@email.com";
  }
  return "";
};

export const aturanSandi = (v: string) => [
  { teks: "Minimal 8 karakter", ok: v.length >= 8 },
  { teks: "Ada huruf", ok: /[A-Za-z]/.test(v) },
  { teks: "Ada angka", ok: /\d/.test(v) },
  { teks: "Ada simbol (contoh: @ # ! _ -)", ok: /[^A-Za-z0-9\s]/.test(v) },
  { teks: "Tanpa spasi", ok: !/\s/.test(v) },
];

export const cekSandi = (v: string) => {
  if (!v) return "Kata sandi wajib diisi";
  const gagal = aturanSandi(v).find((a) => !a.ok);
  return gagal ? `Belum memenuhi syarat: ${gagal.teks.toLowerCase()}` : "";
};

export const cekUlang = (sandi: string, ulang: string) => {
  if (!ulang) return "Konfirmasi kata sandi wajib diisi";
  return sandi === ulang ? "" : "Kata sandi tidak sama";
};

export function cekUsername(v: string) {
  const s = v.trim();
  if (!s) return "Username wajib diisi";
  if (s.length < 3) return "Username minimal 3 karakter";
  if (s.length > 20) return "Username maksimal 20 karakter";
  if (!/^[a-zA-Z0-9._]+$/.test(s)) return "Hanya boleh huruf, angka, titik, dan garis bawah";
  return "";
}