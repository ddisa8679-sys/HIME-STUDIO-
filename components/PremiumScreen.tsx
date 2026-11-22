import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Alert, TouchableOpacity } from "react-native";

const wine="#651D32";
function Plan({name,subtitle,features,tag}:{name:string;subtitle:string;features:string[];tag:string}) {
 return <View style={s.card}><Text style={s.tag}>{tag}</Text><Text style={s.name}>{name}</Text><Text style={s.subtitle}>{subtitle}</Text>{features.map(x=><Text key={x} style={s.feature}>✦  {x}</Text>)}<TouchableOpacity style={s.button} onPress={()=>Alert.alert("Скоро в HIME","Оплата и оформление подписки появятся после подключения платёжного провайдера. Сейчас списаний нет.")}><Text style={s.buttonText}>Скоро будет доступно</Text></TouchableOpacity></View>;
}
export default function PremiumScreen(){
 return <ScrollView style={s.wrap} contentContainerStyle={s.content}>
  <View style={s.hero}><Text style={s.eyebrow}>HIME MEMBERSHIP</Text><Text style={s.title}>Больше возможностей. Больше красоты.</Text><Text style={s.copy}>Дополнительные инструменты для клиентов и мастеров. Основные функции HIME останутся бесплатными.</Text></View>
  <Plan tag="FOR CLIENTS" name="PREMIUM CLIENT" subtitle="Больше вдохновения и персональных возможностей." features={["Расширенное избранное","Премиальные коллекции дизайнов","Персональные рекомендации","Ранний доступ к новым функциям"]}/>
  <Plan tag="FOR NAIL ARTISTS" name="HIME PRO MASTER" subtitle="Инструменты для развития и продвижения." features={["Расширенное портфолио","Статистика просмотров и интереса","AI-помощник для описаний работ","Дополнительные инструменты продвижения"]}/>
  <Plan tag="ALL ACCESS" name="PREMIUM ALL" subtitle="Объединённый пакет для клиентов и мастеров." features={["Все возможности Premium Client","Все возможности HIME PRO","Эксклюзивные темы профиля","Ранний доступ к экспериментальным функциям"]}/>
  <Text style={s.disclaimer}>Цены, периодичность и оплата пока не настроены. Никаких реальных платежей этот экран не принимает. Функции, требующие AI или продвижения, будут включаться только после подключения соответствующих сервисов.</Text>
 </ScrollView>
}
const s=StyleSheet.create({wrap:{flex:1,backgroundColor:"#FAF7F6"},content:{padding:17,paddingBottom:40},hero:{backgroundColor:wine,borderRadius:22,padding:22,marginBottom:12},eyebrow:{fontSize:9,letterSpacing:2,color:"#E8C9D2",fontWeight:"800"},title:{fontSize:26,lineHeight:31,fontWeight:"800",color:"#FFF",marginTop:12},copy:{fontSize:12,lineHeight:19,color:"#F0DDE2",marginTop:10},card:{backgroundColor:"#FFF",borderRadius:18,padding:17,marginTop:12,borderWidth:1,borderColor:"#EFE5E7"},tag:{fontSize:9,letterSpacing:1.7,fontWeight:"800",color:wine},name:{fontSize:19,fontWeight:"900",color:"#171316",marginTop:8},subtitle:{fontSize:11,color:"#8D8186",marginTop:4,marginBottom:10},feature:{fontSize:12,color:"#4D4448",paddingVertical:6},button:{backgroundColor:"#F0E7E8",borderRadius:10,padding:13,alignItems:"center",marginTop:10},buttonText:{fontSize:11,fontWeight:"800",color:wine},disclaimer:{fontSize:10,color:"#8D8186",lineHeight:16,marginTop:16}});
