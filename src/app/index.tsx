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

  const handleSignIn = () => {
    if (!email.trim() || !password) {
      setMessage('Escribe tu correo y contraseña para continuar.');
      return;
    }

    setMessage('');
    setLoading(true);
    // TODO: conectar con el servicio de autenticación y validar el rol seleccionado.
    setTimeout(() => {
      setLoading(false);
      setMessage('El acceso estará disponible al conectar la autenticación de GuavaLink.');
    }, 650);
  };

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
