import React, { useCallback, useEffect, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";

type Role = "client" | "master";
type Screen = "calendar" | "services" | "waitlist" | "promotions" | "tasks" | "bookings" | "favorites" | "notifications" | "settings";
type Service = { id: string; title: string; price: string; duration_minutes: number; is_active: boolean; position: number };
const burgundy = "#651D32";
const weekdays = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

function Action({ title, onPress, secondary = false }: { title: string; onPress: () => void; secondary?: boolean }) {
  return <TouchableOpacity onPress={onPress} style={[s.button, secondary && s.secondary]}><Text style={[s.buttonText, secondary && s.secondaryText]}>{title}</Text></TouchableOpacity>;
}
function Field({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9A8C91" style={s.input}/>;
}

export default function StudioWorkspace({ role, city, fullName }: { role: Role; city: string; fullName: string }) {
  const [screen, setScreen] = useState<Screen>(role === "master" ? "calendar" : "bookings");
  const [userId, setUserId] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [promotionStart, setPromotionStart] = useState("");
  const [promotionEnd, setPromotionEnd] = useState("");
  const [promotionPlan, setPromotionPlan] = useState("featured");
  const [reviewPhoto, setReviewPhoto] = useState<string | null>(null);
  const [serviceTitle, setServiceTitle] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [serviceDuration, setServiceDuration] = useState("60");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [breakDay, setBreakDay] = useState("1");
  const [breakStart, setBreakStart] = useState("13:00");
  const [breakEnd, setBreakEnd] = useState("14:00");
  const [editStart, setEditStart] = useState("10:00");
  const [editEnd, setEditEnd] = useState("19:00");
  const [bookingDate, setBookingDate] = useState("");
  const [dayOffDate, setDayOffDate] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setUserId(auth.user.id);
    if (screen === "calendar") {
      const { data, error } = await supabase.from("master_working_hours").select("*").eq("master_id", auth.user.id).order("weekday");
      if (!error) setRows(data || []);
    } else if (screen === "services") {
      const { data, error } = await supabase.from("master_services").select("id,title,price,duration_minutes,is_active,position").eq("master_id", auth.user.id).order("position");
      if (error) Alert.alert("Не удалось загрузить прайс", error.message); else setServices((data || []) as Service[]);
    } else if (screen === "waitlist") {
      const { data, error } = await supabase.from("master_waitlist").select("id,client_id,desired_date,preferred_from,preferred_to,client_note,status,created_at").eq("master_id", auth.user.id).in("status", ["waiting","notified","contacted"]).order("desired_date");
      if (error) Alert.alert("Не удалось загрузить лист ожидания", error.message); else setWaitlist(data || []);
    } else if (screen === "promotions") {
      const { data, error } = await supabase.from("master_promotions").select("id,plan,city,starts_on,ends_on,status,note,created_at").eq("master_id", auth.user.id).order("created_at", { ascending: false });
      if (error) Alert.alert("Не удалось загрузить продвижение", error.message); else setPromotions(data || []);
    } else if (screen === "tasks") {
      const { data, error } = await supabase.from("master_tasks").select("*").eq("master_id", auth.user.id).order("due_at", { ascending: true });
      if (!error) setTasks(data || []);
    } else if (screen === "bookings") {
      const column = role === "master" ? "master_id" : "client_id";
      const { data, error } = await supabase.from("bookings").select("id, starts_at, ends_at, status, client_note, cancellation_reason, master_id, client_id, service_id").eq(column, auth.user.id).order("starts_at", { ascending: false });
      if (!error) setRows(data || []);
    } else if (screen === "notifications") {
      const { data, error } = await supabase.from("notifications").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(50);
      if (!error) setNotifications(data || []);
    } else if (screen === "favorites") {
      const { data, error } = await supabase.from("favorite_masters").select("master_id, created_at").eq("client_id", auth.user.id).order("created_at", { ascending: false });
      if (!error) setFavorites(data || []);
    }
  }, [role, screen]);

  useEffect(() => { void load(); }, [load]);

  const saveHours = async (weekday: number, working: boolean) => {
    if (!userId) return;
    setBusy(true);
    const payload = { master_id: userId, weekday, is_working: working, starts_at: working ? editStart : null, ends_at: working ? editEnd : null };
    const { error } = await supabase.from("master_working_hours").upsert(payload, { onConflict: "master_id,weekday" });
    setBusy(false);
    if (error) Alert.alert("Не удалось сохранить график", error.message);
    else { Alert.alert("Сохранено", "График мастера обновлён."); void load(); }
  };

  const addBreak = async () => {
    const { error } = await supabase.from("master_breaks").insert({ master_id: userId, weekday: Number(breakDay), starts_at: breakStart, ends_at: breakEnd });
    if (error) Alert.alert("Не удалось добавить перерыв", error.message);
    else Alert.alert("Готово", "Перерыв добавлен в расписание.");
  };

  const resetServiceForm = () => { setServiceTitle(""); setServicePrice(""); setServiceDuration("60"); setEditingServiceId(null); };

  const saveService = async () => {
    const title = serviceTitle.trim();
    const price = servicePrice.trim();
    const duration = Number(serviceDuration);
    if (!title) return Alert.alert("Укажи услугу", "Название услуги не может быть пустым.");
    if (!Number.isInteger(duration) || duration < 15 || duration > 480) return Alert.alert("Проверь длительность", "Укажи целое число от 15 до 480 минут.");
    if (!userId) return;
    setBusy(true);
    const payload = { title, price, duration_minutes: duration };
    const result = editingServiceId
      ? await supabase.from("master_services").update(payload).eq("id", editingServiceId).eq("master_id", userId)
      : await supabase.from("master_services").insert({ ...payload, master_id: userId, is_active: true, position: services.length });
    setBusy(false);
    if (result.error) Alert.alert("Не удалось сохранить услугу", result.error.message);
    else { resetServiceForm(); void load(); }
  };

  const editService = (service: Service) => {
    setEditingServiceId(service.id); setServiceTitle(service.title); setServicePrice(service.price || ""); setServiceDuration(String(service.duration_minutes || 60));
  };

  const toggleService = async (service: Service) => {
    const { error } = await supabase.from("master_services").update({ is_active: !service.is_active }).eq("id", service.id).eq("master_id", userId);
    if (error) Alert.alert("Не удалось изменить публикацию", error.message); else void load();
  };

  const deleteService = (service: Service) => {
    Alert.alert("Удалить услугу?", "«" + service.title + "» будет удалена из прайса и перестанет отображаться клиентам.", [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: async () => {
        const { error } = await supabase.from("master_services").delete().eq("id", service.id).eq("master_id", userId);
        if (error) Alert.alert("Не удалось удалить услугу", error.message); else { if (editingServiceId === service.id) resetServiceForm(); void load(); }
      } },
    ]);
  };

  const updateWaitlist = async (id: string, status: string) => {
    const { error } = await supabase.from("master_waitlist").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("master_id", userId);
    if (error) Alert.alert("Не удалось обновить заявку", error.message); else void load();
  };

  const requestPromotion = async () => {
    if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(promotionStart) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(promotionEnd) || promotionEnd < promotionStart) return Alert.alert("Проверь даты", "Укажи период в формате ГГГГ-ММ-ДД, дата окончания не раньше начала.");
    const { error } = await supabase.from("master_promotions").insert({ master_id: userId, plan: promotionPlan, city, starts_on: promotionStart, ends_on: promotionEnd, status: "pending" });
    if (error) Alert.alert("Не удалось отправить заявку", error.message); else { setPromotionStart(""); setPromotionEnd(""); Alert.alert("Заявка отправлена", "После проверки администрацией продвижение появится в каталоге."); void load(); }
  };

  const addTask = async () => {
    if (!taskTitle.trim()) return Alert.alert("Нужна задача", "Напиши название задачи.");
    const { error } = await supabase.from("master_tasks").insert({ master_id: userId, title: taskTitle.trim(), due_at: taskDue ? new Date(taskDue).toISOString() : null });
    if (error) Alert.alert("Не удалось добавить задачу", error.message);
    else { setTaskTitle(""); setTaskDue(""); void load(); }
  };

  const updateBooking = async (id: string, status: string) => {
    const { error } = await supabase.from("bookings").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) Alert.alert("Не удалось обновить запись", error.message);
    else void load();
  };

  const rescheduleBooking = async (booking: any) => {
    if (!bookingDate.trim()) return Alert.alert("Нужна дата", "Введи новую дату и время в формате 2026-11-25T15:00:00+03:00.");
    const next = new Date(bookingDate);
    if (Number.isNaN(next.getTime())) return Alert.alert("Неверная дата", "Проверь формат даты и времени.");
    const oldStart = new Date(booking.starts_at).getTime();
    const oldEnd = booking.ends_at ? new Date(booking.ends_at).getTime() : oldStart + 60 * 60000;
    const duration = Math.max(15 * 60000, oldEnd - oldStart);
    const { error } = await supabase.from("bookings").update({ starts_at: next.toISOString(), ends_at: new Date(next.getTime() + duration).toISOString(), updated_at: new Date().toISOString() }).eq("id", booking.id);
    if (error) Alert.alert("Не удалось перенести запись", error.message); else { setBookingDate(""); Alert.alert("Запись перенесена", "Новое время сохранено."); void load(); }
  };

  const pickReviewPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return Alert.alert("Нужен доступ к галерее", "Разреши доступ, чтобы прикрепить фото результата.");
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.85 });
    if (!result.canceled && result.assets?.[0]) setReviewPhoto(result.assets[0].uri);
  };

  const submitReview = async (booking: any) => {
    const score = Number(reviewRating);
    if (!Number.isInteger(score) || score < 1 || score > 5) return Alert.alert("Оценка от 1 до 5", "Укажи корректную оценку.");
    let photoPath: string | null = null;
    if (reviewPhoto) {
      const response = await fetch(reviewPhoto); const blob = await response.blob();
      photoPath = userId + "/review-" + booking.id + "-" + Date.now() + ".jpg";
      const { error: uploadError } = await supabase.storage.from("hime-review-photos").upload(photoPath, blob, { contentType: "image/jpeg" });
      if (uploadError) return Alert.alert("Не удалось загрузить фото", uploadError.message);
    }
    const { error } = await supabase.from("reviews").insert({ booking_id: booking.id, client_id: userId, master_id: booking.master_id, rating: score, body: reviewText.trim() || null, photo_path: photoPath });
    if (error) Alert.alert("Не удалось отправить отзыв", error.message); else { setReviewText(""); setReviewPhoto(null); Alert.alert("Спасибо за отзыв", "Оценка и фотография сохранены."); void load(); }
  };

  const addDayOff = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayOffDate)) return Alert.alert("Неверная дата", "Используй формат ГГГГ-ММ-ДД.");
    const { error } = await supabase.from("master_schedule_exceptions").upsert({ master_id: userId, exception_date: dayOffDate, is_day_off: true }, { onConflict: "master_id,exception_date" });
    if (error) Alert.alert("Не удалось сохранить выходной", error.message); else { setDayOffDate(""); Alert.alert("Выходной добавлен", dayOffDate); }
  };

  const markRead = async (id: string) => {
    const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    if (error) Alert.alert("Ошибка", error.message); else void load();
  };

  const markTask = async (id: string, done: boolean) => {
    const { error } = await supabase.from("master_tasks").update({ is_done: done, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) Alert.alert("Ошибка", error.message); else void load();
  };

  const menu: [Screen, string][] = role === "master"
    ? [["calendar", "Календарь"], ["services", "Мой прайс"], ["waitlist", "Лист ожидания"], ["promotions", "Продвижение"], ["bookings", "Записи"], ["tasks", "Задачи"], ["notifications", "Уведомления"], ["settings", "Настройки"]]
    : [["bookings", "Мои записи"], ["favorites", "Избранное"], ["notifications", "Уведомления"], ["settings", "Настройки"]];

  return <View style={s.wrap}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.menu}>
      {menu.map(([key, label]) => <TouchableOpacity key={key} onPress={() => setScreen(key)} style={[s.menuItem, screen === key && s.menuActive]}><Text style={[s.menuText, screen === key && s.menuTextActive]}>{label}</Text></TouchableOpacity>)}
    </ScrollView>
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>HIME STUDIO · {role === "master" ? "КАБИНЕТ МАСТЕРА" : "ЛИЧНЫЙ КАБИНЕТ"}</Text>
      {screen === "calendar" && role === "master" && <>
        <Text style={s.title}>Рабочий календарь</Text><Text style={s.note}>Настрой обычные часы работы по дням недели. Выходные можно отключить отдельно.</Text>
        <Text style={s.label}>Время работы для выбранного дня</Text><View style={s.row}><View style={{flex:1}}><Field value={editStart} onChangeText={setEditStart} placeholder="Начало, 10:00"/></View><View style={{flex:1}}><Field value={editEnd} onChangeText={setEditEnd} placeholder="Конец, 19:00"/></View></View>
        {weekdays.map((day, i) => { const item = rows.find(x => x.weekday === i); return <View key={day} style={s.card}><View style={s.row}><Text style={s.cardTitle}>{day}</Text><Text style={s.note}>{item ? (item.is_working ? item.starts_at?.slice(0,5)+"–"+item.ends_at?.slice(0,5) : "Выходной") : "Не настроено"}</Text></View><View style={s.row}><Action title="Рабочий день" secondary onPress={() => void saveHours(i, true)}/><Action title="Выходной" secondary onPress={() => void saveHours(i, false)}/></View></View>; })}
        <Text style={s.heading}>Добавить перерыв</Text><Field value={breakDay} onChangeText={setBreakDay} placeholder="День недели: 0–6 (0 — воскресенье)"/><View style={s.row}><View style={{flex:1}}><Field value={breakStart} onChangeText={setBreakStart} placeholder="13:00"/></View><View style={{flex:1}}><Field value={breakEnd} onChangeText={setBreakEnd} placeholder="14:00"/></View></View><Action title="Сохранить перерыв" onPress={() => void addBreak()}/><Text style={s.heading}>Разовый выходной</Text><Field value={dayOffDate} onChangeText={setDayOffDate} placeholder="Дата: 2026-12-31"/><Action title="Добавить выходной" secondary onPress={() => void addDayOff()}/>
      </>}
      {screen === "services" && role === "master" && <>
        <Text style={s.title}>Мой прайс</Text>
        <Text style={s.note}>Добавляй услуги, указывай стоимость и длительность. Скрытые услуги останутся в кабинете, но исчезнут из каталога и онлайн-записи.</Text>
        <Text style={s.heading}>{editingServiceId ? "Редактировать услугу" : "Новая услуга"}</Text>
        <Field value={serviceTitle} onChangeText={setServiceTitle} placeholder="Название услуги, например маникюр с покрытием"/>
        <View style={s.row}><View style={{flex:1}}><Field value={servicePrice} onChangeText={setServicePrice} placeholder="Цена, например 2000 ₽"/></View><View style={{flex:1}}><Field value={serviceDuration} onChangeText={setServiceDuration} placeholder="Минуты"/></View></View>
        <View style={s.row}><Action title={busy ? "Сохранение…" : editingServiceId ? "Сохранить изменения" : "Добавить услугу"} onPress={() => void saveService()}/>{!!editingServiceId && <Action title="Отмена" secondary onPress={resetServiceForm}/>}</View>
        <Text style={s.heading}>Услуги в прайсе · {services.length}</Text>
        {services.map(service => <View key={service.id} style={s.card}>
          <View style={s.row}><Text style={s.cardTitle}>{service.title}</Text><Text style={s.note}>{service.is_active ? "Опубликована" : "Скрыта"}</Text></View>
          <Text style={s.note}>{service.price || "Цена по договорённости"} · {service.duration_minutes || 60} мин</Text>
          <View style={s.row}><Action title="Изменить" secondary onPress={() => editService(service)}/><Action title={service.is_active ? "Скрыть" : "Опубликовать"} secondary onPress={() => void toggleService(service)}/><Action title="Удалить" secondary onPress={() => deleteService(service)}/></View>
        </View>)}
        {!services.length && <Text style={s.note}>Прайс пока пуст. Добавь первую услугу выше.</Text>}
      </>}
      {screen === "waitlist" && role === "master" && <>
        <Text style={s.title}>Лист ожидания</Text><Text style={s.note}>Когда запись отменяется, клиенты с подходящей датой и временем получают уведомление. Здесь можно обработать заявки.</Text>
        {waitlist.map(item => <View key={item.id} style={s.card}><Text style={s.cardTitle}>{item.desired_date} · {item.preferred_from?.slice(0,5) || "Любое время"}{item.preferred_to ? "–" + item.preferred_to.slice(0,5) : ""}</Text><Text style={s.note}>Клиент · {item.client_id.slice(0,8)} · {item.status}</Text>{!!item.client_note && <Text style={s.note}>{item.client_note}</Text>}<View style={s.row}><Action title="Связались" secondary onPress={() => void updateWaitlist(item.id,"contacted")}/><Action title="Записан" onPress={() => void updateWaitlist(item.id,"booked")}/></View></View>)}
        {!waitlist.length && <Text style={s.note}>Пока нет активных заявок в листе ожидания.</Text>}
      </>}
      {screen === "promotions" && role === "master" && <>
        <Text style={s.title}>Продвижение мастера</Text><Text style={s.note}>Отправь заявку на выделение карточки в каталоге. Публикация включается после проверки администратором; оплата внутри приложения пока не подключена.</Text>
        <Text style={s.heading}>Новая заявка</Text>
        <View style={s.row}><Action title={promotionPlan === "featured" ? "✓ Выделенная карточка" : "Выделенная карточка"} secondary onPress={() => setPromotionPlan("featured")}/><Action title={promotionPlan === "top" ? "✓ В топе города" : "В топе города"} secondary onPress={() => setPromotionPlan("top")}/></View>
        <Field value={promotionStart} onChangeText={setPromotionStart} placeholder="Начало: ГГГГ-ММ-ДД"/><Field value={promotionEnd} onChangeText={setPromotionEnd} placeholder="Окончание: ГГГГ-ММ-ДД"/>
        <Action title="Отправить на модерацию" onPress={() => void requestPromotion()}/>
        <Text style={s.heading}>Мои заявки</Text>
        {promotions.map(p => <View key={p.id} style={s.card}><Text style={s.cardTitle}>{p.plan === "top" ? "Топ мастеров города" : "Выделенная карточка"} · {p.city}</Text><Text style={s.note}>{p.starts_on} — {p.ends_on} · {p.status === "pending" ? "На проверке" : p.status === "active" ? "Активно" : p.status === "rejected" ? "Отклонено" : p.status}</Text></View>)}
        {!promotions.length && <Text style={s.note}>Заявок пока нет.</Text>}
      </>}
      {screen === "tasks" && role === "master" && <>
        <Text style={s.title}>Мои задачи</Text><Field value={taskTitle} onChangeText={setTaskTitle} placeholder="Например, заказать материалы"/><Field value={taskDue} onChangeText={setTaskDue} placeholder="Срок: 2026-11-25T15:00:00"/><Action title="Добавить задачу" onPress={() => void addTask()}/>
        {tasks.map(t => <TouchableOpacity key={t.id} onPress={() => void markTask(t.id, !t.is_done)} style={s.card}><Text style={s.cardTitle}>{t.is_done ? "✓ " : "○ "}{t.title}</Text>{t.due_at && <Text style={s.note}>{new Date(t.due_at).toLocaleString()}</Text>}</TouchableOpacity>)}
        {!tasks.length && <Text style={s.note}>Задач пока нет.</Text>}
      </>}
      {screen === "bookings" && <>
        <Text style={s.title}>{role === "master" ? "Записи клиентов" : "История записей"}</Text><Text style={s.note}>Заявки, подтверждения, переносы и отмены.</Text>
        {rows.map(b => <View key={b.id} style={s.card}><Text style={s.cardTitle}>{new Date(b.starts_at).toLocaleString()}</Text><Text style={s.note}>Статус: {b.status}</Text>{b.client_note && <Text style={s.note}>{b.client_note}</Text>}{role === "master" && <View style={s.row}><Action title="Подтвердить" secondary onPress={() => void updateBooking(b.id,"confirmed")}/><Action title="Завершить" secondary onPress={() => void updateBooking(b.id,"completed")}/><Action title="Отменить" secondary onPress={() => void updateBooking(b.id,"cancelled")}/></View>}{b.status === "confirmed" && <><Field value={bookingDate} onChangeText={setBookingDate} placeholder="Перенос: 2026-11-25T15:00:00+03:00"/><Action title="Перенести запись" secondary onPress={() => void rescheduleBooking(b)}/></>}{role === "client" && b.status === "confirmed" && <Action title="Отменить запись" secondary onPress={() => void updateBooking(b.id,"cancelled")}/ >}{role === "client" && b.status === "completed" && <><Field value={reviewRating} onChangeText={setReviewRating} placeholder="Оценка 1–5"/><Field value={reviewText} onChangeText={setReviewText} placeholder="Твой отзыв"/><Action title={reviewPhoto ? "Фото прикреплено ✓" : "Добавить фото результата"} secondary onPress={() => void pickReviewPhoto()}/>{!!reviewPhoto && <Image source={{uri:reviewPhoto}} style={{width:96,height:96,borderRadius:10}}/>}<Action title="Оставить отзыв" onPress={() => void submitReview(b)}/></>}</View>)}
        {!rows.length && <Text style={s.note}>Записей пока нет. Они появятся здесь после оформления через каталог мастеров.</Text>}
      </>}
      {screen === "favorites" && role === "client" && <>
        <Text style={s.title}>Избранные мастера</Text>{favorites.map(f => <View key={f.master_id} style={s.card}><Text style={s.cardTitle}>Мастер · {f.master_id.slice(0,8)}</Text><Text style={s.note}>Добавлен {new Date(f.created_at).toLocaleDateString()}</Text></View>)}{!favorites.length && <Text style={s.note}>Пока нет сохранённых мастеров.</Text>}
      </>}
      {screen === "notifications" && <>
        <Text style={s.title}>Уведомления</Text>{notifications.map(n => <TouchableOpacity key={n.id} onPress={() => void markRead(n.id)} style={[s.card, !n.read_at && s.unread]}><Text style={s.cardTitle}>{n.title}</Text><Text style={s.note}>{n.body}</Text><Text style={s.note}>{new Date(n.created_at).toLocaleString()} · {n.read_at ? "Прочитано" : "Нажми, чтобы отметить прочитанным"}</Text></TouchableOpacity>)}{!notifications.length && <Text style={s.note}>Новых уведомлений пока нет.</Text>}
      </>}
      {screen === "settings" && <>
        <Text style={s.title}>Настройки аккаунта</Text><View style={s.card}><Text style={s.cardTitle}>{fullName || "Пользователь"}</Text><Text style={s.note}>Город: {city || "Не указан"}</Text><Text style={s.note}>Роль: {role === "master" ? "Мастер" : "Клиент"}</Text><Text style={s.note}>Для смены имени и города открой раздел «Профиль».</Text></View>
      </>}
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  wrap:{flex:1},menu:{paddingHorizontal:12,paddingVertical:10,gap:7},menuItem:{paddingHorizontal:13,paddingVertical:10,borderRadius:18,backgroundColor:"#F0E7E8"},menuActive:{backgroundColor:burgundy},menuText:{fontSize:11,color:burgundy,fontWeight:"600"},menuTextActive:{color:"#FFF"},content:{padding:18,paddingBottom:30},eyebrow:{fontSize:9,letterSpacing:2,color:burgundy,fontWeight:"800",marginBottom:8},title:{fontSize:27,fontWeight:"800",color:"#171316",marginBottom:8},heading:{fontSize:17,fontWeight:"700",color:"#171316",marginTop:18,marginBottom:8},label:{fontSize:12,fontWeight:"700",color:"#171316",marginTop:10,marginBottom:6},note:{fontSize:11,color:"#8D8186",lineHeight:17,flexShrink:1},card:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#EFE7E8",borderRadius:13,padding:13,marginTop:10},cardTitle:{fontSize:13,fontWeight:"700",color:"#171316",flex:1},row:{flexDirection:"row",gap:7,alignItems:"center",marginTop:8},button:{backgroundColor:burgundy,paddingHorizontal:12,paddingVertical:11,borderRadius:9,alignItems:"center",justifyContent:"center",marginTop:7,flex:1},secondary:{backgroundColor:"#F0E7E8"},buttonText:{fontSize:10,color:"#FFF",fontWeight:"700"},secondaryText:{color:burgundy},input:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#E9DFE1",borderRadius:10,paddingHorizontal:12,paddingVertical:11,color:"#171316",fontSize:12,marginBottom:8},unread:{borderColor:"#B98291",backgroundColor:"#FFF9FA"}
});
