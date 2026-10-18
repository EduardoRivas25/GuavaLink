import { NavGlyph, StatGlyph } from '@/components/dashboard-glyphs';
import { dashboardStyles, getDashboardTheme } from '@/styles/dashboard';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

import * as OrchardsModule from './orchards';
import * as PaymentsModule from './payments';
import ProducersScreen from './producers';
import * as ReportsModule from './reports';
import * as ShipmentsModule from './shipments';
import * as UsersRolesModule from './users-roles';

const OrchardsView: any = (OrchardsModule as any).default || Object.values(OrchardsModule)[0];
const ShipmentsView: any = (ShipmentsModule as any).default || Object.values(ShipmentsModule)[0];
const PaymentsView: any = (PaymentsModule as any).default || Object.values(PaymentsModule)[0];
const ReportsView: any = (ReportsModule as any).default || Object.values(ReportsModule)[0];
const UsersRolesView: any = (UsersRolesModule as any).default || Object.values(UsersRolesModule)[0];

export default function AdminDashboard({
  onSignOut,
  account,
  isDarkMode = true,
}: any = {}) {
  const t = getDashboardTheme(isDarkMode);
  
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(true);

  const [producersCount, setProducersCount] = useState(0);
  const [orchardsCount, setOrchardsCount] = useState(0);
  const [totalKilos, setTotalKilos] = useState(0);
  const [totalBoxes, setTotalBoxes] = useState(0);
  const [activeShipments, setActiveShipments] = useState(0);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      const { count: pCount } = await supabase.from('producers').select('*', { count: 'exact', head: true });
      setProducersCount(pCount || 0);

      const { count: oCount } = await supabase.from('orchards').select('*', { count: 'exact', head: true });
      setOrchardsCount(oCount || 0);

      const { data: recs } = await supabase.from('receptions').select('*');
      const safeRecs = recs || [];
      setTotalKilos(safeRecs.reduce((acc, r) => acc + (Number(r.weight_kg) || 0), 0));
      setTotalBoxes(safeRecs.reduce((acc, r) => acc + (Number(r.boxes) || 0), 0));

      const { data: ships } = await supabase.from('shipments').select('*');
      const safeShips = ships || [];
      setActiveShipments(safeShips.filter((s: any) => s.status !== 'Entregado' && s.status !== 'Cancelado').length);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === 'overview') fetchOverview();
  }, [fetchOverview, activeSection]);

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: 'overview' },
    { id: 'producers', label: 'Productores', icon: 'producers', count: producersCount },
    { id: 'orchards', label: 'Huertas', icon: 'orchards', count: orchardsCount },
    { id: 'shipments', label: 'Embarques', icon: 'shipments', count: activeShipments },
    { id: 'payments', label: 'Pagos', icon: 'payments' },
    { id: 'reports', label: 'Reportes', icon: 'reports' },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'producers': return <ProducersScreen isDarkMode={isDarkMode} />;
      case 'orchards': return OrchardsView ? <OrchardsView /> : null;
      case 'shipments': return ShipmentsView ? <ShipmentsView /> : null;
      case 'payments': return PaymentsView ? <PaymentsView /> : null;
      case 'reports': return ReportsView ? <ReportsView /> : null;
      case 'users': return UsersRolesView ? <UsersRolesView /> : null;
      default:
        return (
          <ScrollView contentContainerStyle={dashboardStyles.content} showsVerticalScrollIndicator={false}>
            <View style={dashboardStyles.welcomeRow}>
              <View style={dashboardStyles.welcomeCopy}>
                <Text style={dashboardStyles.eyebrow}>RESUMEN GENERAL</Text>
                <Text style={[dashboardStyles.greeting, { color: t.text }]}>Hola, {account?.name || 'Administrador'}</Text>
                <Text style={[dashboardStyles.subtitle, { color: t.sub }]}>La operación del empaque en tiempo real.</Text>
              </View>
              <Pressable style={[dashboardStyles.datePill, { borderColor: t.border }]} onPress={fetchOverview}>
                <Text style={[dashboardStyles.dateText, { color: t.text }]}>↻ Sincronizar datos</Text>
              </Pressable>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#0071e3" style={{ marginVertical: 60 }} />
            ) : (
              <View style={dashboardStyles.statsGrid}>
                <Pressable style={[dashboardStyles.statCard, { backgroundColor: t.card, borderColor: t.border }]} onPress={() => setActiveSection('producers')}>
                  <View style={dashboardStyles.statTop}>
                    <Text style={[dashboardStyles.statLabel, { color: t.sub }]}>Productores</Text>
                    <View style={dashboardStyles.statIcon}><NavGlyph name="producers" active /></View>
                  </View>
                  <Text style={[dashboardStyles.statValue, { color: t.text }]}>{producersCount}</Text>
                  <Text style={dashboardStyles.statNote}>En padrón activo</Text>
                </Pressable>

                <Pressable style={[dashboardStyles.statCard, { backgroundColor: t.card, borderColor: t.border }]} onPress={() => setActiveSection('orchards')}>
                  <View style={dashboardStyles.statTop}>
                    <Text style={[dashboardStyles.statLabel, { color: t.sub }]}>Huertas vinculadas</Text>
                    <View style={[dashboardStyles.statIcon, dashboardStyles.statIconRose]}><StatGlyph name="farmers" /></View>
                  </View>
                  <Text style={[dashboardStyles.statValue, { color: t.text }]}>{orchardsCount}</Text>
                  <Text style={dashboardStyles.statNote}>Con trazabilidad</Text>
                </Pressable>

                <View style={[dashboardStyles.statCard, { backgroundColor: t.card, borderColor: t.border }]}>
                  <View style={dashboardStyles.statTop}>
                    <Text style={[dashboardStyles.statLabel, { color: t.sub }]}>Fruta recibida</Text>
                    <View style={[dashboardStyles.statIcon, dashboardStyles.statIconGold]}><StatGlyph name="weight" /></View>
                  </View>
                  <View style={dashboardStyles.statValueRow}>
                    <Text style={[dashboardStyles.statValue, { color: t.text }]}>{totalKilos.toLocaleString()}</Text>
                    <Text style={[dashboardStyles.statUnit, { color: t.sub }]}>kg</Text>
                  </View>
                  <Text style={dashboardStyles.statNote}>{totalBoxes.toLocaleString()} cajas registradas</Text>
                </View>

                <Pressable style={[dashboardStyles.statCard, { backgroundColor: t.card, borderColor: t.border }]} onPress={() => setActiveSection('shipments')}>
                  <View style={dashboardStyles.statTop}>
                    <Text style={[dashboardStyles.statLabel, { color: t.sub }]}>Embarques activos</Text>
                    <View style={dashboardStyles.statIcon}><StatGlyph name="truck" /></View>
                  </View>
                  <Text style={[dashboardStyles.statValue, { color: t.text }]}>{activeShipments}</Text>
                  <Text style={dashboardStyles.statNote}>En tránsito</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={[dashboardStyles.safeArea, { backgroundColor: t.bg }]}>
      <View style={[dashboardStyles.shell, { backgroundColor: t.bg }]}>
        <View style={[dashboardStyles.sidebar, { backgroundColor: t.sidebar, borderRightColor: t.border }]}>
          <ScrollView style={dashboardStyles.sidebarScroll} contentContainerStyle={dashboardStyles.sidebarScrollContent}>
            <View style={dashboardStyles.brand}>
              <Text style={[dashboardStyles.brandName, { color: t.text }]}>GuavaLink</Text>
            </View>
            <View style={[dashboardStyles.packhouse, { backgroundColor: t.card, borderColor: t.border }]}>
              <View style={[dashboardStyles.packhouseIcon, { backgroundColor: t.active }]}><Text style={dashboardStyles.brandLeaf}>🍃</Text></View>
              <View style={dashboardStyles.packhouseCopy}>
                <Text style={[dashboardStyles.packhouseName, { color: t.text }]}>Empaque Central</Text>
                <Text style={[dashboardStyles.packhousePlace, { color: t.sub }]}>Uruapan, Mich.</Text>
              </View>
            </View>

            <Text style={dashboardStyles.navSection}>MENÚ</Text>
            <View style={dashboardStyles.navList}>
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <Pressable
                    key={item.id}
                    style={[dashboardStyles.navItem, isActive && { backgroundColor: t.active }]}
                    onPress={() => setActiveSection(item.id)}
                  >
                    <View style={dashboardStyles.navGlyphBox}>
                      <NavGlyph name={item.icon} active={isActive} isDark={isDarkMode} />
                    </View>
                    <Text style={[dashboardStyles.navLabel, isActive ? { color: t.text, fontWeight: '600' } : { color: t.sub }]}>
                      {item.label}
                    </Text>
                    {item.count !== undefined && (
                      <Text style={[dashboardStyles.navCount, { backgroundColor: t.badgeBg, color: t.text }]}>{item.count}</Text>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <Text style={[dashboardStyles.navSection, dashboardStyles.adminSection]}>ADMINISTRACIÓN</Text>
            <View style={dashboardStyles.navList}>
              <Pressable
                style={[dashboardStyles.navItem, activeSection === 'users' && { backgroundColor: t.active }]}
                onPress={() => setActiveSection('users')}
              >
                <View style={dashboardStyles.navGlyphBox}><NavGlyph name="users" active={activeSection === 'users'} isDark={isDarkMode} /></View>
                <Text style={[dashboardStyles.navLabel, activeSection === 'users' ? { color: t.text, fontWeight: '600' } : { color: t.sub }]}>
                  Usuarios y roles
                </Text>
              </Pressable>
            </View>
          </ScrollView>

          <Pressable style={[dashboardStyles.sidebarSignOut, { borderTopColor: t.border }]} onPress={onSignOut}>
            <View style={dashboardStyles.navGlyphBox}><NavGlyph name="logout" isDark={isDarkMode} /></View>
            <Text style={[dashboardStyles.sidebarSignOutText, { color: t.sub }]}>Cerrar sesión</Text>
          </Pressable>
        </View>

        <View style={dashboardStyles.mainArea}>
          <View style={[dashboardStyles.topNav, { borderBottomColor: t.border }]}>
            <View style={dashboardStyles.breadcrumb}>
              <Text style={[dashboardStyles.breadcrumbMuted, { color: t.sub }]}>GuavaLink</Text>
              <Text style={[dashboardStyles.breadcrumbSlash, { color: t.border }]}>/</Text>
              <Text style={[dashboardStyles.breadcrumbActive, { color: t.text }]}>
                {navItems.find(i => i.id === activeSection)?.label || 'Usuarios y roles'}
              </Text>
            </View>
            <View style={dashboardStyles.topActions}>
              <View style={[dashboardStyles.topDivider, { backgroundColor: t.border }]} />
              <View style={[dashboardStyles.avatar, { backgroundColor: t.active }]}>
                <Text style={[dashboardStyles.avatarText, { color: t.text }]}>
                  {account?.name ? account.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : 'AD'}
                </Text>
              </View>
            </View>
          </View>
          {renderActiveSection()}
        </View>
      </View>
    </SafeAreaView>
  );
}