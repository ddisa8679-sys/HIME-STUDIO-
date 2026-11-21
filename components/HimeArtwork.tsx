import React from "react";
import Svg, { Circle, Ellipse, G, Path, Rect, Defs, LinearGradient, Stop } from "react-native-svg";

const ink = "#160D13";
const wine = "#641A35";
const rose = "#B85A76";
const skin = "#F1C9BC";
const light = "#F8E8E5";

export function HeroMascot() {
  return <Svg width="100%" height="210" viewBox="0 0 340 220">
    <Defs>
      <LinearGradient id="hair" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#3C1A2B"/><Stop offset="1" stopColor="#100B12"/></LinearGradient>
      <LinearGradient id="dress" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#8D3150"/><Stop offset="1" stopColor="#3A1427"/></LinearGradient>
      <LinearGradient id="skinTone" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFE0D4"/><Stop offset="1" stopColor="#D99D98"/></LinearGradient>
    </Defs>
    <Ellipse cx="170" cy="185" rx="136" ry="20" fill="#4C1B30" opacity=".10"/>
    <Circle cx="170" cy="105" r="94" fill="#F4E7E6"/>
    <Circle cx="170" cy="105" r="84" fill="none" stroke="#D7B1B8" strokeWidth="1.4"/>
    <Path d="M74 190 Q85 133 135 130 L218 130 Q269 141 280 190Z" fill="url(#dress)"/>
    <Path d="M93 190 Q108 145 147 142 Q169 164 192 142 Q236 149 250 190" fill="#21101C"/>
    <Path d="M92 103 Q76 20 161 16 Q255 8 254 106 L245 159 Q220 188 195 161 L116 165 Q88 145 92 103Z" fill="url(#hair)"/>
    <Path d="M111 85 Q115 38 166 35 Q220 34 232 82 Q224 122 204 134 L123 131 Q106 112 111 85Z" fill="url(#skinTone)"/>
    <Path d="M104 82 Q109 27 166 24 Q222 21 242 75 Q218 62 199 73 Q173 82 154 61 Q136 84 104 82Z" fill="url(#hair)"/>
    <Path d="M116 72 Q100 111 124 154 Q102 145 95 117 L91 72Z" fill="#24101D"/>
    <Path d="M218 68 Q245 105 224 157 Q251 143 256 103 L246 69Z" fill="#24101D"/>
    <Path d="M133 94 Q145 82 158 94" fill="none" stroke="#4B2630" strokeWidth="4" strokeLinecap="round"/>
    <Path d="M178 94 Q192 82 205 94" fill="none" stroke="#4B2630" strokeWidth="4" strokeLinecap="round"/>
    <Ellipse cx="147" cy="103" rx="7" ry="10" fill="#321724"/><Ellipse cx="190" cy="103" rx="7" ry="10" fill="#321724"/>
    <Circle cx="149" cy="100" r="2.8" fill="#FFF"/><Circle cx="192" cy="100" r="2.8" fill="#FFF"/>
    <Path d="M163 117 Q169 121 175 117" fill="none" stroke="#B76D75" strokeWidth="2" strokeLinecap="round"/>
    <Ellipse cx="130" cy="117" rx="12" ry="5" fill="#E99E9F" opacity=".36"/><Ellipse cx="207" cy="117" rx="12" ry="5" fill="#E99E9F" opacity=".36"/>
    <Path d="M125 133 Q111 150 125 163 Q143 176 163 151" fill="none" stroke="url(#skinTone)" strokeWidth="17" strokeLinecap="round"/>
    <Path d="M213 132 Q231 150 216 164 Q197 176 179 151" fill="none" stroke="url(#skinTone)" strokeWidth="17" strokeLinecap="round"/>
    <Path d="M125 161 Q143 146 160 151 Q169 153 173 164 Q155 175 139 171Z" fill="url(#skinTone)"/>
    <Path d="M216 161 Q198 146 181 151 Q172 153 168 164 Q186 175 202 171Z" fill="url(#skinTone)"/>
    <G fill={wine} stroke="#F7D8D7" strokeWidth="1">
      <Path d="M135 155 Q140 150 144 155 L143 163 Q137 165 135 155Z"/><Path d="M147 151 Q152 147 156 152 L155 160 Q149 162 147 151Z"/><Path d="M187 152 Q192 147 196 152 L195 160 Q189 162 187 152Z"/><Path d="M199 156 Q204 151 208 156 L207 164 Q201 166 199 156Z"/>
    </G>
    <Path d="M104 43 Q121 7 163 12" fill="none" stroke="#815064" strokeWidth="3" opacity=".7"/>
    <Path d="M218 31 Q246 52 248 84" fill="none" stroke="#815064" strokeWidth="3" opacity=".55"/>
    <Path d="M237 31 L242 19 L247 31 L259 36 L247 41 L242 53 L237 41 L225 36Z" fill="#C99AA6"/>
    <Circle cx="109" cy="45" r="4" fill="#D7A5AF"/><Circle cx="260" cy="111" r="3" fill="#D7A5AF"/>
    <Path d="M159 27 Q171 21 183 28" fill="none" stroke="#B87587" strokeWidth="2"/>
  </Svg>;
}

export function NavMascot({ active = false }: { active?: boolean }) {
  return <Svg width="37" height="30" viewBox="0 0 74 60">
    <Circle cx="37" cy="31" r="23" fill={active ? "#F1DDE2" : "#F7F0F0"} stroke={active ? "#9A4B64" : "#E6D7DA"} strokeWidth="1.5"/>
    <Path d="M14 33 Q9 4 36 5 Q64 5 60 35 L55 53 L19 53Z" fill="#20101B"/>
    <Ellipse cx="37" cy="28" rx="15" ry="18" fill={skin}/>
    <Path d="M22 25 Q22 8 38 10 Q52 10 54 25 Q45 18 37 22 Q28 27 22 25Z" fill="#24101D"/>
    <Ellipse cx="31" cy="29" rx="2.4" ry="3.5" fill="#321724"/><Ellipse cx="43" cy="29" rx="2.4" ry="3.5" fill="#321724"/>
    <Circle cx="32" cy="28" r="1" fill="#FFF"/><Circle cx="44" cy="28" r="1" fill="#FFF"/>
    <Path d="M34 38 Q37 40 40 38" fill="none" stroke="#B76D75" strokeWidth="1.4" strokeLinecap="round"/>
    <Path d="M16 46 Q27 37 35 45 Q41 52 49 44" fill="none" stroke={wine} strokeWidth="6" strokeLinecap="round"/>
    <Path d="M47 42 L51 39" stroke="#9B3858" strokeWidth="3" strokeLinecap="round"/>
    <Circle cx="53" cy="14" r="3" fill="#C99AA6"/>
  </Svg>;
}
