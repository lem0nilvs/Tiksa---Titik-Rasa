import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, font, radius } from "../theme";

type Props = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
  password?: boolean;
  invalid?: boolean;
};

export default function Field({ label, error, hint, password, invalid, ...rest }: Props) {
  const [tampil, setTampil] = useState(false);

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.box, (!!error || invalid) && s.boxError]}>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#8aa0d6"
          {...rest}
          style={s.input}
          secureTextEntry={password && !tampil}
        />
        {password && (
          <Pressable onPress={() => setTampil((v) => !v)} hitSlop={10}>
            <Ionicons name={tampil ? "eye-off-outline" : "eye-outline"} size={20} color={colors.primary} />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text style={s.error}>{error}</Text>
      ) : hint ? (
        <Text style={s.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 16 },
  label: { fontFamily: font.semibold, fontSize: 12, color: colors.primary, marginBottom: 6 },
  box: {
    height: 52, flexDirection: "row", alignItems: "center",
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.input,
    paddingHorizontal: 16, backgroundColor: colors.white,
  },
  boxError: { borderColor: colors.danger, backgroundColor: "#fef2f2" },
  input: { flex: 1, fontFamily: font.regular, fontSize: 13, color: colors.primary },
  error: { fontFamily: font.medium, fontSize: 11, color: colors.danger, marginTop: 5, marginLeft: 2 },
  hint: { fontFamily: font.regular, fontSize: 10, color: colors.primary, marginTop: 5, marginLeft: 2 },
});