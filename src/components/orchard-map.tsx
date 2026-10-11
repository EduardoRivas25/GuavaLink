import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText } from 'react-native-svg';

import type { OrchardMapProps } from '@/types/orchard';

export default function OrchardMap({ orchards, selectedFolio, onSelect }: OrchardMapProps) {
  const xFor = (longitude: number) => 90 + ((longitude + 102.45) / 0.65) * 820;
  const yFor = (latitude: number) => 275 - ((latitude - 19.1) / 0.65) * 210;
  return (
    <View style={styles.mapCanvas}>
      <Svg width="100%" height="100%" viewBox="0 0 1000 340" preserveAspectRatio="xMidYMid slice">
        <Path d="M0 0H1000V340H0z" fill="#101713" />
        <Path d="M-50 90 C120 40 160 130 300 75 S520 95 630 45 S840 90 1060 20M-20 260 C130 210 260 300 390 230 S610 250 730 200 S920 270 1050 180M130 -30 C180 90 110 160 210 370M430 -30 C370 70 500 140 430 370M760 -40 C690 90 810 170 720 380" fill="none" stroke="#26372d" strokeWidth="18" />
        <Path d="M-50 90 C120 40 160 130 300 75 S520 95 630 45 S840 90 1060 20M-20 260 C130 210 260 300 390 230 S610 250 730 200 S920 270 1050 180M130 -30 C180 90 110 160 210 370M430 -30 C370 70 500 140 430 370M760 -40 C690 90 810 170 720 380" fill="none" stroke="#35473a" strokeWidth="2" />
        <Path d="M0 155 C170 125 250 170 410 140 S700 150 1000 112M0 315 C220 290 370 325 530 285 S800 315 1000 265" fill="none" stroke="#59614a" strokeWidth="2" strokeDasharray="8 6" />
        {orchards.map((orchard, index) => { const x = xFor(orchard.longitude); const y = yFor(orchard.latitude); const active = orchard.folio === selectedFolio; return <g key={orchard.folio}><Circle onPress={() => onSelect(orchard.folio)} cx={x} cy={y} r={active ? 17 : 13} fill="#0071e3" fillOpacity={active ? 0.24 : 0.15} /><Circle onPress={() => onSelect(orchard.folio)} cx={x} cy={y} r={active ? 8 : 6} fill="#2997ff" stroke="#ffffff" strokeWidth="2" /><SvgText x={x + 16} y={y - 11} fill="#f5f5f7" fontSize="11">{orchard.name}</SvgText><SvgText x={x + 16} y={y + 4} fill="#86868b" fontSize="9">{index + 1} · {orchard.hectares} ha</SvgText></g>; })}
        <SvgText x="28" y="318" fill="#86868b" fontSize="10">Michoacán, México</SvgText>
      </Svg>
      <View style={styles.nativeNote}><Text style={styles.nativeNoteText}>El mapa interactivo está disponible en la versión web.</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapCanvas: { width: '100%', height: 340, overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: '#333336', backgroundColor: '#101713' },
  nativeNote: { position: 'absolute', right: 10, top: 10, borderRadius: 9999, backgroundColor: 'rgba(29,29,31,0.92)', paddingHorizontal: 10, paddingVertical: 7 },
  nativeNoteText: { color: '#cccccc', fontSize: 10 },
});
