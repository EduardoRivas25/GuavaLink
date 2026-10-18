import { router } from 'expo-router';
import {
    Image,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleLoginPress = () => {
    // Forzamos el tipado con "as any" para que TS no marque error 
    // por la nueva ruta que acabas de crear.
    router.push('/login' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Navbar */}
        <View style={styles.navbar}>
          <View style={styles.navBrand}>
            <Image
              source={require('../../assets/images/logo-horizontal-dark.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Pressable style={styles.navButton} onPress={handleLoginPress}>
            <Text style={styles.navButtonText}>Iniciar sesión →</Text>
          </Pressable>
        </View>

        {/* Hero Section */}
        <View style={[styles.hero, isMobile && styles.heroMobile]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Plataforma B2B Agrícola</Text>
          </View>
          <Text style={[styles.heroTitle, isMobile && styles.heroTitleMobile]}>
            Del campo a cada <Text style={styles.textHighlight}>embarque.</Text>
          </Text>
          <Text style={[styles.heroSubtitle, isMobile && styles.heroSubtitleMobile]}>
            Una operación de empaque de guayaba más clara, conectada y trazable.
            Reúne en un mismo flujo a productores, personal de recepción y administración.
          </Text>
          <View style={styles.heroActions}>
            <Pressable style={styles.primaryButton} onPress={handleLoginPress}>
              <Text style={styles.primaryButtonText}>Acceder al sistema</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryButton}
              onPress={() => {
                if (Platform.OS === 'web') {
                  window.scrollTo({ top: 800, behavior: 'smooth' });
                }
              }}
            >
              <Text style={styles.secondaryButtonText}>Descubrir funciones</Text>
            </Pressable>
          </View>
        </View>

        {/* Bento Grid Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>¿Qué resuelve GuavaLink?</Text>
          <Text style={styles.sectionSubtitle}>
            Digitalizamos el proceso para eliminar errores manuales y agilizar la exportación.
          </Text>

          <View style={[styles.bentoGrid, isMobile && styles.bentoGridMobile]}>
            {/* Feature 1 */}
            <View style={[styles.bentoCard, styles.bentoLarge]}>
              <Text style={styles.bentoIcon}>📱</Text>
              <Text style={styles.bentoTitle}>Recepción con Código QR</Text>
              <Text style={styles.bentoText}>
                Olvida las libretas. El personal de patio escanea el código QR del productor desde su celular, 
                registrando cajas, kilos netos y la huerta de origen en segundos.
              </Text>
            </View>

            {/* Feature 2 */}
            <View style={styles.bentoCard}>
              <Text style={styles.bentoIcon}>📊</Text>
              <Text style={styles.bentoTitle}>Trazabilidad de Embarques</Text>
              <Text style={styles.bentoText}>
                Conoce exactamente de qué huertas proviene la fruta de cada embarque. Controla destinos y estados en tiempo real.
              </Text>
            </View>

            {/* Feature 3 */}
            <View style={styles.bentoCard}>
              <Text style={styles.bentoIcon}>💳</Text>
              <Text style={styles.bentoTitle}>Pagos Claros</Text>
              <Text style={styles.bentoText}>
                Genera liquidaciones automáticas para los productores basadas en la fruta recibida. Mantén un historial financiero preciso.
              </Text>
            </View>

            {/* Feature 4 */}
            <View style={[styles.bentoCard, styles.bentoLarge]}>
              <Text style={styles.bentoIcon}>🧑‍🌾</Text>
              <Text style={styles.bentoTitle}>Portal para Productores</Text>
              <Text style={styles.bentoText}>
                Cada productor tiene su propio acceso para consultar sus entregas diarias, visualizar su historial de cajas y revisar el estado de sus pagos, generando confianza y transparencia.
              </Text>
            </View>
          </View>
        </View>

        {/* Footer CTA */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>¿Listo para modernizar tu empaque?</Text>
          <Pressable style={styles.primaryButton} onPress={handleLoginPress}>
            <Text style={styles.primaryButtonText}>Iniciar sesión en GuavaLink</Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Image
            source={require('../../assets/images/guavalink-logo.png')}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerText}>© 2026 GuavaLink. Todos los derechos reservados.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  navbar: {
    width: '100%',
    maxWidth: 1200,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  navBrand: {
    justifyContent: 'center',
  },
  logo: {
    width: 140,
    height: 40,
  },
  navButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  navButtonText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  hero: {
    width: '100%',
    maxWidth: 900,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 100,
  },
  heroMobile: {
    paddingTop: 60,
    paddingBottom: 80,
  },
  badge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 24,
  },
  badgeText: {
    color: '#4ADE80',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 64,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    lineHeight: 70,
    letterSpacing: -2,
    marginBottom: 24,
  },
  heroTitleMobile: {
    fontSize: 42,
    lineHeight: 48,
  },
  textHighlight: {
    color: '#22C55E',
  },
  heroSubtitle: {
    fontSize: 18,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 600,
    lineHeight: 28,
    marginBottom: 40,
  },
  heroSubtitleMobile: {
    fontSize: 16,
    lineHeight: 24,
  },
  heroActions: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  secondaryButtonText: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingVertical: 60,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -1,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 600,
    marginBottom: 48,
  },
  bentoGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  bentoGridMobile: {
    flexDirection: 'column',
  },
  bentoCard: {
    flex: 1,
    minWidth: 300,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 24,
    padding: 32,
  },
  bentoLarge: {
    flexBasis: '100%',
  },
  bentoIcon: {
    fontSize: 32,
    marginBottom: 20,
  },
  bentoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  bentoText: {
    fontSize: 15,
    color: '#94A3B8',
    lineHeight: 24,
  },
  ctaSection: {
    width: '100%',
    maxWidth: 1200,
    paddingHorizontal: 24,
    paddingVertical: 100,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 32,
    letterSpacing: -1,
  },
  footer: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingVertical: 40,
    alignItems: 'center',
    gap: 16,
  },
  footerLogo: {
    width: 120,
    height: 30,
    tintColor: '#475569',
  },
  footerText: {
    color: '#475569',
    fontSize: 13,
  },
});