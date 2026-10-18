import { roleHomeStyles as styles } from '@/styles/role-home';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

interface PackerHomeProps {
  account: any;
  onSignOut: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function PackerHome({
  account,
  onSignOut,
  isDarkMode,
  toggleTheme,
}: PackerHomeProps) {
  const { width } = useWindowDimensions();
  const compact = width < 800;

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scannedLock, setScannedLock] = useState(false);

  const [producers, setProducers] = useState<any[]>([]);
  const [receptions, setReceptions] = useState<any[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<any | null>(null);

  const [qrInput, setQrInput] = useState('');
  const [orchardName, setOrchardName] = useState('');
  const [shipmentFolio, setShipmentFolio] = useState('');
  const [boxes, setBoxes] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [incidents, setIncidents] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const spinAnim = useRef(new Animated.Value(isDarkMode ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(spinAnim, {
      toValue: isDarkMode ? 0 : 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isDarkMode]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const loadData = useCallback(async () => {
    const { data: prodData } = await supabase.from('producers').select('*').order('name');
    setProducers(prodData || []);

    const { data: recData } = await supabase
      .from('receptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(15);
    setReceptions(recData || []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const matchProducerByQr = (code: string) => {
    const clean = code.trim().toUpperCase();
    setQrInput(clean);
    const found = producers.find((p) => String(p.qr_code).toUpperCase() === clean);
    if (found) {
      setSelectedProducer(found);
      setStatusMessage(`Productor identificado: ${found.name} (${found.qr_code})`);
    } else {
      setSelectedProducer(null);
      setStatusMessage(`Código QR leído (${clean}). Selecciona al productor manualmente.`);
    }
  };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        setStatusMessage('Permiso de cámara denegado. Actívalo en los ajustes de tu dispositivo.');
        return;
      }
    }
    setScannedLock(false);
    setCameraOpen(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedLock) return;
    setScannedLock(true);
    setCameraOpen(false);
    matchProducerByQr(data);
  };

  const handleRegisterReception = async () => {
    const producerName = selectedProducer?.name || qrInput.trim();
    const producerQr = selectedProducer?.qr_code || qrInput.trim() || 'GL-PROD-S/N';
    const numBoxes = Number(boxes);
    const numKg = Number(weightKg);

    if (!producerName || !numBoxes || !numKg) {
      setStatusMessage('Escanea un productor e ingresa cajas y kilos válidos.');
      return;
    }

    setSaving(true);
    try {
      const folio = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
      const { error } = await supabase.from('receptions').insert([
        {
          folio,
          producer_id: selectedProducer?.id || null,
          producer_name: producerName,
          producer_qr: producerQr,
          orchard_name: orchardName.trim() || selectedProducer?.municipality || 'Huerta general',
          shipment_folio: shipmentFolio.trim() || 'EMB-ACTUAL',
          boxes: numBoxes,
          weight_kg: numKg,
          incidents: incidents.trim() || 'Sin daños',
          received_by: account?.email || 'empacador@gmail.com',
        },
      ]);

      if (error) throw error;

      setBoxes('');
      setWeightKg('');
      setIncidents('');
      setStatusMessage(`✅ Recepción ${folio} guardada: ${numBoxes} cajas (${numKg} kg) de ${producerName}.`);
      loadData();
    } catch (err: any) {
      setStatusMessage(err.message || 'Error al registrar la recepción.');
    } finally {
      setSaving(false);
    }
  };

  const t = {
    bg: isDarkMode ? '#000000' : '#f3f4f6',
    card: isDarkMode ? '#1d1d1f' : '#ffffff',
    text: isDarkMode ? '#f5f5f7' : '#111827',
    sub: isDarkMode ? '#86868b' : '#6b7280',
    border: isDarkMode ? '#292929' : '#d1d5db',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.bg }]}>
      <View style={[styles.header, compact && styles.headerCompact, { borderBottomColor: t.border }]}>
        <Image
          source={
            isDarkMode
              ? require('../../assets/images/logo-horizontal-dark.png')
              : require('../../assets/images/guavalink-logo.png')
          }
          style={[styles.logo, !isDarkMode && { tintColor: '#111827' }]}
          resizeMode="contain"
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          <Pressable onPress={toggleTheme}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Text style={{ fontSize: 24 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </Animated.View>
          </Pressable>
          <Pressable style={[styles.signOutButton, { borderColor: t.border }]} onPress={onSignOut}>
            <Text style={[styles.signOutText, { color: t.text }]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: '#0071e3' }]}>RECEPCIÓN EN PATIO</Text>
        <Text style={[styles.title, compact && styles.titleCompact, { color: t.text }]}>
          Hola, {account.name}.
        </Text>
        <Text style={[styles.description, { color: t.sub }]}>
          Utiliza la cámara del dispositivo para escanear el código QR del productor o búscalo manualmente para registrar su fruta.
        </Text>

        {statusMessage ? (
          <Text style={[styles.note, { color: statusMessage.includes('✅') ? '#16a34a' : '#ef4444', fontWeight: '600' }]}>
            {statusMessage}
          </Text>
        ) : null}

        <View style={[styles.gridTwo, compact && styles.gridTwoCompact]}>
          <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border, flex: 1.2 }]}>
            <Text style={[styles.panelTitle, { color: t.text }]}>Nueva Recepción</Text>
            
