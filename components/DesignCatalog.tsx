import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

type NailDesign = {
  id: string; title: string; category: string; color: string | null;
  nail_shape: string | null; nail_length: string | null; finish: string | null;
  image_path: string; thumbnail_path: string | null;
};
const PAGE_SIZE = 24;
const categories = ["Все", "Френч", "Нюд", "Бордовый", "Красный", "Свадебный", "Минимализм", "Геометрия", "Цветы", "Стразы", "Хром", "Градиент", "Мрамор", "Яркий"];

export default function DesignCatalog() {
  const [items, setItems] = useState<NailDesign[]>([]);
  const [category, setCategory] = useState("Все");
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [selected, setSelected] = useState<NailDesign | null>(null);

  const load = useCallback(async (reset = false) => {
    if (!supabase || loading) return;
    setLoading(true); setError("");
    const from = reset ? 0 : offset;
    let request = supabase.from("nail_designs")
      .select("id,title,category,color,nail_shape,nail_length,finish,image_path,thumbnail_path")
      .eq("is_active", true).order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (category !== "Все") request = request.eq("category", category);
    if (search.trim()) request = request.ilike("title", "%" + search.trim() + "%");
    const { data, error: queryError } = await request;
    if (queryError) setError("Не удалось загрузить каталог: " + queryError.message);
    else {
      const rows = (data || []) as NailDesign[];
      setItems(old => reset ? rows : [...old, ...rows]);
      setOffset(from + rows.length);
      setHasMore(rows.length === PAGE_SIZE);
    }
    setLoading(false);
  }, [category, search, offset, loading]);

  useEffect(() => { setItems([]); setOffset(0); setHasMore(true); void load(true); }, [category, search]);

  const publicUrl = (path: string) => supabase?.storage.from("nail-designs").getPublicUrl(path).data.publicUrl || "";
  const visibleItems = savedOnly ? items.filter(x => saved.includes(x.id)) : items;

  return <View style={s.wrap}>
    <Text style={s.eyebrow}>HIME STUDIO · INSPIRATION</Text>
    <Text style={s.title}>Каталог дизайнов</Text>
    <Text style={s.note}>Фотографии реальных дизайнов. Загружаются частями, чтобы каталог работал плавно.</Text>
    <TextInput value={search} onChangeText={setSearch} placeholder="Поиск дизайна" placeholderTextColor="#A9959C" style={s.search}/>
    <View style={s.row}>
      <TouchableOpacity onPress={()=>setSavedOnly(false)} style={[s.tab,!savedOnly&&s.active]}><Text style={s.tabText}>Все дизайны</Text></TouchableOpacity>
      <TouchableOpacity onPress={()=>setSavedOnly(true)} style={[s.tab,savedOnly&&s.active]}><Text style={s.tabText}>♡ Избранное ({saved.length})</Text></TouchableOpacity>
    </View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
      {categories.map(x=><TouchableOpacity key={x} onPress={()=>setCategory(x)} style={[s.chip,category===x&&s.chipOn]}><Text style={s.chipText}>{x}</Text></TouchableOpacity>)}
    </ScrollView>
    {error ? <Text style={s.error}>{error}</Text> : null}
    {selected ? <View style={s.viewer}>
      <TouchableOpacity onPress={()=>setSelected(null)}><Text style={s.close}>‹ Назад к каталогу</Text></TouchableOpacity>
      <Image source={{uri:publicUrl(selected.image_path)}} style={s.fullImage} resizeMode="contain"/>
      <Text style={s.cardTitle}>{selected.title}</Text>
      <Text style={s.meta}>{[selected.category,selected.nail_shape,selected.nail_length,selected.finish].filter(Boolean).join(" · ")}</Text>
    </View> : <>
      <View style={s.grid}>{visibleItems.map(item=><View key={item.id} style={s.card}>
        <TouchableOpacity onPress={()=>setSelected(item)}>
          <Image source={{uri:publicUrl(item.thumbnail_path || item.image_path)}} style={s.photo} resizeMode="cover"/>
          <Text style={s.cardTitle}>{item.title}</Text>
          <Text style={s.meta}>{[item.nail_shape,item.nail_length,item.finish].filter(Boolean).join(" · ")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>setSaved(old=>old.includes(item.id)?old.filter(x=>x!==item.id):[...old,item.id])} style={s.heart}><Text style={s.heartText}>{saved.includes(item.id)?"♥":"♡"}</Text></TouchableOpacity>
      </View>)}</View>
      {!loading && visibleItems.length===0 && <Text style={s.empty}>{savedOnly ? "Ты пока не добавила дизайны в избранное." : "Фотографии ещё не загружены. Каталог и фильтры уже подключены; фотоколлекцию нужно наполнить файлами с подтверждённой лицензией."}</Text>}
      {loading && <ActivityIndicator color="#C34A68" style={{margin:18}}/>}
      {!loading && hasMore && !savedOnly && <TouchableOpacity style={s.moreButton} onPress={()=>void load()}><Text style={s.moreText}>Загрузить ещё</Text></TouchableOpacity>}
    </>}
  </View>;
}
const s=StyleSheet.create({
 wrap:{gap:12,backgroundColor:"#090607",padding:12,borderRadius:20},
 eyebrow:{fontSize:10,letterSpacing:2,color:"#C34A68",fontWeight:"800"},
 title:{fontSize:28,fontWeight:"800",color:"#FFF5F6"},
 note:{fontSize:13,lineHeight:20,color:"#B9A6AC"},
 search:{backgroundColor:"#1B1014",borderColor:"#49303A",borderWidth:1,borderRadius:12,padding:12,color:"#FFF0F3"},
 row:{flexDirection:"row",gap:8},
 tab:{paddingVertical:10,paddingHorizontal:14,borderRadius:20,backgroundColor:"#211317",borderWidth:1,borderColor:"#392129"},
 active:{backgroundColor:"#70152D",borderColor:"#A92D4D"},
 tabText:{fontSize:12,color:"#FFF",fontWeight:"700"},
 chips:{gap:7,paddingVertical:3},
 chip:{paddingVertical:8,paddingHorizontal:12,borderRadius:18,backgroundColor:"#211317",borderWidth:1,borderColor:"#392129"},
 chipOn:{backgroundColor:"#78172F",borderColor:"#B53656"},
 chipText:{fontSize:11,color:"#FFF"},
 grid:{flexDirection:"row",flexWrap:"wrap",justifyContent:"space-between",gap:8},
 card:{width:"48%",backgroundColor:"#160D10",borderRadius:16,padding:8,borderWidth:1,borderColor:"#43212D",overflow:"hidden"},
 photo:{width:"100%",height:150,borderRadius:11,backgroundColor:"#2A1A20"},
 heart:{position:"absolute",top:12,right:12,width:30,height:30,borderRadius:15,backgroundColor:"#120A0CE8",alignItems:"center",justifyContent:"center"},
 heartText:{fontSize:19,color:"#E35B7C"},
 cardTitle:{fontSize:12,fontWeight:"800",color:"#FFF0F3",marginTop:7},
 meta:{fontSize:10,color:"#BDA9B0",marginTop:3},
 empty:{fontSize:12,lineHeight:19,color:"#D2BFC5",padding:14,backgroundColor:"#211317",borderRadius:12},
 moreButton:{backgroundColor:"#78172F",padding:14,borderRadius:12,alignItems:"center"},
 moreText:{color:"#FFF",fontWeight:"800"},
 error:{color:"#FF9AAE",fontSize:12},
 viewer:{backgroundColor:"#160D10",borderRadius:16,padding:12},
 close:{color:"#E7A8B8",fontWeight:"700",paddingVertical:8},
 fullImage:{width:"100%",height:420,backgroundColor:"#20151A",borderRadius:12},
});
