import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg';
import OrchardMap from '@/components/orchard-map';
import type { Orchard } from '@/types/orchard';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const narrow = width < 380;
  const tablet = width >= 700 && width < 900;
  const shortScreen = !compact && useWindowDimensions().height < 820;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [signedIn, setSignedIn] = useState(false);

  const handleSignIn = () => {
    if (!email.trim() || !password) {
      setMessage('Escribe tu correo y contraseña para continuar.');
      return;
    }

    setMessage('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSignedIn(true);
    }, 250);
  };

  if (signedIn) return <AdminDashboard onSignOut={() => setSignedIn(false)} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.page, compact && styles.pageCompact, narrow && styles.pageNarrow]}>
            <View style={[styles.topBar, shortScreen && styles.topBarShort]}>
              <Image
                source={require('../../assets/images/logo-horizontal-dark.png')}
                style={styles.logo}
                resizeMode="contain"
                accessibilityLabel="GuavaLink"
              />
            </View>

            <View style={[styles.main, compact && styles.mainCompact, tablet && styles.mainTablet, shortScreen && styles.mainShort]}>
              <View style={[styles.intro, compact && styles.introCompact]}>
                <View style={styles.eyebrowRow}>
                  <View style={styles.eyebrowLine} />
                  <Text style={styles.eyebrow}>EMPAQUE DE EXPORTACIÓN</Text>
                </View>
                <Text style={[styles.headline, tablet && styles.headlineTablet, compact && styles.headlineCompact, narrow && styles.headlineNarrow]}>Del campo{ '\n' }a tu pantalla.</Text>
                <Text style={styles.description}>
                  La operación de tu empaque, conectada de principio a fin.
                </Text>

                {!compact && (
                  <View style={[styles.produceFrame, shortScreen && styles.produceFrameShort]}>
                    <Image
                      source={require('../../assets/GUAYABA-1.webp')}
                      style={styles.produceImage}
                      resizeMode="contain"
                      accessibilityLabel="Guayabas frescas, enteras y cortadas"
                    />
                    <View style={styles.imageCaption}>
                      <View style={styles.captionDot} />
                      <Text style={styles.captionText}>DEL CAMPO A CADA EMBARQUE</Text>
                    </View>
                  </View>
                )}

                {!compact && <View style={[styles.featureList, shortScreen && styles.featureListShort]}>
                  <FeatureItem number="01" title="Recepciones trazables" detail="Cada kilo, desde el patio." />
                  <FeatureItem number="02" title="Productores conectados" detail="Entregas y pagos al día." />
                  <FeatureItem number="03" title="Embarques bajo control" detail="Información que fluye." last />
                </View>}
              </View>

              <View style={[styles.loginCard, tablet && styles.loginCardTablet, compact && styles.loginCardCompact, narrow && styles.loginCardNarrow, shortScreen && styles.loginCardShort]}>
                <View style={styles.cardHeading}>
                  <View>
                    <Text style={styles.cardEyebrow}>BIENVENIDO DE NUEVO</Text>
                    <Text style={styles.cardTitle}>Inicia sesión</Text>
                  </View>
                  <Image
                    source={require('../../assets/images/guavalink-mark.png')}
                    style={styles.cardMark}
                    resizeMode="contain"
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  />
                </View>

                <Text style={styles.fieldLabel}>Correo electrónico</Text>
                <TextInput
                  accessibilityLabel="Correo electrónico"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  keyboardType="email-address"
                  onChangeText={(value) => {
                    setEmail(value);
                    setMessage('');
                  }}
                  placeholder="nombre@guavalink.mx"
                  placeholderTextColor="#777a75"
                  returnKeyType="next"
                  style={styles.input}
                  textContentType="emailAddress"
                  value={email}
                />

                <View style={styles.passwordLabelRow}>
                  <Text style={styles.fieldLabel}>Contraseña</Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setMessage('Solicita a tu administrador el restablecimiento de contraseña.')}
                    hitSlop={8}
                  >
                    <Text style={styles.linkText}>¿La olvidaste?</Text>
                  </Pressable>
                </View>
                <View style={styles.passwordWrap}>
                  <TextInput
                    accessibilityLabel="Contraseña"
                    autoCapitalize="none"
                    autoComplete="password"
                    onChangeText={(value) => {
                      setPassword(value);
                      setMessage('');
                    }}
                    onSubmitEditing={handleSignIn}
                    placeholder="Tu contraseña"
                    placeholderTextColor="#777a75"
                    returnKeyType="go"
                    secureTextEntry={!passwordVisible}
                    style={styles.passwordInput}
                    textContentType="password"
                    value={password}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onPress={() => setPasswordVisible((visible) => !visible)}
                    hitSlop={10}
                    style={styles.visibilityButton}
                  >
                    <Text style={styles.visibilityText}>{passwordVisible ? 'Ocultar' : 'Mostrar'}</Text>
                  </Pressable>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: loading }}
                  disabled={loading}
                  onPress={handleSignIn}
                  style={({ pressed }) => [styles.submitButton, pressed && !loading && styles.submitPressed]}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitText}>Entrar a GuavaLink <Text style={styles.arrow}>→</Text></Text>
                  )}
                </Pressable>

                <View style={styles.separatorRow}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>o continúa con</Text>
                  <View style={styles.separatorLine} />
                </View>

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setMessage('El acceso con Google estará disponible al conectar la autenticación de GuavaLink.')}
                  style={({ pressed }) => [styles.googleButton, pressed && styles.googlePressed]}
                >
                  <View style={styles.googleMark} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                    <Text style={styles.googleG}>G</Text>
                  </View>
                  <Text style={styles.googleText}>Iniciar con Google</Text>
                </Pressable>

                {message ? <Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text> : null}

                <View style={styles.secureNote}>
                  <Text style={styles.lockIcon}>◇</Text>
                  <Text style={styles.secureText}>Acceso seguro para personal y productores</Text>
                </View>
              </View>
            </View>

            <View style={[styles.footer, compact && styles.footerCompact]}>
              <Text style={styles.footerText}>© 2026 GuavaLink</Text>
              {!compact && <Text style={styles.footerCenter}>De la huerta al mundo.</Text>}
              <Text style={styles.footerText}>Hecho para el campo</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FeatureItem({ number, title, detail, last = false }: { number: string; title: string; detail: string; last?: boolean }) {
  return (
    <View style={[styles.featureItem, last && styles.featureItemLast]}>
      <Text style={styles.featureNumber}>{number}</Text>
      <View style={styles.featureCopy}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDetail}>{detail}</Text>
      </View>
      <Text style={styles.featureArrow}>↗</Text>
    </View>
  );
}

const dashboardStats = [
  { label: 'Kilos recibidos hoy', value: '8,450', unit: 'kg', note: '↗  +12.8% vs. ayer', icon: 'weight' },
  { label: 'Embarques activos', value: '03', unit: '', note: '1 listo para salir hoy', icon: 'truck' },
  { label: 'Pagos pendientes', value: '$184,250', unit: 'MXN', note: '24 productores por liquidar', icon: 'wallet' },
  { label: 'Productores activos', value: '128', unit: '', note: '+8 nuevos este mes', icon: 'farmers' },
];

const dashboardLinks = [
  { label: 'Resumen', icon: 'overview' },
  { label: 'Productores', icon: 'producers', count: '128' },
  { label: 'Huertas', icon: 'orchards' },
  { label: 'Embarques', icon: 'shipments', count: '3' },
  { label: 'Pagos', icon: 'payments' },
  { label: 'Reportes', icon: 'reports' },
];

