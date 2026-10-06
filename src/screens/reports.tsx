import { useState } from 'react';
import { Platform, Pressable, ScrollView, Share, Text, TextInput, View } from 'react-native';
import { NavGlyph } from '@/components/dashboard-glyphs';
import { dashboardStyles } from '@/styles/dashboard';
import { demoOrchards } from '@/screens/orchards';
import { initialProducers } from '@/screens/producers';
import { initialShipments } from '@/screens/shipments';

type ReportRow = { date: string; values: string[] };
type ReportDefinition = { title: string; description: string; icon: 'orchards' | 'farmers' | 'shipments' | 'payments'; headers: string[]; rows: ReportRow[]; fileName: string };

export default function ReportsScreen({ compact }: { compact: boolean }) {
  const [from, setFrom] = useState('01/10/2026');
  const [to, setTo] = useState('03/10/2026');
  const [rangeMessage, setRangeMessage] = useState('');
  const reports: ReportDefinition[] = [
    {
      title: 'Recepción de fruta', description: 'Kilos, cajas y entregas por productor.', icon: 'orchards', fileName: 'recepcion-fruta',
      headers: ['Fecha', 'Productor', 'Origen', 'Kilos recibidos'],
      rows: initialProducers.slice(0, 4).map((producer, index) => ({ date: `0${index + 1}/10/2026`, values: [`0${index + 1}/10/2026`, `${producer.nombres} ${producer.apellidos}`, producer.origen, producer.kilos.replace(' kg', '')] })),
    },
    {
      title: 'Producción por huerta', description: 'Origen y volumen de la fruta recibida.', icon: 'farmers', fileName: 'produccion-por-huerta',
      headers: ['Fecha', 'Huerta', 'Productor', 'Hectáreas', 'Kilos recibidos'],
      rows: demoOrchards.map((orchard, index) => ({ date: `0${index + 1}/10/2026`, values: [`0${index + 1}/10/2026`, orchard.name, orchard.producer, String(orchard.hectares), String([2450, 1680, 3120, 2190][index])] })),
    },
    {
      title: 'Embarques y destinos', description: 'Kilos enviados, fechas y estado de cada embarque.', icon: 'shipments', fileName: 'embarques-y-destinos',
      headers: ['Fecha de salida', 'Folio', 'Destino', 'Kilos', 'Estado'],
      rows: initialShipments.map((shipment) => ({ date: shipment.departure.replace(' oct, 2026', '/10/2026'), values: [shipment.departure, shipment.folio, shipment.destination, String(shipment.kilos), shipment.status] })),
    },
    {
      title: 'Pagos a productores', description: 'Pagos realizados y saldos pendientes.', icon: 'payments', fileName: 'pagos-a-productores',
      headers: ['Fecha', 'Productor', 'Folio', 'Kilos recibidos', 'Monto estimado (MXN)', 'Estado'],
      rows: initialProducers.map((producer, index) => ({ date: `0${(index % 3) + 1}/10/2026`, values: [`0${(index % 3) + 1}/10/2026`, `${producer.nombres} ${producer.apellidos}`, producer.folio, producer.kilos.replace(' kg', ''), String([18750, 14700, 11400, 16500, 9600, 13350][index]), index % 2 ? 'Pendiente' : 'Pagado'] })),
    },
  ];
  const parseDate = (value: string) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
    if (!match) return null;
    const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
    return date.getFullYear() === Number(match[3]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[1]) ? date : null;
  };
  const exportAll = async () => {
    const start = parseDate(from); const end = parseDate(to);
    if (!start || !end) { setRangeMessage('Usa el formato DD/MM/AAAA para las fechas.'); return; }
    if (start > end) { setRangeMessage('La fecha inicial debe ser anterior a la fecha final.'); return; }
    setRangeMessage('');
    const rows = reports.flatMap((report) => report.rows.filter((row) => { const date = parseDate(row.date); return date && date >= start && date <= end; }).map((row) => [report.title, row.date, row.values.slice(1).join(' · ')]));
    const csv = `\uFEFF${[['Reporte', 'Fecha', 'Detalle'], ...rows].map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n')}`;
    const fileName = `guavalink-reportes-${from.replaceAll('/', '-')}-a-${to.replaceAll('/', '-')}.csv`;
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = fileName; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); return;
    }
    await Share.share({ title: 'Reportes GuavaLink.csv', message: csv });
  };
  const download = async (report: ReportDefinition) => {
    const start = parseDate(from); const end = parseDate(to);
    if (!start || !end) { setRangeMessage('Usa el formato DD/MM/AAAA para las fechas.'); return; }
    if (start > end) { setRangeMessage('La fecha inicial debe ser anterior a la fecha final.'); return; }
    setRangeMessage('');
    const rows = report.rows.filter((row) => { const date = parseDate(row.date); return date && date >= start && date <= end; });
    const csv = `\uFEFF${[report.headers, ...rows.map((row) => row.values)].map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n')}`;
    if (Platform.OS === 'web') {
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = `${report.fileName}-${from.replaceAll('/', '-')}-a-${to.replaceAll('/', '-')}.csv`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
      return;
    }
    await Share.share({ title: `${report.title}.csv`, message: csv });
  };

  return <ScrollView contentContainerStyle={[dashboardStyles.producerContent, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
    <View style={[dashboardStyles.producerHeading, compact && dashboardStyles.producerHeadingCompact]}>
      <View style={dashboardStyles.welcomeCopy}><Text style={dashboardStyles.eyebrow}>MI EMPAQUE</Text><Text style={[dashboardStyles.producerTitle, compact && dashboardStyles.producerTitleCompact]}>Reportes</Text><Text style={dashboardStyles.subtitle}>Tu operación, convertida en información.</Text></View>
      {!compact && <Pressable style={dashboardStyles.exportButton} onPress={() => void exportAll()}><Text style={dashboardStyles.exportText}>⇩  Exportar</Text></Pressable>}
    </View>
    {rangeMessage ? <Text accessibilityRole="alert" style={dashboardStyles.reportError}>{rangeMessage}</Text> : null}
    <View style={[dashboardStyles.reportGrid, compact && dashboardStyles.reportGridCompact]}>
      {reports.map((report) => <View key={report.title} style={[dashboardStyles.reportCard, compact && dashboardStyles.reportCardCompact]}>
        <View style={dashboardStyles.reportIcon}><NavGlyph name={report.icon} active /></View>
        <Text style={dashboardStyles.reportTitle}>{report.title}</Text><Text style={dashboardStyles.reportDescription}>{report.description}</Text>
        <View style={[dashboardStyles.reportDates, compact && dashboardStyles.reportDatesCompact]}>
          <TextInput value={from} onChangeText={(value) => { setFrom(value); setRangeMessage(''); }} placeholder="DD/MM/AAAA" placeholderTextColor="#86868b" accessibilityLabel={`Fecha inicial para ${report.title}`} style={[dashboardStyles.reportDateInput, compact && dashboardStyles.reportDateInputCompact]} />
          <Text style={dashboardStyles.reportDash}>—</Text>
          <TextInput value={to} onChangeText={(value) => { setTo(value); setRangeMessage(''); }} placeholder="DD/MM/AAAA" placeholderTextColor="#86868b" accessibilityLabel={`Fecha final para ${report.title}`} style={[dashboardStyles.reportDateInput, compact && dashboardStyles.reportDateInputCompact]} />
        </View>
        <Pressable accessibilityRole="button" onPress={() => void download(report)} style={dashboardStyles.reportDownload}><Text style={dashboardStyles.reportDownloadText}>▤  Descargar CSV</Text></Pressable>
      </View>)}
    </View>
    <Text style={dashboardStyles.reportFootnote}>Los archivos usan datos de demostración hasta conectar los registros reales del empaque.</Text>
  </ScrollView>;
}
