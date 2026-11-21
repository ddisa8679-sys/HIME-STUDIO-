import React, { useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

type Props = { role: "client" | "master"; onSwitchRole: () => void; onSignOut: () => void };
const burgundy = "#651D32", ink = "#171316", muted = "#8D8186";
const languages = ["Русский", "English", "Türkçe", "Español", "Deutsch", "Français", "中文", "Қазақша"];

function SettingSwitch({ title, detail, value, onValueChange }: { title: string; detail: string; value: boolean; onValueChange: (value: boolean) => void }) {
  return <View style={styles.settingRow}><View style={styles.copy}><Text style={styles.itemTitle}>{title}</Text><Text style={styles.itemText}>{detail}</Text></View><Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#E6DDE0", true: "#B77A8D" }} thumbColor={value ? burgundy : "#FFF"} /></View>;
}
function RowAction({ icon, title, detail, onPress, danger = false }: { icon: string; title: string; detail: string; onPress: () => void; danger?: boolean }) {
  return <TouchableOpacity style={styles.actionRow} onPress={onPress}><View style={[styles.iconBox, danger && styles.dangerBox]}><Text style={[styles.iconText, danger && styles.dangerText]}>{icon}</Text></View><View style={styles.copy}><Text style={[styles.itemTitle, danger && styles.dangerText]}>{title}</Text><Text style={styles.itemText}>{detail}</Text></View><Text style={styles.arrow}>›</Text></TouchableOpacity>;
}
export default function SettingsScreen({ role, onSwitchRole, onSignOut }: Props) {
  const isClient = role === "client";
  const [bookingAlerts, setBookingAlerts] = useState(true), [messages, setMessages] = useState(true), [reminders, setReminders] = useState(true), [marketing, setMarketing] = useState(false);
  const [theme, setTheme] = useState("Фирменная"), [compact, setCompact] = useState(false), [language, setLanguage] = useState("Русский"), [languageOpen, setLanguageOpen] = useState(false);
  const [profilePublic, setProfilePublic] = useState(true), [portfolioPublic, setPortfolioPublic] = useState(true), [showCity, setShowCity] = useState(true);
  const deleteAccount = () => Alert.alert("Удаление аккаунта", "Удаление аккаунта необратимо. Перед продолжением потребуется подтвердить личность и удалить данные на сервере.", [{ text: "Отмена", style: "cancel" }, { text: "Понятно", style: "destructive", onPress: () => Alert.alert("Нужна серверная настройка", "Самостоятельное удаление пока не подключено. Не удаляй аккаунт через этот экран — сначала подключим безопасный серверный сценарий.") }]);
  return <ScrollView contentContainerStyle={styles.container}>
    <Text style={styles.kicker}>HIME STUDIO · PREFERENCES</Text><Text style={styles.title}>Настройки</Text><Text style={styles.description}>Управляй аккаунтом, языком, внешним видом и приватностью.</Text>

    <Text style={styles.section}>Аккаунт</Text><View style={styles.card}>
      <RowAction icon="♙" title="Тип аккаунта" detail={isClient ? "Клиент" : "Мастер"} onPress={onSwitchRole}/>
      <View style={styles.separator}/><RowAction icon="◎" title="Личные данные" detail="Имя, город и описание в профиле" onPress={() => Alert.alert("Личные данные", "Изменить имя, город и описание можно в разделе «Профиль».")}/>
    </View>

    <Text style={styles.section}>Язык приложения</Text><View style={styles.card}>
      <RowAction icon="文" title="Язык" detail={language} onPress={() => setLanguageOpen(true)}/>
      <Text style={styles.note}>Популярные языки для пользователей из России и других стран.</Text>
    </View>

    <Text style={styles.section}>Уведомления</Text><View style={styles.card}>
      <SettingSwitch title="Записи и изменения" detail="Подтверждения, переносы и отмены" value={bookingAlerts} onValueChange={setBookingAlerts}/><View style={styles.separator}/>
      <SettingSwitch title="Сообщения" detail="Новые сообщения от клиентов и мастеров" value={messages} onValueChange={setMessages}/><View style={styles.separator}/>
      <SettingSwitch title="Напоминания" detail="О предстоящей записи" value={reminders} onValueChange={setReminders}/><View style={styles.separator}/>
      <SettingSwitch title="Новости и предложения" detail="Акции и новости HIME STUDIO" value={marketing} onValueChange={setMarketing}/>
    </View>

    <Text style={styles.section}>Внешний вид</Text><View style={styles.card}>
      <Text style={styles.itemTitle}>Тема приложения</Text><Text style={styles.itemText}>Выбери оформление</Text>
      <View style={styles.choices}>{["Фирменная", "Светлая", "Тёмная"].map(option => <TouchableOpacity key={option} onPress={() => setTheme(option)} style={[styles.themeChoice, theme === option && styles.themeChoiceActive]}><View style={[styles.themeSwatch, option === "Фирменная" ? styles.swatchBrand : option === "Тёмная" ? styles.swatchDark : styles.swatchLight]}/><Text style={[styles.themeText, theme === option && styles.themeTextActive]}>{option}</Text><Text style={styles.themeCheck}>{theme === option ? "✓" : ""}</Text></TouchableOpacity>)}</View>
      <View style={styles.separator}/><SettingSwitch title="Компактный вид" detail="Больше информации на одном экране" value={compact} onValueChange={setCompact}/>
    </View>

    <Text style={styles.section}>Конфиденциальность</Text><View style={styles.card}>
      <SettingSwitch title="Показывать профиль" detail="Разрешить другим пользователям находить профиль" value={profilePublic} onValueChange={setProfilePublic}/><View style={styles.separator}/>
      <SettingSwitch title="Открытое портфолио" detail="Разрешить просмотр опубликованных работ" value={portfolioPublic} onValueChange={setPortfolioPublic}/><View style={styles.separator}/>
      <SettingSwitch title="Показывать город" detail="Отображать город в публичном профиле" value={showCity} onValueChange={setShowCity}/>
      <View style={styles.separator}/><RowAction icon="◇" title="Безопасность аккаунта" detail="Советы по защите учётной записи" onPress={() => Alert.alert("Безопасность", "Используй уникальный пароль и никому не сообщай одноразовые коды.")}/>
    </View>

    <Text style={styles.section}>Помощь и информация</Text><View style={styles.card}>
      <RowAction icon="?" title="Помощь и поддержка" detail="Ответы на частые вопросы" onPress={() => Alert.alert("Поддержка", "Контактный канал поддержки нужно подключить отдельно.")}/><View style={styles.separator}/>
      <RowAction icon="ⓘ" title="О приложении" detail="HIME STUDIO · информация о проекте" onPress={() => Alert.alert("HIME STUDIO", "Платформа для вдохновения, поиска мастеров и записи на маникюр.")}/>
    </View>

    <Text style={styles.section}>Управление аккаунтом</Text><View style={styles.card}>
      <RowAction icon="↪" title="Выйти из аккаунта" detail="Завершить текущий сеанс" onPress={onSignOut}/>
      <View style={styles.separator}/><RowAction icon="⌫" title="Удалить аккаунт" detail="Необратимое удаление профиля и данных" danger onPress={deleteAccount}/>
    </View>
    <Text style={styles.footer}>HIME STUDIO · BEAUTY STARTS HERE</Text>

    <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => setLanguageOpen(false)}><View style={styles.modalBackdrop}><View style={styles.languageModal}><Text style={styles.modalTitle}>Выбери язык</Text><ScrollView>{languages.map(item => <TouchableOpacity key={item} style={styles.languageOption} onPress={() => { setLanguage(item); setLanguageOpen(false); }}><Text style={styles.languageText}>{item}</Text><Text style={styles.themeCheck}>{language === item ? "✓" : ""}</Text></TouchableOpacity>)}</ScrollView><TouchableOpacity style={styles.closeButton} onPress={() => setLanguageOpen(false)}><Text style={styles.closeText}>Закрыть</Text></TouchableOpacity></View></View></Modal>
  </ScrollView>;
}
const styles = StyleSheet.create({
 container:{padding:20,paddingBottom:42},kicker:{color:burgundy,fontSize:10,fontWeight:"800",letterSpacing:2.5,marginTop:8},title:{color:ink,fontSize:30,fontWeight:"700",marginTop:8},description:{color:muted,fontSize:13,lineHeight:20,marginTop:8,marginBottom:12},
 section:{color:ink,fontSize:16,fontWeight:"700",marginTop:22,marginBottom:10},card:{backgroundColor:"#FFF",borderRadius:15,borderWidth:1,borderColor:"#EFE5E7",padding:15},settingRow:{flexDirection:"row",alignItems:"center",gap:12,minHeight:48},copy:{flex:1},itemTitle:{color:ink,fontSize:13,fontWeight:"700"},itemText:{color:muted,fontSize:11,lineHeight:17,marginTop:4},note:{color:muted,fontSize:10,lineHeight:16,marginTop:10},
 separator:{height:1,backgroundColor:"#F0E8E9",marginVertical:11},actionRow:{flexDirection:"row",alignItems:"center",gap:11,minHeight:54},iconBox:{width:34,height:34,borderRadius:10,backgroundColor:"#F5ECEE",alignItems:"center",justifyContent:"center"},iconText:{fontSize:17,color:burgundy,fontWeight:"700"},arrow:{fontSize:24,color:burgundy,marginLeft:4},dangerBox:{backgroundColor:"#FBEDEF"},dangerText:{color:"#A32643"},
 choices:{gap:8,marginTop:14},themeChoice:{flexDirection:"row",alignItems:"center",gap:10,borderWidth:1,borderColor:"#EFE5E7",borderRadius:11,padding:10},themeChoiceActive:{borderColor:burgundy,backgroundColor:"#FBF5F6"},themeSwatch:{width:25,height:25,borderRadius:8},swatchBrand:{backgroundColor:"#651D32"},swatchDark:{backgroundColor:"#171316"},swatchLight:{backgroundColor:"#F4ECEC",borderWidth:1,borderColor:"#E7DADD"},themeText:{color:ink,fontSize:12,flex:1},themeTextActive:{color:burgundy,fontWeight:"700"},themeCheck:{color:burgundy,fontWeight:"800",minWidth:12},
 modalBackdrop:{flex:1,backgroundColor:"rgba(20,10,14,0.5)",justifyContent:"center",padding:24},languageModal:{maxHeight:"75%",backgroundColor:"#FFF",borderRadius:18,padding:18},modalTitle:{color:ink,fontSize:19,fontWeight:"700",marginBottom:12},languageOption:{paddingVertical:14,borderBottomWidth:1,borderColor:"#F0E8E9",flexDirection:"row",justifyContent:"space-between"},languageText:{color:ink,fontSize:14},closeButton:{backgroundColor:burgundy,borderRadius:10,padding:13,alignItems:"center",marginTop:14},closeText:{color:"#FFF",fontWeight:"700"},
 footer:{color:"#A99BA0",fontSize:9,letterSpacing:2,textAlign:"center",marginTop:22}
});