function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 760;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('Resumen');

  return (
    <SafeAreaView style={dashboardStyles.safeArea}>
      <View style={dashboardStyles.shell}>
        {!compact && (
          <View style={[dashboardStyles.sidebar, sidebarCollapsed && dashboardStyles.sidebarCollapsed]}>
            <View style={[dashboardStyles.brand, sidebarCollapsed && dashboardStyles.brandCollapsed]}>
              <Image
                source={sidebarCollapsed
                  ? require('../../assets/images/guavalink-brand-mark.png')
                  : require('../../assets/images/guavalink-brand-horizontal-dark.png')}
                style={sidebarCollapsed ? dashboardStyles.brandLogoCollapsed : dashboardStyles.brandLogo}
                resizeMode="contain"
                accessibilityLabel="GuavaLink"
              />
            </View>

            {!sidebarCollapsed && <View style={dashboardStyles.packhouse}>
              <View style={dashboardStyles.packhouseIcon}><Text style={dashboardStyles.navIcon}>♧</Text></View>
              <View style={dashboardStyles.packhouseCopy}>
              <Text style={dashboardStyles.packhouseName}>GuceMich</Text>
                <Text style={dashboardStyles.packhousePlace}>Michoacán, México</Text>
              </View>
              <Text style={dashboardStyles.chevron}>⌄</Text>
            </View>}

            {!sidebarCollapsed && <Text style={dashboardStyles.navSection}>PRINCIPAL</Text>}
            <View style={dashboardStyles.navList}>
              {dashboardLinks.map((item) => {
                const active = activeSection === item.label;
                return (
                  <Pressable key={item.label} accessibilityLabel={item.label} onPress={() => setActiveSection(item.label)} style={[dashboardStyles.navItem, sidebarCollapsed && dashboardStyles.navItemCollapsed, active && dashboardStyles.navItemActive]}>
                    <NavGlyph name={item.icon} active={active} />
                    {!sidebarCollapsed && <Text style={[dashboardStyles.navLabel, active && dashboardStyles.navLabelActive]}>{item.label}</Text>}
                    {!sidebarCollapsed && item.count ? <Text style={dashboardStyles.navCount}>{item.count}</Text> : null}
                  </Pressable>
                );
              })}
            </View>

            {!sidebarCollapsed && <Text style={[dashboardStyles.navSection, dashboardStyles.adminSection]}>ADMINISTRACIÓN</Text>}
            <Pressable accessibilityLabel="Usuarios y roles" style={[dashboardStyles.navItem, sidebarCollapsed && dashboardStyles.navItemCollapsed]} onPress={() => setActiveSection('Usuarios y roles')}>
              <NavGlyph name="users" />
              {!sidebarCollapsed && <Text style={dashboardStyles.navLabel}>Usuarios y roles</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'} onPress={() => setSidebarCollapsed((collapsed) => !collapsed)} style={[dashboardStyles.collapseButton, sidebarCollapsed && dashboardStyles.navItemCollapsed]}>
              <Text style={dashboardStyles.collapseGlyph}>{sidebarCollapsed ? '›' : '‹'}</Text>
              {!sidebarCollapsed && <Text style={dashboardStyles.collapseLabel}>Contraer menú</Text>}
            </Pressable>
          </View>
        )}

        <View style={dashboardStyles.mainArea}>
          <View style={dashboardStyles.topNav}>
            {compact ? (
              <View style={dashboardStyles.brandCompact}>
                <Image source={require('../../assets/images/guavalink-brand-horizontal-dark.png')} style={dashboardStyles.brandLogoCompact} resizeMode="contain" accessibilityLabel="GuavaLink" />
              </View>
            ) : (
              <View style={dashboardStyles.breadcrumb}><Pressable accessibilityRole="button" accessibilityLabel="Alternar menú lateral" onPress={() => setSidebarCollapsed((collapsed) => !collapsed)} style={dashboardStyles.menuToggle}><Text style={dashboardStyles.menuToggleText}>☰</Text></Pressable><Text style={dashboardStyles.breadcrumbMuted}>Mi empaque</Text><Text style={dashboardStyles.breadcrumbSlash}>/</Text><Text style={dashboardStyles.breadcrumbActive}>{activeSection}</Text></View>
            )}
            <View style={dashboardStyles.topActions}>
              {!compact && <Text style={dashboardStyles.search}>⌕  Buscar en GuavaLink...</Text>}
              <View style={dashboardStyles.topDivider} />
              <Pressable accessibilityRole="button" accessibilityLabel="Notificaciones, 3 sin leer" style={dashboardStyles.bellButton}>
                <NotificationBell />
                <View style={dashboardStyles.notificationBadge}><Text style={dashboardStyles.notificationBadgeText}>3</Text></View>
              </Pressable>
              <Pressable accessibilityLabel="Cerrar sesión" onPress={onSignOut} style={dashboardStyles.avatar}><Text style={dashboardStyles.avatarText}>AC</Text></Pressable>
            </View>
          </View>

          {activeSection === 'Productores' ? <ProducerScreen compact={compact} /> : activeSection === 'Huertas' ? <OrchardScreen compact={compact} /> : activeSection === 'Embarques' ? <ShipmentScreen compact={compact} /> : activeSection === 'Pagos' ? <PaymentScreen compact={compact} /> : activeSection === 'Reportes' ? <ReportsScreen compact={compact} /> : <ScrollView contentContainerStyle={[dashboardStyles.content, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
            <View style={dashboardStyles.welcomeRow}>
              <View style={dashboardStyles.welcomeCopy}>
                <Text style={dashboardStyles.eyebrow}>TU EMPAQUE, DE UN VISTAZO</Text>
                <Text style={[dashboardStyles.greeting, compact && dashboardStyles.greetingCompact]}>Buen día, Alejandro <Text style={dashboardStyles.sun}>☀</Text></Text>
                <Text style={dashboardStyles.subtitle}>Todo lo que necesitas saber para empezar el día.</Text>
              </View>
              <View style={dashboardStyles.welcomeActions}>
                <View style={dashboardStyles.datePill}><Text style={dashboardStyles.dateIcon}>▦</Text><Text style={dashboardStyles.dateText}>3 oct, 2026</Text></View>
                <Pressable style={dashboardStyles.newButton}><Text style={dashboardStyles.newButtonText}>＋  Nueva recepción</Text></Pressable>
              </View>
            </View>

            <View style={dashboardStyles.statsGrid}>
              {dashboardStats.map((stat, index) => (
                <View key={stat.label} style={[dashboardStyles.statCard, compact && dashboardStyles.statCardCompact]}>
                  <View style={dashboardStyles.statTop}>
                    <Text style={dashboardStyles.statLabel}>{stat.label}</Text>
                    <View style={[dashboardStyles.statIcon, index === 2 && dashboardStyles.statIconGold, index === 3 && dashboardStyles.statIconRose]}><StatGlyph name={stat.icon} /></View>
                  </View>
                  <View style={dashboardStyles.statValueRow}>
                    <Text style={dashboardStyles.statValue}>{stat.value}</Text>
                    {stat.unit ? <Text style={dashboardStyles.statUnit}>{stat.unit}</Text> : null}
                  </View>
                  <Text style={[dashboardStyles.statNote, index !== 0 && dashboardStyles.statNoteBlue]}>{stat.note}</Text>
                </View>
              ))}
            </View>

            <View style={[dashboardStyles.lowerGrid, compact && dashboardStyles.lowerGridCompact]}>
              <View style={dashboardStyles.lowerPanel}>
                <View style={dashboardStyles.panelHeader}><View><Text style={dashboardStyles.panelTitle}>Recepción de fruta</Text><Text style={dashboardStyles.panelSubtitle}>Un campo que no deja de crecer.</Text></View><Pressable style={dashboardStyles.weekSelect}><Text style={dashboardStyles.weekText}>▦  Esta semana  ⌄</Text></Pressable></View>
                <View style={dashboardStyles.receiptSummary}><Text style={dashboardStyles.receiptValue}>32,840 <Text style={dashboardStyles.receiptUnit}>kg</Text></Text><Text style={dashboardStyles.receiptCaption}>recibidos esta semana</Text></View>
                <ReceptionChart />
              </View>
              <View style={dashboardStyles.lowerPanel}>
                <View style={dashboardStyles.panelHeader}><View><Text style={dashboardStyles.panelTitle}>Embarques en curso</Text><Text style={dashboardStyles.panelSubtitle}>Del empaque a su próximo destino.</Text></View><Text style={dashboardStyles.panelArrow}>↗</Text></View>
                <ShipmentRow name="Exportación norte" detail="GUA-2026-084 · Sale hoy" progress="72%" />
                <ShipmentRow name="Mercado nacional" detail="GUA-2026-083 · En preparación" progress="38%" />
              </View>
            </View>
          </ScrollView>}
        </View>
      </View>
    </SafeAreaView>
  );
}

type ShipmentStatus = 'En preparación' | 'Listo para salir' | 'En tránsito' | 'Entregado';
type Shipment = { folio: string; destination: string; initials: string; departure: string; kilos: number; status: ShipmentStatus };
const shipmentStatuses: ShipmentStatus[] = ['En preparación', 'Listo para salir', 'En tránsito', 'Entregado'];
const initialShipments: Shipment[] = [
  { folio: 'EMB-2026-024', destination: 'Houston, Texas', initials: 'HT', departure: '05 oct, 2026', kilos: 18450, status: 'En preparación' },
  { folio: 'EMB-2026-025', destination: 'Los Ángeles, California', initials: 'LÁ', departure: '06 oct, 2026', kilos: 12300, status: 'En preparación' },
  { folio: 'EMB-2026-026', destination: 'Monterrey, Nuevo León', initials: 'MN', departure: '08 oct, 2026', kilos: 22000, status: 'Listo para salir' },
];

function ShipmentScreen({ compact }: { compact: boolean }) {
  const [shipments, setShipments] = useState(initialShipments);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Todos' | ShipmentStatus>('Todos');
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [destination, setDestination] = useState('');
  const [departure, setDeparture] = useState('');
  const [kilos, setKilos] = useState('');
  const totalKilos = shipments.reduce((sum, shipment) => sum + shipment.kilos, 0);
  const visible = shipments.filter((shipment) => `${shipment.destination} ${shipment.folio} ${shipment.status}`.toLowerCase().includes(query.toLowerCase()) && (filter === 'Todos' || shipment.status === filter));
  const openForm = (shipment?: Shipment) => {
    setEditing(shipment ?? { folio: `EMB-2026-${String(24 + shipments.length).padStart(3, '0')}`, destination: '', initials: '', departure: '', kilos: 0, status: 'En preparación' });
    setDestination(shipment?.destination ?? ''); setDeparture(shipment?.departure ?? ''); setKilos(shipment ? String(shipment.kilos) : '');
  };
  const save = () => {
    const parsedKilos = Number(kilos.replace(/,/g, ''));
    if (!editing || !destination.trim() || !departure.trim() || !Number.isFinite(parsedKilos) || parsedKilos <= 0) { Alert.alert('Revisa los datos', 'Ingresa destino, fecha de salida y kilos válidos.'); return; }
    const saved = { ...editing, destination: destination.trim(), initials: destination.trim().split(/[ ,]+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase(), departure: departure.trim(), kilos: parsedKilos };
    setShipments((current) => current.some((item) => item.folio === editing.folio) ? current.map((item) => item.folio === editing.folio ? saved : item) : [...current, saved]);
    setEditing(null);
  };
  const cycleStatus = (shipment: Shipment) => setShipments((current) => current.map((item) => item.folio === shipment.folio ? { ...item, status: shipmentStatuses[(shipmentStatuses.indexOf(item.status) + 1) % shipmentStatuses.length] } : item));
  const statusStyle = (status: ShipmentStatus) => status === 'Entregado' ? dashboardStyles.shipmentDelivered : status === 'En tránsito' ? dashboardStyles.shipmentTransit : status === 'Listo para salir' ? dashboardStyles.shipmentReady : dashboardStyles.shipmentPreparing;

  return <ScrollView contentContainerStyle={[dashboardStyles.producerContent, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
    <View style={[dashboardStyles.producerHeading, compact && dashboardStyles.producerHeadingCompact]}>
      <View style={dashboardStyles.welcomeCopy}><Text style={dashboardStyles.eyebrow}>MI EMPAQUE</Text><Text style={[dashboardStyles.producerTitle, compact && dashboardStyles.producerTitleCompact]}>Embarques</Text><Text style={dashboardStyles.subtitle}>Cada cosecha, camino a su próximo destino.</Text></View>
      <View style={dashboardStyles.welcomeActions}><Pressable style={dashboardStyles.exportButton} onPress={() => Alert.alert('Exportar embarques', 'La exportación estará disponible al conectar los datos del empaque.')}><Text style={dashboardStyles.exportText}>⇩  Exportar</Text></Pressable><Pressable style={dashboardStyles.newButton} onPress={() => openForm()}><Text style={dashboardStyles.newButtonText}>＋  Nuevo embarque</Text></Pressable></View>
    </View>
    <View style={dashboardStyles.producerStats}>
      <View style={[dashboardStyles.producerStatCard, compact && dashboardStyles.producerStatCardCompact]}><View style={dashboardStyles.statTop}><Text style={dashboardStyles.statLabel}>Embarques registrados</Text><View style={dashboardStyles.statIcon}><NavGlyph name="shipments" active /></View></View><Text style={dashboardStyles.statValue}>{String(shipments.length).padStart(2, '0')}</Text><Text style={dashboardStyles.producerStatNote}>Datos de demostración</Text></View>
      <View style={[dashboardStyles.producerStatCard, compact && dashboardStyles.producerStatCardCompact]}><View style={dashboardStyles.statTop}><Text style={dashboardStyles.statLabel}>Carga total</Text><View style={dashboardStyles.statIcon}><StatGlyph name="truck" /></View></View><Text style={[dashboardStyles.statValue, compact && { fontSize: 27 }]}>{totalKilos.toLocaleString('es-MX')} kg</Text><Text style={dashboardStyles.producerStatNote}>Kilos en embarques registrados</Text></View>
    </View>
    <View style={[dashboardStyles.producerToolbar, compact && dashboardStyles.producerToolbarCompact]}>
      <View style={[dashboardStyles.producerSearch, compact && dashboardStyles.producerSearchCompact]}><Text style={dashboardStyles.searchGlyph}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Buscar embarques..." placeholderTextColor="#86868b" style={dashboardStyles.producerSearchInput} accessibilityLabel="Buscar embarques" /></View>
      <Pressable style={dashboardStyles.filterButton} onPress={() => setFilter((value) => value === 'Todos' ? 'En preparación' : value === 'En preparación' ? 'Listo para salir' : value === 'Listo para salir' ? 'En tránsito' : value === 'En tránsito' ? 'Entregado' : 'Todos')}><Text style={dashboardStyles.filterText}>{filter}  ⌄</Text></Pressable>
    </View>
    {compact ? <View style={dashboardStyles.producerCards}>{visible.map((shipment) => <View key={shipment.folio} style={dashboardStyles.producerCard}><View style={dashboardStyles.producerMobileHeading}><View style={dashboardStyles.producerAvatar}><Text style={dashboardStyles.producerInitials}>{shipment.initials}</Text></View><View style={dashboardStyles.producerMobileCopy}><Text style={dashboardStyles.producerName}>{shipment.destination}</Text><Text style={dashboardStyles.producerMeta}>{shipment.folio} · Sale {shipment.departure}</Text></View></View><View style={dashboardStyles.shipmentMobileFooter}><Text style={dashboardStyles.producerKilos}>{shipment.kilos.toLocaleString('es-MX')} kg</Text><Pressable accessibilityRole="button" accessibilityLabel={`Cambiar estado de ${shipment.folio}. Estado actual: ${shipment.status}`} onPress={() => cycleStatus(shipment)} style={[dashboardStyles.statusBadge, statusStyle(shipment.status)]}><Text style={dashboardStyles.shipmentStatusText}>{shipment.status}  ›</Text></Pressable><Pressable accessibilityLabel={`Editar ${shipment.folio}`} onPress={() => openForm(shipment)}><ActionGlyph name="edit" /></Pressable><Pressable accessibilityLabel={`Eliminar ${shipment.folio}`} onPress={() => Alert.alert('Eliminar embarque', `¿Eliminar ${shipment.folio}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => setShipments((current) => current.filter((item) => item.folio !== shipment.folio)) }])}><ActionGlyph name="delete" /></Pressable></View></View>)}</View> : <ScrollView horizontal showsHorizontalScrollIndicator><View style={dashboardStyles.shipmentTable}><View style={[dashboardStyles.producerTableRow, dashboardStyles.producerTableHeader]}><Text style={[dashboardStyles.producerColumn, dashboardStyles.shipmentDestinationCol, dashboardStyles.tableHeading]}>DESTINO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.shipmentFolioCol, dashboardStyles.tableHeading]}>FOLIO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.shipmentDateCol, dashboardStyles.tableHeading]}>SALIDA</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.shipmentKilosCol, dashboardStyles.tableHeading]}>KILOS RECIBIDOS</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.shipmentStatusCol, dashboardStyles.tableHeading]}>ESTADO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnActions, dashboardStyles.tableHeading]}>ACCIONES</Text></View>{visible.map((shipment) => <View key={shipment.folio} style={dashboardStyles.producerTableRow}><View style={[dashboardStyles.producerColumn, dashboardStyles.shipmentDestinationCol, dashboardStyles.producerNameCell]}><View style={dashboardStyles.producerAvatar}><Text style={dashboardStyles.producerInitials}>{shipment.initials}</Text></View><Text style={dashboardStyles.producerName}>{shipment.destination}</Text></View><Text style={[dashboardStyles.producerColumn, dashboardStyles.shipmentFolioCol, dashboardStyles.producerMeta]}>{shipment.folio}</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.shipmentDateCol, dashboardStyles.producerMeta]}>{shipment.departure}</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.shipmentKilosCol, dashboardStyles.producerName]}>{shipment.kilos.toLocaleString('es-MX')} kg</Text><View style={[dashboardStyles.producerColumn, dashboardStyles.shipmentStatusCol]}><Pressable accessibilityRole="button" accessibilityLabel={`Cambiar estado de ${shipment.folio}. Estado actual: ${shipment.status}`} onPress={() => cycleStatus(shipment)} style={[dashboardStyles.statusBadge, statusStyle(shipment.status)]}><Text style={dashboardStyles.shipmentStatusText}>{shipment.status}  ›</Text></Pressable></View><View style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnActions]}><Pressable accessibilityLabel={`Editar ${shipment.folio}`} onPress={() => openForm(shipment)}><ActionGlyph name="edit" /></Pressable><Pressable accessibilityLabel={`Eliminar ${shipment.folio}`} onPress={() => Alert.alert('Eliminar embarque', `¿Eliminar ${shipment.folio}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => setShipments((current) => current.filter((item) => item.folio !== shipment.folio)) }])}><ActionGlyph name="delete" /></Pressable></View></View>)}</View></ScrollView>}
    {visible.length === 0 && <Text style={dashboardStyles.emptyText}>No hay embarques que coincidan con la búsqueda.</Text>}
    <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}><View style={dashboardStyles.modalBackdrop}><ScrollView style={dashboardStyles.formScroll} contentContainerStyle={dashboardStyles.formScrollContent} keyboardShouldPersistTaps="handled"><View style={dashboardStyles.formCard}><Text style={dashboardStyles.panelTitle}>{shipments.some((item) => item.folio === editing?.folio) ? 'Editar embarque' : 'Nuevo embarque'}</Text><Text style={dashboardStyles.formHint}>{editing?.folio}</Text><Text style={dashboardStyles.formLabel}>Destino</Text><TextInput value={destination} onChangeText={setDestination} placeholder="Ciudad, estado o país" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.formLabel}>Fecha de salida</Text><TextInput value={departure} onChangeText={setDeparture} placeholder="05 oct, 2026" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.formLabel}>Kilos recibidos</Text><TextInput value={kilos} onChangeText={setKilos} placeholder="0" keyboardType="numeric" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><View style={dashboardStyles.formActions}><Pressable onPress={() => setEditing(null)}><Text style={dashboardStyles.cancelText}>Cancelar</Text></Pressable><Pressable onPress={save} style={dashboardStyles.newButton}><Text style={dashboardStyles.newButtonText}>Guardar embarque</Text></Pressable></View></View></ScrollView></View></Modal>
  </ScrollView>;
}

