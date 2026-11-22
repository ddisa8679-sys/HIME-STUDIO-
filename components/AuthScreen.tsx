import React, { useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as Linking from "expo-linking";
import { supabase } from "../lib/supabase";

type Mode = "login" | "signup" | "forgot" | "recovery";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(14)).current;

  const switchMode = (next: Mode) => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 130, useNativeDriver: true }),
      Animated.timing(slide, { toValue: -8, duration: 130, useNativeDriver: true }),
    ]).start(() => {
      setMode(next);
      setNotice("");
      setPassword("");
      setRepeatPassword("");
      slide.setValue(12);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 280, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]).start();
    });
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();

    const handleUrl = async (url: string) => {
      const parsed = Linking.parse(url);
      const params = (parsed.queryParams || {}) as Record<string, string | undefined>;
      const hash = url.split("#")[1] || "";
      const hashParams: Record<string, string> = {};
      hash.split("&").forEach(pair => {
        const [key, ...rest] = pair.split("=");
        if (key) hashParams[key] = decodeURIComponent(rest.join("=") || "");
      });
      const type = params.type || hashParams.type;
      const tokenHash = params.token_hash;
      if (tokenHash && (type === "signup" || type === "email" || type === "recovery")) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as "signup" | "email" | "recovery" });
        if (error) Alert.alert("Не удалось обработать ссылку", error.message);
        else if (type === "recovery") switchMode("recovery");
        else Alert.alert("E-mail подтверждён", "Теперь можно войти в HIME STUDIO.");
      } else if (type === "recovery" && hashParams.access_token && hashParams.refresh_token) {
        const { error } = await supabase.auth.setSession({ access_token: hashParams.access_token, refresh_token: hashParams.refresh_token });
        if (error) Alert.alert("Ошибка ссылки", error.message);
        else switchMode("recovery");
      }
    };
    Linking.getInitialURL().then(url => { if (url) void handleUrl(url); });
    const subscription = Linking.addEventListener("url", event => { void handleUrl(event.url); });
    return () => subscription.remove();
  }, []);

  const redirectTo = Linking.createURL("auth/callback");
  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (mode !== "recovery" && !normalizedEmail) { Alert.alert("Нужен e-mail", "Введи свой действующий адрес электронной почты."); return; }
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!name.trim()) { Alert.alert("Укажи имя", "Нужно настоящее имя, чтобы оформить профиль."); return; }
        if (password.length < 8) { Alert.alert("Слишком короткий пароль", "Используй не менее 8 символов."); return; }
        if (password !== repeatPassword) { Alert.alert("Пароли не совпадают", "Проверь оба поля с паролем."); return; }
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: redirectTo },
        });
        if (error) throw error;
        if (data.session) setNotice("Почта подтверждена автоматически. Аккаунт создан.");
        else setNotice("Письмо для подтверждения отправлено на " + normalizedEmail + ". Открой его, чтобы активировать аккаунт.");
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
        if (error) throw error;
        setNotice("Ссылка для сброса пароля отправлена на " + normalizedEmail + ".");
      } else {
        if (password.length < 8) { Alert.alert("Слишком короткий пароль", "Используй не менее 8 символов."); return; }
        if (password !== repeatPassword) { Alert.alert("Пароли не совпадают", "Проверь оба поля с паролем."); return; }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setNotice("Пароль обновлён. Аккаунт снова защищён.");
        switchMode("login");
      }
    } catch (error: any) {
      Alert.alert("Не получилось", error?.message || "Попробуй ещё раз.");
    } finally {
      setBusy(false);
    }
  };

  const heading = mode === "signup" ? "Создать аккаунт" : mode === "forgot" ? "Восстановить пароль" : mode === "recovery" ? "Новый пароль" : "С возвращением";
  const description = mode === "signup" ? "Твой аккаунт HIME STUDIO начинается здесь." : mode === "forgot" ? "Отправим письмо со ссылкой для восстановления доступа." : mode === "recovery" ? "Придумай новый пароль для своего аккаунта." : "Войди, чтобы продолжить.";
  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <Text style={s.brand}>HIME <Text style={s.accent}>STUDIO</Text></Text>
          <Text style={s.kicker}>BEAUTY · NAIL COMMUNITY</Text>
          <View style={s.ornament}><Text style={s.flower}>✿</Text></View>
          <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <Text style={s.heading}>{heading}</Text>
            <Text style={s.description}>{description}</Text>
            {mode === "signup" && <Field label="Настоящее имя" value={name} onChangeText={setName} placeholder="Как тебя зовут" />}
            {mode !== "recovery" && <Field label="E-mail" value={email} onChangeText={setEmail} placeholder="name@example.com" keyboardType="email-address" autoCapitalize="none" /> }
            {mode !== "forgot" && <>
              <Field label={mode === "recovery" ? "Новый пароль" : "Пароль"} value={password} onChangeText={setPassword} placeholder="Минимум 8 символов" secureTextEntry />
              {(mode === "signup" || mode === "recovery") && <Field label="Повтори пароль" value={repeatPassword} onChangeText={setRepeatPassword} placeholder="Ещё раз пароль" secureTextEntry />}
            </>}
            {!!notice && <Text style={s.notice}>{notice}</Text>}
            <TouchableOpacity disabled={busy} onPress={submit} style={[s.primary, busy && { opacity: 0.6 }]}>
              <Text style={s.primaryText}>{busy ? "Подожди..." : mode === "signup" ? "Зарегистрироваться" : mode === "forgot" ? "Отправить ссылку" : mode === "recovery" ? "Сохранить пароль" : "Войти"}</Text>
            </TouchableOpacity>
            {mode === "login" && <TouchableOpacity onPress={() => switchMode("forgot")} style={s.linkButton}><Text style={s.link}>Забыл пароль?</Text></TouchableOpacity>}
            <View style={s.bottom}>
              <Text style={s.bottomText}>{mode === "signup" ? "Уже есть аккаунт? " : "Впервые в HIME STUDIO? "}</Text>
              <TouchableOpacity onPress={() => switchMode(mode === "signup" ? "login" : "signup")}><Text style={s.link}>{mode === "signup" ? "Войти" : "Создать аккаунт"}</Text></TouchableOpacity>
            </View>
            {(mode === "forgot" || mode === "recovery") && <TouchableOpacity onPress={() => switchMode("login")}><Text style={[s.link, { textAlign: "center", marginTop: 20 }]}>Вернуться ко входу</Text></TouchableOpacity>}
          </Animated.View>
          <Text style={s.foot}>Защищённый вход · HIME STUDIO</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field(props: any) {
  const { label, ...inputProps } = props;
  return <View style={s.field}><Text style={s.label}>{label}</Text><TextInput {...inputProps} style={s.input} placeholderTextColor="#A99BA0" autoCorrect={false} /></View>;
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FAF7F6" },
  container: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 26, paddingVertical: 34 },
  brand: { fontSize: 23, letterSpacing: 5, fontWeight: "800", color: "#171316" },
  accent: { color: "#651D32" },
  kicker: { color: "#8D6874", letterSpacing: 3, fontSize: 9, fontWeight: "800", marginTop: 9 },
  ornament: { height: 112, borderRadius: 16, backgroundColor: "#F0E5E7", alignItems: "center", justifyContent: "center", marginTop: 28, marginBottom: 26 },
  flower: { color: "#651D32", fontSize: 58 },
  heading: { color: "#171316", fontSize: 29, fontWeight: "700" },
  description: { color: "#8D8186", fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 20 },
  field: { marginBottom: 13 },
  label: { color: "#3A3034", fontWeight: "700", fontSize: 11, marginBottom: 7 },
  input: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E9DFE1", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 14, fontSize: 14, color: "#171316" },
  primary: { backgroundColor: "#651D32", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 7 },
  primaryText: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  linkButton: { alignItems: "center", padding: 13 },
  link: { color: "#651D32", fontWeight: "700", fontSize: 12 },
  bottom: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  bottomText: { color: "#8D8186", fontSize: 12 },
  notice: { color: "#651D32", backgroundColor: "#F0E5E7", padding: 12, borderRadius: 9, fontSize: 12, lineHeight: 18, marginBottom: 10 },
  foot: { textAlign: "center", color: "#A99BA0", fontSize: 9, letterSpacing: 1, marginTop: 30 },
});
