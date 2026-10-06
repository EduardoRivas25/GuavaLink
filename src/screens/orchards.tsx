import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NavGlyph, StatGlyph } from '@/components/dashboard-glyphs';
import { dashboardStyles } from '@/styles/dashboard';
import OrchardMap from '@/components/orchard-map';
import type { Orchard } from '@/types/orchard';
import { initialProducers, producerFullName } from '@/screens/producers';

export const demoOrchards: Orchard[] = [
  { name: 'La Esperanza', folio: 'HRT-001', producer: 'José Martínez López', hectares: 8.5, tenure: 'Propia', latitude: 19.420, longitude: -102.060, active: true },
  { name: 'El Guayabal', folio: 'HRT-002', producer: 'María Elena González', hectares: 5.2, tenure: 'Rentada', latitude: 19.350, longitude: -102.200, active: true },
  { name: 'Los Laureles', folio: 'HRT-003', producer: 'Roberto Díaz Ramírez', hectares: 12, tenure: 'Propia', latitude: 19.510, longitude: -102.320, active: true },
  { name: 'La Palma', folio: 'HRT-004', producer: 'Miguel Ángel Torres', hectares: 6.8, tenure: 'Rentada', latitude: 19.280, longitude: -101.980, active: true },
];

export default function OrchardScreen({ compact }: { compact: boolean }) {
  const [orchards, setOrchards] = useState(demoOrchards);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Todos' | 'Activas' | 'Inactivas'>('Todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Orchard | null>(null);
  const [selectedFolio, setSelectedFolio] = useState(demoOrchards[0].folio);
  const [name, setName] = useState('');
  const [producer, setProducer] = useState(producerFullName(initialProducers[0]));
  const [hectares, setHectares] = useState('');
  const [tenure, setTenure] = useState<'Propia' | 'Rentada'>('Propia');
  const [latitude, setLatitude] = useState('19.4200');
  const [longitude, setLongitude] = useState('-102.0600');
  const visible = orchards.filter((orchard) => `${orchard.name} ${orchard.folio} ${orchard.producer}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'Todos' || orchard.active === (filter === 'Activas')));
  const openForm = (orchard?: Orchard) => {
    setEditing(orchard ?? null);
    setName(orchard?.name ?? '');
    setProducer(orchard?.producer ?? producerFullName(initialProducers.find((item) => item.active) ?? initialProducers[0]));
    setHectares(orchard ? String(orchard.hectares) : '');
    setTenure(orchard?.tenure ?? 'Propia');
    setLatitude(orchard ? String(orchard.latitude) : '19.4200');
    setLongitude(orchard ? String(orchard.longitude) : '-102.0600');
    setModalOpen(true);
  };
  const saveOrchard = () => {
    const parsedHectares = Number(hectares);
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    if (!name.trim() || !producer || !parsedHectares || parsedHectares < 0 || !Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90 || !Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
      Alert.alert('Revisa los datos', 'Completa el nombre, productor, hectáreas y coordenadas válidas.');
      return;
    }
    const saved: Orchard = { name: name.trim(), producer, hectares: parsedHectares, tenure, latitude: parsedLatitude, longitude: parsedLongitude, folio: editing?.folio ?? `HRT-${String(orchards.length + 1).padStart(3, '0')}`, active: editing?.active ?? true };
    setOrchards((items) => editing ? items.map((item) => item.folio === editing.folio ? saved : item) : [...items, saved]);
    setSelectedFolio(saved.folio);
    setModalOpen(false);
  };

  return <ScrollView contentContainerStyle={[dashboardStyles.producerContent, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
    <View style={[dashboardStyles.producerHeading, compact && dashboardStyles.producerHeadingCompact]}>
      <View style={dashboardStyles.welcomeCopy}><Text style={dashboardStyles.eyebrow}>MI EMPAQUE</Text><Text style={[dashboardStyles.producerTitle, compact && dashboardStyles.producerTitleCompact]}>Huertas</Text><Text style={dashboardStyles.subtitle}>El origen de cada fruto, siempre a la vista.</Text></View>
      <View style={dashboardStyles.welcomeActions}><Pressable style={dashboardStyles.exportButton} onPress={() => Alert.alert('Exportar huertas', 'La exportación estará disponible al conectar los datos del empaque.')}><Text style={dashboardStyles.exportText}>⇩  Exportar</Text></Pressable><Pressable style={dashboardStyles.newButton} onPress={() => openForm()}><Text style={dashboardStyles.newButtonText}>＋  Nueva huerta</Text></Pressable></View>
    </View>

    <View style={dashboardStyles.producerStats}>
      <View style={[dashboardStyles.producerStatCard, compact && dashboardStyles.producerStatCardCompact]}><View style={dashboardStyles.statTop}><Text style={dashboardStyles.statLabel}>Huertas registradas</Text><View style={dashboardStyles.statIcon}><NavGlyph name="orchards" active /></View></View><Text style={dashboardStyles.statValue}>{String(orchards.length).padStart(2, '0')}</Text><Text style={dashboardStyles.producerStatNote}>En el padrón del empaque</Text></View>
      <View style={[dashboardStyles.producerStatCard, compact && dashboardStyles.producerStatCardCompact]}><View style={dashboardStyles.statTop}><Text style={dashboardStyles.statLabel}>Superficie activa</Text><View style={dashboardStyles.statIcon}><StatGlyph name="farmers" /></View></View><Text style={dashboardStyles.statValue}>{orchards.filter((item) => item.active).reduce((sum, item) => sum + item.hectares, 0).toFixed(1)} <Text style={dashboardStyles.receiptUnit}>ha</Text></Text><Text style={dashboardStyles.producerStatNote}>Propias y rentadas</Text></View>
    </View>

    <View style={[dashboardStyles.producerToolbar, compact && dashboardStyles.producerToolbarCompact]}>
      <View style={[dashboardStyles.producerSearch, compact && dashboardStyles.producerSearchCompact]}><Text style={dashboardStyles.searchGlyph}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Buscar huertas o productores..." placeholderTextColor="#86868b" style={dashboardStyles.producerSearchInput} accessibilityLabel="Buscar huertas" /></View>
      <Pressable style={dashboardStyles.filterButton} onPress={() => setFilter((value) => value === 'Todos' ? 'Activas' : value === 'Activas' ? 'Inactivas' : 'Todos')}><Text style={dashboardStyles.filterText}>{filter}  ⌄</Text></Pressable>
    </View>

    {compact ? <View style={dashboardStyles.producerCards}>{visible.map((orchard) => <View key={orchard.folio} style={dashboardStyles.producerCard}><View style={dashboardStyles.producerMobileHeading}><View style={dashboardStyles.producerAvatar}><NavGlyph name="orchards" active /></View><View style={dashboardStyles.producerMobileCopy}><Text style={dashboardStyles.producerName}>{orchard.name}</Text><Text style={dashboardStyles.producerMeta}>{orchard.folio} · {orchard.producer}</Text></View><Text style={[dashboardStyles.statusBadge, dashboardStyles.statusActive]}>Activa</Text></View><View style={dashboardStyles.orchardDetails}><Text style={dashboardStyles.producerKilos}>{orchard.hectares} ha · {orchard.tenure}</Text><Text style={dashboardStyles.producerMeta}>{orchard.latitude.toFixed(4)}, {orchard.longitude.toFixed(4)}</Text><Pressable onPress={() => openForm(orchard)}><Text style={dashboardStyles.rowAction}>Editar</Text></Pressable></View></View>)}</View> : <ScrollView horizontal showsHorizontalScrollIndicator><View style={dashboardStyles.producerTable}><View style={[dashboardStyles.producerTableRow, dashboardStyles.producerTableHeader]}><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnName, dashboardStyles.tableHeading]}>HUERTA</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnFolio, dashboardStyles.tableHeading]}>FOLIO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.orchardProducerCol, dashboardStyles.tableHeading]}>PRODUCTOR</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.orchardHectaresCol, dashboardStyles.tableHeading]}>SUPERFICIE</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.orchardTenureCol, dashboardStyles.tableHeading]}>TENENCIA</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnStatus, dashboardStyles.tableHeading]}>ESTADO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnActions, dashboardStyles.tableHeading]}>ACCIONES</Text></View>{visible.map((orchard) => <Pressable key={orchard.folio} onPress={() => setSelectedFolio(orchard.folio)} style={[dashboardStyles.producerTableRow, selectedFolio === orchard.folio && dashboardStyles.orchardRowSelected]}><View style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnName, dashboardStyles.producerNameCell]}><View style={dashboardStyles.producerAvatar}><NavGlyph name="orchards" active /></View><Text style={dashboardStyles.producerName}>{orchard.name}</Text></View><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnFolio, dashboardStyles.producerMeta]}>{orchard.folio}</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.orchardProducerCol, dashboardStyles.producerMeta]}>{orchard.producer}</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.orchardHectaresCol, dashboardStyles.producerName]}>{orchard.hectares} ha</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.orchardTenureCol, dashboardStyles.producerMeta]}>{orchard.tenure}</Text><View style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnStatus]}><Text style={[dashboardStyles.statusBadge, dashboardStyles.statusActive]}>Activa</Text></View><View style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnActions]}><Pressable accessibilityLabel={`Editar ${orchard.name}`} onPress={() => openForm(orchard)}><Text style={dashboardStyles.rowAction}>✎</Text></Pressable><Pressable accessibilityLabel={`Eliminar ${orchard.name}`} onPress={() => { setOrchards((items) => items.filter((item) => item.folio !== orchard.folio)); if (selectedFolio === orchard.folio) setSelectedFolio(''); }}><Text style={dashboardStyles.rowDelete}>×</Text></Pressable></View></Pressable>)}</View></ScrollView>}
    {visible.length === 0 && <Text style={dashboardStyles.emptyText}>No hay huertas que coincidan con la búsqueda.</Text>}

    <View style={dashboardStyles.mapSection}>
      <View style={[dashboardStyles.mapHeading, compact && dashboardStyles.mapHeadingCompact]}><View><Text style={dashboardStyles.panelTitle}>Ubicación de huertas</Text><Text style={dashboardStyles.panelSubtitle}>Localiza cada predio por sus coordenadas.</Text></View><View style={dashboardStyles.mapLegend}><View style={dashboardStyles.legendDot} /><Text style={dashboardStyles.mapLegendText}>{visible.length} huertas</Text></View></View>
      <OrchardMap orchards={visible} selectedFolio={selectedFolio} onSelect={setSelectedFolio} />
      {orchards.find((item) => item.folio === selectedFolio) && <View style={dashboardStyles.selectedOrchard}><View style={dashboardStyles.mapPinMini}><Text style={dashboardStyles.mapPinMiniText}>⌖</Text></View><View style={dashboardStyles.selectedOrchardCopy}><Text style={dashboardStyles.producerName}>{orchards.find((item) => item.folio === selectedFolio)?.name}</Text><Text style={dashboardStyles.producerMeta}>{orchards.find((item) => item.folio === selectedFolio)?.latitude.toFixed(4)}, {orchards.find((item) => item.folio === selectedFolio)?.longitude.toFixed(4)} · {orchards.find((item) => item.folio === selectedFolio)?.producer}</Text></View><Text style={dashboardStyles.producerKilos}>{orchards.find((item) => item.folio === selectedFolio)?.hectares} ha</Text></View>}
    </View>

    <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}><View style={dashboardStyles.modalBackdrop}><ScrollView contentContainerStyle={dashboardStyles.orchardModalScroll}><View style={dashboardStyles.formCard}><Text style={dashboardStyles.panelTitle}>{editing ? 'Editar huerta' : 'Nueva huerta'}</Text><Text style={dashboardStyles.modalDescription}>Registra el predio y su ubicación para mantenerlo en el mapa.</Text><Text style={dashboardStyles.formLabel}>Nombre de la huerta</Text><TextInput value={name} onChangeText={setName} placeholder="Ej. La Esperanza" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.formLabel}>Productor registrado</Text><View style={dashboardStyles.producerPicker}>{initialProducers.filter((item) => item.active).map((item) => { const fullName = producerFullName(item); return <Pressable key={item.folio} onPress={() => setProducer(fullName)} style={[dashboardStyles.producerChoice, producer === fullName && dashboardStyles.producerChoiceSelected]}><Text style={[dashboardStyles.producerChoiceText, producer === fullName && dashboardStyles.producerChoiceTextSelected]}>{fullName}</Text></Pressable>; })}</View><Text style={dashboardStyles.formLabel}>Tenencia del predio</Text><View style={dashboardStyles.tenurePicker}>{(['Propia', 'Rentada'] as const).map((value) => <Pressable key={value} onPress={() => setTenure(value)} style={[dashboardStyles.tenureOption, tenure === value && dashboardStyles.tenureOptionSelected]}><Text style={[dashboardStyles.tenureOptionText, tenure === value && dashboardStyles.tenureOptionTextSelected]}>{value === 'Propia' ? '⌂  Propiedad' : '▤  Rentada'}</Text></Pressable>)}</View><Text style={dashboardStyles.formLabel}>Superficie (hectáreas)</Text><TextInput value={hectares} onChangeText={setHectares} keyboardType="decimal-pad" placeholder="Ej. 8.5" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.formLabel}>Coordenadas del predio</Text><View style={dashboardStyles.coordinateRow}><TextInput value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" placeholder="Latitud" placeholderTextColor="#86868b" style={[dashboardStyles.formInput, dashboardStyles.coordinateInput]} /><TextInput value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" placeholder="Longitud" placeholderTextColor="#86868b" style={[dashboardStyles.formInput, dashboardStyles.coordinateInput]} /></View><Text style={dashboardStyles.modalHint}>Ejemplo para Michoacán: 19.4200, -102.0600</Text><View style={dashboardStyles.formActions}><Pressable onPress={() => setModalOpen(false)}><Text style={dashboardStyles.cancelText}>Cancelar</Text></Pressable><Pressable onPress={saveOrchard} style={dashboardStyles.newButton}><Text style={dashboardStyles.newButtonText}>Guardar huerta</Text></Pressable></View></View></ScrollView></View></Modal>
  </ScrollView>;
}
