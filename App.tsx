import React, { useEffect, useMemo, useState } from "react";
import { Image, Alert, Modal } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AuthScreen from "./components/AuthScreen";
import StudioWorkspace from "./components/StudioWorkspace";
import { HeroMascot, NavMascot } from "./components/HimeArtwork";
import { supabase } from "./lib/supabase";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type Role = "client" | "master";
type Tab = "home" | "designs" | "masters" | "profile" | "portfolio" | "workspace";
type Post = { id: string | number; uri: string; kind: string; caption: string };
type Price = { id: number; title: string; amount: string };
type City = { id: number; name: string; region: string | null };
type Master = { user_id: string; name: string; city: string; bio: string; avatar_path: string | null; rating: string; reviews: string; work: string };

const burgundy = "#651D32";
const ink = "#171316";
const muted = "#8D8186";
const paper = "#FAF7F6";

const designs = [
  { title: "Бордовый глянец", detail: "Миндалевидная форма · средняя длина", tag: "Классика", mark: "✦" },
  { title: "Нежный нюд", detail: "Квадрат · короткая длина", tag: "Минимализм", mark: "♡" },
  { title: "Вишнёвый акцент", detail: "Овал · длинная длина", tag: "Тренд", mark: "✧" },
  { title: "Молочный френч", detail: "Мягкий квадрат · средняя длина", tag: "Френч", mark: "❀" },
];

const masters: Master[] = [];

function Button({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  return <TouchableOpacity onPress={onPress} style={[styles.button, secondary && styles.buttonSecondary]}><Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{title}</Text></TouchableOpacity>;
}
function SectionTitle({ title, action }: { title: string; action?: string }) {
  return <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Text style={styles.action}>{action}</Text> : null}</View>;
}
function PhotoPlaceholder() {
  return <View style={styles.photo}><Text style={styles.photoPlus}>＋</Text><Text style={styles.photoHint}>Фото мастера</Text></View>;
}

