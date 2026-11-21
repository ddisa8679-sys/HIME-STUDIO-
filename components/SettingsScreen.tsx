import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  role: "client" | "master";
  onSwitchRole: () => void;
  onSignOut: () => void;
};

const burgundy = "#651D32";
const ink = "#171316";
const muted = "#8D8186";

export default function SettingsScreen({ role, onSwitchRole, onSignOut }: Props) {
  const isClient = role === "client";
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>HIME STUDIO · PREFERENCES</Text>
      <Text style={styles.title}>Настройки</Text>
      <Text style={styles.description}>Управляй аккаунтом и основными параметрами приложения в одном месте.</Text>

      <Text style={styles.section}>Аккаунт</Text>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.icon}><Text style={styles.iconText}>♙</Text></View>
          <View style={styles.copy}><Text style={styles.itemTitle}>Тип аккаунта</Text><Text style={styles.itemText}>{isClient ? "Клиент" : "Мастер"}</Text></View>
        </View>
        <TouchableOpacity style={styles.action} onPress={onSwitchRole}>
          <Text style={styles.actionText}>{isClient ? "Переключиться на аккаунт мастера" : "Переключиться на аккаунт клиента"}</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Приложение</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}><Text style={styles.itemTitle}>Оформление</Text><Text style={styles.itemText}>Фирменная тема HIME STUDIO</Text></View>
        <View style={styles.separator}/>
        <View style={styles.infoRow}><Text style={styles.itemTitle}>Версия</Text><Text style={styles.itemText}>HIME STUDIO</Text></View>
      </View>

      <Text style={styles.section}>Конфиденциальность и помощь</Text>
      <View style={styles.card}>
        <View style={styles.infoRow}><Text style={styles.itemTitle}>Личные данные</Text><Text style={styles.itemText}>Проверяй информацию в разделе «Профиль».</Text></View>
        <View style={styles.separator}/>
        <View style={styles.infoRow}><Text style={styles.itemTitle}>Безопасность</Text><Text style={styles.itemText}>Не передавай никому пароль и коды входа.</Text></View>
      </View>

      <TouchableOpacity style={styles.signOut} onPress={onSignOut}>
        <Text style={styles.signOutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{padding:20,paddingBottom:38},
  kicker:{color:burgundy,fontSize:10,fontWeight:"800",letterSpacing:2.5,marginTop:8},
  title:{color:ink,fontSize:30,fontWeight:"700",marginTop:8},
  description:{color:muted,fontSize:13,lineHeight:20,marginTop:8,marginBottom:18},
  section:{color:ink,fontSize:16,fontWeight:"700",marginTop:18,marginBottom:10},
  card:{backgroundColor:"#FFF",borderRadius:15,borderWidth:1,borderColor:"#EFE5E7",padding:15},
  row:{flexDirection:"row",alignItems:"center",gap:12},
  icon:{width:40,height:40,borderRadius:12,backgroundColor:"#F5ECEE",alignItems:"center",justifyContent:"center"},
  iconText:{color:burgundy,fontSize:22},
  copy:{flex:1},
  itemTitle:{color:ink,fontSize:13,fontWeight:"700"},
  itemText:{color:muted,fontSize:11,lineHeight:17,marginTop:4},
  action:{marginTop:14,paddingTop:13,borderTopWidth:1,borderColor:"#F0E8E9",flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  actionText:{color:burgundy,fontSize:12,fontWeight:"700",flex:1},
  arrow:{color:burgundy,fontSize:22,marginLeft:8},
  infoRow:{paddingVertical:5},
  separator:{height:1,backgroundColor:"#F0E8E9",marginVertical:10},
  signOut:{marginTop:26,padding:16,borderRadius:12,borderWidth:1,borderColor:"#E7D4DA",alignItems:"center",backgroundColor:"#F8F0F2"},
  signOutText:{color:burgundy,fontWeight:"700",fontSize:13}
});
