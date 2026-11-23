import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font } from "../../theme";

const AKTIF = colors.primary;
const NONAKTIF = "#8aa0d6";

type IkonProps = {
  focused: boolean;
  nama: React.ComponentProps<typeof Ionicons>["name"];
  namaAktif: React.ComponentProps<typeof Ionicons>["name"];
};

function Ikon({ focused, nama, namaAktif }: IkonProps) {
  return (
    <Ionicons
      name={focused ? namaAktif : nama}
      size={24}
      color={focused ? AKTIF : NONAKTIF}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: AKTIF,
        tabBarInactiveTintColor: NONAKTIF,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: colors.border,
          backgroundColor: colors.white,
        },
        tabBarLabelStyle: { fontFamily: font.medium, fontSize: 10 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarIcon: ({ focused }) => (
            <Ikon focused={focused} nama="home-outline" namaAktif="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="peta"
        options={{
          title: "Peta",
          tabBarIcon: ({ focused }) => (
            <Ikon focused={focused} nama="location-outline" namaAktif="location" />
          ),
        }}
      />
      <Tabs.Screen
        name="tambah"
        options={{
          title: "Tambah",
          tabBarIcon: () => (
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 20, fontFamily: font.bold, lineHeight: 24 }}>
                +
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: "Profil",
          tabBarIcon: ({ focused }) => (
            <Ikon focused={focused} nama="person-outline" namaAktif="person" />
          ),
        }}
      />
    </Tabs>
  );
}