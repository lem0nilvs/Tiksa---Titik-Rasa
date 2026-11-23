import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import {
  useFonts, Manrope_400Regular, Manrope_500Medium,
  Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import { colors } from "../theme";
import * as SplashScreen from "expo-splash-screen";
import Splash from "../components/Splash";
import { LokasiProvider } from "../lib/LokasiContext";

SplashScreen.preventAutoHideAsync(); // di luar komponen, di bawah import

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();
  const [fontsLoaded] = useFonts({
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold,
    Manrope_700Bold, Manrope_800ExtraBold,
  });
  const [tunggu, setTunggu] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setTunggu(false), 1800); // splash tampil minimal 1,8 detik
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    const seg = segments as string[];
    const diAuth = seg[0] === "(auth)";
    const diLupa = diAuth && seg[1] === "lupa-sandi"; // jangan dialihkan saat atur ulang sandi
    if (!session && !diAuth) router.replace("/(auth)/login");
    if (session && diAuth && !diLupa) router.replace("/(tabs)");
  }, [session, loading, segments]);

  if (loading || !fontsLoaded || tunggu) return <Splash />;

  return (
    <LokasiProvider aktif={!!session}>
      <Stack screenOptions={{ headerShown: false }} />
    </LokasiProvider>
  );
}