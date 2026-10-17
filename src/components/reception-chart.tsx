import { dashboardStyles, getDashboardTheme } from '@/styles/dashboard';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop, Text as SvgText } from 'react-native-svg';

export type DailyPoint = { label: string; kilos: number };

export function ReceptionChart({
  thisWeek = [
    { label: 'Lun', kilos: 0 },
    { label: 'Mar', kilos: 0 },
    { label: 'Mié', kilos: 0 },
    { label: 'Jue', kilos: 0 },
    { label: 'Vie', kilos: 0 },
    { label: 'Sáb', kilos: 0 },
    { label: 'Dom', kilos: 0 },
  ],
  lastWeek = [
    { label: 'Lun', kilos: 0 },
    { label: 'Mar', kilos: 0 },
    { label: 'Mié', kilos: 0 },
    { label: 'Jue', kilos: 0 },
    { label: 'Vie', kilos: 0 },
    { label: 'Sáb', kilos: 0 },
    { label: 'Dom', kilos: 0 },
  ],
  isDarkMode = true,
}: {
  thisWeek?: DailyPoint[];
  lastWeek?: DailyPoint[];
  isDarkMode?: boolean;
}) {
  const t = getDashboardTheme(isDarkMode);
  const [period, setPeriod] = useState<'Esta semana' | 'Semana anterior'>('Esta semana');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const data = period === 'Esta semana' ? thisWeek : lastWeek;
  const total = data.reduce((sum, item) => sum + item.kilos, 0);
  const previousTotal = lastWeek.reduce((sum, item) => sum + item.kilos, 0);
  const growth = previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 1000) / 10 : total > 0 ? 100 : 0;
  const rawMax = Math.max(...data.map((item) => item.kilos), 1000);
  const max = Math.ceil(rawMax / 1000) * 1000;
  const coordinates = data.map((item, index) => ({
    x: 44 + (index * 530) / Math.max(1, data.length - 1),
    y: 190 - (item.kilos / max) * 150,
  }));
  const linePath = coordinates.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const areaPath = `${linePath} L ${coordinates[coordinates.length - 1].x} 194 L ${coordinates[0].x} 194 Z`;
  const selected = data[selectedIndex] ?? { label: 'Hoy', kilos: 0 };

  return (
    <View style={dashboardStyles.chartWrap}>
      <View style={dashboardStyles.chartToolbar}>
        <View style={dashboardStyles.chartTotalRow}>
          <Text style={[dashboardStyles.chartTotal, { color: t.text }]}>
            {total.toLocaleString('es-MX')} <Text style={[dashboardStyles.chartTotalUnit, { color: t.sub }]}>kg</Text>
          </Text>
          <Text style={[dashboardStyles.chartGrowth, growth < 0 && dashboardStyles.chartGrowthMuted]}>
            {growth > 0 ? '▲ ' : growth < 0 ? '▼ ' : ''}
            {Math.abs(growth)}% <Text style={[dashboardStyles.chartGrowthMuted, { color: t.sub }]}>vs. semana anterior</Text>
          </Text>
        </View>
        <View style={[dashboardStyles.chartPeriodSwitch, { backgroundColor: t.cardAlt, borderColor: t.border }]}>
          {(['Esta semana', 'Semana anterior'] as const).map((option) => (
            <Pressable
              key={option}
              onPress={() => {
                setPeriod(option);
                setSelectedIndex(0);
              }}
              style={[dashboardStyles.chartPeriodOption, period === option && dashboardStyles.chartPeriodOptionActive]}
            >
              <Text style={[dashboardStyles.chartPeriodText, { color: t.sub }, period === option && dashboardStyles.chartPeriodTextActive]}>
                {option}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Svg width="100%" height={220} viewBox="0 0 610 220" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="receptionArea" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0071e3" stopOpacity="0.25" />
            <Stop offset="1" stopColor="#0071e3" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        {[0, 1, 2, 3].map((step) => {
          const y = 190 - step * 50;
          const value = Math.round((max * step) / 3);
          return (
            <g key={step}>
              <Line x1="42" y1={y} x2="596" y2={y} stroke={isDarkMode ? '#333336' : '#cbd5e1'} strokeDasharray="3 5" strokeWidth="1" />
              <SvgText x="34" y={y + 3} fill={t.sub} fontSize="9" textAnchor="end">
                {value === 0 ? '0' : `${(value / 1000).toFixed(value % 1000 ? 1 : 0)}k`}
              </SvgText>
            </g>
          );
        })}
        <Path d={areaPath} fill="url(#receptionArea)" />
        <Path d={linePath} fill="none" stroke="#0071e3" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        {coordinates.map((point, index) => (
          <g key={data[index].label}>
            <Circle
              onPress={() => setSelectedIndex(index)}
              cx={point.x}
              cy={point.y}
              r={index === selectedIndex ? 6 : 4}
              fill={index === selectedIndex ? '#0071e3' : '#38bdf8'}
              stroke="#ffffff"
              strokeWidth={index === selectedIndex ? 2 : 0}
            />
          </g>
        ))}
        {data.map((item, index) => (
          <SvgText
            key={item.label}
            x={coordinates[index].x}
            y="214"
            fill={index === selectedIndex ? t.text : t.sub}
            fontSize="10"
            fontWeight={index === selectedIndex ? '700' : '400'}
            textAnchor="middle"
          >
            {item.label}
          </SvgText>
        ))}
      </Svg>
      <View style={[dashboardStyles.chartSelection, { backgroundColor: t.cardAlt, borderColor: t.border }]}>
        <Text style={[dashboardStyles.chartSelectedLabel, { color: t.sub }]}>Recepción del {selected.label}</Text>
        <Text style={[dashboardStyles.chartSelectedValue, { color: t.text }]}>{selected.kilos.toLocaleString('es-MX')} kg</Text>
      </View>
    </View>
  );
}

export function ShipmentRow({
  name,
  detail,
  progress,
  isDarkMode = true,
}: {
  name: string;
  detail: string;
  progress: `${number}%`;
  isDarkMode?: boolean;
}) {
  const t = getDashboardTheme(isDarkMode);
  return (
    <View style={[dashboardStyles.shipmentRow, { borderTopColor: t.border }]}>
      <View style={dashboardStyles.shipmentIcon}>
        <Text style={{ color: '#0071e3', fontSize: 15 }}>🚚</Text>
      </View>
      <View style={dashboardStyles.shipmentCopy}>
        <Text style={[dashboardStyles.shipmentName, { color: t.text }]}>{name}</Text>
        <Text style={[dashboardStyles.shipmentDetail, { color: t.sub }]}>{detail}</Text>
        <View style={dashboardStyles.progressTrack}>
          <View style={[dashboardStyles.progressFill, { width: progress }]} />
        </View>
      </View>
      <Text style={dashboardStyles.progressText}>{progress}</Text>
    </View>
  );
}