type ReportRow = { date: string; values: string[] };
type ReportDefinition = { title: string; description: string; icon: 'orchards' | 'farmers' | 'shipments' | 'payments'; headers: string[]; rows: ReportRow[]; fileName: string };

function ReportsScreen({ compact }: { compact: boolean }) {
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
          <TextInput value={from} onChangeText={(value) => { setFrom(value); setRangeMessage(''); }} placeholder="DD/MM/AAAA" placeholderTextColor="#86868b" accessibilityLabel={`Fecha inicial para ${report.title}`} style={dashboardStyles.reportDateInput} />
          <Text style={dashboardStyles.reportDash}>—</Text>
          <TextInput value={to} onChangeText={(value) => { setTo(value); setRangeMessage(''); }} placeholder="DD/MM/AAAA" placeholderTextColor="#86868b" accessibilityLabel={`Fecha final para ${report.title}`} style={dashboardStyles.reportDateInput} />
        </View>
        <Pressable accessibilityRole="button" onPress={() => void download(report)} style={dashboardStyles.reportDownload}><Text style={dashboardStyles.reportDownloadText}>▤  Descargar CSV</Text></Pressable>
      </View>)}
    </View>
    <Text style={dashboardStyles.reportFootnote}>Los archivos usan datos de demostración hasta conectar los registros reales del empaque.</Text>
  </ScrollView>;
}

type Producer = { nombres: string; apellidos: string; folio: string; origen: string; rfc: string; huerta: string | null; kilos: string; active: boolean };
const initialProducers: Producer[] = [
  { nombres: 'José', apellidos: 'Martínez López', folio: 'PR-001', origen: 'Calvillo, Aguascalientes', rfc: 'MALJ850412XXX', huerta: null, kilos: '1,250 kg', active: true },
  { nombres: 'María Elena', apellidos: 'González', folio: 'PR-002', origen: 'Jalpa, Zacatecas', rfc: 'GOME900723XXX', huerta: null, kilos: '980 kg', active: true },
  { nombres: 'Roberto', apellidos: 'Díaz Ramírez', folio: 'PR-003', origen: 'Calvillo, Aguascalientes', rfc: 'DIRR780915XXX', huerta: null, kilos: '760 kg', active: true },
  { nombres: 'Rosa Isela', apellidos: 'Hernández', folio: 'PR-004', origen: 'Huanusco, Zacatecas', rfc: 'HEIR880206XXX', huerta: null, kilos: '1,100 kg', active: false },
  { nombres: 'Miguel Ángel', apellidos: 'Torres', folio: 'PR-005', origen: 'Calvillo, Aguascalientes', rfc: 'TOMM820331XXX', huerta: null, kilos: '640 kg', active: true },
  { nombres: 'Leticia', apellidos: 'Pérez Silva', folio: 'PR-006', origen: 'Jalpa, Zacatecas', rfc: 'PESL920108XXX', huerta: null, kilos: '890 kg', active: true },
];
const producerFullName = (producer: Producer) => `${producer.nombres} ${producer.apellidos}`;

const demoOrchards: Orchard[] = [
  { name: 'La Esperanza', folio: 'HRT-001', producer: 'José Martínez López', hectares: 8.5, tenure: 'Propia', latitude: 19.420, longitude: -102.060, active: true },
  { name: 'El Guayabal', folio: 'HRT-002', producer: 'María Elena González', hectares: 5.2, tenure: 'Rentada', latitude: 19.350, longitude: -102.200, active: true },
  { name: 'Los Laureles', folio: 'HRT-003', producer: 'Roberto Díaz Ramírez', hectares: 12, tenure: 'Propia', latitude: 19.510, longitude: -102.320, active: true },
  { name: 'La Palma', folio: 'HRT-004', producer: 'Miguel Ángel Torres', hectares: 6.8, tenure: 'Rentada', latitude: 19.280, longitude: -101.980, active: true },
];

function OrchardScreen({ compact }: { compact: boolean }) {
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
      <View style={dashboardStyles.mapHeading}><View><Text style={dashboardStyles.panelTitle}>Ubicación de huertas</Text><Text style={dashboardStyles.panelSubtitle}>Localiza cada predio por sus coordenadas.</Text></View><View style={dashboardStyles.mapLegend}><View style={dashboardStyles.legendDot} /><Text style={dashboardStyles.mapLegendText}>{visible.length} huertas</Text></View></View>
      <OrchardMap orchards={visible} selectedFolio={selectedFolio} onSelect={setSelectedFolio} />
      {orchards.find((item) => item.folio === selectedFolio) && <View style={dashboardStyles.selectedOrchard}><View style={dashboardStyles.mapPinMini}><Text style={dashboardStyles.mapPinMiniText}>⌖</Text></View><View style={dashboardStyles.selectedOrchardCopy}><Text style={dashboardStyles.producerName}>{orchards.find((item) => item.folio === selectedFolio)?.name}</Text><Text style={dashboardStyles.producerMeta}>{orchards.find((item) => item.folio === selectedFolio)?.latitude.toFixed(4)}, {orchards.find((item) => item.folio === selectedFolio)?.longitude.toFixed(4)} · {orchards.find((item) => item.folio === selectedFolio)?.producer}</Text></View><Text style={dashboardStyles.producerKilos}>{orchards.find((item) => item.folio === selectedFolio)?.hectares} ha</Text></View>}
    </View>

    <Modal visible={modalOpen} transparent animationType="fade" onRequestClose={() => setModalOpen(false)}><View style={dashboardStyles.modalBackdrop}><ScrollView contentContainerStyle={dashboardStyles.orchardModalScroll}><View style={dashboardStyles.formCard}><Text style={dashboardStyles.panelTitle}>{editing ? 'Editar huerta' : 'Nueva huerta'}</Text><Text style={dashboardStyles.modalDescription}>Registra el predio y su ubicación para mantenerlo en el mapa.</Text><Text style={dashboardStyles.formLabel}>Nombre de la huerta</Text><TextInput value={name} onChangeText={setName} placeholder="Ej. La Esperanza" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.formLabel}>Productor registrado</Text><View style={dashboardStyles.producerPicker}>{initialProducers.filter((item) => item.active).map((item) => { const fullName = producerFullName(item); return <Pressable key={item.folio} onPress={() => setProducer(fullName)} style={[dashboardStyles.producerChoice, producer === fullName && dashboardStyles.producerChoiceSelected]}><Text style={[dashboardStyles.producerChoiceText, producer === fullName && dashboardStyles.producerChoiceTextSelected]}>{fullName}</Text></Pressable>; })}</View><Text style={dashboardStyles.formLabel}>Tenencia del predio</Text><View style={dashboardStyles.tenurePicker}>{(['Propia', 'Rentada'] as const).map((value) => <Pressable key={value} onPress={() => setTenure(value)} style={[dashboardStyles.tenureOption, tenure === value && dashboardStyles.tenureOptionSelected]}><Text style={[dashboardStyles.tenureOptionText, tenure === value && dashboardStyles.tenureOptionTextSelected]}>{value === 'Propia' ? '⌂  Propiedad' : '▤  Rentada'}</Text></Pressable>)}</View><Text style={dashboardStyles.formLabel}>Superficie (hectáreas)</Text><TextInput value={hectares} onChangeText={setHectares} keyboardType="decimal-pad" placeholder="Ej. 8.5" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.formLabel}>Coordenadas del predio</Text><View style={dashboardStyles.coordinateRow}><TextInput value={latitude} onChangeText={setLatitude} keyboardType="decimal-pad" placeholder="Latitud" placeholderTextColor="#86868b" style={[dashboardStyles.formInput, dashboardStyles.coordinateInput]} /><TextInput value={longitude} onChangeText={setLongitude} keyboardType="decimal-pad" placeholder="Longitud" placeholderTextColor="#86868b" style={[dashboardStyles.formInput, dashboardStyles.coordinateInput]} /></View><Text style={dashboardStyles.modalHint}>Ejemplo para Michoacán: 19.4200, -102.0600</Text><View style={dashboardStyles.formActions}><Pressable onPress={() => setModalOpen(false)}><Text style={dashboardStyles.cancelText}>Cancelar</Text></Pressable><Pressable onPress={saveOrchard} style={dashboardStyles.newButton}><Text style={dashboardStyles.newButtonText}>Guardar huerta</Text></Pressable></View></View></ScrollView></View></Modal>
  </ScrollView>;
}