export default function App() {
  const [role, setRole] = useState<Role | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [tab, setTab] = useState<Tab>("home");
  const [city, setCity] = useState("Ногинск");
  const [cityId, setCityId] = useState<number | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [cityPickerVisible, setCityPickerVisible] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [masters, setMasters] = useState<Master[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<Master | null>(null);
  const [masterReviews, setMasterReviews] = useState<any[]>([]);
  const [bookingWhen, setBookingWhen] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [masterCity, setMasterCity] = useState("Екатеринбург");
  const [masterName, setMasterName] = useState("");
  const [profileName, setProfileName] = useState("");
  const [masterBio, setMasterBio] = useState("");
  const [masterPhoto, setMasterPhoto] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCaption, setPostCaption] = useState("");
  const [prices, setPrices] = useState<Price[]>([{id:1,title:"Маникюр с покрытием",amount:"2000"},{id:2,title:"Укрепление",amount:"500"},{id:3,title:"Дизайн",amount:"от 100"}]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("Все");
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => {
    let active = true;
    const loadDirectory = async () => {
      const { data: cityRows } = await supabase.from("cities").select("id,name,region").order("name");
      if (active) setCities((cityRows || []) as City[]);
      const { data: masterRows } = await supabase.from("master_profiles").select("user_id,display_name,bio,avatar_path").eq("is_visible", true);
      if (!masterRows?.length || !active) { if (active) setMasters([]); return; }
      const ids = masterRows.map(m => m.user_id);
      const [{ data: profiles }, { data: services }, { data: reviews }] = await Promise.all([
        supabase.from("profiles").select("user_id,city_id").in("user_id", ids),
        supabase.from("master_services").select("master_id,title").in("master_id", ids).eq("is_active", true),
        supabase.from("reviews").select("master_id,rating").in("master_id", ids),
      ]);
      const cityIds = [...new Set((profiles || []).map(p => p.city_id).filter(Boolean))];
      const { data: cityLookup } = cityIds.length ? await supabase.from("cities").select("id,name").in("id", cityIds) : { data: [] as any[] };
      const cityMap = new Map((cityLookup || []).map(x => [x.id, x.name]));
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      const serviceMap = new Map<string,string[]>();
      (services || []).forEach(s => serviceMap.set(s.master_id,[...(serviceMap.get(s.master_id)||[]),s.title]));
      const reviewMap = new Map<string,number[]>();
      (reviews || []).forEach(r => reviewMap.set(r.master_id,[...(reviewMap.get(r.master_id)||[]),r.rating]));
      const mapped: Master[] = masterRows.map(m => {
        const ratings = reviewMap.get(m.user_id) || [];
        return { user_id:m.user_id, name:m.display_name || "Мастер HIME", city:cityMap.get(profileMap.get(m.user_id)?.city_id) || "", bio:m.bio || "", avatar_path:m.avatar_path, rating:ratings.length ? (ratings.reduce((a,b)=>a+b,0)/ratings.length).toFixed(1) : "—", reviews:ratings.length ? ratings.length+" отзывов" : "Пока без отзывов", work:(serviceMap.get(m.user_id)||[]).join(" · ") || "Услуги уточняются" };
      }).filter(m => !!m.city);
      if (active) setMasters(mapped);
    };
    void loadDirectory();
    return () => { active = false; };
  }, []);


  const filteredMasters = useMemo(() => masters.filter(m => m.city.trim().toLowerCase() === city.trim().toLowerCase() && (m.name.toLowerCase().includes(query.toLowerCase()) || m.work.toLowerCase().includes(query.toLowerCase()))), [query, city, masters]);
  useEffect(() => {
    let active = true;
    const loadSaved = async () => {
      if (role !== "client" || !signedIn) { setSaved([]); return; }
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data, error } = await supabase.from("favorite_masters").select("master_id").eq("client_id", auth.user.id);
      if (!error && active) setSaved((data || []).map(row => row.master_id));
    };
    void loadSaved();
    return () => { active = false; };
  }, [role, signedIn]);

  const toggleSaved = async (masterId: string) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { Alert.alert("Нужен вход", "Войди в аккаунт, чтобы сохранять мастеров."); return; }
    const alreadySaved = saved.includes(masterId);
    const result = alreadySaved
      ? await supabase.from("favorite_masters").delete().eq("client_id", auth.user.id).eq("master_id", masterId)
      : await supabase.from("favorite_masters").insert({ client_id: auth.user.id, master_id: masterId });
    if (result.error) { Alert.alert("Не удалось обновить избранное", result.error.message); return; }
    setSaved(old => alreadySaved ? old.filter(id => id !== masterId) : [...old, masterId]);
  };
  const openMaster = async (master: Master) => {
    setSelectedMaster(master);
    setMasterReviews([]);
    const { data, error } = await supabase.from("reviews").select("id,rating,body,created_at").eq("master_id", master.user_id).order("created_at", { ascending: false });
    if (!error) setMasterReviews(data || []);
  };
  const createBooking = async () => {
    if (!selectedMaster) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { Alert.alert("Нужен вход", "Войди в аккаунт, чтобы записаться."); return; }
    const when = new Date(bookingWhen);
    if (!bookingWhen.trim() || Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) { Alert.alert("Проверь дату", "Укажи будущую дату и время, например 2026-11-25T15:00:00+03:00."); return; }
    const { error } = await supabase.from("bookings").insert({ client_id: auth.user.id, master_id: selectedMaster.user_id, starts_at: when.toISOString(), status: "pending", client_note: bookingNote.trim() || null });
    if (error) Alert.alert("Не удалось отправить заявку", error.message);
    else { setBookingWhen(""); setBookingNote(""); setSelectedMaster(null); Alert.alert("Заявка отправлена", "Мастер сможет подтвердить или отклонить запись в своём кабинете."); }
  };

  useEffect(() => {
    let alive = true;
    const restore = async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      if (data.session) {
        setSignedIn(true);
        const { data: profile } = await supabase.from("profiles").select("role, full_name, city_id").eq("user_id", data.session.user.id).maybeSingle();
        if (alive && (profile?.role === "client" || profile?.role === "master")) setRole(profile.role);
        if (alive && profile?.full_name) { setProfileName(profile.full_name); setMasterName(profile.full_name); }
        if (alive && profile?.city_id) setCityId(profile.city_id);
      }
      if (alive) setAuthReady(true);
    };
    void restore();
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "PASSWORD_RECOVERY") setSignedIn(!!session);
      if (!session) { setRole(null); setProfileName(""); }
      else if (event === "SIGNED_IN") {
        void supabase.from("profiles").select("role, full_name, city_id").eq("user_id", session.user.id).maybeSingle().then(({ data: profile }) => {
          if (profile?.full_name) { setProfileName(profile.full_name); setMasterName(profile.full_name); }
          if (profile?.city_id) setCityId(profile.city_id);
          if (profile?.role === "client" || profile?.role === "master") setRole(profile.role);
        });
      }
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  const chooseRole = async (nextRole: Role) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const fullName = String(profileName.trim() || auth.user.user_metadata?.full_name || auth.user.email?.split("@")[0] || "Пользователь");
    const { error } = await supabase.from("profiles").upsert({ user_id: auth.user.id, role: nextRole, full_name: fullName, city_id: cityId }, { onConflict: "user_id" });
    if (error) { Alert.alert("Не удалось сохранить профиль", error.message); return; }
    if (nextRole === "master") {
      const { error: masterError } = await supabase.from("master_profiles").upsert({ user_id: auth.user.id, display_name: fullName, is_visible: true }, { onConflict: "user_id" });
      if (masterError) { Alert.alert("Не удалось создать профиль мастера", masterError.message); return; }
    } else {
      const { error: hideError } = await supabase.from("master_profiles").update({ is_visible: false }).eq("user_id", auth.user.id);
      if (hideError) { Alert.alert("Не удалось скрыть профиль мастера", hideError.message); return; }
    }
    setProfileName(fullName);
    setMasterName(fullName);
    setRole(nextRole);
    setTab("home");
  };

  const saveProfile = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    if (!profileName.trim()) { Alert.alert("Укажи настоящее имя", "Имя будет отображаться в профиле и в верхней панели."); return; }
    const { error } = await supabase.from("profiles").upsert({ user_id: auth.user.id, role, full_name: profileName.trim(), city_id: cityId }, { onConflict: "user_id" });
    if (error) { Alert.alert("Не удалось сохранить профиль", error.message); return; }
    await supabase.auth.updateUser({ data: { full_name: profileName.trim() } });
    if (role === "master") {
      let avatarPath: string | null = null;
      if (masterPhoto && !masterPhoto.startsWith("http")) {
        const response = await fetch(masterPhoto);
        const blob = await response.blob();
        const path = auth.user.id + "/avatar-" + Date.now() + ".jpg";
        const { error: uploadError } = await supabase.storage.from("hime-portfolio").upload(path, blob, { contentType: "image/jpeg", upsert: true });
        if (uploadError) { Alert.alert("Не удалось загрузить фото", uploadError.message); return; }
        avatarPath = path;
      }
      const masterPayload: any = { user_id: auth.user.id, display_name: masterName.trim() || profileName.trim(), bio: masterBio.trim(), is_visible: true };
      if (avatarPath) masterPayload.avatar_path = avatarPath;
      const { error: masterError } = await supabase.from("master_profiles").upsert(masterPayload, { onConflict: "user_id" });
      if (masterError) { Alert.alert("Имя сохранено, но профиль мастера не обновлён", masterError.message); return; }
      await supabase.from("master_services").delete().eq("master_id", auth.user.id);
      const serviceRows = prices.filter(p => p.title.trim()).map((p, i) => ({ master_id: auth.user.id, title: p.title.trim(), price: Number(String(p.amount).replace(",", ".").replace(/[^0-9.]/g, "")) || 0, is_active: true }));
      if (serviceRows.length) {
        const { error: serviceError } = await supabase.from("master_services").insert(serviceRows);
        if (serviceError) { Alert.alert("Профиль сохранён, но прайс не обновился", serviceError.message); return; }
      }
    }
    setMasterName(masterName.trim() || profileName.trim());
    Alert.alert("Сохранено", "Профиль, город и услуги сохранены.");
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert("Не удалось выйти", error.message);
    else { setRole(null); setSignedIn(false); }
  };

  useEffect(() => {
    let active = true;
    const loadPortfolio = async () => {
      if (role !== "master") return;
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data, error } = await supabase.from("portfolio_items").select("id,media_path,media_type,caption").eq("master_id", auth.user.id).order("created_at", { ascending: false });
      if (error || !active) return;
      setPosts((data || []).map(item => ({ id:item.id, uri:supabase.storage.from("hime-portfolio").getPublicUrl(item.media_path).data.publicUrl, kind:item.media_type, caption:item.caption || "" })));
    };
    void loadPortfolio();
    return () => { active = false; };
  }, [role]);

  if (!authReady) return <SafeAreaView style={styles.safe}><View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Text style={styles.brand}>HIME <Text style={styles.brandAccent}>STUDIO</Text></Text><Text style={styles.small}>Восстанавливаем вход...</Text></View></SafeAreaView>;
  if (!signedIn) return <AuthScreen />;


  const pickMedia = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Нужен доступ к галерее", "Разреши доступ, чтобы выбрать фото или видео работы."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, allowsEditing: false, quality: 0.85 });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const extension = asset.mimeType?.split("/")[1] || (asset.type === "video" ? "mp4" : "jpg");
      const path = auth.user.id + "/portfolio-" + Date.now() + "." + extension;
      const { error: uploadError } = await supabase.storage.from("hime-portfolio").upload(path, blob, { contentType: asset.mimeType || (asset.type === "video" ? "video/mp4" : "image/jpeg") });
      if (uploadError) { Alert.alert("Не удалось загрузить работу", uploadError.message); return; }
      const { data: row, error: insertError } = await supabase.from("portfolio_items").insert({ master_id: auth.user.id, media_path: path, media_type: asset.type === "video" ? "video" : "image", caption: postCaption.trim() }).select("id").single();
      if (insertError) { Alert.alert("Файл загружен, но публикация не сохранена", insertError.message); return; }
      const publicUrl = supabase.storage.from("hime-portfolio").getPublicUrl(path).data.publicUrl;
      setPosts(old => [{ id: row.id, uri: publicUrl, kind: asset.type || "image", caption: postCaption.trim() }, ...old]);
      setPostCaption("");
    }
  };
  const deletePortfolioPost = async (postId: string | number) => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data: item, error: fetchError } = await supabase.from("portfolio_items")
      .select("media_path").eq("id", postId).eq("master_id", auth.user.id).maybeSingle();
    if (fetchError || !item) {
      Alert.alert("Не удалось найти публикацию", fetchError?.message || "Обнови портфолио и попробуй ещё раз.");
      return;
    }
    const { error: deleteError } = await supabase.from("portfolio_items")
      .delete().eq("id", postId).eq("master_id", auth.user.id);
    if (deleteError) { Alert.alert("Не удалось удалить публикацию", deleteError.message); return; }
    const { error: storageError } = await supabase.storage.from("hime-portfolio").remove([item.media_path]);
    if (storageError) Alert.alert("Публикация удалена", "Запись удалена, но файл не удалось удалить из хранилища: " + storageError.message);
    setPosts(old => old.filter(post => post.id !== postId));
  };
  const pickMasterPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert("Нужен доступ к галерее", "Разреши доступ, чтобы выбрать фото профиля."); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (!result.canceled && result.assets?.[0]) setMasterPhoto(result.assets[0].uri);
  };

  if (!role) return (
    <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.welcome}>
        <Text style={styles.brand}>HIME <Text style={styles.brandAccent}>STUDIO</Text></Text>
        <Text style={styles.kicker}>BEAUTY · NAIL COMMUNITY</Text>
        <View style={styles.heroArt}><HeroMascot /><Text style={styles.heroCaption}>ТВОЙ СТИЛЬ. ТВОИ ПРАВИЛА.</Text></View>
        <Text style={styles.welcomeTitle}>Добро пожаловать{ "\n" }в HIME STUDIO</Text>
        <Text style={styles.body}>Пространство для тех, кто создаёт красоту и выбирает её.</Text>
        <Button title="Я клиент" onPress={() => { void chooseRole("client"); }} />
        <Button title="Я мастер" secondary onPress={() => { void chooseRole("master"); }} />
        <Text style={styles.footnote}>Выбери роль один раз. Изменить её позже можно в настройках профиля.</Text>
      </ScrollView>
    </SafeAreaView>
  );

  const isClient = role === "client";
  const title = isClient ? "Найди свой стиль" : "Твоя студия начинается здесь";
  return (
    <SafeAreaView style={styles.safe}><StatusBar barStyle="dark-content" />
      <View style={styles.topbar}><TouchableOpacity onPress={() => setTab("home")}><Text style={styles.back}>‹ Главная</Text></TouchableOpacity><View style={{ alignItems: "center" }}><Text style={styles.brandSmall}>HIME <Text style={styles.brandAccent}>STUDIO</Text></Text><Text style={styles.headerName}>{profileName || masterName || "Ваш профиль"}</Text></View><TouchableOpacity onPress={signOut}><Text style={styles.roleTag}>ВЫЙТИ</Text></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.content}>
        {tab === "home" && <>
          <Text style={styles.kicker}>BEAUTY IN YOUR CITY</Text><Text style={styles.pageTitle}>{title}</Text>
          <Text style={styles.body}>{isClient ? "Вдохновляйся дизайнами, находи мастеров рядом и выбирай то, что нравится именно тебе." : "Покажи свои работы, расскажи о себе и находи клиентов в своём городе."}</Text>
          {isClient ? <>
            <SectionTitle title="Город" /><TouchableOpacity style={styles.input} onPress={() => setCityPickerVisible(true)}><Text style={{color:city ? ink : muted}}>{city || "Выбери город из списка"}</Text></TouchableOpacity><Text style={styles.small}>Город выбирается из справочника российских городов.</Text>
            <SectionTitle title="Популярные дизайны" action="Все дизайны" />
            {designs.slice(0, 2).map((d, i) => <DesignCard key={d.title} item={d} index={i} />)}
            <SectionTitle title="Мастера рядом" action="Все мастера" />
            {masters.filter(m => m.city.toLowerCase() === city.toLowerCase()).slice(0, 1).map((m, i) => <MasterCard key={i} item={m} onPress={() => { void openMaster(m); }} saved={saved.includes(m.user_id)} onToggleSaved={() => { void toggleSaved(m.user_id); }} />)}
            <Button title="Открыть каталог мастеров" onPress={() => setTab("masters")} /><Button title="Мои записи и избранное" secondary onPress={() => setTab("workspace")} />
          </> : <>
            <View style={styles.masterIntro}><PhotoPlaceholder /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Твоя страница мастера</Text><Text style={styles.small}>Добавь фото, город и описание, чтобы клиенты могли тебя найти.</Text></View></View>
            <SectionTitle title="Портфолио работ" /><Text style={styles.small}>Добавляй фотографии и видео своих работ в своё портфолио.</Text><Button title="Добавить фото или видео" onPress={() => setTab("portfolio")} /><SectionTitle title="Мой прайс" />{prices.map(p => <Text style={styles.priceLine} key={p.id}>{p.title} · {p.amount} ₽</Text>)}<Button title="Редактировать прайс" secondary onPress={() => setTab("profile")} />
            <SectionTitle title="Быстрый старт" />
            {["Заполни описание и услуги", "Добавь фотографии своих работ", "Укажи город и свободное время", "Собирай отзывы клиентов"].map((s, i) => <View style={styles.step} key={s}><Text style={styles.stepNo}>0{i + 1}</Text><Text style={styles.stepText}>{s}</Text></View>)}
            <Button title="Открыть календарь и записи" onPress={() => setTab("workspace")} /><Button title="Перейти в мой профиль" onPress={() => setTab("profile")} />
          </>}
        </>}
        {tab === "designs" && <>
          <Text style={styles.kicker}>NAIL INSPIRATION</Text><Text style={styles.pageTitle}>Каталог дизайнов</Text><Text style={styles.body}>Выбирай идею и сохраняй понравившиеся варианты.</Text>
          <View style={styles.chips}>{["Все", "Нюд", "Френч", "Яркие", "Бордовые"].map(x => <TouchableOpacity key={x} onPress={() => setSelected(x)} style={[styles.chip, selected === x && styles.chipActive]}><Text style={[styles.chipText, selected === x && styles.chipTextActive]}>{x}</Text></TouchableOpacity>)}</View>
          {designs.filter(d => selected === "Все" || (selected === "Бордовые" ? d.title.toLowerCase().includes("борд") || d.title.toLowerCase().includes("виш") : d.title.toLowerCase().includes(selected.toLowerCase()))).map((d, i) => <DesignCard key={d.title} item={d} index={i} />)}
        </>}
        {tab === "masters" && <>
          <Text style={styles.kicker}>FIND YOUR NAIL ARTIST</Text><Text style={styles.pageTitle}>Каталог мастеров</Text><Text style={styles.body}>Поиск по городу. Смотри портфолио, рейтинг и отзывы перед записью.</Text>
          <TextInput value={query} onChangeText={setQuery} placeholder="Поиск по имени или услуге" style={styles.input} /><Text style={styles.small}>Город каталога: {city}</Text>
          {filteredMasters.map((m, i) => <MasterCard key={m.user_id} item={m} onPress={() => { void openMaster(m); }} saved={saved.includes(m.user_id)} onToggleSaved={() => { void toggleSaved(m.user_id); }} />)}
          {filteredMasters.length === 0 && <Text style={styles.small}>В выбранном городе пока нет мастеров в демонстрационном списке. Другие города не показываются.</Text>}
        </>}

        {tab === "workspace" && <StudioWorkspace role={role} city={city} fullName={profileName || masterName} />}
        {tab === "portfolio" && <>
          <Text style={styles.kicker}>MY PORTFOLIO</Text><Text style={styles.pageTitle}>Портфолио работ</Text>
          <Text style={styles.body}>Загружай фотографии и видео. Это витрина твоих работ, без лайков и комментариев.</Text>
          <TextInput value={postCaption} onChangeText={setPostCaption} placeholder="Подпись к публикации..." style={[styles.input,styles.multiline]} multiline />
          <Button title="Выбрать фото или видео из галереи" onPress={pickMedia} />
          {posts.length === 0 && <Text style={styles.small}>Публикаций пока нет. Добавь первую работу.</Text>}
          {posts.map(post=><View key={post.id} style={styles.postCard}>{post.kind === "video" ? <View style={styles.videoTile}><Text style={styles.videoIcon}>▶</Text><Text style={styles.videoLabel}>ВИДЕО РАБОТА</Text></View> : <Image source={{uri:post.uri}} style={styles.postImage} />}<Text style={styles.tag}>{post.kind === "video" ? "ВИДЕО" : "ФОТО"}</Text>{!!post.caption && <Text style={styles.cardTitle}>{post.caption}</Text>}<TouchableOpacity onPress={()=>{ void deletePortfolioPost(post.id); }} style={styles.deletePost}><Text style={styles.remove}>Удалить работу</Text></TouchableOpacity></View>)}
        </>}
        {tab === "profile" && <>
          <Text style={styles.kicker}>YOUR HIME PROFILE</Text><Text style={styles.pageTitle}>{isClient ? "Мой профиль" : "Профиль мастера"}</Text>
          <View style={styles.profileTop}><PhotoPlaceholder /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{profileName || "Твоё имя"}</Text><Text style={styles.small}>Это имя видно в верхней панели приложения.</Text></View></View>
          <Text style={styles.label}>Настоящее имя и фамилия</Text><TextInput value={profileName} onChangeText={setProfileName} placeholder="Как к тебе обращаться" style={styles.input} />
          {isClient ? <><Text style={styles.label}>Мой город</Text><TouchableOpacity style={styles.input} onPress={() => setCityPickerVisible(true)}><Text style={{color:city ? ink : muted}}>{city || "Выбери город из списка"}</Text></TouchableOpacity><Text style={styles.small}>Смена города обновляет каталог мастеров.</Text></> : <><TouchableOpacity onPress={pickMasterPhoto} style={styles.profileTop}>{masterPhoto ? <Image source={{uri:masterPhoto}} style={styles.profileImage} /> : <PhotoPlaceholder />}<Text style={styles.small}>Нажми, чтобы загрузить своё фото</Text></TouchableOpacity><Text style={styles.label}>Имя мастера</Text><TextInput value={masterName} onChangeText={setMasterName} placeholder="Имя" style={styles.input} /><Text style={styles.label}>Город приёма</Text><TouchableOpacity style={styles.input} onPress={() => setCityPickerVisible(true)}><Text style={{color:city ? ink : muted}}>{city || "Выбери город из списка"}</Text></TouchableOpacity><Text style={styles.label}>О себе</Text><TextInput value={masterBio} onChangeText={setMasterBio} multiline placeholder="Опыт, подход к работе..." style={[styles.input,styles.multiline]} />
            <Text style={styles.label}>Услуги</Text><TextInput multiline placeholder="Перечисли услуги" style={[styles.input, styles.multiline]} />
            <Text style={styles.label}>Условия посещения</Text><TextInput multiline placeholder="Например: можно ли с детьми, есть ли животные, курение, парковка и другие важные детали." style={[styles.input, styles.multiline]} />
            <SectionTitle title="Условия посещения" /><TextInput multiline placeholder="Например: можно ли с детьми, есть ли парковка и другие условия..." style={[styles.input,styles.multiline]} /><SectionTitle title="Мой прайс · редактируй цены" />{prices.map(p => <View key={p.id} style={styles.priceEdit}><TextInput value={p.title} onChangeText={v=>setPrices(old=>old.map(x=>x.id===p.id?{...x,title:v}:x))} style={[styles.input,styles.priceName]} placeholder="Услуга" /><TextInput value={p.amount} onChangeText={v=>setPrices(old=>old.map(x=>x.id===p.id?{...x,amount:v}:x))} style={[styles.input,styles.priceAmount]} placeholder="Цена" keyboardType="decimal-pad" /><TouchableOpacity onPress={()=>setPrices(old=>old.filter(x=>x.id!==p.id))}><Text style={styles.remove}>×</Text></TouchableOpacity></View>)}<Button title="＋ Добавить услугу" secondary onPress={()=>setPrices(old=>[...old,{id:Date.now(),title:"",amount:""}])} /><Text style={styles.small}>Пока изменения хранятся только в текущем сеансе. Для публикации прайса всем клиентам подключим базу данных.</Text>
          </>}
          <Button title="Сохранить профиль" onPress={() => { void saveProfile(); }} /><SectionTitle title="Настройки аккаунта" /><Text style={styles.small}>Текущая роль: {isClient ? "Клиент" : "Мастер"}. Изменить тип аккаунта можно здесь, в настройках профиля.</Text><Button title={isClient ? "Переключиться на мастера" : "Переключиться на клиента"} secondary onPress={() => { void chooseRole(isClient ? "master" : "client"); }} />
        </>}
      </ScrollView>
      <View style={styles.nav}>
        {(isClient ? [["home","Главная"],["designs","Дизайны"],["masters","Мастера"],["workspace","Кабинет"],["profile","Профиль"]] : [["home","Главная"],["designs","Дизайны"],["masters","Мастера"],["workspace","Кабинет"],["profile","Профиль"],["portfolio","Портфолио"]]).map(([key, label]) => <TouchableOpacity key={key} onPress={() => setTab(key as Tab)} style={styles.navItem}><NavMascot active={tab === key} /><Text style={[styles.navText, tab === key && styles.navTextActive]}>{label}</Text><View style={[styles.navDot, tab === key && styles.navDotActive]} /></TouchableOpacity>)}
      </View>
      <Modal visible={!!selectedMaster} animationType="slide" transparent onRequestClose={() => setSelectedMaster(null)}><View style={styles.modalBackdrop}><View style={styles.cityModal}><ScrollView keyboardShouldPersistTaps="handled">{selectedMaster && <><Text style={styles.pageTitle}>{selectedMaster.name}</Text><Text style={styles.small}>{selectedMaster.city}</Text><Text style={styles.stars}>{selectedMaster.rating === "—" ? "Пока без оценок" : "★ "+selectedMaster.rating} · {selectedMaster.reviews}</Text><Text style={styles.sectionTitle}>О мастере</Text><Text style={styles.body}>{selectedMaster.bio || "Мастер пока не добавил описание."}</Text><Text style={styles.sectionTitle}>Услуги</Text><Text style={styles.body}>{selectedMaster.work}</Text><Text style={styles.sectionTitle}>Отзывы клиентов</Text>{masterReviews.length ? masterReviews.map(r => <View key={r.id} style={styles.review}><Text style={styles.stars}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</Text><Text style={styles.small}>{r.body || "Клиент оставил оценку без комментария."}</Text><Text style={styles.small}>{new Date(r.created_at).toLocaleDateString("ru-RU")}</Text></View>) : <Text style={styles.small}>Подтверждённых отзывов пока нет. Здесь будут отображаться только отзывы, привязанные к завершённым записям.</Text>}{role === "client" && <><Text style={styles.sectionTitle}>Записаться к мастеру</Text><TextInput value={bookingWhen} onChangeText={setBookingWhen} placeholder="Дата и время: 2026-11-25T15:00:00+03:00" style={styles.input}/><TextInput value={bookingNote} onChangeText={setBookingNote} placeholder="Комментарий к записи (необязательно)" style={[styles.input,styles.multiline]} multiline/><Button title="Отправить заявку на запись" onPress={() => { void createBooking(); }}/></>}</>}</ScrollView><Button title="Закрыть профиль" secondary onPress={() => setSelectedMaster(null)}/></View></View></Modal>
      <Modal visible={cityPickerVisible} animationType="slide" transparent onRequestClose={() => setCityPickerVisible(false)}><View style={styles.modalBackdrop}><View style={styles.cityModal}><Text style={styles.sectionTitle}>Выбери город</Text><TextInput value={citySearch} onChangeText={setCitySearch} placeholder="Поиск города или региона" style={styles.input} /><ScrollView keyboardShouldPersistTaps="handled">{cities.filter(x => (x.name+" "+(x.region||"")).toLowerCase().includes(citySearch.toLowerCase())).map(x => <TouchableOpacity key={x.id} style={styles.cityOption} onPress={() => { setCity(x.name); setCityId(x.id); setMasterCity(x.name); setCityPickerVisible(false); setCitySearch(""); }}><Text style={styles.cardTitle}>{x.name}</Text><Text style={styles.small}>{x.region || "Россия"}</Text></TouchableOpacity>)}</ScrollView><Button title="Закрыть" secondary onPress={() => setCityPickerVisible(false)} /></View></View></Modal>
    </SafeAreaView>
  );
}


