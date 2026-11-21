import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import Svg, { Defs, LinearGradient, Stop, Rect, Path, Circle } from "react-native-svg";

type Design = { id: number; title: string; color: string; colorName: string; category: string; finish: string; style: string; length: string; shape: string; accent: string };
const palettes = [
  ["#F5C4D0","Розовый","Светлые"],["#F4E6D2","Молочный","Светлые"],["#7A1838","Вишнёвый","Тёмные"],["#D92D55","Красный","Яркие"],["#F5A623","Оранжевый","Яркие"],["#9D83C7","Лавандовый","Пастельные"],["#6C8B72","Шалфейный","Пастельные"],["#3B2638","Сливовый","Тёмные"],["#D9B58C","Бежевый","Нюд"],["#F1A8B8","Пудровый","Нюд"]
] as const;
const stylesList = ["Френч","Минимализм","Геометрия","Цветы","Стразы","Градиент","Абстракция","Хром","Мрамор","Однотонный"] as const;
const finishes = ["Глянцевый","Матовый","С блёстками","Перламутровый","Хром"] as const;
const lengths = ["Короткие","Средние","Длинные","Очень длинные"] as const;
const shapes = ["Мягкий квадрат","Миндаль","Овал","Балерина","Стилет"] as const;
const designPhotos: Record<number, string> = {};
const designs: Design[] = Array.from({length:1200},(_,i)=>{
  const p=palettes[i%palettes.length], style=stylesList[Math.floor(i/10)%stylesList.length], finish=finishes[Math.floor(i/100)%finishes.length];
  const length=lengths[Math.floor(i/25)%lengths.length], shape=shapes[Math.floor(i/40)%shapes.length];
  return {id:i+1,title:p[1]+" · "+style.toLowerCase(),color:p[0],colorName:p[1],category:p[2],finish,style,length,shape,accent:["#FFFFFF","#E7B85C","#D8A4B5","#8B5470"][i%4]};
});
const categories=["Все","Яркие","Светлые","Тёмные","Нюд","Пастельные","Френч","Минимализм","Геометрия","Цветы","Стразы","Градиент","Хром","Матовые","Глянцевые","С блёстками"];
const lengthsFilter=["Любая длина",...lengths];
function NailPreview({item}:{item:Design}) {
  const ids=[0,1,2,3,4];
  return <Svg viewBox="0 0 320 190" width="100%" height="170">
    <Defs><LinearGradient id={"bg"+item.id} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFF9F7"/><Stop offset="1" stopColor="#F1E5E7"/></LinearGradient><LinearGradient id={"pol"+item.id} x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFFFFF" stopOpacity=".65"/><Stop offset=".35" stopColor={item.color}/><Stop offset="1" stopColor={item.color}/></LinearGradient></Defs>
    <Rect width="320" height="190" rx="18" fill={"url(#bg"+item.id+")"}/>
    {ids.map((n)=><Path key={n} d={item.length==="Очень длинные"?"M"+(35+n*52)+" 132 Q"+(30+n*52)+" 83 "+(42+n*52)+" 26 Q"+(48+n*52)+" 10 "+(54+n*52)+" 26 Q"+(65+n*52)+" 83 "+(61+n*52)+" 132 Q"+(48+n*52)+" 151 "+(35+n*52)+" 132Z":"M"+(35+n*52)+" 132 Q"+(29+n*52)+" 82 "+(39+n*52)+" 46 Q"+(48+n*52)+" 31 "+(57+n*52)+" 46 Q"+(66+n*52)+" 82 "+(61+n*52)+" 132 Q"+(48+n*52)+" 148 "+(35+n*52)+" 132Z"} fill={"url(#pol"+item.id+")"} stroke="#D9BFC5" strokeWidth="1.2"/>)}
    {item.style==="Френч" && ids.map(n=><Path key={"f"+n} d={"M"+(37+n*52)+" 54 Q"+(48+n*52)+" 44 "+(59+n*52)+" 54"} fill="none" stroke="#FFF" strokeWidth="7" strokeLinecap="round"/>)}
    {item.style==="Стразы" && ids.map(n=><Circle key={"s"+n} cx={48+n*52} cy="83" r="4" fill={item.accent} stroke="#FFF" strokeWidth="1"/>)}
    {item.style==="Цветы" && ids.map(n=><><Circle key={"c"+n} cx={48+n*52} cy="82" r="5" fill={item.accent}/><Circle key={"d"+n} cx={48+n*52} cy="75" r="3" fill="#FFF"/></>)}
    {item.finish==="С блёстками" && ids.map(n=><Path key={"g"+n} d={"M"+(43+n*52)+" 66 l3 -5 l3 5 l-3 5Z"} fill="#FFF" opacity=".9"/>)}
  </Svg>;
}
export default function DesignCatalog() {
  const [category,setCategory]=useState("Все");
  const [length,setLength]=useState("Любая длина");
  const [saved,setSaved]=useState<number[]>([]);
  const [showSaved,setShowSaved]=useState(false);
  const filtered=useMemo(()=>designs.filter(d=>(category==="Все" || d.category===category || d.style===category || (category==="Матовые"&&d.finish==="Матовый") || (category==="Глянцевые"&&d.finish==="Глянцевый") || (category==="С блёстками"&&d.finish==="С блёстками"))&&(length==="Любая длина"||d.length===length)&&(!showSaved||saved.includes(d.id))),[category,length,showSaved,saved]);
  return <View style={s.wrap}>
    <Text style={s.eyebrow}>NAIL INSPIRATION · 1200+ ИДЕЙ</Text>
    <Text style={s.title}>Каталог дизайнов</Text>
    <Text style={s.note}>Подбирай маникюр по настроению, покрытию и длине ногтей.</Text>
    <View style={s.row}><TouchableOpacity onPress={()=>setShowSaved(false)} style={[s.tab,!showSaved&&s.active]}><Text style={[s.tabText,!showSaved&&s.activeText]}>Все дизайны</Text></TouchableOpacity><TouchableOpacity onPress={()=>setShowSaved(true)} style={[s.tab,showSaved&&s.active]}><Text style={[s.tabText,showSaved&&s.activeText]}>♡ Избранное ({saved.length})</Text></TouchableOpacity></View>
    <Text style={s.label}>Цвет и стиль</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>{categories.map(x=><TouchableOpacity key={x} onPress={()=>setCategory(x)} style={[s.chip,category===x&&s.chipOn]}><Text style={[s.chipText,category===x&&s.chipTextOn]}>{x}</Text></TouchableOpacity>)}</ScrollView>
    <Text style={s.label}>Длина ногтей</Text>
    <View style={s.lengths}>{lengthsFilter.map(x=><TouchableOpacity key={x} onPress={()=>setLength(x)} style={[s.lengthChip,length===x&&s.chipOn]}><Text style={[s.chipText,length===x&&s.chipTextOn]}>{x}</Text></TouchableOpacity>)}</View>
    <Text style={s.count}>Найдено вариантов: {filtered.length} из {designs.length}</Text>
    <View style={s.grid}>{filtered.slice(0,100).map(item=><View key={item.id} style={s.card}>
      {designPhotos[item.id] ? <Image source={{uri:designPhotos[item.id]}} style={{width:"100%",height:170,borderRadius:12}} resizeMode="cover"/> : <NailPreview item={item}/>}
      <TouchableOpacity onPress={()=>setSaved(old=>old.includes(item.id)?old.filter(x=>x!==item.id):[...old,item.id])} style={s.heart}><Text style={s.heartText}>{saved.includes(item.id)?"♥":"♡"}</Text></TouchableOpacity>
      <Text style={s.cardTitle}>{String(item.id).padStart(4,"0")} · {item.title}</Text>
      <Text style={s.meta}>{item.length} · {item.shape}</Text>
      <Text style={s.meta}>{item.finish} · {item.style}</Text>
    </View>)}</View>
    {filtered.length>100&&<Text style={s.more}>Показаны первые 100 вариантов из подходящих. Уточни фильтры, чтобы быстрее найти идею.</Text>}
    {filtered.length===0&&<Text style={s.note}>Пока нет сохранённых дизайнов в этой подборке.</Text>}
  </View>;
}
const s=StyleSheet.create({wrap:{gap:12,backgroundColor:"#090607",padding:12,borderRadius:20},eyebrow:{fontSize:10,letterSpacing:2,color:"#C34A68",fontWeight:"800"},title:{fontSize:28,fontWeight:"800",color:"#FFF5F6"},note:{fontSize:13,lineHeight:20,color:"#B9A6AC"},row:{flexDirection:"row",gap:8,flexWrap:"wrap"},tab:{paddingVertical:10,paddingHorizontal:14,borderRadius:20,backgroundColor:"#211317",borderWidth:1,borderColor:"#392129"},active:{backgroundColor:"#70152D",borderColor:"#A92D4D"},tabText:{fontSize:12,color:"#C8B7BC",fontWeight:"700"},activeText:{color:"#FFF"},label:{fontSize:12,fontWeight:"800",color:"#F1E4E8",marginTop:4},chips:{gap:7,paddingVertical:3},chip:{paddingVertical:8,paddingHorizontal:12,borderRadius:18,backgroundColor:"#211317",borderWidth:1,borderColor:"#392129"},chipOn:{backgroundColor:"#78172F",borderColor:"#B53656"},chipText:{fontSize:11,color:"#D4C2C7"},chipTextOn:{color:"#FFF",fontWeight:"700"},lengths:{flexDirection:"row",flexWrap:"wrap",gap:7},lengthChip:{paddingVertical:8,paddingHorizontal:10,borderRadius:16,backgroundColor:"#211317",borderWidth:1,borderColor:"#392129"},count:{fontSize:11,color:"#B49EA5",fontWeight:"700"},grid:{flexDirection:"row",flexWrap:"wrap",gap:10},card:{width:"48%",backgroundColor:"#160D10",borderRadius:16,padding:8,borderWidth:1,borderColor:"#43212D",overflow:"hidden"},heart:{position:"absolute",top:12,right:12,width:30,height:30,borderRadius:15,backgroundColor:"#120A0CE8",alignItems:"center",justifyContent:"center"},heartText:{fontSize:19,color:"#E35B7C"},cardTitle:{fontSize:12,fontWeight:"800",color:"#FFF0F3",marginTop:4},meta:{fontSize:10,color:"#BDA9B0",marginTop:3},more:{fontSize:11,color:"#BDA9B0",textAlign:"center",padding:12}});
