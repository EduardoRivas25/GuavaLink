import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { demoAccounts, findDemoAccount, type DemoAccount } from '@/data/demo-accounts';
import AdminDashboard from '@/screens/dashboard';
import PackerHome from '@/screens/packer-home';
import ProducerHome from '@/screens/producer-home';
import { styles } from '@/styles/login';

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const compact = width < 900;
  const narrow = width < 380;
  const tablet = width >= 900 && width < 1100;
  const shortScreen = !compact && height < 820;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeAccount, setActiveAccount] = useState<DemoAccount | null>(null);

  const handleSignIn = () => {
    if (!email.trim() || !password) {
      setMessage('Escribe tu correo y contraseña para continuar.');
      return;
    }
    const account = findDemoAccount(email);
    if (!account) {
      setMessage('Este correo no tiene una cuenta de demostración. Elige uno de los accesos de prueba.');
      return;
    }

    setMessage('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setActiveAccount(account);
    }, 250);
  };

  const handleSignOut = () => {
    setActiveAccount(null);
    setEmail('');
    setPassword('');
    setPasswordVisible(false);
    setMessage('');
  };

  if (activeAccount?.role === 'admin') return <AdminDashboard onSignOut={handleSignOut} />;
  if (activeAccount?.role === 'productor') return <ProducerHome account={activeAccount} onSignOut={handleSignOut} />;
  if (activeAccount?.role === 'empacador') return <PackerHome account={activeAccount} onSignOut={handleSignOut} />;

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

                <View style={styles.demoAccounts}>
                  <Text style={styles.demoTitle}>ACCESOS DE PRUEBA</Text>
                  {demoAccounts.map((account) => (
                    <Pressable key={account.email} accessibilityRole="button" accessibilityLabel={`Usar cuenta de ${account.role}`} onPress={() => { setEmail(account.email); setMessage(''); }} style={styles.demoAccount}>
                      <Text style={styles.demoRole}>{account.role === 'admin' ? 'Administrador' : account.role === 'productor' ? 'Productor' : 'Empacador'}</Text>
                      <Text style={styles.demoEmail}>{account.email}</Text>
                    </Pressable>
                  ))}
                  <Text style={styles.demoHint}>Para esta demostración, escribe cualquier contraseña.</Text>
                </View>

                <View style={styles.secureNote}>
                  <Text style={styles.lockIcon}>◇</Text>
                  <Text style={styles.secureText}>Acceso de demostración para personal y productores</Text>
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
