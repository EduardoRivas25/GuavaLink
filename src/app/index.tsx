import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop, Text as SvgText } from 'react-native-svg';

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
              <View style={dashboardStyles.brandMark}><Text style={dashboardStyles.brandLeaf}>◈</Text></View>
              {!sidebarCollapsed && <Text style={dashboardStyles.brandName}>GuavaLink</Text>}
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
                <View style={dashboardStyles.brandMark}><Text style={dashboardStyles.brandLeaf}>◈</Text></View>
                <Text style={dashboardStyles.brandName}>GuavaLink</Text>
              </View>
            ) : (
              <View style={dashboardStyles.breadcrumb}><Pressable accessibilityRole="button" accessibilityLabel="Alternar menú lateral" onPress={() => setSidebarCollapsed((collapsed) => !collapsed)} style={dashboardStyles.menuToggle}><Text style={dashboardStyles.menuToggleText}>☰</Text></Pressable><Text style={dashboardStyles.breadcrumbMuted}>Mi empaque</Text><Text style={dashboardStyles.breadcrumbSlash}>/</Text><Text style={dashboardStyles.breadcrumbActive}>{activeSection}</Text></View>
            )}
            <View style={dashboardStyles.topActions}>
              {!compact && <Text style={dashboardStyles.search}>⌕  Buscar en GuavaLink...</Text>}
              <View style={dashboardStyles.topDivider} />
              <Pressable accessibilityLabel="Notificaciones" style={dashboardStyles.bellButton}><Text style={dashboardStyles.bell}>♧</Text><View style={dashboardStyles.notificationDot} /></Pressable>
              <Pressable accessibilityLabel="Cerrar sesión" onPress={onSignOut} style={dashboardStyles.avatar}><Text style={dashboardStyles.avatarText}>AC</Text></Pressable>
            </View>
          </View>

          <ScrollView contentContainerStyle={[dashboardStyles.content, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
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
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
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
  brand: { height: 50, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 26 },
  brandCollapsed: { justifyContent: 'center' },
  brandCompact: { flexDirection: 'row', alignItems: 'center', gap: 9 },
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
  bellButton: { position: 'relative', padding: 6 },
  bell: { color: '#f5f5f7', fontSize: 18 },
  notificationDot: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: '#f5a5a5' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#333336', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#f5f5f7', fontSize: 11, fontWeight: '600' },
  content: { paddingHorizontal: 38, paddingTop: 44, paddingBottom: 36, width: '100%', maxWidth: 1500, alignSelf: 'center' },
  contentCompact: { paddingHorizontal: 20, paddingTop: 28 },
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
