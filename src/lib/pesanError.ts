// Mengubah error teknis menjadi kalimat yang mudah dipahami
export function pesanRamah(e: any, aksi = "menyimpan"): string {
  const teks = String(e?.message ?? e ?? "").toLowerCase();

  if (teks.includes("network request failed") || teks.includes("failed to fetch") || teks.includes("timeout"))
    return "Tidak bisa terhubung ke internet. Periksa koneksimu lalu coba lagi.";
  if (teks.includes("jwt") || teks.includes("not authenticated") || teks.includes("belum masuk"))
    return "Sesimu sudah berakhir. Silakan masuk lagi.";
  if (teks.includes("row-level security") || teks.includes("tidak diizinkan") || teks.includes("permission"))
    return "Kamu tidak punya izin untuk melakukan ini.";
  if (teks.includes("foto") || teks.includes("storage") || teks.includes("upload"))
    return "Foto gagal diunggah. Coba lagi, atau kurangi jumlah fotonya.";
  if (teks.includes("check constraint") || teks.includes("violates"))
    return "Ada isian yang belum sesuai. Periksa kembali formulirnya.";

  return `Gagal ${aksi}. Coba lagi sebentar.`;
}