function AnimeMascot() {
  return (
    <View style={styles.mascotStage}>
      <View style={styles.mascotHalo} />
      <View style={styles.mascotHairBack} />
      <View style={styles.mascotBody} />
      <View style={styles.mascotNeck} />
      <View style={styles.mascotFace}>
        <View style={styles.mascotFringe} />
        <View style={styles.mascotEyeRow}>
          <View style={styles.mascotEye}><View style={styles.mascotEyeShine} /></View>
          <View style={styles.mascotEye}><View style={styles.mascotEyeShine} /></View>
        </View>
        <View style={styles.mascotBlushLeft} /><View style={styles.mascotBlushRight} />
        <View style={styles.mascotMouth} />
      </View>
      <View style={styles.mascotHairSideLeft} /><View style={styles.mascotHairSideRight} />
      <View style={styles.mascotArm}><View style={styles.mascotHand}><View style={styles.mascotNail} /><View style={[styles.mascotNail, styles.mascotNailTwo]} /><View style={[styles.mascotNail, styles.mascotNailThree]} /></View></View>
      <View style={styles.mascotBow}><View style={styles.mascotBowLoop} /><View style={[styles.mascotBowLoop, styles.mascotBowLoopRight]} /><View style={styles.mascotBowKnot} /></View>
      <View style={styles.mascotSparkle}><Text style={styles.mascotSparkleText}>✦</Text></View>
    </View>
  );
}

