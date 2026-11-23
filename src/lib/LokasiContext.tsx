import {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from "react";
import * as Location from "expo-location";
import type { Koordinat } from "./rekomendasi";

export type Daerah = Koordinat & { nama: string };
type StatusGps = "memuat" | "ok" | "ditolak";

type Nilai = {
  status: StatusGps;
  posisi: Koordinat | null;
  daerah: Daerah | null; // daerah pilihan manual (kalau dipakai)
  minta: () => Promise<boolean>; // minta izin lalu pakai GPS
  setDaerah: (d: Daerah | null) => void;
};

const Ctx = createContext<Nilai | null>(null);

export function LokasiProvider({
  aktif, children,
}: { aktif: boolean; children: React.ReactNode }) {
  const [statusGps, setStatusGps] = useState<StatusGps>("memuat");
  const [gps, setGps] = useState<Koordinat | null>(null);
  const [daerah, setDaerah] = useState<Daerah | null>(null);

  const minta = useCallback(async () => {
    setStatusGps("memuat");
    const { status: izin } = await Location.requestForegroundPermissionsAsync();
    if (izin !== "granted") {
      setStatusGps("ditolak");
      return false;
    }
    let berhasil = false;
    const terakhir = await Location.getLastKnownPositionAsync();
    if (terakhir) {
      setGps({ lat: terakhir.coords.latitude, lng: terakhir.coords.longitude });
      setStatusGps("ok");
      berhasil = true;
    }
    try {
      const kini = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setGps({ lat: kini.coords.latitude, lng: kini.coords.longitude });
      setStatusGps("ok");
      berhasil = true;
    } catch {
      if (!terakhir) setStatusGps("ditolak");
    }
    if (berhasil) setDaerah(null); // kembali memakai GPS
    return berhasil;
  }, []);

  // minta izin hanya setelah pengguna masuk (bukan di layar login)
  useEffect(() => {
    if (aktif) {
      minta();
    } else {
      setDaerah(null);
      setGps(null);
      setStatusGps("memuat");
    }
  }, [aktif, minta]);

  const nilai = useMemo<Nilai>(
    () => ({
      status: daerah ? "ok" : statusGps,
      posisi: daerah ?? gps,
      daerah,
      minta,
      setDaerah,
    }),
    [daerah, gps, statusGps, minta]
  );

  return <Ctx.Provider value={nilai}>{children}</Ctx.Provider>;
}

export function useLokasi() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLokasi harus dipakai di dalam LokasiProvider");
  return v;
}