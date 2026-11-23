import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/admin";
import { colors, font } from "../theme";

// Lonceng laporan: hanya tampil untuk admin, angkanya = laporan yang belum diproses
export default function LoncengAdmin() {
  const router = useRouter();
  const admin = useAdmin();
  const [jumlah, setJumlah] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!admin) return;
      let aktif = true;

      const muat = () =>
        supabase
          .from("laporan")
          .select("id", { count: "exact", head: true })
          .eq("status", "baru")
          .then(({ count }) => {
            if (aktif) setJumlah(count ?? 0);
          });

      muat();
      const timer = setInterval(muat, 30000); // cek ulang tiap 30 detik
      return () => {
        aktif = false;
        clearInterval(timer);
      };
    }, [admin])
  );

  if (!admin) return null;

  return (
    <Pressable style={s.tombol} onPress={() => router.push("/laporan" as any)} hitSlop={8}>
      <Ionicons
        name={jumlah > 0 ? "notifications" : "notifications-outline"}
        size={22}
        color={colors.primary}
      />
      {jumlah > 0 && (
        <View style={s.badge}>
          <Text style={s.badgeTeks}>{jumlah > 99 ? "99+" : jumlah}</Text>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  tombol: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
    paddingHorizontal: 4, backgroundColor: colors.merah, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: colors.bg,
  },
  badgeTeks: { fontFamily: font.bold, fontSize: 9, color: colors.white },
});