import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg';
import { dashboardStyles } from '@/styles/dashboard';

const receptionChartData = {
  'Esta semana': [
    { label: 'Lun', kilos: 4800 }, { label: 'Mar', kilos: 6200 }, { label: 'Mié', kilos: 5500 }, { label: 'Jue', kilos: 7800 }, { label: 'Vie', kilos: 6600 }, { label: 'Sáb', kilos: 9200 }, { label: 'Dom', kilos: 8550 },
  ],
  'Semana anterior': [
    { label: 'Lun', kilos: 4100 }, { label: 'Mar', kilos: 5300 }, { label: 'Mié', kilos: 6100 }, { label: 'Jue', kilos: 5800 }, { label: 'Vie', kilos: 7200 }, { label: 'Sáb', kilos: 6900 }, { label: 'Dom', kilos: 7800 },
  ],
};

export function ReceptionChart() {
  const [period, setPeriod] = useState<keyof typeof receptionChartData>('Esta semana');
  const [selectedIndex, setSelectedIndex] = useState(5);
  const data = receptionChartData[period];
  const total = data.reduce((sum, item) => sum + item.kilos, 0);
  const previousTotal = receptionChartData['Semana anterior'].reduce((sum, item) => sum + item.kilos, 0);
  const growth = Math.round(((total - previousTotal) / previousTotal) * 1000) / 10;
  const max = Math.ceil(Math.max(...data.map((item) => item.kilos)) / 2500) * 2500;
  const coordinates = data.map((item, index) => ({ x: 44 + (index * 530) / (data.length - 1), y: 190 - (item.kilos / max) * 150 }));
  const linePath = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} 194 L ${coordinates[0].x} 194 Z`;
  const selected = data[selectedIndex];
  return (
    <View style={dashboardStyles.chartWrap}>
      <View style={dashboardStyles.chartToolbar}>
        <View style={dashboardStyles.chartTotalRow}><Text style={dashboardStyles.chartTotal}>{total.toLocaleString('es-MX')} <Text style={dashboardStyles.chartTotalUnit}>kg</Text></Text><Text style={[dashboardStyles.chartGrowth, growth < 0 && dashboardStyles.chartGrowthMuted]}>{growth > 0 ? '↗ ' : growth < 0 ? '↘ ' : ''}{Math.abs(growth)}% <Text style={dashboardStyles.chartGrowthMuted}>vs. semana anterior</Text></Text></View>
        <View style={dashboardStyles.chartPeriodSwitch}>{(Object.keys(receptionChartData) as (keyof typeof receptionChartData)[]).map((option) => <Pressable key={option} onPress={() => { setPeriod(option); setSelectedIndex(5); }} style={[dashboardStyles.chartPeriodOption, period === option && dashboardStyles.chartPeriodOptionActive]}><Text style={[dashboardStyles.chartPeriodText, period === option && dashboardStyles.chartPeriodTextActive]}>{option}</Text></Pressable>)}</View>
      </View>
      <Svg width="100%" height={220} viewBox="0 0 610 220" preserveAspectRatio="none">
        <Defs><LinearGradient id="receptionArea" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#0071e3" stopOpacity="0.2" /><Stop offset="1" stopColor="#0071e3" stopOpacity="0" /></LinearGradient></Defs>
        {[0, 1, 2, 3].map((step) => { const y = 190 - (step * 50); const value = Math.round((max * step) / 3); return <g key={step}><Line x1="42" y1={y} x2="596" y2={y} stroke="#333336" strokeDasharray="3 5" strokeWidth="1" /><SvgText x="34" y={y + 3} fill="#86868b" fontSize="9" textAnchor="end">{value === 0 ? '0' : `${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k`}</SvgText></g>; })}
        <Path d={areaPath} fill="url(#receptionArea)" />
        <Path d={linePath} fill="none" stroke="#2997ff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point, index) => <g key={data[index].label} onClick={() => setSelectedIndex(index)}><Circle cx={point.x} cy={point.y} r={index === selectedIndex ? 6 : 4} fill={index === selectedIndex ? '#0071e3' : '#2997ff'} stroke="#ffffff" strokeWidth={index === selectedIndex ? 2 : 0} /><Circle cx={point.x} cy={point.y} r={17} fill="transparent" /></g>)}
        {data.map((item, index) => <SvgText key={item.label} x={coordinates[index].x} y="216" fill={index === selectedIndex ? '#f5f5f7' : '#86868b'} fontSize="9" textAnchor="middle">{item.label}</SvgText>)}
      </Svg>
      <View style={dashboardStyles.chartSelection}><Text style={dashboardStyles.chartSelectedLabel}>Recepción del {selected.label}</Text><Text style={dashboardStyles.chartSelectedValue}>{selected.kilos.toLocaleString('es-MX')} kg</Text></View>
      <View style={dashboardStyles.chartLegend}><View style={dashboardStyles.legendDot} /><Text style={dashboardStyles.legendText}>Kilos recibidos por día</Text></View>
    </View>
  );
}

export function ShipmentRow({ name, detail, progress }: { name: string; detail: string; progress: `${number}%` }) {
  return (
    <View style={dashboardStyles.shipmentRow}>
      <View style={dashboardStyles.shipmentIcon}><Text style={dashboardStyles.navIcon}>▣</Text></View>
      <View style={dashboardStyles.shipmentCopy}><Text style={dashboardStyles.shipmentName}>{name}</Text><Text style={dashboardStyles.shipmentDetail}>{detail}</Text><View style={dashboardStyles.progressTrack}><View style={[dashboardStyles.progressFill, { width: progress }]} /></View></View>
      <Text style={dashboardStyles.progressText}>{progress}</Text>
    </View>
  );
}
