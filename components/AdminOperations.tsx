import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

type Tab = "users" | "reports" | "photos" | "support" | "subscriptions";
type UserRow = { user_id: string; full_name: string; phone: string | null; role: string };
type ReportRow = { id: string; reporter_id: string; target_user_id: string | null; target_type: string; reason: string; details: string; status: string; created_at: string };
type ThreadRow = { id: string; requester_id: string; subject: string; category: string; status: string; updated_at: string };
type MessageRow = { id: string; ticket_id: string; sender_id: string; body: string; created_at: string };
type PhotoRow = { id: string; master_id: string; media_path: string; caption: string | null; is_public: boolean };
type SubscriptionRow = { user_id: string; plan: string; status: string; current_period_end: string; provider: string; };

const burgundy = "#651D32";
function Action({title,onPress,danger=false,secondary=false}:{title:string;onPress:()=>void;danger?:boolean;secondary?:boolean}) {
  return <TouchableOpacity onPress={onPress} style={[s.button,secondary&&s.secondary,danger&&s.danger]}><Text style={[s.buttonText,secondary&&s.secondaryText,danger&&s.dangerText]}>{title}</Text></TouchableOpacity>;
}
function Card({children}:{children:React.ReactNode}) { return <View style={s.card}>{children}</View>; }

