import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

type MasterRow = { user_id: string; display_name: string | null; is_visible: boolean };
type PromotionRow = { id: string; master_id: string; plan: string; city: string; starts_on: string; ends_on: string; status: string; created_at: string };
type ReviewRow = { id: string; master_id: string; client_id: string; rating: number; body: string | null; photo_path: string | null; created_at: string };
type BookingRow = { id: string; master_id: string; client_id: string; starts_at: string; status: string };

const burgundy = "#651D32";

function Action({ title, onPress, secondary = false, danger = false }: { title: string; onPress: () => void; secondary?: boolean; danger?: boolean }) {
  return <TouchableOpacity onPress={onPress} style={[s.action, secondary && s.secondary, danger && s.danger]}><Text style={[s.actionText, secondary && s.secondaryText, danger && s.dangerText]}>{title}</Text></TouchableOpacity>;
}

export default function AdminWorkspace() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [masters, setMasters] = useState<MasterRow[]>([]);
  const [promotions, setPromotions] = useState<PromotionRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [section, setSection] = useState<"overview" | "promotions" | "masters" | "reviews" | "bookings">("overview");

  const load = useCallback(async () => {
    setLoading(true);
    const { data: isAdmin, error: gateError } = await supabase.rpc("hime_is_admin");
    if (gateError || isAdmin !== true) {
      setAllowed(false);
      setLoading(false);
      return;
    }
    setAllowed(true);
    const [masterResult, promotionResult, reviewResult, bookingResult] = await Promise.all([
      supabase.from("master_profiles").select("user_id,display_name,is_visible").order("display_name"),
      supabase.from("master_promotions").select("id,master_id,plan,city,starts_on,ends_on,status,created_at").order("created_at", { ascending: false }).limit(150),
      supabase.from("reviews").select("id,master_id,client_id,rating,body,photo_path,created_at").order("created_at", { ascending: false }).limit(150),
      supabase.from("bookings").select("id,master_id,client_id,starts_at,status").order("starts_at", { ascending: false }).limit(100)
    ]);
    const errors = [masterResult.error, promotionResult.error, reviewResult.error, bookingResult.error].filter(Boolean);
    if (errors.length) Alert.alert("Не все данные загружены", errors.map(e => e?.message).join("\n"));
    setMasters((masterResult.data || []) as MasterRow[]);
    setPromotions((promotionResult.data || []) as PromotionRow[]);
    setReviews((reviewResult.data || []) as ReviewRow[]);
    setBookings((bookingResult.data || []) as BookingRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const moderatePromotion = async (id: string, status: "active" | "rejected") => {
    const { error } = await supabase.from("master_promotions").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) Alert.alert("Не удалось обновить заявку", error.message);
    else { Alert.alert("Готово", status === "active" ? "Продвижение одобрено." : "Заявка отклонена."); void load(); }
  };

  const toggleMaster = async (master: MasterRow) => {
    const next = !master.is_visible;
    const { error } = await supabase.from("master_profiles").update({ is_visible: next }).eq("user_id", master.user_id);
    if (error) Alert.alert("Не удалось изменить видимость", error.message);
    else void load();
  };

  const removeReview = (review: ReviewRow) => {
    Alert.alert("Удалить отзыв?", "Отзыв исчезнет из публичного профиля мастера. Это действие нельзя отменить.", [
      { text: "Не удалять", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: async () => {
        const { error } = await supabase.from("reviews").delete().eq("id", review.id);
        if (error) Alert.alert("Не удалось удалить отзыв", error.message);
        else void load();
      }}
    ]);
  };

  const pending = promotions.filter(p => p.status === "pending").length;
  const visible = masters.filter(m => m.is_visible).length;
  const average = reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "—";

  if (allowed === false) return <View style={s.center}><Text style={s.title}>Доступ закрыт</Text><Text style={s.note}>У этого аккаунта нет прав администратора HIME STUDIO. Добавь его user_id в таблицу hime_admins через Supabase SQL Editor.</Text><Action title="Проверить доступ снова" onPress={() => void load()}/></View>;
  if (allowed === null || loading && allowed === null) return <View style={s.center}><ActivityIndicator color={burgundy}/><Text style={s.note}>Проверяем права администратора…</Text></View>;

  return <ScrollView style={s.wrap} contentContainerStyle={s.content}>
    <View style={s.header}><View><Text style={s.eyebrow}>HIME STUDIO · CONTROL</Text><Text style={s.title}>Админ-панель</Text></View><Action title={loading ? "Обновляем…" : "Обновить"} onPress={() => void load()} secondary/></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
      {(["overview","promotions","masters","reviews","bookings"] as const).map(key => <TouchableOpacity key={key} onPress={() => setSection(key)} style={[s.tab, section === key && s.tabActive]}><Text style={[s.tabText, section === key && s.tabTextActive]}>{({overview:"Обзор",promotions:"Продвижение",masters:"Мастера",reviews:"Отзывы",bookings:"Записи"} as const)[key]}</Text></TouchableOpacity>)}
    </ScrollView>

    {section === "overview" && <>
      <Text style={s.note}>Сводка платформы. Все действия проверяются серверными политиками доступа.</Text>
      <View style={s.stats}>
        <View style={s.stat}><Text style={s.statNumber}>{masters.length}</Text><Text style={s.statLabel}>Мастеров</Text></View>
        <View style={s.stat}><Text style={s.statNumber}>{visible}</Text><Text style={s.statLabel}>В каталоге</Text></View>
        <View style={s.stat}><Text style={s.statNumber}>{pending}</Text><Text style={s.statLabel}>Заявок на проверке</Text></View>
        <View style={s.stat}><Text style={s.statNumber}>{reviews.length}</Text><Text style={s.statLabel}>Отзывов</Text></View>
        <View style={s.stat}><Text style={s.statNumber}>{bookings.length}</Text><Text style={s.statLabel}>Последних записей</Text></View>
        <View style={s.stat}><Text style={s.statNumber}>{average}</Text><Text style={s.statLabel}>Средняя оценка</Text></View>
      </View>
      <Text style={s.sectionTitle}>Требуют внимания</Text>
      <View style={s.card}><Text style={s.cardTitle}>Заявки на продвижение</Text><Text style={s.note}>{pending ? pending + " заявок ожидают решения." : "Нет ожидающих заявок."}</Text><Action title="Открыть модерацию" onPress={() => setSection("promotions")}/></View>
      <View style={s.card}><Text style={s.cardTitle}>Проверка отзывов</Text><Text style={s.note}>Последние отзывы доступны в разделе модерации. Удаляй только контент, нарушающий правила платформы.</Text><Action title="Открыть отзывы" secondary onPress={() => setSection("reviews")}/></View>
    </>}

    {section === "promotions" && <>
      <Text style={s.sectionTitle}>Модерация продвижения</Text>
      {promotions.map(p => <View key={p.id} style={s.card}><Text style={s.cardTitle}>{p.plan === "top" ? "Топ города" : "Выделенная карточка"} · {p.city}</Text><Text style={s.note}>Мастер: {p.master_id}</Text><Text style={s.note}>Период: {p.starts_on} — {p.ends_on}</Text><Text style={s.status}>Статус: {p.status === "pending" ? "На проверке" : p.status === "active" ? "Активно" : p.status === "rejected" ? "Отклонено" : p.status}</Text>{p.status === "pending" && <View style={s.row}><Action title="Одобрить" onPress={() => void moderatePromotion(p.id,"active")}/><Action title="Отклонить" danger onPress={() => void moderatePromotion(p.id,"rejected")}/></View>}</View>)}
      {!promotions.length && <Text style={s.note}>Заявок пока нет.</Text>}
    </>}

    {section === "masters" && <>
      <Text style={s.sectionTitle}>Каталог мастеров</Text>
      {masters.map(m => <View key={m.user_id} style={s.card}><Text style={s.cardTitle}>{m.display_name || "Мастер без имени"}</Text><Text style={s.note}>ID: {m.user_id}</Text><Text style={s.status}>{m.is_visible ? "Показывается в каталоге" : "Скрыт из каталога"}</Text><Action title={m.is_visible ? "Скрыть мастера" : "Вернуть в каталог"} secondary onPress={() => void toggleMaster(m)}/></View>)}
      {!masters.length && <Text style={s.note}>Профилей мастеров пока нет.</Text>}
    </>}

    {section === "reviews" && <>
      <Text style={s.sectionTitle}>Модерация отзывов</Text>
      {reviews.map(r => <View key={r.id} style={s.card}><Text style={s.cardTitle}>{"★".repeat(r.rating)}{"☆".repeat(5-r.rating)}</Text><Text style={s.note}>Мастер: {r.master_id} · Клиент: {r.client_id}</Text><Text style={s.body}>{r.body || "Без текста"}</Text>{!!r.photo_path && <Image source={{uri:supabase.storage.from("hime-review-photos").getPublicUrl(r.photo_path).data.publicUrl}} style={s.photo} resizeMode="cover"/>}<Text style={s.note}>{new Date(r.created_at).toLocaleString("ru-RU")}</Text><Action title="Удалить отзыв" danger onPress={() => removeReview(r)}/></View>)}
      {!reviews.length && <Text style={s.note}>Отзывов пока нет.</Text>}
    </>}

    {section === "bookings" && <>
      <Text style={s.sectionTitle}>Последние записи</Text>
      {bookings.map(b => <View key={b.id} style={s.card}><Text style={s.cardTitle}>{new Date(b.starts_at).toLocaleString("ru-RU")}</Text><Text style={s.note}>Мастер: {b.master_id}</Text><Text style={s.note}>Клиент: {b.client_id}</Text><Text style={s.status}>Статус: {b.status}</Text></View>)}
      {!bookings.length && <Text style={s.note}>Записей пока нет.</Text>}
    </>}
  </ScrollView>;
}

const s = StyleSheet.create({
  wrap:{flex:1,backgroundColor:"#FAF7F6"},content:{padding:18,paddingBottom:36},center:{flex:1,justifyContent:"center",padding:24,backgroundColor:"#FAF7F6"},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:10},eyebrow:{fontSize:9,letterSpacing:2,color:burgundy,fontWeight:"800",marginBottom:6},title:{fontSize:27,fontWeight:"800",color:"#171316",marginBottom:6},note:{fontSize:11,color:"#8D8186",lineHeight:17,marginTop:5},tabs:{gap:7,paddingVertical:14},tab:{paddingHorizontal:14,paddingVertical:10,borderRadius:20,backgroundColor:"#F0E7E8"},tabActive:{backgroundColor:burgundy},tabText:{fontSize:11,color:burgundy,fontWeight:"700"},tabTextActive:{color:"#FFF"},stats:{flexDirection:"row",flexWrap:"wrap",gap:9,marginTop:15},stat:{width:"31%",minHeight:82,backgroundColor:"#FFF",borderRadius:13,borderWidth:1,borderColor:"#EFE7E8",padding:12,justifyContent:"center"},statNumber:{fontSize:22,fontWeight:"800",color:burgundy},statLabel:{fontSize:10,color:"#8D8186",marginTop:3},sectionTitle:{fontSize:18,fontWeight:"800",color:"#171316",marginTop:12,marginBottom:8},card:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#EFE7E8",borderRadius:14,padding:13,marginTop:10},cardTitle:{fontSize:13,fontWeight:"800",color:"#171316"},body:{fontSize:12,color:"#4D4448",lineHeight:18,marginTop:8},status:{fontSize:11,color:burgundy,fontWeight:"700",marginTop:8},row:{flexDirection:"row",gap:8,marginTop:7},action:{backgroundColor:burgundy,paddingHorizontal:12,paddingVertical:11,borderRadius:9,alignItems:"center",justifyContent:"center",marginTop:8,flex:1},secondary:{backgroundColor:"#F0E7E8"},danger:{backgroundColor:"#F9E9E9"},actionText:{fontSize:10,color:"#FFF",fontWeight:"800"},secondaryText:{color:burgundy},dangerText:{color:"#A52B37"},photo:{width:150,height:150,borderRadius:12,marginTop:9}
});
