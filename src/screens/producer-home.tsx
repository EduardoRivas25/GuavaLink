import { roleHomeStyles as styles } from '@/styles/role-home';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCodeReal from '../components/qr-code';
import { supabase } from '../lib/supabase';

interface ProducerHomeProps {
  account: any;
  onSignOut: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function ProducerHome({
  account,
  onSignOut,
  isDarkMode,
  toggleTheme,
}: ProducerHomeProps) {
  const { width } = useWindowDimensions();
  const compact = width < 700;

  const [loading, setLoading] = useState(true);
  const [producerRecord, setProducerRecord] = useState<any | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

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

  const loadProducerData = useCallback(async () => {
    setLoading(true);
    try {
      const email = (account?.email || 'productor@gmail.com').toLowerCase();
      let { data: prod } = await supabase
        .from('producers')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (!prod) {
        const newQr = `GL-PROD-${Math.floor(1000 + Math.random() * 9000)}`;
        const { data: created } = await supabase
          .from('producers')
          .insert([
            {
              name: account?.name || 'Productor Guayabero',
              email,
              municipality: 'Michoacán',
              qr_code: newQr,
              status: 'Activo',
            },
          ])
          .select('*')
          .single();
        prod = created;
      }
      setProducerRecord(prod);

      if (prod) {
        const { data: recs } = await supabase
          .from('receptions')
          .select('*')
          .or(`producer_qr.eq.${prod.qr_code},producer_name.ilike.%${prod.name}%`)
          .order('created_at', { ascending: false });
        setDeliveries(recs || []);

        const { data: pays } = await supabase
          .from('payments')
          .select('*')
          .ilike('producer_name', `%${prod.name}%`)
          .order('created_at', { ascending: false });
        setPayments(pays || []);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    loadProducerData();
  }, [loadProducerData]);

  const totalKilos = deliveries.reduce((acc, d) => acc + (Number(d.weight_kg) || 0), 0);
  const totalBoxes = deliveries.reduce((acc, d) => acc + (Number(d.boxes) || 0), 0);
  const qrValue = producerRecord?.qr_code || 'GL-PROD-0000';

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
        <Text style={[styles.eyebrow, { color: '#0071e3' }]}>PANEL DE PRODUCTOR</Text>
        <Text style={[styles.title, compact && styles.titleCompact, { color: t.text }]}>
          Hola, {producerRecord?.name || account.name}.
        </Text>
        <Text style={[styles.description, { color: t.sub }]}>
          Consulta tus estadísticas, muestra tu código QR en el patio de recepción y verifica tus liquidaciones en tiempo real.
        </Text>
        <Text style={[styles.account, { color: t.sub }]}>Cuenta verificada: {account.email}</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#0071e3" style={{ marginVertical: 40 }} />
        ) : (
          <>
            <View style={[styles.cards, compact && styles.cardsCompact]}>
              <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: t.card, borderColor: t.border }]}>
                <Text style={[styles.cardTitle, { color: t.sub }]}>ENTREGAS REALIZADAS</Text>
                <Text style={[styles.cardValue, { color: t.text }]}>{deliveries.length}</Text>
                <Text style={[styles.cardDetail, { color: t.sub }]}>Viajes registrados en patio</Text>
              </View>
              <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: t.card, borderColor: t.border }]}>
                <Text style={[styles.cardTitle, { color: t.sub }]}>CAJAS TOTALES</Text>
                <Text style={[styles.cardValue, { color: '#0071e3' }]}>{totalBoxes.toLocaleString()}</Text>
                <Text style={[styles.cardDetail, { color: t.sub }]}>Cajas físicas contadas</Text>
              </View>
              <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: t.card, borderColor: t.border }]}>
                <Text style={[styles.cardTitle, { color: t.sub }]}>KILOGRAMOS RECIBIDOS</Text>
                <Text style={[styles.cardValue, { color: '#16a34a' }]}>{totalKilos.toLocaleString()} kg</Text>
                <Text style={[styles.cardDetail, { color: t.sub }]}>Peso neto documentado</Text>
              </View>
            </View>

            <View style={[styles.gridTwo, compact && styles.gridTwoCompact]}>
              <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border, flex: 0.8 }]}>
                <Text style={[styles.panelTitle, { color: t.text }]}>Código QR de Identificación</Text>
                <Text style={[styles.panelSubtitle, { color: t.sub }]}>
                  Muestra este código al empacador para registrar rápidamente tus cajas.
                </Text>
                <View style={[styles.qrContainer, { borderColor: t.border, backgroundColor: t.bg }]}>
                  <Text style={[styles.qrCodeString, { color: t.text, backgroundColor: t.border }]}>
                    {qrValue}
                  </Text>
                  <QRCodeReal value={qrValue} size={180} />
                </View>
              </View>

              <View style={{ flex: 1, gap: 24 }}>
                <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
                  <Text style={[styles.panelTitle, { color: t.text }]}>Recepciones recientes</Text>
                  {deliveries.length === 0 ? (
                    <Text style={{ color: t.sub, fontSize: 13, marginTop: 10 }}>Sin recepciones registradas.</Text>
                  ) : (
                    deliveries.slice(0, 5).map((d) => (
                      <View key={d.id} style={[styles.listItem, { borderTopColor: t.border }]}>
                        <View>
                          <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>{d.folio}</Text>
                          <Text style={{ color: t.sub, fontSize: 12 }}>{d.orchard_name} · {d.shipment_folio}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={{ color: '#16a34a', fontWeight: '700' }}>{d.weight_kg} kg</Text>
                          <Text style={{ color: t.sub, fontSize: 12 }}>{d.boxes} cajas</Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                <View style={[styles.panel, { backgroundColor: t.card, borderColor: t.border }]}>
                  <Text style={[styles.panelTitle, { color: t.text }]}>Pagos y Liquidaciones</Text>
                  {payments.length === 0 ? (
                    <Text style={{ color: t.sub, fontSize: 13, marginTop: 10 }}>Sin pagos registrados.</Text>
                  ) : (
                    payments.map((p) => (
                      <View key={p.id} style={[styles.listItem, { borderTopColor: t.border }]}>
                        <View>
                          <Text style={{ color: t.text, fontWeight: '600', fontSize: 14 }}>{p.folio}</Text>
                          <Text style={{ color: p.status === 'Pagado' ? '#16a34a' : '#0071e3', fontSize: 12, fontWeight: '600' }}>
                            {p.status}
                          </Text>
                        </View>
                        <Text style={{ color: t.text, fontWeight: '700', fontSize: 15 }}>
                          ${Number(p.amount).toLocaleString()}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}