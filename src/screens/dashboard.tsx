import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavGlyph, NotificationBell, StatGlyph } from '@/components/dashboard-glyphs';
import { ReceptionChart, ShipmentRow } from '@/components/reception-chart';
import OrchardScreen from '@/screens/orchards';
import PaymentScreen from '@/screens/payments';
import ProducerScreen from '@/screens/producers';
import ReportsScreen from '@/screens/reports';
import ShipmentScreen from '@/screens/shipments';
import UsersRolesScreen from '@/screens/users-roles';
import { dashboardStyles } from '@/styles/dashboard';

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

export default function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 900;
  const narrow = width < 380;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('Resumen');
  const selectSection = (section: string) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };
  const handleSignOut = () => {
    setMobileMenuOpen(false);
    onSignOut();
  };

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

            <ScrollView style={dashboardStyles.sidebarScroll} contentContainerStyle={dashboardStyles.sidebarScrollContent} showsVerticalScrollIndicator={false}>
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
                  <Pressable key={item.label} accessibilityLabel={item.label} onPress={() => selectSection(item.label)} style={[dashboardStyles.navItem, sidebarCollapsed && dashboardStyles.navItemCollapsed, active && dashboardStyles.navItemActive]}>
                    <NavGlyph name={item.icon} active={active} />
                    {!sidebarCollapsed && <Text style={[dashboardStyles.navLabel, active && dashboardStyles.navLabelActive]}>{item.label}</Text>}
                    {!sidebarCollapsed && item.count ? <Text style={dashboardStyles.navCount}>{item.count}</Text> : null}
                  </Pressable>
                );
              })}
            </View>

            {!sidebarCollapsed && <Text style={[dashboardStyles.navSection, dashboardStyles.adminSection]}>ADMINISTRACIÓN</Text>}
            <Pressable accessibilityLabel="Usuarios y roles" style={[dashboardStyles.navItem, sidebarCollapsed && dashboardStyles.navItemCollapsed, activeSection === 'Usuarios y roles' && dashboardStyles.navItemActive]} onPress={() => selectSection('Usuarios y roles')}>
              <NavGlyph name="users" active={activeSection === 'Usuarios y roles'} />
              {!sidebarCollapsed && <Text style={dashboardStyles.navLabel}>Usuarios y roles</Text>}
            </Pressable>
            </ScrollView>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión y volver al inicio" onPress={handleSignOut} style={[dashboardStyles.sidebarSignOut, sidebarCollapsed && dashboardStyles.navItemCollapsed]}>
              <NavGlyph name="logout" />
              {!sidebarCollapsed && <Text style={dashboardStyles.sidebarSignOutText}>Cerrar sesión</Text>}
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'} onPress={() => setSidebarCollapsed((collapsed) => !collapsed)} style={[dashboardStyles.collapseButton, sidebarCollapsed && dashboardStyles.navItemCollapsed]}>
              <NavGlyph name={sidebarCollapsed ? 'expand' : 'collapse'} />
              {!sidebarCollapsed && <Text style={dashboardStyles.collapseLabel}>Contraer menú</Text>}
            </Pressable>
          </View>
        )}

        <View style={dashboardStyles.mainArea}>
          <View style={[dashboardStyles.topNav, compact && dashboardStyles.topNavCompact]}>
            {compact ? (
              <View style={dashboardStyles.brandCompact}>
                <Pressable accessibilityRole="button" accessibilityLabel="Abrir menú" onPress={() => setMobileMenuOpen(true)} style={dashboardStyles.mobileMenuButton}><Text style={dashboardStyles.menuToggleText}>☰</Text></Pressable>
                <Image source={require('../../assets/images/guavalink-brand-mark.png')} style={dashboardStyles.mobileBrandMark} resizeMode="contain" accessibilityLabel="GuavaLink" />
                <Text numberOfLines={1} style={dashboardStyles.mobileSectionTitle}>{activeSection}</Text>
              </View>
            ) : (
              <View style={dashboardStyles.breadcrumb}><Pressable accessibilityRole="button" accessibilityLabel="Alternar menú lateral" onPress={() => setSidebarCollapsed((collapsed) => !collapsed)} style={dashboardStyles.menuToggle}><Text style={dashboardStyles.menuToggleText}>☰</Text></Pressable><Text style={dashboardStyles.breadcrumbMuted}>Mi empaque</Text><Text style={dashboardStyles.breadcrumbSlash}>/</Text><Text style={dashboardStyles.breadcrumbActive}>{activeSection}</Text></View>
            )}
            <View style={[dashboardStyles.topActions, compact && dashboardStyles.topActionsCompact]}>
              {width >= 1100 && <Text style={dashboardStyles.search}>⌕  Buscar en GuavaLink...</Text>}
              {width >= 1100 && <View style={dashboardStyles.topDivider} />}
              <Pressable accessibilityRole="button" accessibilityLabel="Notificaciones, 3 sin leer" style={dashboardStyles.bellButton}>
                <NotificationBell />
                <View style={dashboardStyles.notificationBadge}><Text style={dashboardStyles.notificationBadgeText}>3</Text></View>
              </Pressable>
              <Pressable accessibilityLabel="Cerrar sesión" onPress={handleSignOut} style={dashboardStyles.avatar}><Text style={dashboardStyles.avatarText}>AC</Text></Pressable>
            </View>
          </View>

          {activeSection === 'Usuarios y roles' ? <UsersRolesScreen compact={compact} /> : activeSection === 'Productores' ? <ProducerScreen compact={compact} /> : activeSection === 'Huertas' ? <OrchardScreen compact={compact} /> : activeSection === 'Embarques' ? <ShipmentScreen compact={compact} /> : activeSection === 'Pagos' ? <PaymentScreen compact={compact} /> : activeSection === 'Reportes' ? <ReportsScreen compact={compact} /> : <ScrollView contentContainerStyle={[dashboardStyles.content, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
            <View style={[dashboardStyles.welcomeRow, compact && dashboardStyles.welcomeRowCompact]}>
              <View style={dashboardStyles.welcomeCopy}>
                <Text style={dashboardStyles.eyebrow}>TU EMPAQUE, DE UN VISTAZO</Text>
                <Text style={[dashboardStyles.greeting, compact && dashboardStyles.greetingCompact, narrow && dashboardStyles.greetingNarrow]}>Buen día, Alejandro <Text style={dashboardStyles.sun}>☀</Text></Text>
                <Text style={dashboardStyles.subtitle}>Todo lo que necesitas saber para empezar el día.</Text>
              </View>
              <View style={dashboardStyles.welcomeActions}>
                <View style={dashboardStyles.datePill}><Text style={dashboardStyles.dateIcon}>▦</Text><Text style={dashboardStyles.dateText}>3 oct, 2026</Text></View>
              </View>
            </View>

            <View style={dashboardStyles.statsGrid}>
              {dashboardStats.map((stat, index) => (
                <View key={stat.label} style={[dashboardStyles.statCard, compact && dashboardStyles.statCardCompact, narrow && dashboardStyles.statCardNarrow]}>
                  <View style={dashboardStyles.statTop}>
                    <Text style={dashboardStyles.statLabel}>{stat.label}</Text>
                    <View style={[dashboardStyles.statIcon, index === 2 && dashboardStyles.statIconGold, index === 3 && dashboardStyles.statIconRose]}><StatGlyph name={stat.icon} /></View>
                  </View>
                  <View style={dashboardStyles.statValueRow}>
                    <Text numberOfLines={1} adjustsFontSizeToFit style={[dashboardStyles.statValue, compact && dashboardStyles.statValueCompact]}>{stat.value}</Text>
                    {stat.unit ? <Text style={dashboardStyles.statUnit}>{stat.unit}</Text> : null}
                  </View>
                  <Text style={[dashboardStyles.statNote, index !== 0 && dashboardStyles.statNoteBlue]}>{stat.note}</Text>
                </View>
              ))}
            </View>

            <View style={[dashboardStyles.lowerGrid, compact && dashboardStyles.lowerGridCompact]}>
              <View style={[dashboardStyles.lowerPanel, compact && dashboardStyles.lowerPanelCompact]}>
                <View style={dashboardStyles.panelHeader}><View><Text style={dashboardStyles.panelTitle}>Recepción de fruta</Text><Text style={dashboardStyles.panelSubtitle}>Kilos recibidos por día.</Text></View></View>
                <ReceptionChart />
              </View>
              <View style={[dashboardStyles.lowerPanel, compact && dashboardStyles.lowerPanelCompact]}>
                <View style={dashboardStyles.panelHeader}><View><Text style={dashboardStyles.panelTitle}>Embarques en curso</Text><Text style={dashboardStyles.panelSubtitle}>Del empaque a su próximo destino.</Text></View><Text style={dashboardStyles.panelArrow}>↗</Text></View>
                <ShipmentRow name="Exportación norte" detail="GUA-2026-084 · Sale hoy" progress="72%" />
                <ShipmentRow name="Mercado nacional" detail="GUA-2026-083 · En preparación" progress="38%" />
              </View>
            </View>
          </ScrollView>}
        </View>
      </View>
      <Modal visible={compact && mobileMenuOpen} transparent animationType="fade" onRequestClose={() => setMobileMenuOpen(false)}>
        <View style={dashboardStyles.mobileMenuOverlay}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={() => setMobileMenuOpen(false)} style={dashboardStyles.mobileMenuBackdrop} />
          <SafeAreaView style={dashboardStyles.mobileMenuPanel}>
            <View style={dashboardStyles.mobileMenuHeader}>
              <Image source={require('../../assets/images/guavalink-brand-horizontal-dark.png')} style={dashboardStyles.brandLogo} resizeMode="contain" accessibilityLabel="GuavaLink" />
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar menú" onPress={() => setMobileMenuOpen(false)} style={dashboardStyles.mobileMenuButton}><Text style={dashboardStyles.menuToggleText}>✕</Text></Pressable>
            </View>
            <ScrollView contentContainerStyle={dashboardStyles.mobileMenuContent}>
              <Text style={dashboardStyles.navSection}>PRINCIPAL</Text>
              {dashboardLinks.map((item) => <Pressable key={item.label} accessibilityRole="button" accessibilityState={{ selected: activeSection === item.label }} onPress={() => selectSection(item.label)} style={[dashboardStyles.mobileNavItem, activeSection === item.label && dashboardStyles.navItemActive]}><NavGlyph name={item.icon} active={activeSection === item.label} /><Text style={[dashboardStyles.navLabel, activeSection === item.label && dashboardStyles.navLabelActive]}>{item.label}</Text></Pressable>)}
              <Text style={[dashboardStyles.navSection, dashboardStyles.adminSection]}>ADMINISTRACIÓN</Text>
              <Pressable accessibilityRole="button" accessibilityState={{ selected: activeSection === 'Usuarios y roles' }} onPress={() => selectSection('Usuarios y roles')} style={[dashboardStyles.mobileNavItem, activeSection === 'Usuarios y roles' && dashboardStyles.navItemActive]}><NavGlyph name="users" active={activeSection === 'Usuarios y roles'} /><Text style={[dashboardStyles.navLabel, activeSection === 'Usuarios y roles' && dashboardStyles.navLabelActive]}>Usuarios y roles</Text></Pressable>
            </ScrollView>
            <View style={dashboardStyles.mobileMenuFooter}>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión y volver al inicio" onPress={handleSignOut} style={dashboardStyles.mobileNavItem}>
                <NavGlyph name="logout" />
                <Text style={dashboardStyles.sidebarSignOutText}>Cerrar sesión</Text>
              </Pressable>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