            <Text style={[styles.label, { color: t.text }]}>Código QR o Productor</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.input, { flex: 1, backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                placeholder="GL-PROD-..."
                placeholderTextColor={t.sub}
                value={qrInput}
                onChangeText={matchProducerByQr}
              />
              <Pressable style={[styles.primaryButton, { marginTop: 0 }]} onPress={handleOpenCamera}>
                <Text style={styles.primaryButtonText}>Escanear QR</Text>
              </Pressable>
            </View>

            <View style={styles.chipRow}>
              {producers.map((p) => {
                const selected = selectedProducer?.id === p.id;
                return (
                  <Pressable
                    key={p.id}
                    style={[styles.chip, { borderColor: t.border }, selected && styles.chipActive]}
                    onPress={() => {
                      setSelectedProducer(p);
                      setQrInput(p.qr_code);
                      setStatusMessage(`Productor seleccionado: ${p.name}`);
                    }}
                  >
                    <Text style={[styles.chipText, { color: t.sub }, selected && styles.chipTextActive]}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: t.text }]}>Cajas *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                  placeholder="0"
                  placeholderTextColor={t.sub}
                  keyboardType="numeric"
                  value={boxes}
                  onChangeText={setBoxes}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: t.text }]}>Kilos *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                  placeholder="0"
                  placeholderTextColor={t.sub}
                  keyboardType="numeric"
                  value={weightKg}
                  onChangeText={setWeightKg}
                />
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: t.text }]}>Huerta</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                  placeholder="Huerta origen"
                  placeholderTextColor={t.sub}
                  value={orchardName}
                  onChangeText={setOrchardName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: t.text }]}>Embarque (Folio)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
                  placeholder="EMB-..."
                  placeholderTextColor={t.sub}
                  value={shipmentFolio}
                  onChangeText={setShipmentFolio}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: t.text }]}>Observaciones</Text>
            <TextInput
              style={[styles.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              placeholder="Estado de la fruta..."
              placeholderTextColor={t.sub}
              value={incidents}
              onChangeText={setIncidents}
            />

            <Pressable style={[styles.primaryButton, { marginTop: 12 }]} onPress={handleRegisterReception} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Registrar entrega en sistema</Text>
              )}
            </Pressable>
          </View>

          <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border, flex: 1 }]}>
            <Text style={[styles.panelTitle, { color: t.text }]}>Registros de hoy</Text>
            {receptions.length === 0 ? (
              <Text style={{ color: t.sub, fontSize: 13, marginTop: 10 }}>Sin recepciones capturadas.</Text>
            ) : (
              receptions.map((r) => (
                <View key={r.id} style={[styles.listItem, { borderTopColor: t.border }]}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ color: t.text, fontWeight: '700', fontSize: 14 }}>
                      {r.producer_name}
                    </Text>
                    <Text style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>
                      {r.folio} · Embarque: {r.shipment_folio}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: '#16a34a', fontWeight: '800', fontSize: 15 }}>
                      {r.weight_kg} kg
                    </Text>
                    <Text style={{ color: t.sub, fontSize: 12 }}>{r.boxes} cajas</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={cameraOpen} transparent animationType="slide">
        <View style={localStyles.modalBg}>
          <View style={[localStyles.modalContainer, { backgroundColor: t.card, borderColor: t.border }]}>
            <Text style={[styles.panelTitle, { color: t.text, marginBottom: 16 }]}>
              Apunta al código QR
            </Text>
            <View style={localStyles.cameraBox}>
              <CameraView
                style={{ flex: 1, width: '100%', height: '100%' }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={localStyles.cameraTarget} />
            </View>
            <Pressable
              style={[styles.primaryButton, { width: '100%', backgroundColor: '#ef4444' }]}
              onPress={() => setCameraOpen(false)}
            >
              <Text style={styles.primaryButtonText}>Cerrar cámara</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  cameraBox: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    marginBottom: 20,
  },
  cameraTarget: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: '#0071e3',
    borderRadius: 16,
    position: 'absolute',
  },
});