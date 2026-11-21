import React, { useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

type Props = {
  role: "client" | "master";
  onSwitchRole: () => void;
  onSignOut: () => void;
};

const burgundy = "#651D32";
const ink = "#171316";
const muted = "#8D8186";

function SettingSwitch({ title, detail, value, onValueChange }: { title: string; detail: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <View style={styles.settingRow}>
    <View style={styles.copy}><Text style={styles.itemTitle}>{title}</Text><Text style={styles.itemText}>{detail}</Text></View>
    <Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#E6DDE0", true: "#B77A8D" }} thumbColor={value ? burgundy : "#FFF"} />
  </View>;
}

function Choice({ title, detail, selected, onPress }: { title: string; detail?: string; selected?: boolean; onPress: () => void }) {
  return <TouchableOpacity style={styles.choice} onPress={onPress}>
    <View style={styles.copy}><Text style={styles.itemTitle}>{title}</Text>{!!detail && <Text style={styles.itemText}>{detail}</Text>}</View>
    <Text style={styles.choiceMark}>{selected ? "●" : "○"}</Text>
  </TouchableOpacity>;
}

export default function SettingsScreen({ role, onSwitchRole, onSignOut }: Props) {
  const isClient = role === "client";
  const [bookingAlerts, setBookingAlerts] = useState(true);
  const [messages, setMessages] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [marketing, setMarketing] = useState(false);
  const [theme, setTheme] = useState("Фирменная");
  const [compact, setCompact] = useState(false);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>HIME STUDIO · PREFERENCES</Text>
      <Text style={styles.title}>Настройки</Text>
      <Text style={styles.description}>Всё важное для аккаунта, уведомлений и удобства приложения — в одном месте.</Text>

      <Text style={styles.section}>Аккаунт</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.copy}><Text style={styles.itemTitle}>Тип аккаунта</Text><Text style={styles.itemText}>{isClient ? "Клиент" : "Мастер"}</Text></View>
          <Text style={styles.accountIcon}>♙</Text>
        </View>
        <TouchableOpacity style={styles.action} onPress={onSwitchRole}>
          <Text style={styles.actionText}>{isClient ? "Переключиться на аккаунт мастера" : "Переключиться на аккаунт клиента"}</Text><Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Уведомления</Text>
      <View style={styles.card}>
        <SettingSwitch title="Записи и изменения" detail="Подтверждения, переносы и отмены" value={bookingAlerts} onValueChange={setBookingAlerts}/>
        <View style={styles.separator}/>
        <SettingSwitch title="Сообщения" detail="Новые сообщения от клиентов и мастеров" value={messages} onValueChange={setMessages}/>
        <View style={styles.separator}/>
        <SettingSwitch title="Напоминания" detail="Напоминание о предстоящей записи" value={reminders} onValueChange={setReminders}/>
        <View style={styles.separator}/>
        <SettingSwitch title="Новости и предложения" detail="Акции и новости HIME STUDIO" value={marketing} onValueChange={setMarketing}/>
      </View>

      <Text style={styles.section}>Внешний вид</Text>
      <View style={styles.card}>
        <Text style={styles.itemTitle}>Тема приложения</Text>
        <Text style={styles.itemText}>Выбери настроение интерфейса</Text>
        <View style={styles.choices}>
          {["Фирменная", "Светлая", "Тёмная"].map(option => <TouchableOpacity key={option} onPress={() => setTheme(option)} style={[styles.themeChoice, theme === option && styles.themeChoiceActive]}>
            <View style={[styles.themeSwatch, option === "Фирменная" ? styles.swatchBrand : option === "Тёмная" ? styles.swatchDark : styles.swatchLight]}/>
            <Text style={[styles.themeText, theme === option && styles.themeTextActive]}>{option}</Text>
            {theme === option && <Text style={styles.themeCheck}>✓</Text>}
          </TouchableOpacity>)}
        </View>
        <View style={styles.separator}/>
        <SettingSwitch title="Компактный вид" detail="Больше информации на одном экране" value={compact} onValueChange={setCompact}/>
      </View>

      <Text style={styles.section}>Конфиденциальность</Text>
      <View style={styles.card}>
        <Choice title="Личные данные" detail="Имя, город и описание — в профиле" onPress={() => Alert.alert("Личные данные", "Изменить личную информацию можно в разделе «Профиль».")}/>
        <View style={styles.separator}/>
        <Choice title="Безопасность аккаунта" detail="Советы по защите учётной записи" onPress={() => Alert.alert("Безопасность", "Не сообщай никому пароль и одноразовые коды. Используй надёжный пароль.")}/>
      </View>

      <Text style={styles.section}>Помощь и информация</Text>
      <View style={styles.card}>
        <Choice title="Помощь и поддержка" detail="Куда обратиться, если что-то не работает" onPress={() => Alert.alert("Поддержка", "Раздел поддержки можно подключить отдельно — здесь пока справочная информация.")}/>
        <View style={styles.separator}/>
        <Choice title="О приложении" detail="HIME STUDIO · версия проекта" onPress={() => Alert.alert("HIME STUDIO", "Приложение для вдохновения, поиска мастеров и записи на маникюр.")}/>
      </View>

      <TouchableOpacity style={styles.signOut} onPress={onSignOut}>
        <Text style={styles.signOutText}>Выйти из аккаунта</Text>
      </TouchableOpacity>
      <Text style={styles.footer}>HIME STUDIO · BEAUTY STARTS HERE</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:{padding:20,paddingBottom:42},
  kicker:{color:burgundy,fontSize:10,fontWeight:"800",letterSpacing:2.5,marginTop:8},
  title:{color:ink,fontSize:30,fontWeight:"700",marginTop:8},
  description:{color:muted,fontSize:13,lineHeight:20,marginTop:8,marginBottom:12},
  section:{color:ink,fontSize:16,fontWeight:"700",marginTop:22,marginBottom:10},
  card:{backgroundColor:"#FFF",borderRadius:15,borderWidth:1,borderColor:"#EFE5E7",padding:15},
  settingRow:{flexDirection:"row",alignItems:"center",gap:12,minHeight:48},
  copy:{flex:1},
  itemTitle:{color:ink,fontSize:13,fontWeight:"700"},
  itemText:{color:muted,fontSize:11,lineHeight:17,marginTop:4},
  separator:{height:1,backgroundColor:"#F0E8E9",marginVertical:11},
  action:{marginTop:14,paddingTop:13,borderTopWidth:1,borderColor:"#F0E8E9",flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  actionText:{color:burgundy,fontSize:12,fontWeight:"700",flex:1},
  arrow:{color:burgundy,fontSize:22,marginLeft:8},
  accountIcon:{color:burgundy,fontSize:23,backgroundColor:"#F5ECEE",overflow:"hidden",padding:9,borderRadius:12},
  choices:{gap:8,marginTop:14},
  themeChoice:{flexDirection:"row",alignItems:"center",gap:10,borderWidth:1,borderColor:"#EFE5E7",borderRadius:11,padding:10},
  themeChoiceActive:{borderColor:burgundy,backgroundColor:"#FBF5F6"},
  themeSwatch:{width:25,height:25,borderRadius:8},
  swatchBrand:{backgroundColor:"#651D32"},
  swatchDark:{backgroundColor:"#171316"},
  swatchLight:{backgroundColor:"#F4ECEC",borderWidth:1,borderColor:"#E7DADD"},
  themeText:{color:ink,fontSize:12,flex:1},
  themeTextActive:{color:burgundy,fontWeight:"700"},
  themeCheck:{color:burgundy,fontWeight:"800"},
  choice:{flexDirection:"row",alignItems:"center",minHeight:48},
  choiceMark:{color:burgundy,fontSize:16,marginLeft:10},
  signOut:{marginTop:26,padding:16,borderRadius:12,borderWidth:1,borderColor:"#E7D4DA",alignItems:"center",backgroundColor:"#F8F0F2"},
  signOutText:{color:burgundy,fontWeight:"700",fontSize:13},
  footer:{color:"#A99BA0",fontSize:9,letterSpacing:2,textAlign:"center",marginTop:22}
});