export default function AdminOperations() {
  const [tab,setTab]=useState<Tab>("users");
  const [loading,setLoading]=useState(false);
  const [query,setQuery]=useState("");
  const [users,setUsers]=useState<UserRow[]>([]);
  const [reports,setReports]=useState<ReportRow[]>([]);
  const [photos,setPhotos]=useState<PhotoRow[]>([]);
  const [threads,setThreads]=useState<ThreadRow[]>([]);
  const [subscriptions,setSubscriptions]=useState<SubscriptionRow[]>([]);
  const [selectedThread,setSelectedThread]=useState<ThreadRow|null>(null);
  const [messages,setMessages]=useState<MessageRow[]>([]);
  const [reply,setReply]=useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const gate=await supabase.rpc("hime_is_admin");
    if(gate.error || gate.data!==true) { setLoading(false); Alert.alert("Доступ закрыт","Сервер не подтвердил права администратора. Проверь миграцию и назначение владельца."); return; }
    const [u,r,p,t,sub]=await Promise.all([
      supabase.from("profiles").select("user_id,full_name,phone,role").order("created_at",{ascending:false}).limit(100),
      supabase.from("hime_reports").select("id,reporter_id,target_user_id,target_type,reason,details,status,created_at").order("created_at",{ascending:false}).limit(100),
      supabase.from("portfolio_items").select("id,master_id,media_path,caption,is_public").order("created_at",{ascending:false}).limit(100),
      supabase.from("hime_support_tickets").select("id,requester_id,subject,category,status,updated_at").order("updated_at",{ascending:false}).limit(100),
      supabase.from("hime_subscription_entitlements").select("user_id,plan,status,current_period_end,provider").order("created_at",{ascending:false}).limit(100)
    ]);
    const errs=[u.error,r.error,p.error,t.error,sub.error].filter(Boolean);
    if(errs.length) Alert.alert("Часть разделов недоступна",errs.map(e=>e?.message).join("\n"));
    setUsers((u.data||[]) as UserRow[]); setReports((r.data||[]) as ReportRow[]);
    setPhotos((p.data||[]) as PhotoRow[]); setThreads((t.data||[]) as ThreadRow[]);
    setSubscriptions((sub.data||[]) as SubscriptionRow[]);
    setLoading(false);
  },[]);
  useEffect(()=>{void load();},[load]);

  const audit=async(action:string,targetType:string,targetId:string,reason:string)=>{
    const {data}=await supabase.auth.getUser(); if(!data.user) return;
    await supabase.from("hime_admin_audit_log").insert({admin_id:data.user.id,action,target_type:targetType,target_id:targetId,reason});
  };
  const moderateUser=(user:UserRow,status:"suspended"|"restricted"|"active")=>{
    const actionLabel=status==="active"?"Снять ограничения":status==="restricted"?"Ограничить аккаунт":"Приостановить аккаунт";
    Alert.alert(actionLabel, "Подтвердить изменение статуса? Для подробного разбирательства добавь запись в жалобу.", [
      {text:"Отмена",style:"cancel"},
      {text:"Подтвердить",style:status==="suspended"?"destructive":"default",onPress:async()=>{
        const {data}=await supabase.auth.getUser(); if(!data.user) return;
        const reason="Решение администратора HIME";
        const {error}=await supabase.from("hime_user_moderation").upsert({user_id:user.user_id,status,reason,updated_by:data.user.id,updated_at:new Date().toISOString()});
        if(error) Alert.alert("Не удалось изменить статус",error.message);
        else { await audit("user_"+status,"user",user.user_id,reason); Alert.alert("Статус обновлён","Изменение записано в журнал. Это ограничительный статус внутри HIME, не блокировка входа в Supabase Auth."); }
      }}
    ]);
  };
  const moderateReport=async(report:ReportRow,status:"in_review"|"action_taken"|"rejected")=>{
    const {error}=await supabase.from("hime_reports").update({status,reviewed_at:new Date().toISOString(),reviewed_by:(await supabase.auth.getUser()).data.user?.id || null}).eq("id",report.id);
    if(error) Alert.alert("Ошибка",error.message); else {await audit("report_"+status,"report",report.id,"");void load();}
  };
  const hidePhoto=async(photo:PhotoRow)=>{
    Alert.alert("Скрыть фотографию?","Она перестанет отображаться в публичном портфолио мастера.",[
      {text:"Отмена",style:"cancel"},{text:"Скрыть",style:"destructive",onPress:async()=>{
        const {error}=await supabase.from("portfolio_items").update({is_public:false}).eq("id",photo.id);
        if(error) Alert.alert("Ошибка",error.message); else {await audit("hide_photo","portfolio_item",photo.id,"Модерация");void load();}
      }}
    ]);
  };
  const openThread=async(thread:ThreadRow)=>{
    setSelectedThread(thread);setMessages([]);
    const {data,error}=await supabase.from("hime_support_messages").select("id,ticket_id,sender_id,body,created_at").eq("ticket_id",thread.id).order("created_at");
    if(error) Alert.alert("Не удалось открыть переписку",error.message); else setMessages((data||[]) as MessageRow[]);
  };
  const sendReply=async()=>{
    if(!selectedThread || !reply.trim()) return;
    const {data}=await supabase.auth.getUser(); if(!data.user) return;
    const {error}=await supabase.from("hime_support_messages").insert({ticket_id:selectedThread.id,sender_id:data.user.id,body:reply.trim()});
    if(error) Alert.alert("Не удалось отправить ответ",error.message);
    else {setReply("");await supabase.from("hime_support_tickets").update({status:"waiting_for_user",assigned_to:data.user.id,updated_at:new Date().toISOString()}).eq("id",selectedThread.id);await audit("support_reply","conversation",selectedThread.id,"");void openThread(selectedThread);}
  };
  const filtered=users.filter(u=>[u.full_name,u.phone||"",u.user_id].some(v=>v.toLowerCase().includes(query.toLowerCase())));

  return <ScrollView style={s.wrap} contentContainerStyle={s.content}>
    <View style={s.header}><View><Text style={s.eyebrow}>HIME ADMIN · OPERATIONS</Text><Text style={s.title}>Управление платформой</Text></View><Action title={loading?"…":"Обновить"} onPress={()=>void load()} secondary/></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
      {(["users","reports","photos","support","subscriptions"] as Tab[]).map(k=><TouchableOpacity key={k} onPress={()=>{setTab(k);setSelectedThread(null);}} style={[s.tab,tab===k&&s.tabOn]}><Text style={[s.tabText,tab===k&&s.tabTextOn]}>{({users:"Люди",reports:"Жалобы",photos:"Фото",support:"Поддержка",subscriptions:"Подписки"} as any)[k]}</Text></TouchableOpacity>)}
    </ScrollView>
    {loading&&<ActivityIndicator color={burgundy}/>}
    {tab==="users"&&<>
      <TextInput value={query} onChangeText={setQuery} placeholder="Имя, телефон или ID пользователя" placeholderTextColor="#9B8D92" style={s.input}/>
      {filtered.map(u=><Card key={u.user_id}><Text style={s.cardTitle}>{u.full_name} · {u.role}</Text><Text style={s.note}>{u.phone||"Телефон не указан"} · {u.user_id}</Text><View style={s.row}><Action title="Ограничить" secondary onPress={()=>moderateUser(u,"restricted")}/><Action title="Приостановить" danger onPress={()=>moderateUser(u,"suspended")}/><Action title="Снять ограничения" onPress={()=>moderateUser(u,"active")}/></View></Card>)}
      {!filtered.length&&<Text style={s.note}>Пользователи не найдены.</Text>}
    </>}
    {tab==="reports"&&reports.map(r=><Card key={r.id}><Text style={s.cardTitle}>{r.reason} · {r.target_type}</Text><Text style={s.note}>Жалоба: {r.id} · Цель: {r.target_user_id||"не указан"} · ID: {r.target_id||"—"}</Text><Text style={s.body}>{r.details||"Без пояснения"}</Text><Text style={s.note}>Статус: {r.status} · {new Date(r.created_at).toLocaleString("ru-RU")}</Text><View style={s.row}><Action title="В работе" secondary onPress={()=>void moderateReport(r,"in_review")}/><Action title="Решено" onPress={()=>void moderateReport(r,"action_taken")}/><Action title="Отклонить" danger onPress={()=>void moderateReport(r,"rejected")}/></View></Card>)}
    {tab==="photos"&&photos.map(p=><Card key={p.id}><Text style={s.cardTitle}>{p.caption||"Работа мастера"}</Text><Text style={s.note}>Мастер: {p.master_id} · {p.media_path}</Text><Text style={s.status}>{p.is_public?"Публичная":"Скрыта"}</Text>{p.is_public&&<Action title="Скрыть из портфолио" danger onPress={()=>void hidePhoto(p)}/>}</Card>)}
    {tab==="support"&&<>
      {selectedThread?<Card><Action title="← Все обращения" secondary onPress={()=>setSelectedThread(null)}/><Text style={s.cardTitle}>{selectedThread.subject}</Text><Text style={s.note}>Пользователь: {selectedThread.requester_id} · {selectedThread.status}</Text>{messages.map(m=><View key={m.id} style={s.message}><Text style={s.note}>{m.sender_id===selectedThread.requester_id?"Пользователь":"Администратор"} · {new Date(m.created_at).toLocaleString("ru-RU")}</Text><Text style={s.body}>{m.body}</Text></View>)}<TextInput value={reply} onChangeText={setReply} multiline placeholder="Ответ пользователю" placeholderTextColor="#9B8D92" style={[s.input,s.textarea]}/><Action title="Отправить ответ" onPress={()=>void sendReply()}/></Card>:threads.map(t=><Card key={t.id}><Text style={s.cardTitle}>{t.subject}</Text><Text style={s.note}>{t.requester_id} · {t.status}</Text><Action title="Открыть переписку" onPress={()=>void openThread(t)}/></Card>)}
      {!threads.length&&<Text style={s.note}>Обращений пока нет.</Text>}
    </>}
    {tab==="subscriptions"&&subscriptions.map(sub=><Card key={sub.id}><Text style={s.cardTitle}>{({client_premium:"PREMIUM CLIENT",master_premium:"HIME PRO MASTER",hime_plus:"PREMIUM ALL"} as any)[sub.plan]||sub.plan}</Text><Text style={s.note}>Пользователь: {sub.user_id}</Text><Text style={s.status}>Статус: {sub.status}</Text><Text style={s.note}>Провайдер: {sub.provider} · Оплачено до: {sub.current_period_end||"не указано"}</Text></Card>)}
    <Text style={s.footnote}>Удаление аккаунта и блокировка входа требуют отдельного серверного Auth Admin endpoint. Сейчас панель меняет статус модерации внутри HIME и не удаляет учётные записи Supabase.</Text>
  </ScrollView>;
}

