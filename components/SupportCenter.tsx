import React,{useCallback,useEffect,useState} from "react";
import {Alert,Modal,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import {supabase} from "../lib/supabase";

type Ticket={id:string;subject:string;category:string;status:string;updated_at:string};
type Message={id:string;ticket_id:string;sender_id:string;body:string;created_at:string};
const wine="#651D32";
export default function SupportCenter({visible,onClose}:{visible:boolean;onClose:()=>void}){
 const [tickets,setTickets]=useState<Ticket[]>([]),[selected,setSelected]=useState<Ticket|null>(null),[messages,setMessages]=useState<Message[]>([]);
 const [subject,setSubject]=useState(""),[body,setBody]=useState(""),[reply,setReply]=useState(""),[category,setCategory]=useState("other"),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{
  const {data:{user}}=await supabase.auth.getUser();if(!user)return;
  const {data,error}=await supabase.from("hime_support_tickets").select("id,subject,category,status,updated_at").eq("requester_id",user.id).order("updated_at",{ascending:false});
  if(error)Alert.alert("Поддержка",error.message);else setTickets((data||[]) as Ticket[]);
 },[]);
 useEffect(()=>{if(visible)void load();},[visible,load]);
 const open=async(t:Ticket)=>{setSelected(t);const {data,error}=await supabase.from("hime_support_messages").select("id,ticket_id,sender_id,body,created_at").eq("ticket_id",t.id).order("created_at");if(error)Alert.alert("Поддержка",error.message);else setMessages((data||[]) as Message[]);};
 const create=async()=>{if(subject.trim().length<3||body.trim().length<1)return Alert.alert("Заполни обращение","Добавь тему и сообщение.");
  setBusy(true);const {data:{user}}=await supabase.auth.getUser();if(!user){setBusy(false);return Alert.alert("Нужен вход","Войди в аккаунт.");}
  const {data,error}=await supabase.from("hime_support_tickets").insert({requester_id:user.id,subject:subject.trim(),category}).select("id,subject,category,status,updated_at").single();
  if(error){setBusy(false);return Alert.alert("Не удалось создать обращение",error.message);}
  const {error:messageError}=await supabase.from("hime_support_messages").insert({ticket_id:data.id,sender_id:user.id,body:body.trim()});
  setBusy(false);if(messageError)return Alert.alert("Обращение создано, но сообщение не отправлено",messageError.message);
  setSubject("");setBody("");await load();await open(data as Ticket);
 };
 const send=async()=>{if(!selected||!reply.trim())return;const {data:{user}}=await supabase.auth.getUser();if(!user)return;
  const {error}=await supabase.from("hime_support_messages").insert({ticket_id:selected.id,sender_id:user.id,body:reply.trim()});
  if(error)Alert.alert("Не удалось отправить сообщение",error.message);else{setReply("");const {data:msgs}=await supabase.from("hime_support_messages").select("id,ticket_id,sender_id,body,created_at").eq("ticket_id",selected.id).order("created_at");setMessages((msgs||[]) as Message[]);await load();}
 };
 return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><View style={s.wrap}><View style={s.header}><Text style={s.title}>Поддержка HIME</Text><TouchableOpacity onPress={onClose}><Text style={s.close}>Закрыть</Text></TouchableOpacity></View>
  <ScrollView contentContainerStyle={s.content}>
   {selected?<><TouchableOpacity onPress={()=>setSelected(null)}><Text style={s.back}>‹ Все обращения</Text></TouchableOpacity><Text style={s.subject}>{selected.subject}</Text><Text style={s.note}>Статус: {selected.status}</Text>
    {messages.map(m=><View key={m.id} style={s.message}><Text style={s.note}>{new Date(m.created_at).toLocaleString("ru-RU")}</Text><Text style={s.body}>{m.body}</Text></View>)}
    {selected.status!=="closed"&&<><TextInput value={reply} onChangeText={setReply} placeholder="Напиши ответ..." multiline style={s.input}/><TouchableOpacity style={s.button} onPress={()=>void send()}><Text style={s.buttonText}>Отправить</Text></TouchableOpacity></>}
   </>:<>
    <Text style={s.section}>Новое обращение</Text><TextInput value={subject} onChangeText={setSubject} placeholder="Тема обращения" style={s.input}/>
    <View style={s.categories}>{["other","account","booking","payment","content","technical"].map(c=><TouchableOpacity key={c} onPress={()=>setCategory(c)} style={[s.chip,category===c&&s.chipOn]}><Text style={[s.chipText,category===c&&s.chipTextOn]}>{({other:"Другое",account:"Аккаунт",booking:"Запись",payment:"Оплата",content:"Контент",technical:"Техника"} as any)[c]}</Text></TouchableOpacity>)}</View>
    <TextInput value={body} onChangeText={setBody} placeholder="Опиши проблему..." multiline style={[s.input,s.multiline]}/>
    <TouchableOpacity style={s.button} disabled={busy} onPress={()=>void create()}><Text style={s.buttonText}>{busy?"Отправка…":"Отправить обращение"}</Text></TouchableOpacity>
    <Text style={s.section}>Мои обращения</Text>{tickets.map(t=><TouchableOpacity key={t.id} style={s.ticket} onPress={()=>void open(t)}><Text style={s.ticketTitle}>{t.subject}</Text><Text style={s.note}>{t.category} · {t.status} · {new Date(t.updated_at).toLocaleDateString("ru-RU")}</Text></TouchableOpacity>)}{!tickets.length&&<Text style={s.note}>Обращений пока нет.</Text>}
   </>}
  </ScrollView></View></Modal>;
}
const s=StyleSheet.create({wrap:{flex:1,backgroundColor:"#FAF7F6",paddingTop:42},header:{paddingHorizontal:18,paddingBottom:12,flexDirection:"row",justifyContent:"space-between",alignItems:"center",borderBottomWidth:1,borderColor:"#EFE5E7"},title:{fontSize:21,fontWeight:"800",color:"#171316"},close:{color:wine,fontWeight:"700"},content:{padding:18,paddingBottom:40},section:{fontSize:16,fontWeight:"800",color:"#171316",marginTop:18,marginBottom:9},input:{backgroundColor:"#FFF",borderWidth:1,borderColor:"#E9DDDF",borderRadius:10,padding:12,color:"#171316",marginTop:9},multiline:{minHeight:110,textAlignVertical:"top"},categories:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:8},chip:{padding:9,borderRadius:18,backgroundColor:"#F0E7E8"},chipOn:{backgroundColor:wine},chipText:{fontSize:11,color:wine},chipTextOn:{color:"#FFF"},button:{backgroundColor:wine,padding:13,borderRadius:10,alignItems:"center",marginTop:10},buttonText:{color:"#FFF",fontWeight:"800"},ticket:{backgroundColor:"#FFF",borderRadius:12,padding:13,marginTop:9},ticketTitle:{fontWeight:"800",color:"#171316"},note:{fontSize:10,color:"#8D8186",marginTop:5},subject:{fontSize:18,fontWeight:"800",color:"#171316",marginTop:12},back:{color:wine,fontWeight:"700"},message:{backgroundColor:"#FFF",borderRadius:10,padding:12,marginTop:10},body:{color:"#332B2F",fontSize:13,lineHeight:19,marginTop:5}});