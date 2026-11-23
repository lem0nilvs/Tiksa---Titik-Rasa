import { useState } from "react";
import { Pressable, StyleSheet, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius } from "../theme";

export default function PasswordInput(props: TextInputProps) {
  const [tampil, setTampil] = useState(false);

  return (
    <View style={s.box}>
      <TextInput
        {...props}
        style={s.input}
        placeholderTextColor="#8aa0d6"
        secureTextEntry={!tampil}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Pressable
        onPress={() => setTampil((v) => !v)}
        hitSlop={10}
        accessibilityLabel={tampil ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
      >
        <Ionicons
          name={tampil ? "eye-off-outline" : "eye-outline"}
          size={20}
          color={colors.primary}
        />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    fontFamily: font.regular,
    fontSize: 13,
    color: colors.primary,
  },
});