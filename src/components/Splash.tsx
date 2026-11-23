import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, Text, View } from "react-native";
import { colors, font } from "../theme";

export default function Splash() {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, [anim]);

  const dot = (delayed: boolean) => (
    <Animated.View
      style={[
        s.dot,
        { opacity: delayed ? Animated.subtract(1, anim).interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] })
                           : anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) },
      ]}
    />
  );

  return (
    <View style={s.wrap}>
      <View style={[s.glow, { top: -86, right: -75, width: 190, height: 190 }]} />
      <View style={[s.glow, { bottom: -30, left: -105, width: 230, height: 230 }]} />

      <View style={s.center}>
        <Image source={require("../../assets/images/tiksa-logo.png")} style={s.logo} resizeMode="contain" />
        <Text style={s.brand}>Tiksa</Text>
        <Text style={s.expand}>TITIK RASA</Text>
        <Text style={s.tagline}>Makanan & minuman enak di sekitarmu</Text>
      </View>

      <View style={s.bottom}>
        <View style={s.dots}>
          {dot(false)}
          {dot(true)}
          {dot(false)}
        </View>
        <Text style={s.loading}>Menyiapkan Tiksa...</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, overflow: "hidden" },
  glow: { position: "absolute", borderRadius: 999, backgroundColor: colors.peach },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 60 },
  logo: { width: 164, height: 178 },
  brand: { fontFamily: font.extrabold, fontSize: 52, color: colors.primary, marginTop: 8 },
  expand: { fontFamily: font.semibold, fontSize: 10, letterSpacing: 4, color: colors.primary, marginTop: 2 },
  tagline: { fontFamily: font.regular, fontSize: 13, color: colors.primary, marginTop: 28 },
  bottom: { alignItems: "center", paddingBottom: 110 },
  dots: { flexDirection: "row", gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  loading: { fontFamily: font.regular, fontSize: 10, color: colors.primary, marginTop: 10 },
});