function ProducerScreen({ compact }: { compact: boolean }) {
  const [producers, setProducers] = useState(initialProducers);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Todos' | 'Activos' | 'Inactivos'>('Todos');
  const [editing, setEditing] = useState<Producer | null>(null);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [origen, setOrigen] = useState('');
  const [rfc, setRfc] = useState('');
  const fullName = (producer: Producer) => `${producer.nombres} ${producer.apellidos}`;
  const visible = producers.filter((producer) => {
    const matchesQuery = `${fullName(producer)} ${producer.folio} ${producer.origen} ${producer.rfc}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (filter === 'Todos' || producer.active === (filter === 'Activos'));
  });
  const openForm = (producer?: Producer) => {
    setEditing(producer ?? { nombres: '', apellidos: '', folio: `PR-${String(producers.length + 1).padStart(3, '0')}`, origen: '', rfc: '', huerta: null, kilos: '0 kg', active: true });
    setNombres(producer?.nombres ?? ''); setApellidos(producer?.apellidos ?? ''); setOrigen(producer?.origen ?? ''); setRfc(producer?.rfc ?? '');
  };
  const save = () => {
    if (!nombres.trim() || !apellidos.trim() || !origen.trim() || !rfc.trim() || !editing) { Alert.alert('Completa los datos', 'Nombre, apellidos, lugar de origen y RFC son obligatorios. La huerta se puede agregar después.'); return; }
    const saved = { ...editing, nombres: nombres.trim(), apellidos: apellidos.trim(), origen: origen.trim(), rfc: rfc.trim().toUpperCase() };
    setProducers((current) => editing.nombres ? current.map((item) => item.folio === editing.folio ? saved : item) : [...current, saved]);
    setEditing(null);
  };

  return <ScrollView contentContainerStyle={[dashboardStyles.producerContent, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
    <View style={[dashboardStyles.producerHeading, compact && dashboardStyles.producerHeadingCompact]}>
      <View style={dashboardStyles.welcomeCopy}><Text style={dashboardStyles.eyebrow}>MI EMPAQUE</Text><Text style={[dashboardStyles.producerTitle, compact && dashboardStyles.producerTitleCompact]}>Productores</Text><Text style={dashboardStyles.subtitle}>Las personas que hacen crecer tu empaque.</Text></View>
      <View style={dashboardStyles.welcomeActions}>
        <Pressable style={dashboardStyles.exportButton} onPress={() => Alert.alert('Exportar productores', 'La exportación estará disponible al conectar los datos del empaque.')}><Text style={dashboardStyles.exportText}>⇩  Exportar</Text></Pressable>
        <Pressable style={dashboardStyles.newButton} onPress={() => openForm()}><Text style={dashboardStyles.newButtonText}>＋  Nuevo productor</Text></Pressable>
      </View>
    </View>
    <View style={dashboardStyles.producerStats}>
      <View style={[dashboardStyles.producerStatCard, compact && dashboardStyles.producerStatCardCompact]}><View style={dashboardStyles.statTop}><Text style={dashboardStyles.statLabel}>Productores registrados</Text><View style={dashboardStyles.statIcon}><StatGlyph name="farmers" /></View></View><Text style={dashboardStyles.statValue}>{String(producers.length).padStart(2, '0')}</Text><Text style={dashboardStyles.producerStatNote}>Datos de demostración</Text></View>
      <View style={[dashboardStyles.producerStatCard, compact && dashboardStyles.producerStatCardCompact]}><View style={dashboardStyles.statTop}><Text style={dashboardStyles.statLabel}>Registros activos</Text><View style={dashboardStyles.statIcon}><Text style={dashboardStyles.statGlyph}>✓</Text></View></View><Text style={dashboardStyles.statValue}>{String(producers.filter((item) => item.active).length).padStart(2, '0')}</Text><Text style={dashboardStyles.producerStatNote}>Datos de demostración</Text></View>
    </View>
    <View style={[dashboardStyles.producerToolbar, compact && dashboardStyles.producerToolbarCompact]}>
      <View style={[dashboardStyles.producerSearch, compact && dashboardStyles.producerSearchCompact]}><Text style={dashboardStyles.searchGlyph}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Buscar productores..." placeholderTextColor="#86868b" style={dashboardStyles.producerSearchInput} accessibilityLabel="Buscar productores" /></View>
      <Pressable style={dashboardStyles.filterButton} onPress={() => setFilter((current) => current === 'Todos' ? 'Activos' : current === 'Activos' ? 'Inactivos' : 'Todos')}><Text style={dashboardStyles.filterText}>{filter}  ⌄</Text></Pressable>
    </View>
    {compact ? <View style={dashboardStyles.producerCards}>{visible.map((producer) => <View key={producer.folio} style={dashboardStyles.producerCard}><View style={dashboardStyles.producerMobileHeading}><View style={dashboardStyles.producerAvatar}><Text style={dashboardStyles.producerInitials}>{`${producer.nombres[0] ?? ''}${producer.apellidos[0] ?? ''}`}</Text></View><View style={dashboardStyles.producerMobileCopy}><Text style={dashboardStyles.producerName}>{fullName(producer)}</Text><Text style={dashboardStyles.producerMeta}>{producer.folio} · {producer.origen}</Text><Text style={dashboardStyles.producerMeta}>RFC {producer.rfc} · {producer.huerta ?? 'Sin huerta asignada'}</Text></View><Text style={[dashboardStyles.statusBadge, producer.active ? dashboardStyles.statusActive : dashboardStyles.statusInactive]}>{producer.active ? 'Activo' : 'Inactivo'}</Text></View><View style={dashboardStyles.producerMobileFooter}><Text style={dashboardStyles.producerKilos}>{producer.kilos} recibidos</Text><Pressable accessibilityLabel={`Editar a ${fullName(producer)}`} onPress={() => openForm(producer)}><ActionGlyph name="edit" /></Pressable><Pressable accessibilityLabel={`Eliminar a ${fullName(producer)}`} onPress={() => setProducers((current) => current.filter((item) => item.folio !== producer.folio))}><ActionGlyph name="delete" /></Pressable></View></View>)}</View> : <ScrollView horizontal showsHorizontalScrollIndicator><View style={dashboardStyles.producerTable}><View style={[dashboardStyles.producerTableRow, dashboardStyles.producerTableHeader]}><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnName, dashboardStyles.tableHeading]}>NOMBRE</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnFolio, dashboardStyles.tableHeading]}>FOLIO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnLocation, dashboardStyles.tableHeading]}>ORIGEN / HUERTA</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnRfc, dashboardStyles.tableHeading]}>RFC</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnKilos, dashboardStyles.tableHeading]}>KILOS RECIBIDOS</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnStatus, dashboardStyles.tableHeading]}>ESTADO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnActions, dashboardStyles.tableHeading]}>ACCIONES</Text></View>{visible.map((producer) => <View key={producer.folio} style={dashboardStyles.producerTableRow}><View style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnName, dashboardStyles.producerNameCell]}><View style={dashboardStyles.producerAvatar}><Text style={dashboardStyles.producerInitials}>{`${producer.nombres[0] ?? ''}${producer.apellidos[0] ?? ''}`}</Text></View><Text style={dashboardStyles.producerName}>{fullName(producer)}</Text></View><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnFolio, dashboardStyles.producerMeta]}>{producer.folio}</Text><View style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnLocation]}><Text style={dashboardStyles.producerMeta}>{producer.origen}</Text><Text style={dashboardStyles.producerSubMeta}>{producer.huerta ?? 'Sin huerta asignada'}</Text></View><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnRfc, dashboardStyles.producerMeta]}>{producer.rfc}</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnKilos, dashboardStyles.producerName]}>{producer.kilos}</Text><View style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnStatus]}><Text style={[dashboardStyles.statusBadge, producer.active ? dashboardStyles.statusActive : dashboardStyles.statusInactive]}>{producer.active ? 'Activo' : 'Inactivo'}</Text></View><View style={[dashboardStyles.producerColumn, dashboardStyles.producerColumnActions]}><Pressable accessibilityLabel={`Editar a ${fullName(producer)}`} onPress={() => openForm(producer)}><ActionGlyph name="edit" /></Pressable><Pressable accessibilityLabel={`Eliminar a ${fullName(producer)}`} onPress={() => setProducers((current) => current.filter((item) => item.folio !== producer.folio))}><ActionGlyph name="delete" /></Pressable></View></View>)}</View></ScrollView>}
    {visible.length === 0 && <Text style={dashboardStyles.emptyText}>No hay productores que coincidan con la búsqueda.</Text>}
    <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}><View style={dashboardStyles.modalBackdrop}><ScrollView style={dashboardStyles.formScroll} contentContainerStyle={dashboardStyles.formScrollContent} keyboardShouldPersistTaps="handled"><View style={dashboardStyles.formCard}><Text style={dashboardStyles.panelTitle}>{editing?.nombres ? 'Editar productor' : 'Nuevo productor'}</Text><Text style={dashboardStyles.formHint}>La huerta se puede asignar más adelante.</Text><Text style={dashboardStyles.formLabel}>Nombre(s)</Text><TextInput value={nombres} onChangeText={setNombres} placeholder="Nombre(s)" placeholderTextColor="#86868b" style={dashboardStyles.formInput} autoCapitalize="words" /><Text style={dashboardStyles.formLabel}>Apellidos</Text><TextInput value={apellidos} onChangeText={setApellidos} placeholder="Apellidos" placeholderTextColor="#86868b" style={dashboardStyles.formInput} autoCapitalize="words" /><Text style={dashboardStyles.formLabel}>¿De dónde es?</Text><TextInput value={origen} onChangeText={setOrigen} placeholder="Localidad, estado" placeholderTextColor="#86868b" style={dashboardStyles.formInput} autoCapitalize="words" /><Text style={dashboardStyles.formLabel}>RFC</Text><TextInput value={rfc} onChangeText={setRfc} placeholder="RFC del productor" placeholderTextColor="#86868b" style={dashboardStyles.formInput} autoCapitalize="characters" maxLength={13} /><View style={dashboardStyles.formActions}><Pressable onPress={() => setEditing(null)}><Text style={dashboardStyles.cancelText}>Cancelar</Text></Pressable><Pressable onPress={save} style={dashboardStyles.newButton}><Text style={dashboardStyles.newButtonText}>Guardar productor</Text></Pressable></View></View></ScrollView></View></Modal>
  </ScrollView>;
}

type PaymentStatus = 'Pendiente' | 'Pagado';
type Payment = { folio: string; producerFolio: string; orchard: string; amount: number; date: string; status: PaymentStatus };
const initialPayments: Payment[] = [
  { folio: 'PAG-001', producerFolio: 'PR-001', orchard: 'La Esperanza', amount: 22500, date: '03 oct, 2026', status: 'Pendiente' },
  { folio: 'PAG-002', producerFolio: 'PR-002', orchard: 'Los Pinos', amount: 17640, date: '02 oct, 2026', status: 'Pendiente' },
  { folio: 'PAG-003', producerFolio: 'PR-003', orchard: 'Sin huerta asignada', amount: 16260, date: '01 oct, 2026', status: 'Pendiente' },
  { folio: 'PAG-004', producerFolio: 'PR-004', orchard: 'El Encino', amount: 16260, date: '30 sep, 2026', status: 'Pendiente' },
  { folio: 'PAG-005', producerFolio: 'PR-005', orchard: 'La Palma', amount: 16260, date: '29 sep, 2026', status: 'Pendiente' },
  { folio: 'PAG-006', producerFolio: 'PR-006', orchard: 'Los Pinos', amount: 17940, date: '28 sep, 2026', status: 'Pagado' },
];
const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-MX')} MXN`;

function PaymentScreen({ compact }: { compact: boolean }) {
  const [payments, setPayments] = useState(initialPayments);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Todos' | PaymentStatus>('Todos');
  const [editing, setEditing] = useState<Payment | null>(null);
  const [producerFolio, setProducerFolio] = useState('PR-001');
  const [orchard, setOrchard] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('Pendiente');
  const pending = payments.filter((payment) => payment.status === 'Pendiente');
  const visible = payments.filter((payment) => {
    const producer = initialProducers.find((item) => item.folio === payment.producerFolio);
    const matches = `${producer ? producerFullName(producer) : ''} ${payment.folio} ${payment.orchard}`.toLowerCase().includes(query.toLowerCase());
    return matches && (filter === 'Todos' || payment.status === filter);
  });
  const openForm = (payment?: Payment) => {
    const nextFolio = Math.max(0, ...payments.map((item) => Number(item.folio.split('-')[1]) || 0)) + 1;
    setEditing(payment ?? { folio: `PAG-${String(nextFolio).padStart(3, '0')}`, producerFolio: initialProducers[0].folio, orchard: '', amount: 0, date: '', status: 'Pendiente' });
    setProducerFolio(payment?.producerFolio ?? initialProducers[0].folio);
    setOrchard(payment?.orchard === 'Sin huerta asignada' ? '' : payment?.orchard ?? '');
    setAmount(payment ? String(payment.amount) : '');
    setDate(payment?.date ?? new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }));
    setStatus(payment?.status ?? 'Pendiente');
  };
  const save = () => {
    const parsedAmount = Number(amount.replace(/[,$\s]/g, ''));
    if (!editing || !producerFolio || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !date.trim()) {
      Alert.alert('Revisa los datos', 'Selecciona un productor e ingresa un importe mayor a cero y una fecha.');
      return;
    }
    const saved: Payment = { ...editing, producerFolio, orchard: orchard.trim() || 'Sin huerta asignada', amount: parsedAmount, date: date.trim(), status };
    setPayments((items) => items.some((item) => item.folio === editing.folio) ? items.map((item) => item.folio === editing.folio ? saved : item) : [...items, saved]);
    setEditing(null);
  };
  const producerName = (payment: Payment) => {
    const producer = initialProducers.find((item) => item.folio === payment.producerFolio);
    return producer ? producerFullName(producer) : 'Productor eliminado';
  };
  const statusStyle = (value: PaymentStatus) => value === 'Pagado' ? dashboardStyles.paymentPaid : dashboardStyles.paymentPending;
  const removePayment = (payment: Payment) => Alert.alert('Eliminar pago', `¿Quieres eliminar el pago ${payment.folio}?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => setPayments((items) => items.filter((item) => item.folio !== payment.folio)) },
  ]);

  return <ScrollView contentContainerStyle={[dashboardStyles.producerContent, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
    <View style={[dashboardStyles.producerHeading, compact && dashboardStyles.producerHeadingCompact]}>
      <View style={dashboardStyles.welcomeCopy}><Text style={dashboardStyles.eyebrow}>MI EMPAQUE</Text><Text style={[dashboardStyles.producerTitle, compact && dashboardStyles.producerTitleCompact]}>Pagos a productores</Text><Text style={dashboardStyles.subtitle}>Cuentas claras. Relaciones que crecen.</Text></View>
      <View style={dashboardStyles.welcomeActions}><Pressable style={dashboardStyles.exportButton} onPress={() => Alert.alert('Exportar pagos', 'La exportación estará disponible al conectar los datos del empaque.')}><Text style={dashboardStyles.exportText}>⇩  Exportar</Text></Pressable><Pressable style={dashboardStyles.newButton} onPress={() => openForm()}><Text style={dashboardStyles.newButtonText}>＋  Nuevo pago</Text></Pressable></View>
    </View>

    <View style={dashboardStyles.paymentStats}>
      <PaymentMetric compact={compact} label="Pendiente de pago" value={formatCurrency(pending.reduce((sum, payment) => sum + payment.amount, 0))} note="Datos de demostración" icon="wallet" />
      <PaymentMetric compact={compact} label="Productores por liquidar" value={String(new Set(pending.map((payment) => payment.producerFolio)).size)} note="Con pagos pendientes" icon="farmers" />
      <PaymentMetric compact={compact} label="Pagos realizados" value={String(payments.filter((payment) => payment.status === 'Pagado').length)} note="Datos de demostración" icon="check" />
      <PaymentMetric compact={compact} label="Precio de ejemplo / kg" value="$18 MXN" note="Referencia de demostración" icon="orchards" />
    </View>

    <View style={[dashboardStyles.producerToolbar, compact && dashboardStyles.producerToolbarCompact]}>
      <View style={[dashboardStyles.producerSearch, compact && dashboardStyles.producerSearchCompact]}><Text style={dashboardStyles.searchGlyph}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Buscar pagos..." placeholderTextColor="#86868b" style={dashboardStyles.producerSearchInput} accessibilityLabel="Buscar pagos" /></View>
      <Pressable style={dashboardStyles.filterButton} onPress={() => setFilter((value) => value === 'Todos' ? 'Pendiente' : value === 'Pendiente' ? 'Pagado' : 'Todos')}><Text style={dashboardStyles.filterText}>{filter}  ⌄</Text></Pressable>
    </View>

    {compact ? <View style={dashboardStyles.producerCards}>{visible.map((payment) => <View key={payment.folio} style={dashboardStyles.producerCard}><View style={dashboardStyles.producerMobileHeading}><View style={dashboardStyles.producerAvatar}><Text style={dashboardStyles.producerInitials}>{producerName(payment).split(' ').slice(0, 2).map((word) => word[0]).join('')}</Text></View><View style={dashboardStyles.producerMobileCopy}><Text style={dashboardStyles.producerName}>{producerName(payment)}</Text><Text style={dashboardStyles.producerMeta}>{payment.folio} · {payment.orchard}</Text><Text style={dashboardStyles.producerMeta}>{payment.date}</Text></View><Text style={[dashboardStyles.statusBadge, statusStyle(payment.status)]}>{payment.status}</Text></View><View style={dashboardStyles.paymentMobileFooter}><Text style={dashboardStyles.paymentAmount}>{formatCurrency(payment.amount)}</Text><Pressable accessibilityRole="button" onPress={() => openForm(payment)}><ActionGlyph name="edit" /></Pressable><Pressable accessibilityRole="button" onPress={() => removePayment(payment)}><ActionGlyph name="delete" /></Pressable>{payment.status === 'Pendiente' && <Pressable style={dashboardStyles.registerPaymentButton} onPress={() => setPayments((items) => items.map((item) => item.folio === payment.folio ? { ...item, status: 'Pagado' } : item))}><Text style={dashboardStyles.registerPaymentText}>Registrar pago</Text></Pressable>}</View></View>)}</View> : <ScrollView horizontal showsHorizontalScrollIndicator><View style={dashboardStyles.paymentTable}><View style={[dashboardStyles.producerTableRow, dashboardStyles.producerTableHeader]}><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentNameCol, dashboardStyles.tableHeading]}>NOMBRE</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentFolioCol, dashboardStyles.tableHeading]}>FOLIO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentOrchardCol, dashboardStyles.tableHeading]}>UBICACIÓN / HUERTA</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentAmountCol, dashboardStyles.tableHeading]}>IMPORTE</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentStatusCol, dashboardStyles.tableHeading]}>ESTADO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentActionsCol, dashboardStyles.tableHeading]}>ACCIONES</Text></View>{visible.map((payment) => <View key={payment.folio} style={dashboardStyles.producerTableRow}><View style={[dashboardStyles.producerColumn, dashboardStyles.paymentNameCol, dashboardStyles.producerNameCell]}><View style={dashboardStyles.producerAvatar}><Text style={dashboardStyles.producerInitials}>{producerName(payment).split(' ').slice(0, 2).map((word) => word[0]).join('')}</Text></View><Text style={dashboardStyles.producerName}>{producerName(payment)}</Text></View><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentFolioCol, dashboardStyles.producerMeta]}>{payment.folio}</Text><View style={[dashboardStyles.producerColumn, dashboardStyles.paymentOrchardCol]}><Text style={dashboardStyles.producerMeta}>{payment.orchard}</Text><Text style={dashboardStyles.producerSubMeta}>{payment.date}</Text></View><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentAmountCol, dashboardStyles.producerName]}>{formatCurrency(payment.amount)}</Text><View style={[dashboardStyles.producerColumn, dashboardStyles.paymentStatusCol]}><Text style={[dashboardStyles.statusBadge, statusStyle(payment.status)]}>{payment.status}</Text></View><View style={[dashboardStyles.producerColumn, dashboardStyles.paymentActionsCol]}>{payment.status === 'Pendiente' && <Pressable style={dashboardStyles.registerPaymentButton} onPress={() => setPayments((items) => items.map((item) => item.folio === payment.folio ? { ...item, status: 'Pagado' } : item))}><Text style={dashboardStyles.registerPaymentText}>Registrar pago</Text></Pressable>}<Pressable accessibilityLabel={`Editar pago ${payment.folio}`} onPress={() => openForm(payment)}><ActionGlyph name="edit" /></Pressable><Pressable accessibilityLabel={`Eliminar pago ${payment.folio}`} onPress={() => removePayment(payment)}><ActionGlyph name="delete" /></Pressable></View></View>)}</View></ScrollView>}
    {visible.length === 0 && <Text style={dashboardStyles.emptyText}>No hay pagos que coincidan con la búsqueda.</Text>}

    <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}><View style={dashboardStyles.modalBackdrop}><ScrollView style={dashboardStyles.formScroll} contentContainerStyle={dashboardStyles.formScrollContent} keyboardShouldPersistTaps="handled"><View style={dashboardStyles.formCard}><Text style={dashboardStyles.panelTitle}>{payments.some((payment) => payment.folio === editing?.folio) ? 'Editar pago' : 'Crear pago'}</Text><Text style={dashboardStyles.formHint}>Elige al productor y registra el importe del pago.</Text><Text style={dashboardStyles.fieldLabel}>Productor</Text><View style={dashboardStyles.paymentProducerOptions}>{initialProducers.map((producer) => <Pressable key={producer.folio} onPress={() => setProducerFolio(producer.folio)} style={[dashboardStyles.paymentProducerOption, producerFolio === producer.folio && dashboardStyles.paymentProducerOptionSelected]}><Text style={[dashboardStyles.paymentProducerOptionText, producerFolio === producer.folio && dashboardStyles.paymentProducerOptionTextSelected]}>{producerFullName(producer)}</Text></Pressable>)}</View><Text style={dashboardStyles.fieldLabel}>Huerta (opcional)</Text><TextInput value={orchard} onChangeText={setOrchard} placeholder="Nombre de la huerta o déjalo vacío" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.fieldLabel}>Importe (MXN)</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Ej. 22500" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.fieldLabel}>Fecha</Text><TextInput value={date} onChangeText={setDate} placeholder="Ej. 03 oct, 2026" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.fieldLabel}>Estado del pago</Text><View style={dashboardStyles.paymentStatusOptions}>{(['Pendiente', 'Pagado'] as PaymentStatus[]).map((value) => <Pressable key={value} onPress={() => setStatus(value)} style={[dashboardStyles.paymentStatusOption, status === value && dashboardStyles.paymentStatusOptionSelected]}><Text style={[dashboardStyles.paymentStatusOptionText, status === value && dashboardStyles.paymentStatusOptionTextSelected]}>{value}</Text></Pressable>)}</View><View style={dashboardStyles.formActions}><Pressable onPress={() => setEditing(null)}><Text style={dashboardStyles.cancelText}>Cancelar</Text></Pressable><Pressable onPress={save} style={dashboardStyles.newButton}><Text style={dashboardStyles.newButtonText}>Guardar pago</Text></Pressable></View></View></ScrollView></View></Modal>
  </ScrollView>;
}

function PaymentMetric({ compact, label, value, note, icon }: { compact: boolean; label: string; value: string; note: string; icon: 'wallet' | 'farmers' | 'check' | 'orchards' }) {
  return <View style={[dashboardStyles.paymentMetric, compact && dashboardStyles.paymentMetricCompact]}><View style={dashboardStyles.statTop}><Text style={dashboardStyles.statLabel}>{label}</Text><View style={dashboardStyles.statIcon}>{icon === 'check' ? <Text style={dashboardStyles.statGlyph}>✓</Text> : <StatGlyph name={icon} />}</View></View><Text numberOfLines={1} adjustsFontSizeToFit style={dashboardStyles.statValue}>{value}</Text><Text style={dashboardStyles.producerStatNote}>{note}</Text></View>;
}

function NotificationBell() {
  return (
    <View style={dashboardStyles.notificationBellIcon}>
      <Svg width={20} height={20} viewBox="0 0 24 24">
        <Path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" fill="none" stroke="#f5f5f7" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </View>
  );
}

function ActionGlyph({ name }: { name: 'edit' | 'delete' }) {
  const common = { stroke: '#f5f5f7', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' as const };
  return <View style={dashboardStyles.actionGlyph}><Svg width={18} height={18} viewBox="0 0 24 24">{name === 'edit' ? <Path {...common} d="m14 5 5 5M4 20l4.2-.9L19 8.3a2.1 2.1 0 0 0-3-3L5.2 16.1 4 20Z" /> : <><Path {...common} d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" /></>}</Svg></View>;
}

function NavGlyph({ name, active = false }: { name: string; active?: boolean }) {
  const color = active ? '#f5f5f7' : '#86868b';
  const common = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <View style={dashboardStyles.navGlyphBox}>
      <Svg width={20} height={20} viewBox="0 0 24 24">
        {name === 'overview' && <><Path {...common} d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></>}
        {name === 'producers' && <><Circle {...common} cx="9" cy="8" r="3" /><Path {...common} d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h1a5.5 5.5 0 0 1 5.5 5.5V20M16 5.5a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.5V20" /></>}
        {name === 'orchards' && <><Path {...common} d="M12 20v-8M12 12C6 12 5 8 5 5c4 0 7 1 7 7ZM12 14c0-5 3-8 8-8 0 5-2 8-8 8ZM5 20h14" /></>}
        {name === 'shipments' && <><Path {...common} d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><Circle {...common} cx="7" cy="19" r="1.5" /><Circle {...common} cx="18" cy="19" r="1.5" /></>}
        {name === 'payments' && <><RectIcon common={common} /><Path {...common} d="M3 9h18M16 14h2M5 5h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></>}
        {name === 'reports' && <><Path {...common} d="M4 19h16M6 16v-4M10 16V8M14 16v-6M18 16V5" /></>}
        {name === 'users' && <><Circle {...common} cx="9" cy="8" r="3" /><Path {...common} d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h1a5.5 5.5 0 0 1 5.5 5.5V20M16 5.5a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.5V20" /></>}
      </Svg>
    </View>
  );
}

function RectIcon({ common }: { common: { stroke: string; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round'; fill: string } }) {
  return <Path {...common} d="M4 5h16v14H4z" />;
}

function StatGlyph({ name }: { name: string }) {
  const color = name === 'wallet' ? '#f2bd58' : name === 'farmers' ? '#e89a9a' : '#f5f5f7';
  const common = { stroke: color, strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      {name === 'weight' && <><Path {...common} d="M12 4v15M5 7h14M7 7l-4 8h8L7 7ZM17 7l-4 8h8l-4-8ZM8 20h8" /></>}
      {name === 'truck' && <><Path {...common} d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><Circle {...common} cx="7" cy="19" r="1.7" /><Circle {...common} cx="18" cy="19" r="1.7" /></>}
      {name === 'wallet' && <><Path {...common} d="M4 6.5A2.5 2.5 0 0 1 6.5 4H20v15H6.5A2.5 2.5 0 0 1 4 16.5zM4 7h14a2 2 0 0 1 2 2v2h-6a2.5 2.5 0 0 0 0 5h6" /><Circle cx="14" cy="13.5" r=".8" fill={color} /></>}
      {name === 'farmers' && <><Circle {...common} cx="9" cy="8" r="3" /><Path {...common} d="M3.5 20v-1.5A5.5 5.5 0 0 1 9 13h1a5.5 5.5 0 0 1 5.5 5.5V20M16 5.5a3 3 0 0 1 0 5.8M17 14a4.5 4.5 0 0 1 3.5 4.5V20" /></>}
    </Svg>
  );
}

function ReceptionChart() {
  const points = [104, 76, 88, 53, 69, 27, 39];
  const xPositions = [42, 130, 218, 306, 394, 482, 570];
  const coords = points.map((y, index) => `${xPositions[index]},${y}`).join(' ');
  return (
    <View style={dashboardStyles.chartWrap}>
      <View style={dashboardStyles.chartTotalRow}>
        <Text style={dashboardStyles.chartTotal}>48,650 <Text style={dashboardStyles.chartTotalUnit}>kg</Text></Text>
        <Text style={dashboardStyles.chartGrowth}>↗ 12.8% <Text style={dashboardStyles.chartGrowthMuted}>vs. semana anterior</Text></Text>
      </View>
      <Svg width="100%" height={220} viewBox="0 0 610 220" preserveAspectRatio="none">
        <Defs><LinearGradient id="receptionArea" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#0071e3" stopOpacity="0.2" /><Stop offset="1" stopColor="#0071e3" stopOpacity="0" /></LinearGradient></Defs>
        {[30, 75, 120, 165, 210].map((y, index) => <g key={y}><Line x1="42" y1={y} x2="596" y2={y} stroke="#333336" strokeDasharray="3 5" strokeWidth="1" /><SvgText x="31" y={y + 3} fill="#86868b" fontSize="9" textAnchor="end">{['10k', '7.5k', '5k', '2.5k', '0'][index]}</SvgText></g>)}
        <Path d={`M ${coords} L 570 210 L 42 210 Z`} fill="url(#receptionArea)" />
        <Path d="M 42 104 C 75 92, 99 76, 130 76 S 190 94, 218 88 S 280 47, 306 53 S 370 78, 394 69 S 456 25, 482 27 S 548 34, 570 39" fill="none" stroke="#2997ff" strokeWidth="2.4" strokeLinecap="round" />
        <Line x1="482" y1="27" x2="482" y2="210" stroke="#86868b" strokeWidth="1" />
        <Circle cx="482" cy="27" r="5" fill="#0071e3" stroke="#ffffff" strokeWidth="2" />
        <Path d="M 387 144 h 105 a 8 8 0 0 1 8 8 v 43 h -113 a 8 8 0 0 1 -8 -8 v -35 a 8 8 0 0 1 8 -8" fill="#1d1d1f" stroke="#333336" />
        <SvgText x="400" y="164" fill="#f5f5f7" fontSize="10">Sáb</SvgText>
        <SvgText x="400" y="182" fill="#2997ff" fontSize="9">Recepción: 9,200 kg</SvgText>
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, index) => <SvgText key={day} x={xPositions[index]} y="218" fill="#86868b" fontSize="9" textAnchor="middle">{day}</SvgText>)}
      </Svg>
      <View style={dashboardStyles.chartLegend}><View style={dashboardStyles.legendDot} /><Text style={dashboardStyles.legendText}>Kilos recibidos</Text></View>
    </View>
  );
}

function ShipmentRow({ name, detail, progress }: { name: string; detail: string; progress: `${number}%` }) {
  return (
    <View style={dashboardStyles.shipmentRow}>
      <View style={dashboardStyles.shipmentIcon}><Text style={dashboardStyles.navIcon}>▣</Text></View>
      <View style={dashboardStyles.shipmentCopy}><Text style={dashboardStyles.shipmentName}>{name}</Text><Text style={dashboardStyles.shipmentDetail}>{detail}</Text><View style={dashboardStyles.progressTrack}><View style={[dashboardStyles.progressFill, { width: progress }]} /></View></View>
      <Text style={dashboardStyles.progressText}>{progress}</Text>
    </View>
  );
}

const dashboardStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  shell: { flex: 1, flexDirection: 'row', backgroundColor: '#000000' },
  sidebar: { width: 236, backgroundColor: '#080808', borderRightWidth: 1, borderRightColor: '#292929', paddingHorizontal: 20, paddingTop: 20 },
  sidebarCollapsed: { width: 76, paddingHorizontal: 12 },
  brand: { height: 50, flexDirection: 'row', alignItems: 'center', marginBottom: 26 },
  brandCollapsed: { justifyContent: 'center' },
  brandCompact: { flexDirection: 'row', alignItems: 'center' },
  brandLogo: { width: 188, height: 48 },
  brandLogoCollapsed: { width: 44, height: 44, borderRadius: 10, backgroundColor: '#f5f5f7' },
  brandLogoCompact: { width: 174, height: 44 },
  brandMark: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#f5f5f7', alignItems: 'center', justifyContent: 'center' },
  brandLeaf: { color: '#1d1d1f', fontSize: 21 },
  brandName: { color: '#f5f5f7', fontSize: 23, fontWeight: '600', letterSpacing: -0.6 },
  packhouse: { minHeight: 86, borderRadius: 18, backgroundColor: '#1d1d1f', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 26 },
  packhouseIcon: { width: 34, height: 34, borderRadius: 9, backgroundColor: '#333336', alignItems: 'center', justifyContent: 'center' },
  packhouseCopy: { flex: 1, gap: 5 },
  packhouseName: { color: '#f5f5f7', fontSize: 12, fontWeight: '600' },
  packhousePlace: { color: '#86868b', fontSize: 11, lineHeight: 16 },
  chevron: { color: '#86868b' },
  navSection: { color: '#86868b', fontSize: 10, letterSpacing: 0.6, marginHorizontal: 12, marginBottom: 12 },
  navList: { gap: 4 },
  navItem: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 12, borderRadius: 999, marginBottom: 2 },
  navItemCollapsed: { justifyContent: 'center', paddingHorizontal: 0 },
  navItemActive: { backgroundColor: '#333336' },
  navIcon: { color: '#86868b', width: 18, textAlign: 'center', fontSize: 16 },
  navGlyphBox: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { color: '#f5f5f7' },
  navLabel: { color: '#cccccc', fontSize: 13, flex: 1 },
  navLabelActive: { color: '#ffffff', fontWeight: '600' },
  navCount: { color: '#cccccc', backgroundColor: '#1d1d1f', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, fontSize: 10 },
  adminSection: { marginTop: 24 },
  collapseButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, borderRadius: 999, marginTop: 16 },
  collapseGlyph: { width: 20, color: '#86868b', fontSize: 23, textAlign: 'center' },
  collapseLabel: { color: '#86868b', fontSize: 12 },
  mainArea: { flex: 1, minWidth: 0 },
  topNav: { height: 64, borderBottomWidth: 1, borderBottomColor: '#292929', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 36 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuToggle: { width: 30, height: 30, borderRadius: 9, borderWidth: 1, borderColor: '#333336', alignItems: 'center', justifyContent: 'center' },
  menuToggleText: { color: '#cccccc', fontSize: 15 },
  breadcrumbMuted: { color: '#86868b', fontSize: 11 },
  breadcrumbSlash: { color: '#424245', fontSize: 12 },
  breadcrumbActive: { color: '#f5f5f7', fontSize: 11, fontWeight: '600' },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  search: { width: 255, color: '#86868b', fontSize: 12 },
  topDivider: { width: 1, height: 26, backgroundColor: '#333336' },
  bellButton: { position: 'relative', width: 38, height: 38, borderRadius: 12, borderWidth: 1, borderColor: '#292929', backgroundColor: '#111111', alignItems: 'center', justifyContent: 'center' },
  notificationBellIcon: { alignItems: 'center', justifyContent: 'center' },
  notificationBadge: { position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, paddingHorizontal: 3, borderRadius: 8, borderWidth: 2, borderColor: '#000000', backgroundColor: '#e45858', alignItems: 'center', justifyContent: 'center' },
  notificationBadgeText: { color: '#ffffff', fontSize: 8, lineHeight: 10, fontWeight: '700' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333336', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#f5f5f7', fontSize: 11, fontWeight: '600' },
  content: { paddingHorizontal: 38, paddingTop: 44, paddingBottom: 36, width: '100%', maxWidth: 1500, alignSelf: 'center' },
  producerContent: { paddingHorizontal: 38, paddingTop: 38, paddingBottom: 36, width: '100%', maxWidth: 1500, alignSelf: 'center' },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 20 },
  reportGridCompact: { flexDirection: 'column', gap: 14 },
  reportCard: { width: '49%', minHeight: 294, borderRadius: 28, backgroundColor: '#1d1d1f', padding: 28, marginBottom: 0 },
  reportCardCompact: { width: '100%', minHeight: 270, padding: 22, borderRadius: 24 },
  reportIcon: { width: 38, height: 38, borderRadius: 20, backgroundColor: '#333336', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  reportTitle: { color: '#f5f5f7', fontSize: 21, lineHeight: 27, fontWeight: '600', letterSpacing: -0.25 },
  reportDescription: { color: '#86868b', fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 20 },
  reportDates: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  reportDatesCompact: { gap: 6 },
  reportDateInput: { flex: 1, minWidth: 0, height: 44, borderRadius: 9999, borderWidth: 1, borderColor: '#333336', paddingHorizontal: 14, color: '#f5f5f7', fontSize: 13, outlineStyle: 'none' } as any,
  reportDash: { color: '#86868b', fontSize: 13 },
  reportDownload: { minHeight: 42, alignSelf: 'flex-start', justifyContent: 'center', borderRadius: 9999, backgroundColor: '#333336', paddingHorizontal: 18, paddingVertical: 10 },
  reportDownloadText: { color: '#ffffff', fontSize: 13 },
  reportError: { color: '#f2a7a7', fontSize: 13, marginBottom: 14 },
  reportFootnote: { color: '#86868b', fontSize: 11, marginTop: 22 },
  contentCompact: { paddingHorizontal: 20, paddingTop: 28 },
  producerHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 36 },
  producerHeadingCompact: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 26 },
  producerTitle: { color: '#f5f5f7', fontSize: 48, lineHeight: 56, fontWeight: '600', letterSpacing: -1.7 },
  producerTitleCompact: { fontSize: 38, lineHeight: 44 },
  exportButton: { minHeight: 42, paddingHorizontal: 17, borderRadius: 9999, backgroundColor: '#333336', justifyContent: 'center' },
  exportText: { color: '#f5f5f7', fontSize: 12 },
  producerStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 32 },
  paymentStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 32 },
  paymentMetric: { flex: 1, minWidth: 205, minHeight: 178, borderRadius: 28, backgroundColor: '#1d1d1f', padding: 24, justifyContent: 'space-between' },
  paymentMetricCompact: { flexBasis: '46%', minWidth: 140, minHeight: 148, borderRadius: 22, padding: 16 },
  paymentTable: { minWidth: 1090 },
  paymentNameCol: { width: 265 },
  paymentFolioCol: { width: 105 },
  paymentOrchardCol: { width: 195 },
  paymentAmountCol: { width: 145 },
  paymentStatusCol: { width: 130 },
  paymentActionsCol: { width: 250, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  paymentPending: { color: '#f5b942', backgroundColor: '#382b16' },
  paymentPaid: { color: '#37d67a', backgroundColor: '#183126' },
  paymentMobileFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, flexWrap: 'wrap' },
  paymentAmount: { color: '#f5f5f7', fontSize: 14, fontWeight: '600', marginRight: 'auto' },
  registerPaymentButton: { minHeight: 36, paddingHorizontal: 13, borderRadius: 9999, backgroundColor: '#333336', alignItems: 'center', justifyContent: 'center' },
  registerPaymentText: { color: '#f5f5f7', fontSize: 10, fontWeight: '500' },
  paymentProducerOptions: { maxHeight: 130, flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  paymentProducerOption: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 9999, borderWidth: 1, borderColor: '#424245' },
  paymentProducerOptionSelected: { backgroundColor: '#333336', borderColor: '#86868b' },
  paymentProducerOptionText: { color: '#cccccc', fontSize: 11 },
  paymentProducerOptionTextSelected: { color: '#ffffff' },
  paymentStatusOptions: { flexDirection: 'row', gap: 9 },
  paymentStatusOption: { flex: 1, minHeight: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 9999, borderWidth: 1, borderColor: '#424245' },
  paymentStatusOptionSelected: { backgroundColor: '#333336', borderColor: '#86868b' },
  paymentStatusOptionText: { color: '#cccccc', fontSize: 12 },
  paymentStatusOptionTextSelected: { color: '#ffffff' },
  producerStatCard: { width: 240, minHeight: 178, borderRadius: 28, backgroundColor: '#1d1d1f', padding: 24, justifyContent: 'space-between' },
  producerStatCardCompact: { flex: 1, minWidth: 140, minHeight: 145, padding: 16, borderRadius: 22 },
  producerStatNote: { color: '#86868b', fontSize: 11, marginTop: 4 },
  producerToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22 },
  producerToolbarCompact: { flexDirection: 'column', alignItems: 'stretch', marginBottom: 16 },
  producerSearch: { height: 46, width: 320, maxWidth: '100%', borderRadius: 9999, backgroundColor: '#1d1d1f', borderWidth: 1, borderColor: '#333336', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  producerSearchCompact: { width: '100%' },
  searchGlyph: { color: '#86868b', fontSize: 20 },
  producerSearchInput: { flex: 1, color: '#f5f5f7', fontSize: 13, outlineStyle: 'none' } as any,
  orchardDetails: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingLeft: 42 },
  orchardProducerCol: { width: 230 },
  orchardHectaresCol: { width: 120 },
  orchardTenureCol: { width: 110 },
  orchardRowSelected: { backgroundColor: 'rgba(51,51,54,0.45)' },
  mapSection: { marginTop: 36, marginBottom: 24 },
  mapHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  mapLegend: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#333336', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 8 },
  mapLegendText: { color: '#cccccc', fontSize: 11 },
  mapCanvas: { width: '100%', height: 340, overflow: 'hidden', borderRadius: 20, borderWidth: 1, borderColor: '#333336', backgroundColor: '#101713' },
  selectedOrchard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderColor: '#333336', paddingHorizontal: 14, marginTop: 10 },
  mapPinMini: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1d1d1f', alignItems: 'center', justifyContent: 'center' },
  mapPinMiniText: { color: '#2997ff', fontSize: 20 },
  selectedOrchardCopy: { flex: 1, gap: 4 },
  orchardModalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20, width: '100%' },
  modalDescription: { color: '#86868b', fontSize: 12, lineHeight: 18, marginBottom: 6 },
  producerPicker: { gap: 7 },
  producerChoice: { minHeight: 38, justifyContent: 'center', borderWidth: 1, borderColor: '#424245', borderRadius: 10, paddingHorizontal: 12 },
  producerChoiceSelected: { borderColor: '#0071e3', backgroundColor: '#101d2b' },
  producerChoiceText: { color: '#cccccc', fontSize: 12 },
  producerChoiceTextSelected: { color: '#f5f5f7' },
  tenurePicker: { flexDirection: 'row', gap: 8 },
  tenureOption: { flex: 1, minHeight: 40, borderWidth: 1, borderColor: '#424245', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tenureOptionSelected: { borderColor: '#0071e3', backgroundColor: '#101d2b' },
  tenureOptionText: { color: '#86868b', fontSize: 12 },
  tenureOptionTextSelected: { color: '#f5f5f7' },
  coordinateRow: { flexDirection: 'row', gap: 10 },
  coordinateInput: { flex: 1, minWidth: 0 },
  modalHint: { color: '#86868b', fontSize: 11 },
  filterButton: { minWidth: 150, minHeight: 44, paddingHorizontal: 17, borderRadius: 9999, borderWidth: 1, borderColor: '#333336', justifyContent: 'center' },
  filterText: { color: '#f5f5f7', fontSize: 13 },
  producerTable: { minWidth: 1115 },
  shipmentTable: { minWidth: 1040 },
  shipmentDestinationCol: { width: 280 },
  shipmentFolioCol: { width: 150 },
  shipmentDateCol: { width: 135 },
  shipmentKilosCol: { width: 155 },
  shipmentStatusCol: { width: 170 },
  shipmentMobileFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12 },
  shipmentStatusText: { color: '#f5f5f7', fontSize: 11 },
  shipmentPreparing: { backgroundColor: '#3b3020' },
  shipmentReady: { backgroundColor: '#183323' },
  shipmentTransit: { backgroundColor: '#172d43' },
  shipmentDelivered: { backgroundColor: '#26312a' },
  producerTableHeader: { borderTopWidth: 1, borderTopColor: '#333336', minHeight: 48 },
  producerTableRow: { minHeight: 82, flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#333336' },
  producerColumn: { justifyContent: 'center', paddingHorizontal: 12 },
  producerColumnName: { width: 265 },
  producerColumnFolio: { width: 100 },
  producerColumnLocation: { width: 220 },
  producerColumnRfc: { width: 145 },
  producerColumnKilos: { width: 150 },
  producerColumnStatus: { width: 120 },
  producerColumnActions: { width: 115, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  tableHeading: { color: '#cccccc', fontSize: 10, letterSpacing: 0.2 },
  producerNameCell: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  producerAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#333336', alignItems: 'center', justifyContent: 'center' },
  producerInitials: { color: '#f5f5f7', fontSize: 10, fontWeight: '600' },
  producerName: { color: '#f5f5f7', fontSize: 12, fontWeight: '600' },
  producerMeta: { color: '#cccccc', fontSize: 12 },
  producerSubMeta: { color: '#86868b', fontSize: 10, marginTop: 4 },
  statusBadge: { alignSelf: 'flex-start', overflow: 'hidden', borderRadius: 9999, paddingHorizontal: 12, paddingVertical: 7, fontSize: 11 },
  statusActive: { color: '#37d67a', backgroundColor: '#1d1d1f' },
  statusInactive: { color: '#cccccc', backgroundColor: '#333336' },
  rowAction: { color: '#f5f5f7', fontSize: 18, paddingHorizontal: 8, paddingVertical: 6 },
  rowDelete: { color: '#cccccc', fontSize: 16, paddingHorizontal: 8, paddingVertical: 6 },
  actionGlyph: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  producerCards: { gap: 10 },
  producerCard: { borderTopWidth: 1, borderColor: '#333336', paddingVertical: 14, gap: 13 },
  producerMobileHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  producerMobileCopy: { flex: 1, gap: 5 },
  producerMobileFooter: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 14 },
  producerKilos: { color: '#cccccc', fontSize: 11, marginRight: 'auto' },
  emptyText: { color: '#86868b', textAlign: 'center', padding: 28 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  formScroll: { width: '100%', maxWidth: 480, maxHeight: '100%' },
  formScrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 12 },
  formCard: { width: '100%', backgroundColor: '#1d1d1f', borderRadius: 24, padding: 24, gap: 12 },
  formHint: { color: '#86868b', fontSize: 12, marginTop: -6, marginBottom: 4 },
  formLabel: { color: '#f5f5f7', fontSize: 12, marginTop: 5 },
  fieldLabel: { color: '#f5f5f7', fontSize: 12, marginTop: 5 },
  formInput: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: '#424245', backgroundColor: '#080808', color: '#f5f5f7', paddingHorizontal: 13, fontSize: 14, outlineStyle: 'none' } as any,
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 18, marginTop: 10 },
  cancelText: { color: '#cccccc', fontSize: 13 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 20, marginBottom: 34 },
  welcomeCopy: { flex: 1 },
  eyebrow: { color: '#cccccc', fontSize: 11, letterSpacing: 0.2, marginBottom: 13 },
  greeting: { color: '#f5f5f7', fontSize: 46, lineHeight: 54, fontWeight: '600', letterSpacing: -1.5 },
  greetingCompact: { fontSize: 34, lineHeight: 40 },
  sun: { color: '#f5f5f7', fontSize: 27 },
  subtitle: { color: '#86868b', fontSize: 14, marginTop: 7 },
  welcomeActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePill: { minHeight: 40, paddingHorizontal: 12, borderWidth: 1, borderColor: '#333336', borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateIcon: { color: '#86868b', fontSize: 13 },
  dateText: { color: '#f5f5f7', fontSize: 11 },
  newButton: { minHeight: 42, paddingHorizontal: 16, borderRadius: 9999, backgroundColor: '#0071e3', justifyContent: 'center' },
  newButtonText: { color: '#ffffff', fontSize: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 42 },
  statCard: { flex: 1, minWidth: 210, minHeight: 164, borderRadius: 28, backgroundColor: '#1d1d1f', padding: 24, justifyContent: 'space-between' },
  statCardCompact: { flexBasis: '46%', minWidth: 145, minHeight: 148, padding: 17 },
  statTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  statLabel: { color: '#86868b', fontSize: 12 },
  statIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333336', alignItems: 'center', justifyContent: 'center' },
  statIconGold: { backgroundColor: '#3b3020' },
  statIconRose: { backgroundColor: '#3b2426' },
  statGlyph: { color: '#f5f5f7', fontSize: 16 },
  statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 9, marginTop: 12 },
  statValue: { color: '#f5f5f7', fontSize: 34, letterSpacing: -1.1, fontWeight: '600' },
  statUnit: { color: '#86868b', fontSize: 13 },
  statNote: { color: '#2997ff', fontSize: 11, marginTop: 12 },
  statNoteBlue: { color: '#2997ff' },
  lowerGrid: { flexDirection: 'row', gap: 32 },
  lowerGridCompact: { flexDirection: 'column' },
  lowerPanel: { flex: 1, minWidth: 0 },
  panelHeader: { minHeight: 54, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 },
  panelTitle: { color: '#f5f5f7', fontSize: 19, fontWeight: '600', letterSpacing: 0.13 },
  panelSubtitle: { color: '#86868b', fontSize: 12, marginTop: 5 },
  weekSelect: { borderWidth: 1, borderColor: '#333336', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  weekText: { color: '#f5f5f7', fontSize: 10 },
  receiptSummary: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  receiptValue: { color: '#f5f5f7', fontSize: 30, fontWeight: '600', letterSpacing: -0.8 },
  receiptUnit: { color: '#86868b', fontSize: 14, fontWeight: '400' },
  receiptCaption: { color: '#86868b', fontSize: 11 },
  chartWrap: { marginTop: 22 },
  chartTotalRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 6 },
  chartTotal: { color: '#f5f5f7', fontSize: 30, letterSpacing: -0.7, fontWeight: '600' },
  chartTotalUnit: { color: '#86868b', fontSize: 13, fontWeight: '400' },
  chartGrowth: { color: '#2997ff', fontSize: 11 },
  chartGrowthMuted: { color: '#86868b' },
  chartLegend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 },
  legendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#2997ff' },
  legendText: { color: '#86868b', fontSize: 11 },
  panelArrow: { color: '#cccccc', fontSize: 17 },
  shipmentRow: { minHeight: 74, flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, borderTopColor: 'rgba(134,134,139,0.3)' },
  shipmentIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#1d1d1f', justifyContent: 'center', alignItems: 'center' },
  shipmentCopy: { flex: 1, gap: 4 },
  shipmentName: { color: '#f5f5f7', fontSize: 12 },
  shipmentDetail: { color: '#86868b', fontSize: 10 },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden', backgroundColor: '#333336', marginTop: 4 },
  progressFill: { height: '100%', backgroundColor: '#0071e3', borderRadius: 2 },
  progressText: { color: '#86868b', fontSize: 10 },
});

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#000000' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  page: { flex: 1, minHeight: '100%', paddingHorizontal: 64 },
  topBar: {
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(134,134,139,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  logo: { width: 142, height: 38 },
  main: {
    flex: 1,
    width: '100%',
    maxWidth: 1170,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 48,
    paddingVertical: 24,
  },
  intro: { flex: 1, maxWidth: 540, paddingVertical: 8 },
  eyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  eyebrowLine: { width: 22, height: 1, backgroundColor: '#86868b' },
  eyebrow: { color: '#cccccc', fontSize: 12, letterSpacing: -0.12, fontWeight: '400' },
  headline: {
    color: '#f5f5f7',
    fontSize: 48,
    lineHeight: 51,
    letterSpacing: -1.8,
    fontWeight: '600',
  },
  description: {
    color: '#86868b',
    fontSize: 17,
    lineHeight: 25,
    letterSpacing: -0.374,
    maxWidth: 395,
    marginTop: 12,
  },
  produceFrame: {
    width: '100%',
    maxWidth: 430,
    aspectRatio: 1.65,
    maxHeight: 210,
    marginTop: 12,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  produceImage: { width: '100%', height: '100%' },
  imageCaption: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(29,29,31,0.88)',
    borderRadius: 9999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  captionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#cccccc' },
  captionText: { color: '#f5f5f7', fontSize: 10, letterSpacing: -0.1 },
  featureList: { marginTop: 10, maxWidth: 440 },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(134,134,139,0.3)',
    gap: 12,
  },
  featureItemLast: { borderBottomWidth: 0 },
  featureNumber: { color: '#86868b', fontSize: 12, letterSpacing: -0.12, width: 24 },
  featureCopy: { flex: 1, gap: 3 },
  featureTitle: { color: '#f5f5f7', fontSize: 14, fontWeight: '400' },
  featureDetail: { color: '#86868b', fontSize: 12 },
  featureArrow: { color: '#cccccc', fontSize: 16 },
  loginCard: {
    width: 420,
    maxWidth: '100%',
    backgroundColor: '#1d1d1f',
    borderWidth: 1,
    borderColor: 'rgba(134,134,139,0.3)',
    borderRadius: 28,
    padding: 26,
  },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  cardEyebrow: { color: '#86868b', fontSize: 12, letterSpacing: -0.12, marginBottom: 6 },
  cardTitle: { color: '#f5f5f7', fontSize: 28, lineHeight: 32, letterSpacing: 0.196, fontWeight: '600' },
  cardMark: { width: 36, height: 36, opacity: 0.9 },
  fieldLabel: { color: '#f5f5f7', fontSize: 12, fontWeight: '400', marginBottom: 10 },
  input: {
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(134,134,139,0.5)',
    backgroundColor: '#000000',
    paddingHorizontal: 15,
    color: '#f5f5f7',
    fontSize: 17,
    letterSpacing: -0.374,
    marginBottom: 14,
  },
  passwordLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkText: { color: '#2997ff', fontSize: 12, marginBottom: 10 },
  passwordWrap: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(134,134,139,0.5)',
    backgroundColor: '#000000',
    marginBottom: 16,
  },
  passwordInput: { flex: 1, height: '100%', paddingHorizontal: 15, color: '#f5f5f7', fontSize: 17, letterSpacing: -0.374 },
  visibilityButton: { paddingHorizontal: 14, paddingVertical: 12 },
  visibilityText: { color: '#cccccc', fontSize: 12 },
  submitButton: {
    minHeight: 46,
    backgroundColor: '#0071e3',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  submitPressed: { opacity: 0.82 },
  submitText: { color: '#ffffff', fontWeight: '400', fontSize: 17, letterSpacing: -0.374 },
  arrow: { fontSize: 17 },
  separatorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 13 },
  separatorLine: { height: StyleSheet.hairlineWidth, flex: 1, backgroundColor: 'rgba(134,134,139,0.3)' },
  separatorText: { color: '#86868b', fontSize: 12 },
  googleButton: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(134,134,139,0.5)',
    borderRadius: 9999,
    backgroundColor: '#000000',
  },
  googlePressed: { opacity: 0.78 },
  googleMark: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  googleG: { color: '#4285F4', fontSize: 14, fontWeight: '600' },
  googleText: { color: '#f5f5f7', fontSize: 14 },
  message: { color: '#f5f5f7', fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: 'center' },
  secureNote: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14 },
  lockIcon: { color: '#cccccc', fontSize: 14 },
  secureText: { color: '#86868b', fontSize: 12 },
  footer: {
    minHeight: 48,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(134,134,139,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerText: { color: '#86868b', fontSize: 12, letterSpacing: -0.12 },
  footerCenter: { color: '#cccccc', fontSize: 12, letterSpacing: -0.12 },
  pageCompact: { paddingHorizontal: 22 },
  pageNarrow: { paddingHorizontal: 16 },
  topBarShort: { minHeight: 48 },
  mainShort: { paddingVertical: 10, gap: 36 },
  produceFrameShort: { maxHeight: 160, marginTop: 8 },
  featureListShort: { marginTop: 6 },
  loginCardShort: { padding: 20 },
  mainCompact: { flexDirection: 'column', alignItems: 'stretch', gap: 24, paddingVertical: 34 },
  mainTablet: { gap: 36 },
  introCompact: { maxWidth: 520, paddingVertical: 0 },
  headlineTablet: { fontSize: 46, lineHeight: 51 },
  headlineCompact: { fontSize: 42, lineHeight: 46, letterSpacing: -1.7 },
  headlineNarrow: { fontSize: 36, lineHeight: 40 },
  loginCardTablet: { width: 390, padding: 27 },
  loginCardCompact: { width: '100%', padding: 25, borderRadius: 24 },
  loginCardNarrow: { padding: 20 },
  footerCompact: { minHeight: 54 },
});

