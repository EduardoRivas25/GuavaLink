/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect */
import { producerName, producerQrValue } from '@/lib/domain';
import { roleHomeStyles as styles } from '@/styles/role-home';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCodeReal from '../components/qr-code';
import { supabase } from '../lib/supabase';

interface ProducerHomeProps { account: any; onSignOut: () => void; isDarkMode: boolean; toggleTheme: () => void; }

export default function ProducerHome({ account, onSignOut, isDarkMode, toggleTheme }: ProducerHomeProps) {
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schemaReady, setSchemaReady] = useState(true);
  const [message, setMessage] = useState('');
  const [producerRecord, setProducerRecord] = useState<any | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [orchards, setOrchards] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [orchardName, setOrchardName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [hectares, setHectares] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const spinAnim = useRef(new Animated.Value(isDarkMode ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(spinAnim, { toValue: isDarkMode ? 0 : 1, duration: 500, useNativeDriver: true }).start();
  }, [isDarkMode, spinAnim]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const loadProducerData = useCallback(async () => {
    setLoading(true);
    setSchemaReady(true);
    try {
      const email = (account?.email || 'productor@gmail.com').toLowerCase();
      const { data: prod, error: producerError } = await supabase.from('producers').select('id,folio,nombres,apellidos,email,status').ilike('email', email).maybeSingle();
      if (producerError) throw producerError;
      if (!prod) throw new Error('No se encontró el productor vinculado a esta cuenta.');
      setProducerRecord(prod);
      const [receptionsResult, paymentsResult, orchardsResult, registrationsResult] = await Promise.all([
        supabase.from('receptions').select('*').eq('producer_id', prod.id).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').ilike('producer_name', `%${producerName(prod)}%`).order('created_at', { ascending: false }),
        supabase.from('orchards').select('*').eq('producer_id', prod.id).order('created_at', { ascending: false }),
        supabase.from('export_registrations').select('*').eq('producer_id', prod.id).order('created_at', { ascending: false }),
      ]);
      if (receptionsResult.error) throw receptionsResult.error;
      if (orchardsResult.error) throw orchardsResult.error;
      if (registrationsResult.error) throw registrationsResult.error;
      setDeliveries(receptionsResult.data || []);
      setPayments(paymentsResult.data || []);
      setOrchards(orchardsResult.data || []);
      setRegistrations(registrationsResult.data || []);
      setMessage('');
    } catch (error: any) {
      const missingSchema = error?.code === '42P01' || error?.code === '42703' || /does not exist|schema cache|column .*producer_id/i.test(error?.message || '');
      setSchemaReady(!missingSchema);
      setMessage(missingSchema
        ? 'La base de datos aún no tiene instalada la migración de huertas y registros de exportación.'
        : error.message || 'No fue posible cargar la información del productor.');
    } finally { setLoading(false); }
  }, [account]);

  useEffect(() => { void loadProducerData(); }, [loadProducerData]);

  const saveOrchard = async () => {
    if (!schemaReady) { setMessage('Primero debe aplicarse la migración de trazabilidad en Supabase.'); return; }
    const parsedHectares = Number(hectares), parsedLatitude = Number(latitude), parsedLongitude = Number(longitude);
    if (!producerRecord || !orchardName.trim() || parsedHectares <= 0 || !Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90 || !Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
      setMessage('Completa nombre, superficie y coordenadas válidas.'); return;
    }
    setSaving(true);
    const { error } = await supabase.from('orchards').insert([{
      folio: `HRT-${Date.now().toString().slice(-7)}`, name: orchardName.trim(), producer_id: producerRecord.id,
      producer: producerName(producerRecord), hectares: parsedHectares, latitude: parsedLatitude,
      longitude: parsedLongitude, tenure: 'Propia', active: true,
    }]);
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    setOrchardName(''); setLatitude(''); setLongitude(''); setHectares('');
    await loadProducerData(); setMessage('✅ Huerta registrada correctamente.');
  };

  const saveRegistration = async () => {
    if (!schemaReady) { setMessage('Primero debe aplicarse la migración de trazabilidad en Supabase.'); return; }
    if (!producerRecord || !registrationNumber.trim()) { setMessage('Ingresa el número de registro de exportación.'); return; }
    setSaving(true);
    const { error } = await supabase.from('export_registrations').insert([{ producer_id: producerRecord.id, registration_number: registrationNumber.trim().toUpperCase() }]);
    setSaving(false);
    if (error) { setMessage(error.message); return; }
    setRegistrationNumber(''); await loadProducerData(); setMessage('✅ Registro de exportación guardado.');
  };

  const totalKilos = deliveries.reduce((sum, item) => sum + (Number(item.weight_kg) || 0), 0);
  const totalBoxes = deliveries.reduce((sum, item) => sum + (Number(item.boxes) || 0), 0);
  const qrValue = producerRecord ? producerQrValue(producerRecord) : 'GUAVALINK:PRODUCER:NO-DISPONIBLE';
  const t = { bg: isDarkMode ? '#000000' : '#f3f4f6', card: isDarkMode ? '#1d1d1f' : '#ffffff', text: isDarkMode ? '#f5f5f7' : '#111827', sub: isDarkMode ? '#86868b' : '#6b7280', border: isDarkMode ? '#292929' : '#d1d5db' };
  const inputStyle = [styles.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }];

  return <SafeAreaView style={[styles.safeArea, { backgroundColor: t.bg }]}>
    <View style={[styles.header, compact && styles.headerCompact, { borderBottomColor: t.border }]}>
      <Image source={isDarkMode ? require('../../assets/images/logo-horizontal-dark.png') : require('../../assets/images/guavalink-logo.png')} style={[styles.logo, !isDarkMode && { tintColor: '#111827' }]} resizeMode="contain" />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}><Pressable onPress={toggleTheme}><Animated.View style={{ transform: [{ rotate: spin }] }}><Text style={{ fontSize: 24 }}>{isDarkMode ? '☀️' : '🌙'}</Text></Animated.View></Pressable><Pressable style={[styles.signOutButton, { borderColor: t.border }]} onPress={onSignOut}><Text style={[styles.signOutText, { color: t.text }]}>Cerrar sesión</Text></Pressable></View>
    </View>
    <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
      <Text style={[styles.eyebrow, { color: '#0071e3' }]}>PANEL DE PRODUCTOR</Text>
      <Text style={[styles.title, compact && styles.titleCompact, { color: t.text }]}>Hola, {producerRecord ? producerName(producerRecord) : account.name}.</Text>
      <Text style={[styles.description, { color: t.sub }]}>Registra tus huertas y registros de exportación, muestra tu QR y consulta las cajas y kilos recibidos.</Text>
      <Text style={[styles.account, { color: t.sub }]}>Cuenta verificada: {account.email}</Text>
      {message ? <Text style={[styles.note, { color: message.startsWith('✅') ? '#16a34a' : '#ef4444', fontWeight: '600' }]}>{message}</Text> : null}
      {loading ? <ActivityIndicator size="large" color="#0071e3" style={{ marginVertical: 40 }} /> : <>
        <View style={[styles.cards, compact && styles.cardsCompact]}>
          <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: t.card, borderColor: t.border }]}><Text style={[styles.cardTitle, { color: t.sub }]}>ENTREGAS REALIZADAS</Text><Text style={[styles.cardValue, { color: t.text }]}>{deliveries.length}</Text><Text style={[styles.cardDetail, { color: t.sub }]}>Viajes registrados en patio</Text></View>
          <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: t.card, borderColor: t.border }]}><Text style={[styles.cardTitle, { color: t.sub }]}>CAJAS TOTALES</Text><Text style={[styles.cardValue, { color: '#0071e3' }]}>{totalBoxes.toLocaleString()}</Text><Text style={[styles.cardDetail, { color: t.sub }]}>Cajas físicas contadas</Text></View>
          <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: t.card, borderColor: t.border }]}><Text style={[styles.cardTitle, { color: t.sub }]}>KILOGRAMOS RECIBIDOS</Text><Text style={[styles.cardValue, { color: '#16a34a' }]}>{totalKilos.toLocaleString()} kg</Text><Text style={[styles.cardDetail, { color: t.sub }]}>Peso neto documentado</Text></View>
        </View>
        <View style={[styles.gridTwo, compact && styles.gridTwoCompact]}>
          <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}><Text style={[styles.panelTitle, { color: t.text }]}>Registrar huerta</Text><Text style={[styles.label, { color: t.text }]}>Nombre</Text><TextInput style={inputStyle} value={orchardName} onChangeText={setOrchardName} placeholder="Ej. La Esperanza" placeholderTextColor={t.sub} /><Text style={[styles.label, { color: t.text }]}>Superficie en hectáreas</Text><TextInput style={inputStyle} value={hectares} onChangeText={setHectares} keyboardType="decimal-pad" placeholder="Ej. 8.5" placeholderTextColor={t.sub} /><View style={{ flexDirection: compact ? 'column' : 'row', gap: 12 }}><View style={{ flex: 1 }}><Text style={[styles.label, { color: t.text }]}>Latitud</Text><TextInput style={inputStyle} value={latitude} onChangeText={setLatitude} keyboardType="numbers-and-punctuation" placeholder="19.4200" placeholderTextColor={t.sub} /></View><View style={{ flex: 1 }}><Text style={[styles.label, { color: t.text }]}>Longitud</Text><TextInput style={inputStyle} value={longitude} onChangeText={setLongitude} keyboardType="numbers-and-punctuation" placeholder="-102.0600" placeholderTextColor={t.sub} /></View></View><Pressable style={[styles.primaryButton, !schemaReady && { opacity: 0.5 }]} onPress={saveOrchard} disabled={saving}><Text style={styles.primaryButtonText}>Guardar huerta</Text></Pressable>{!schemaReady && <Text style={{ color: '#ef4444', fontSize: 12 }}>Falta aplicar la migración de trazabilidad en Supabase.</Text>}{orchards.map((item) => <View key={item.id} style={[styles.listItem, { borderTopColor: t.border }]}><View><Text style={{ color: t.text, fontWeight: '600' }}>{item.name}</Text><Text style={{ color: t.sub, fontSize: 12 }}>{item.latitude}, {item.longitude}</Text></View><Text style={{ color: '#16a34a', fontWeight: '700' }}>{item.hectares} ha</Text></View>)}</View>
          <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}><Text style={[styles.panelTitle, { color: t.text }]}>Registro de exportación</Text><Text style={[styles.panelSubtitle, { color: t.sub }]}>Captura el número o ID oficial que se usará para identificar cada entrega.</Text><Text style={[styles.label, { color: t.text }]}>Número de registro (ID)</Text><TextInput style={inputStyle} value={registrationNumber} onChangeText={setRegistrationNumber} autoCapitalize="characters" placeholder="Ej. EXP-MX-2026-001" placeholderTextColor={t.sub} /><Pressable style={[styles.primaryButton, !schemaReady && { opacity: 0.5 }]} onPress={saveRegistration} disabled={saving}><Text style={styles.primaryButtonText}>Guardar registro</Text></Pressable>{!schemaReady && <Text style={{ color: '#ef4444', fontSize: 12 }}>Falta aplicar la migración de trazabilidad en Supabase.</Text>}{registrations.map((item) => <View key={item.id} style={[styles.listItem, { borderTopColor: t.border }]}><Text style={{ color: t.text, fontWeight: '600' }}>{item.registration_number}</Text></View>)}</View>
        </View>
        <View style={[styles.gridTwo, compact && styles.gridTwoCompact]}>
          <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }, compact ? { flexGrow: 0, flexShrink: 0 } : { flex: 0.8 }]}><Text style={[styles.panelTitle, { color: t.text }]}>Código QR de identificación</Text><Text style={[styles.panelSubtitle, { color: t.sub }]}>Muestra este código al empacador; contiene tu ID de productor.</Text><View style={[styles.qrContainer, { borderColor: t.border, backgroundColor: t.bg }]}><Text style={[styles.qrCodeString, { color: t.text, backgroundColor: t.border }]}>{producerRecord?.id}</Text><QRCodeReal value={qrValue} size={180} /></View></View>
          <View style={compact ? { width: '100%', flexGrow: 0, flexShrink: 0, gap: 24 } : { flex: 1, gap: 24 }}><View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}><Text style={[styles.panelTitle, { color: t.text }]}>Recepciones recientes</Text>{deliveries.length === 0 ? <Text style={{ color: t.sub, fontSize: 13 }}>Sin recepciones registradas.</Text> : deliveries.slice(0, 8).map((item) => <View key={item.id} style={[styles.listItem, { borderTopColor: t.border }]}><View><Text style={{ color: t.text, fontWeight: '600' }}>{item.folio}</Text><Text style={{ color: t.sub, fontSize: 12 }}>{item.orchard_name} · {item.shipment_folio}</Text></View><View style={{ alignItems: 'flex-end' }}><Text style={{ color: '#16a34a', fontWeight: '700' }}>{item.weight_kg} kg</Text><Text style={{ color: t.sub, fontSize: 12 }}>{item.boxes} cajas</Text></View></View>)}</View><View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}><Text style={[styles.panelTitle, { color: t.text }]}>Pagos y liquidaciones</Text>{payments.length === 0 ? <Text style={{ color: t.sub, fontSize: 13 }}>Sin pagos registrados.</Text> : payments.map((item) => <View key={item.id} style={[styles.listItem, { borderTopColor: t.border }]}><Text style={{ color: t.text, fontWeight: '600' }}>{item.folio}</Text><Text style={{ color: t.text, fontWeight: '700' }}>${Number(item.amount).toLocaleString()}</Text></View>)}</View></View>
        </View>
      </>}
    </ScrollView>
  </SafeAreaView>;
}