const s=StyleSheet.create({
 wrap:{flex:1,backgroundColor:"#FAF7F6"},content:{padding:16,paddingBottom:40},header:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",gap:8},eyebrow:{fontSize:9,letterSpacing:2,color:burgundy,fontWeight:"800"},title:{fontSize:23,fontWeight:"800",color:"#171316",marginTop:5},tabs:{gap:7,paddingVertical:14},tab:{paddingHorizontal:13,paddingVertical:10,borderRadius:18,backgroundColor:"#F0E7E8"},tabOn:{backgroundColor:burgundy},tabText:{fontSize:11,color:burgundy,fontWeight:"700"},tabTextOn:{color:"#FFF"},input:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#E9DDDF",borderRadius:10,padding:12,color:"#171316",marginTop:10},textarea:{minHeight:90,textAlignVertical:"top"},card:{backgroundColor:"#FFF",borderRadius:14,borderWidth:1,borderColor:"#EFE7E8",padding:13,marginTop:10},cardTitle:{fontSize:13,fontWeight:"800",color:"#171316"},note:{fontSize:10,color:"#8D8186",lineHeight:16,marginTop:5},body:{fontSize:12,color:"#4D4448",lineHeight:18,marginTop:8},status:{fontSize:11,color:burgundy,fontWeight:"700",marginTop:7},row:{flexDirection:"row",gap:6,flexWrap:"wrap"},button:{backgroundColor:burgundy,paddingHorizontal:10,paddingVertical:10,borderRadius:9,alignItems:"center",justifyContent:"center",marginTop:8,flex:1},secondary:{backgroundColor:"#F0E7E8"},danger:{backgroundColor:"#F9E9E9"},buttonText:{fontSize:10,color:"#FFF",fontWeight:"800"},secondaryText:{color:burgundy},dangerText:{color:"#A52B37"},message:{padding:9,backgroundColor:"#FAF7F6",borderRadius:9,marginTop:8},footnote:{fontSize:10,color:"#9B8D92",lineHeight:15,marginTop:18}
});