function DesignCard({ item, index }: { item: typeof designs[number]; index: number }) {
  return <View style={styles.designCard}><View style={[styles.designVisual, index % 2 === 0 ? styles.visualDark : styles.visualLight]}><Text style={styles.visualMark}>{item.mark}</Text><Text style={styles.visualLabel}>HIME NAIL DESIGN</Text></View><View style={styles.designInfo}><Text style={styles.tag}>{item.tag}</Text><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.small}>{item.detail}</Text></View></View>;
}
function MasterCard({ item, onPress, saved = false, onToggleSaved }: { item: typeof masters[number]; onPress: () => void; saved?: boolean; onToggleSaved?: () => void }) {
  const avatar = item.avatar_path ? supabase.storage.from("hime-portfolio").getPublicUrl(item.avatar_path).data.publicUrl : null;
  return <View style={styles.masterCard}><View style={styles.masterRow}>{avatar ? <Image source={{uri:avatar}} style={styles.profileImage} /> : <PhotoPlaceholder />}<View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.small}>{item.city}</Text><Text style={styles.stars}>{item.rating === "—" ? "Без оценок" : "★ "+item.rating} <Text style={styles.small}>· {item.reviews}</Text></Text></View></View><Text style={styles.small}>{item.work}</Text><Button title="Посмотреть профиль и отзывы" secondary onPress={onPress} />{onToggleSaved && <Button title={saved ? "♥ В избранном · Убрать" : "♡ В избранное"} secondary onPress={onToggleSaved} />}</View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: paper }, welcome: { flexGrow: 1, padding: 26, justifyContent: "center" },
  brand: { fontSize: 24, letterSpacing: 5, fontWeight: "800", color: ink }, brandSmall: { fontSize: 15, letterSpacing: 2, fontWeight: "800", color: ink }, brandAccent: { color: burgundy },
  kicker: { color: burgundy, letterSpacing: 3, fontSize: 10, fontWeight: "800", marginTop: 24, marginBottom: 10 },
  heroArt: { height: 230, marginTop: 28, marginBottom: 26, borderRadius: 18, backgroundColor: "#EDE2E3", alignItems: "center", justifyContent: "flex-end", overflow: "hidden", paddingBottom: 15 }, heroCaption: { color: burgundy, fontSize: 9, letterSpacing: 3, fontWeight: "700" },
  mascotStage: { width: 230, height: 188, alignItems: "center", justifyContent: "flex-end" }, mascotHalo: { position: "absolute", width: 166, height: 166, borderRadius: 83, backgroundColor: "#F7EFF0", top: 10 }, mascotHairBack: { position: "absolute", width: 116, height: 142, borderTopLeftRadius: 58, borderTopRightRadius: 58, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, backgroundColor: "#351522", top: 19 }, mascotBody: { position: "absolute", width: 116, height: 64, borderTopLeftRadius: 55, borderTopRightRadius: 55, backgroundColor: "#76263E", bottom: 0 }, mascotNeck: { position: "absolute", width: 27, height: 28, backgroundColor: "#F2C7B9", borderBottomLeftRadius: 12, borderBottomRightRadius: 12, bottom: 48, zIndex: 2 }, mascotFace: { position: "absolute", width: 84, height: 100, borderRadius: 42, backgroundColor: "#F6D2C5", top: 42, zIndex: 3, alignItems: "center" }, mascotFringe: { position: "absolute", top: -3, width: 88, height: 48, borderTopLeftRadius: 45, borderTopRightRadius: 45, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, backgroundColor: "#351522" }, mascotEyeRow: { position: "absolute", top: 48, width: 56, flexDirection: "row", justifyContent: "space-between" }, mascotEye: { width: 13, height: 18, borderRadius: 9, backgroundColor: "#351522", alignItems: "flex-end", padding: 3 }, mascotEyeShine: { width: 4, height: 5, borderRadius: 3, backgroundColor: "#FFF" }, mascotBlushLeft: { position: "absolute", left: 8, top: 68, width: 15, height: 6, borderRadius: 8, backgroundColor: "#E9A4A5", opacity: 0.65 }, mascotBlushRight: { position: "absolute", right: 8, top: 68, width: 15, height: 6, borderRadius: 8, backgroundColor: "#E9A4A5", opacity: 0.65 }, mascotMouth: { position: "absolute", top: 76, width: 10, height: 5, borderBottomWidth: 2, borderColor: "#A85C68", borderRadius: 8 }, mascotHairSideLeft: { position: "absolute", left: 58, top: 68, width: 25, height: 88, borderBottomLeftRadius: 22, borderBottomRightRadius: 20, backgroundColor: "#351522", zIndex: 4, transform: [{ rotate: "8deg" }] }, mascotHairSideRight: { position: "absolute", right: 58, top: 67, width: 25, height: 90, borderBottomLeftRadius: 20, borderBottomRightRadius: 22, backgroundColor: "#351522", zIndex: 4, transform: [{ rotate: "-8deg" }] }, mascotArm: { position: "absolute", right: 45, bottom: 21, width: 22, height: 75, borderRadius: 14, backgroundColor: "#F2C7B9", zIndex: 5, transform: [{ rotate: "-42deg" }] }, mascotHand: { position: "absolute", top: -12, left: -7, width: 35, height: 29, borderRadius: 18, backgroundColor: "#F2C7B9", transform: [{ rotate: "20deg" }] }, mascotNail: { position: "absolute", top: 4, left: 7, width: 6, height: 9, borderRadius: 4, backgroundColor: "#8E2948", borderWidth: 1, borderColor: "#F5D6D5" }, mascotNailTwo: { left: 16, top: 1 }, mascotNailThree: { left: 24, top: 5 }, mascotBow: { position: "absolute", top: 24, right: 65, zIndex: 6, flexDirection: "row" }, mascotBowLoop: { width: 17, height: 13, borderRadius: 10, backgroundColor: "#9A3652", transform: [{ rotate: "25deg" }] }, mascotBowLoopRight: { transform: [{ rotate: "-25deg" }] }, mascotBowKnot: { position: "absolute", width: 8, height: 8, borderRadius: 5, backgroundColor: "#D9A9A9", left: 13, top: 3 }, mascotSparkle: { position: "absolute", left: 36, top: 47 }, mascotSparkleText: { color: "#A65A70", fontSize: 22 },
  welcomeTitle: { color: ink, fontSize: 32, lineHeight: 39, fontWeight: "700" }, pageTitle: { color: ink, fontSize: 30, lineHeight: 36, fontWeight: "700" }, body: { color: muted, fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 18 },
  button: { backgroundColor: burgundy, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 10 }, buttonSecondary: { backgroundColor: "#F0E7E8", borderWidth: 1, borderColor: "#E5D4D8" }, buttonText: { color: "#FFF", fontSize: 14, fontWeight: "700" }, buttonTextSecondary: { color: burgundy },
  footnote: { color: muted, fontSize: 11, textAlign: "center", marginTop: 18 }, topbar: { height: 64, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderColor: "#EEE7E7" }, headerName: { color: muted, fontSize: 10, marginTop: 3, maxWidth: 190 }, back: { color: burgundy, fontWeight: "700" }, roleTag: { color: muted, fontSize: 9, letterSpacing: 2 },
  content: { padding: 20, paddingBottom: 35 }, sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22, marginBottom: 12 }, sectionTitle: { color: ink, fontSize: 18, fontWeight: "700" }, action: { color: burgundy, fontSize: 11, fontWeight: "700" },
  input: { backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E9DFE1", borderRadius: 11, paddingHorizontal: 14, paddingVertical: 13, color: ink, marginBottom: 10, fontSize: 14 }, label: { color: ink, fontWeight: "700", marginTop: 12, marginBottom: 7, fontSize: 12 }, multiline: { minHeight: 90, textAlignVertical: "top" },
  designCard: { backgroundColor: "#FFF", borderRadius: 15, overflow: "hidden", marginBottom: 14, borderWidth: 1, borderColor: "#EFE7E8" }, designVisual: { height: 138, justifyContent: "center", alignItems: "center" }, visualDark: { backgroundColor: "#3C1725" }, visualLight: { backgroundColor: "#EADBDD" }, visualMark: { color: "#C99AA8", fontSize: 58 }, visualLabel: { color: "#D9B8C1", letterSpacing: 3, fontSize: 8, marginTop: 2 }, designInfo: { padding: 14 }, tag: { color: burgundy, fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase" }, cardTitle: { color: ink, fontSize: 15, fontWeight: "700", marginTop: 4 }, small: { color: muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginBottom: 16 }, chip: { borderWidth: 1, borderColor: "#E5D8DB", borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8 }, chipActive: { backgroundColor: burgundy, borderColor: burgundy }, chipText: { color: muted, fontSize: 11 }, chipTextActive: { color: "#FFF" },
  masterCard: { backgroundColor: "#FFF", borderRadius: 15, borderWidth: 1, borderColor: "#EFE7E8", padding: 14, marginTop: 12 }, masterRow: { flexDirection: "row", gap: 13, alignItems: "center", marginBottom: 12 }, photo: { width: 76, height: 76, borderRadius: 38, backgroundColor: "#FFF", borderWidth: 1, borderColor: "#E7DDE0", alignItems: "center", justifyContent: "center" }, photoPlus: { color: burgundy, fontSize: 25 }, photoHint: { color: muted, fontSize: 8 }, stars: { color: "#A66B36", fontWeight: "800", marginTop: 5, fontSize: 12 }, reviewText: { color: "#665B60", fontSize: 12, fontStyle: "italic", marginTop: 10 },
  profileImage: { width: 76, height: 76, borderRadius: 38 }, postCard: { backgroundColor: "#FFF", borderRadius: 14, padding: 12, marginTop: 14 }, postImage: { width: "100%", height: 230, borderRadius: 10 }, videoTile: { width: "100%", height: 230, borderRadius: 10, backgroundColor: "#3C1725", alignItems: "center", justifyContent: "center" }, videoIcon: { color: "#FFF", fontSize: 38 }, videoLabel: { color: "#EADBDD", letterSpacing: 2, fontSize: 10, marginTop: 8 }, deletePost: { alignSelf: "flex-end", paddingVertical: 8 }, priceLine: { color: ink, fontSize: 13, paddingVertical: 8 }, priceEdit: { flexDirection: "row", alignItems: "center", gap: 6 }, priceName: { flex: 1 }, priceAmount: { width: 90 }, remove: { color: burgundy, fontSize: 25, paddingHorizontal: 5 },
  masterIntro: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#F0E7E8", padding: 14, borderRadius: 15, marginVertical: 12 }, step: { flexDirection: "row", alignItems: "center", paddingVertical: 13, borderBottomWidth: 1, borderColor: "#EEE7E7" }, stepNo: { color: burgundy, fontWeight: "800", marginRight: 14 }, stepText: { color: ink, fontSize: 13 }, profileTop: { flexDirection: "row", gap: 14, alignItems: "center", marginVertical: 20 }, review: { backgroundColor: "#FFF", borderRadius: 12, padding: 14 }, modalBackdrop: { flex:1, backgroundColor:"rgba(20,10,14,0.45)", justifyContent:"flex-end" }, cityModal: { height:"82%", backgroundColor:paper, borderTopLeftRadius:22, borderTopRightRadius:22, padding:20 }, cityOption: { paddingVertical:12, borderBottomWidth:1, borderColor:"#EEE7E7" }, nav: { height: 65, borderTopWidth: 1, borderColor: "#EEE7E7", backgroundColor: "#FFF", flexDirection: "row", justifyContent: "space-around", alignItems: "center" }, navItem: { alignItems: "center", justifyContent: "center", flex: 1 }, navText: { color: muted, fontSize: 10 }, navTextActive: { color: burgundy, fontWeight: "800" }, navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "transparent", marginTop: 5 }, navDotActive: { backgroundColor: burgundy }
});