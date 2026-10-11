// screens/dashboard.tsx
import { NavGlyph, NotificationBell, StatGlyph } from '@/components/dashboard-glyphs';
import { ReceptionChart, ShipmentRow } from '@/components/reception-chart';
import OrchardScreen from '@/screens/orchards';
import PaymentScreen from '@/screens/payments';
import ProducerScreen from '@/screens/producers';
import ReportsScreen from '@/screens/reports';
import ShipmentScreen from '@/screens/shipments';
import UsersRolesScreen from '@/screens/users-roles';
import { dashboardStyles } from '@/styles/dashboard';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const dashboardStats = [
  { label: 'Kilos recibidos hoy', value: '8,450', unit: 'kg', note: '↑ +12.8% vs. ayer', icon: 'weight' },
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

export default function AdminDashboard({ onSignOut, account, isDarkMode, toggleTheme }: { onSignOut: () => void; account?: any; isDarkMode: boolean; toggleTheme: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const narrow = width < 380;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Resumen');

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
    outputRange: ['0deg', '360deg']
  });

  const selectSection = (section: string) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    setMobileMenuOpen(false);
    onSignOut();
  };

  const t = {
    bg: isDarkMode ? '#000000' : '#f3f4f6',
    sidebar: isDarkMode ? '#080808' : '#ffffff',
    card: isDarkMode ? '#1d1d1f' : '#ffffff',
    text: isDarkMode ? '#f5f5f7' : '#111827',
    sub: isDarkMode ? '#86868b' : '#6b7280',
    border: isDarkMode ? '#292929' : '#e5e7eb',
    active: isDarkMode ? '#333336' : '#f3f4f6',
  };

  return (
    <SafeAreaView style={[dashboardStyles.safeArea, { backgroundColor: t.bg }]}>
      <View style={[dashboardStyles.shell, { backgroundColor: t.bg }]}>
        {!compact && (
          <View style={[dashboardStyles.sidebar, sidebarCollapsed && dashboardStyles.sidebarCollapsed, { backgroundColor: t.sidebar, borderRightColor: t.border }]}>
            <View style={[dashboardStyles.brand, sidebarCollapsed && dashboardStyles.brandCollapsed]}>
              <Image
                source={sidebarCollapsed
                  ? require('../../assets/images/guavalink-brand-mark.png')
                  : (isDarkMode ? require('../../assets/images/guavalink-brand-horizontal-dark.png') : require('../../assets/images/logo-horizontal-dark.png'))}
                style={[sidebarCollapsed ? dashboardStyles.brandLogoCollapsed : dashboardStyles.brandLogo, !isDarkMode && !sidebarCollapsed && { tintColor: '#111827' }]}
                resizeMode="contain"
                accessibilityLabel="GuavaLink"
              />
            </View>

            <ScrollView style={dashboardStyles.sidebarScroll} contentContainerStyle={dashboardStyles.sidebarScrollContent} showsVerticalScrollIndicator={false}>
              {!sidebarCollapsed && <View style={[dashboardStyles.packhouse, { backgroundColor: t.card }]}>
                <View style={dashboardStyles.packhouseIcon}><Text style={dashboardStyles.navIcon}>📦</Text></View>
                <View style={dashboardStyles.packhouseCopy}>
                  <Text style={[dashboardStyles.packhouseName, { color: t.text }]}>GuceMich</Text>
                  <Text style={dashboardStyles.packhousePlace}>Michoacán, México</Text>
                </View>
                <Text style={dashboardStyles.chevron}>▼</Text>
              </View>}

              {!sidebarCollapsed && <Text style={dashboardStyles.navSection}>PRINCIPAL</Text>}
              
              <View style={dashboardStyles.navList}>
                {dashboardLinks.map((item) => {
                  const active = activeSection === item.label;
                  return (
                    <Pressable key={item.label} accessibilityLabel={item.label} onPress={() => selectSection(item.label)} style={[dashboardStyles.navItem, sidebarCollapsed && dashboardStyles.navItemCollapsed, active && { backgroundColor: t.active }]}>
                      <NavGlyph name={item.icon} active={active} isDark={isDarkMode} />
                      {!sidebarCollapsed && <Text style={[dashboardStyles.navLabel, active && { color: t.text, fontWeight: '600' }]}>{item.label}</Text>}
                      {!sidebarCollapsed && item.count ? <Text style={dashboardStyles.navCount}>{item.count}</Text> : null}
                    </Pressable>
                  );
                })}
              </View>

              {!sidebarCollapsed && <Text style={[dashboardStyles.navSection, dashboardStyles.adminSection]}>ADMINISTRACIÓN</Text>}
              <Pressable accessibilityLabel="Usuarios y roles" style={[dashboardStyles.navItem, sidebarCollapsed && dashboardStyles.navItemCollapsed, activeSection === 'Usuarios y roles' && { backgroundColor: t.active }]} onPress={() => selectSection('Usuarios y roles')}>
                <NavGlyph name="users" active={activeSection === 'Usuarios y roles'} isDark={isDarkMode} />
                {!sidebarCollapsed && <Text style={[dashboardStyles.navLabel, activeSection === 'Usuarios y roles' && { color: t.text, fontWeight: '600' }]}>Usuarios y roles</Text>}
              </Pressable>
            </ScrollView>

            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión y volver al inicio" onPress={handleSignOut} style={[dashboardStyles.sidebarSignOut, sidebarCollapsed && dashboardStyles.navItemCollapsed, { borderTopColor: t.border }]}>
              <NavGlyph name="logout" isDark={isDarkMode} />
              {!sidebarCollapsed && <Text style={[dashboardStyles.sidebarSignOutText, { color: t.text }]}>Cerrar sesión</Text>}
            </Pressable>
            
            <Pressable accessibilityRole="button" accessibilityLabel={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'} onPress={() => setSidebarCollapsed((collapsed) => !collapsed)} style={[dashboardStyles.collapseButton, sidebarCollapsed && dashboardStyles.navItemCollapsed]}>
              <NavGlyph name={sidebarCollapsed ? 'expand' : 'collapse'} isDark={isDarkMode} />
              {!sidebarCollapsed && <Text style={dashboardStyles.collapseLabel}>Contraer menú</Text>}
            </Pressable>
          </View>
        )}

        <View style={[dashboardStyles.mainArea, { backgroundColor: t.bg }]}>
          <View style={[dashboardStyles.topNav, compact && dashboardStyles.topNavCompact, { borderBottomColor: t.border }]}>
            {compact ? (
              <View style={dashboardStyles.brandCompact}>
                <Pressable accessibilityRole="button" accessibilityLabel="Abrir menú" onPress={() => setMobileMenuOpen(true)} style={dashboardStyles.mobileMenuButton}>
                  <Text style={dashboardStyles.menuToggleText}>☰</Text>
                </Pressable>
                <Image source={require('../../assets/images/guavalink-brand-mark.png')} style={dashboardStyles.mobileBrandMark} resizeMode="contain" accessibilityLabel="GuavaLink" />
                <Text numberOfLines={1} style={[dashboardStyles.mobileSectionTitle, { color: t.text }]}>{activeSection}</Text>
              </View>
            ) : (
              <View style={dashboardStyles.breadcrumb}>
                <Pressable accessibilityRole="button" accessibilityLabel="Alternar menú lateral" onPress={() => setSidebarCollapsed((collapsed) => !collapsed)} style={[dashboardStyles.menuToggle, { borderColor: t.border }]}>
                  <Text style={[dashboardStyles.menuToggleText, { color: t.text }]}>☰</Text>
                </Pressable>
                <Text style={dashboardStyles.breadcrumbMuted}>Mi empaque</Text>
                <Text style={dashboardStyles.breadcrumbSlash}>/</Text>
                <Text style={[dashboardStyles.breadcrumbActive, { color: t.text }]}>{activeSection}</Text>
              </View>
            )}

            <View style={[dashboardStyles.topActions, compact && dashboardStyles.topActionsCompact]}>
              {width >= 1100 && <Text style={[dashboardStyles.search, { color: t.sub }]}>🔍 Buscar en GuavaLink...</Text>}
              {width >= 1100 && <View style={[dashboardStyles.topDivider, { backgroundColor: t.border }]} />}
              
              <Pressable onPress={toggleTheme} style={{ marginRight: 10 }}>
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Text style={{ fontSize: 22 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
                </Animated.View>
              </Pressable>

              <Pressable accessibilityRole="button" accessibilityLabel="Notificaciones, 3 sin leer" style={[dashboardStyles.bellButton, { backgroundColor: t.sidebar, borderColor: t.border }]}>
                <NotificationBell isDark={isDarkMode} />
                <View style={dashboardStyles.notificationBadge}><Text style={dashboardStyles.notificationBadgeText}>3</Text></View>
              </Pressable>
              
              <Pressable accessibilityLabel="Cerrar sesión" onPress={handleSignOut} style={[dashboardStyles.avatar, { backgroundColor: t.active }]}>
                <Text style={[dashboardStyles.avatarText, { color: t.text }]}>{account?.name?.substring(0, 2).toUpperCase() || 'AC'}</Text>
              </Pressable>
            </View>
          </View>

          {activeSection === 'Usuarios y roles' ? <UsersRolesScreen compact={compact} /> : activeSection === 'Productores' ? <ProducerScreen compact={compact} /> : activeSection === 'Huertas' ? <OrchardScreen compact={compact} /> : activeSection === 'Embarques' ? <ShipmentScreen compact={compact} /> : activeSection === 'Pagos' ? <PaymentScreen compact={compact} /> : activeSection === 'Reportes' ? <ReportsScreen compact={compact} /> : <ScrollView contentContainerStyle={[dashboardStyles.content, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
            <View style={[dashboardStyles.welcomeRow, compact && dashboardStyles.welcomeRowCompact]}>
              <View style={dashboardStyles.welcomeCopy}>
                <Text style={dashboardStyles.eyebrow}>TU EMPAQUE, DE UN VISTAZO</Text>
                <Text style={[dashboardStyles.greeting, compact && dashboardStyles.greetingCompact, narrow && dashboardStyles.greetingNarrow, { color: t.text }]}>Buen día, {account?.name?.split(' ')[0] || 'Alejandro'} <Text style={dashboardStyles.sun}>☀️</Text></Text>
                <Text style={dashboardStyles.subtitle}>Todo lo que necesitas saber para empezar el día.</Text>
              </View>
              <View style={dashboardStyles.welcomeActions}>
                <View style={[dashboardStyles.datePill, { borderColor: t.border }]}><Text style={dashboardStyles.dateIcon}>📅</Text><Text style={[dashboardStyles.dateText, { color: t.text }]}>3 oct, 2026</Text></View>
              </View>
            </View>

            <View style={dashboardStyles.statsGrid}>
              {dashboardStats.map((stat, index) => (
                <View key={stat.label} style={[dashboardStyles.statCard, compact && dashboardStyles.statCardCompact, narrow && dashboardStyles.statCardNarrow, { backgroundColor: t.card }]}>
                  <View style={dashboardStyles.statTop}>
                    <Text style={dashboardStyles.statLabel}>{stat.label}</Text>
                    <View style={[dashboardStyles.statIcon, index === 2 && dashboardStyles.statIconGold, index === 3 && dashboardStyles.statIconRose]}><StatGlyph name={stat.icon} isDark={isDarkMode} /></View>
                  </View>
                  <View style={dashboardStyles.statValueRow}>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[dashboardStyles.statValue, compact && dashboardStyles.statValueCompact, { color: t.text }]}>{stat.value}</Text>
                    {stat.unit ? <Text style={dashboardStyles.statUnit}>{stat.unit}</Text> : null}
                  </View>
                  <Text style={[dashboardStyles.statNote, index !== 0 && dashboardStyles.statNoteBlue]}>{stat.note}</Text>
                </View>
              ))}
            </View>

            <View style={[dashboardStyles.lowerGrid, compact && dashboardStyles.lowerGridCompact]}>
              <View style={[dashboardStyles.lowerPanel, compact && dashboardStyles.lowerPanelCompact]}>
                <View style={dashboardStyles.panelHeader}><View><Text style={[dashboardStyles.panelTitle, { color: t.text }]}>Recepción de fruta</Text><Text style={dashboardStyles.panelSubtitle}>Kilos recibidos por día.</Text></View></View>
                <ReceptionChart />
              </View>
              <View style={[dashboardStyles.lowerPanel, compact && dashboardStyles.lowerPanelCompact]}>
                <View style={dashboardStyles.panelHeader}><View><Text style={[dashboardStyles.panelTitle, { color: t.text }]}>Embarques en curso</Text><Text style={dashboardStyles.panelSubtitle}>Del empaque a su próximo destino.</Text></View><Text style={dashboardStyles.panelArrow}>→</Text></View>
                <ShipmentRow name="Exportación norte" detail="GUA-2026-084 • Sale hoy" progress="72%" />
                <ShipmentRow name="Mercado nacional" detail="GUA-2026-083 • En preparación" progress="38%" />
              </View>
            </View>
          </ScrollView>}
        </View>
      </View>

      <Modal visible={compact && mobileMenuOpen} transparent animationType="fade" onRequestClose={() => setMobileMenuOpen(false)}>
        <View style={dashboardStyles.mobileMenuOverlay}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={() => setMobileMenuOpen(false)} style={dashboardStyles.mobileMenuBackdrop} />
          <SafeAreaView style={[dashboardStyles.mobileMenuPanel, { backgroundColor: t.sidebar, borderRightColor: t.border }]}>
            <View style={dashboardStyles.mobileMenuHeader}>
              <Image source={isDarkMode ? require('../../assets/images/guavalink-brand-horizontal-dark.png') : require('../../assets/images/logo-horizontal-dark.png')} style={[dashboardStyles.brandLogo, !isDarkMode && { tintColor: '#111827' }]} resizeMode="contain" accessibilityLabel="GuavaLink" />
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={() => setMobileMenuOpen(false)} style={dashboardStyles.mobileMenuButton}><Text style={[dashboardStyles.menuToggleText, { color: t.text }]}>✕</Text></Pressable>
            </View>
            <ScrollView contentContainerStyle={dashboardStyles.mobileMenuContent}>
              <Text style={dashboardStyles.navSection}>PRINCIPAL</Text>
              {dashboardLinks.map((item) => (
                <Pressable key={item.label} accessibilityRole="button" accessibilityState={{ selected: activeSection === item.label }} onPress={() => selectSection(item.label)} style={[dashboardStyles.mobileNavItem, activeSection === item.label && { backgroundColor: t.active }]}>
                  <NavGlyph name={item.icon} active={activeSection === item.label} isDark={isDarkMode} />
                  <Text style={[dashboardStyles.navLabel, activeSection === item.label && { color: t.text, fontWeight: '600' }]}>{item.label}</Text>
                </Pressable>
              ))}
              <Text style={[dashboardStyles.navSection, dashboardStyles.adminSection]}>ADMINISTRACIÓN</Text>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: activeSection === 'Usuarios y roles' }} onPress={() => selectSection('Usuarios y roles')} style={[dashboardStyles.mobileNavItem, activeSection === 'Usuarios y roles' && { backgroundColor: t.active }]}>
                <NavGlyph name="users" active={activeSection === 'Usuarios y roles'} isDark={isDarkMode} />
                <Text style={[dashboardStyles.navLabel, activeSection === 'Usuarios y roles' && { color: t.text, fontWeight: '600' }]}>Usuarios y roles</Text>
              </Pressable>
            </ScrollView>
            <View style={[dashboardStyles.mobileMenuFooter, { borderTopColor: t.border }]}>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión y volver al inicio" onPress={handleSignOut} style={dashboardStyles.mobileNavItem}>
                <NavGlyph name="logout" isDark={isDarkMode} />
                <Text style={[dashboardStyles.sidebarSignOutText, { color: t.text }]}>Cerrar sesión</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}