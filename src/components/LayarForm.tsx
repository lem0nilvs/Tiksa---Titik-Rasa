import { KeyboardAvoidingView, ScrollView, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "../theme";

type Props = {
  children: React.ReactNode;
  isiStyle?: StyleProp<ViewStyle>; // gaya isi (padding) yang dulu ada di contentContainerStyle
};

// Pembungkus form: isi naik saat keyboard muncul, dan layar bisa digulir
export default function LayarForm({ children, isiStyle }: Props) {
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior="padding">
      <ScrollView
        contentContainerStyle={[{ flexGrow: 1 }, isiStyle]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}