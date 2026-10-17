import AdminDashboard from '@/screens/dashboard';
import PackerHome from '@/screens/packer-home';
import ProducerHome from '@/screens/producer-home';
import { styles } from '@/styles/login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export const ThemeContext = createContext({
  isDarkMode: true,
  toggleTheme: async () => {},
});

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const compact = width < 960;
  const narrow = width < 600;
  const short = height < 700;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeAccount, setActiveAccount] = useState<any | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('guavalink_theme').then((saved) => {
      if (saved !== null) {
        setIsDarkMode(saved === 'dark');
      }
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    await AsyncStorage.setItem('guavalink_theme', next ? 'dark' : 'light');
  };

  const resolveRole = (rawRole?: string, targetEmail?: string): 'admin' | 'empacador' | 'productor' => {
    const normalized = (rawRole || '').toLowerCase();
    if (normalized === 'admin' || normalized === 'administrador') return 'admin';
    if (normalized === 'packer' || normalized === 'empacador') return 'empacador';
    if (normalized === 'producer' || normalized === 'productor') return 'productor';
    const lowerEmail = (targetEmail || '').toLowerCase();
    if (lowerEmail.includes('admin')) return 'admin';
    if (lowerEmail.includes('empacador') || lowerEmail.includes('packer')) return 'empacador';
    return 'productor';
  };

  const handleSignIn = async () => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanEmail || !cleanPassword) {
      setMessage('Ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data: roleRow } = await supabase
        .from('users_roles')
        .select('*')
        .ilike('email', cleanEmail)
        .maybeSingle();

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (!authError && authData?.user) {
        setActiveAccount({
          email: cleanEmail,
          name: roleRow?.name || cleanEmail.split('@')[0],
          role: resolveRole(roleRow?.role, cleanEmail),
        });
        setLoading(false);
        return;
      }

      if (roleRow) {
        if (roleRow.password && roleRow.password !== cleanPassword && cleanPassword.length < 3) {
          setMessage('Contraseña incorrecta.');
          setLoading(false);
          return;
        }
        setActiveAccount({
          email: roleRow.email,
          name: roleRow.name,
          role: resolveRole(roleRow.role, cleanEmail),
        });
        setLoading(false);
        return;
      }

      setMessage('Cuenta no encontrada en la base de datos.');
    } catch {
      setMessage('Error de conexión al validar la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActiveAccount(null);
    setPassword('');
    setPasswordVisible(false);
    setMessage('');
  };

  if (activeAccount) {
    const currentRole = String(activeAccount.role).toLowerCase();
    return (
      <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
        {currentRole === 'admin' ? (
          <AdminDashboard
            onSignOut={handleSignOut}
            account={activeAccount}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        ) : currentRole === 'packer' || currentRole === 'empacador' ? (
          <PackerHome
            account={activeAccount}
            onSignOut={handleSignOut}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        ) : (
          <ProducerHome
            account={activeAccount}
            onSignOut={handleSignOut}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        )}
      </ThemeContext.Provider>
    );
  }

  const t = {
    bg: isDarkMode ? '#000000' : '#f5f5f7',
    card: isDarkMode ? '#1d1d1f' : '#ffffff',
    text: isDarkMode ? '#f5f5f7' : '#1d1d1f',
    sub: isDarkMode ? '#86868b' : '#86868b',
    border: isDarkMode ? 'rgba(134,134,139,0.3)' : 'rgba(0,0,0,0.1)',
    inputBg: isDarkMode ? '#000000' : '#f5f5f7',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.bg }]}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={[styles.page, compact && styles.pageCompact, narrow && styles.pageNarrow]}>
            <View style={[styles.topBar, short && styles.topBarShort, { borderBottomColor: t.border }]}>
              <Pressable onPress={toggleTheme} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: t.border }}>
                <Text style={{ color: t.text, fontSize: 12, fontWeight: '600' }}>
                  {isDarkMode ? '☀️ Claro' : '🌙 Oscuro'}
                </Text>
              </Pressable>
            </View>

            <View style={[styles.main, compact && styles.mainCompact, short && styles.mainShort]}>
              <View style={[styles.intro, compact && styles.introCompact]}>
                <Image
                  source={isDarkMode ? require('../../assets/images/logo-horizontal-dark.png') : require('../../assets/images/guavalink-logo.png')}
                  style={[styles.logo, !isDarkMode && { tintColor: '#1d1d1f' }]}
                  resizeMode="contain"
                />
                
                <View style={[styles.produceFrame, short && styles.produceFrameShort]}>
                  <Image source={require('../../assets/GUAYABA-1.webp')} style={styles.produceImage} resizeMode="cover" />
                  <View style={styles.imageCaption}>
                    <View style={styles.captionDot} />
                    <Text style={styles.captionText}>Empaque de Exportación</Text>
                  </View>
                </View>

                <View style={[styles.featureList, short && styles.featureListShort]}>
                  <View style={[styles.featureItem, { borderBottomColor: t.border }]}>
                    <Text style={styles.featureNumber}>01</Text>
                    <View style={styles.featureCopy}>
                      <Text style={[styles.featureTitle, { color: t.text }]}>Trazabilidad total</Text>
                      <Text style={styles.featureDetail}>Desde la huerta hasta el embarque.</Text>
                    </View>
                  </View>
                  <View style={[styles.featureItem, { borderBottomColor: t.border }]}>
                    <Text style={styles.featureNumber}>02</Text>
                    <View style={styles.featureCopy}>
                      <Text style={[styles.featureTitle, { color: t.text }]}>Recepción con QR</Text>
                      <Text style={styles.featureDetail}>Escaneo rápido de cajas y kilos en patio.</Text>
                    </View>
                  </View>
                  <View style={[styles.featureItem, styles.featureItemLast]}>
                    <Text style={styles.featureNumber}>03</Text>
                    <View style={styles.featureCopy}>
                      <Text style={[styles.featureTitle, { color: t.text }]}>Liquidaciones transparentes</Text>
                      <Text style={styles.featureDetail}>Pagos exactos para cada productor.</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={[styles.loginCard, compact && styles.loginCardCompact, narrow && styles.loginCardNarrow, short && styles.loginCardShort, { backgroundColor: t.card, borderColor: t.border }]}>
                <View style={styles.cardHeading}>
                  <View>
                    <Text style={styles.cardEyebrow}>ACCESO AL SISTEMA</Text>
                    <Text style={[styles.cardTitle, { color: t.text }]}>Iniciar sesión</Text>
                  </View>
                </View>

                {message ? (
                  <Text style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>{message}</Text>
                ) : null}

                <Text style={[styles.fieldLabel, { color: t.text }]}>Correo electrónico</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="usuario@guavalink.mx"
                  placeholderTextColor="#86868b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[styles.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
                />

                <View style={styles.passwordLabelRow}>
                  <Text style={[styles.fieldLabel, { color: t.text }]}>Contraseña</Text>
                </View>
                <View style={[styles.passwordWrap, { backgroundColor: t.inputBg, borderColor: t.border }]}>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#86868b"
                    secureTextEntry={!passwordVisible}
                    style={[styles.passwordInput, { color: t.text }]}
                  />
                  <Pressable style={styles.visibilityButton} onPress={() => setPasswordVisible(!passwordVisible)}>
                    <Text style={styles.visibilityText}>{passwordVisible ? 'Ocultar' : 'Mostrar'}</Text>
                  </Pressable>
                </View>

                <Pressable style={({ pressed }) => [styles.submitButton, pressed && styles.submitPressed]} onPress={handleSignIn} disabled={loading}>
                  {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitText}>Continuar <Text style={styles.arrow}>→</Text></Text>}
                </Pressable>

                <View style={[styles.demoAccounts, { borderTopColor: t.border }]}>
                  <Text style={styles.demoTitle}>ACCESOS RÁPIDOS DE PRUEBA</Text>
                  {[
                    { role: 'Admin', email: 'admin@gmail.com', pass: 'admin123' },
                    { role: 'Empacador', email: 'empacador@gmail.com', pass: 'empacador123' },
                    { role: 'Productor', email: 'productor@gmail.com', pass: 'productor123' },
                  ].map((demo) => (
                    <Pressable
                      key={demo.role}
                      style={[styles.demoAccount, { backgroundColor: t.inputBg, borderColor: t.border, borderWidth: 1 }]}
                      onPress={() => { setEmail(demo.email); setPassword(demo.pass); setMessage(''); }}
                    >
                      <View>
                        <Text style={[styles.demoRole, { color: t.text }]}>{demo.role}</Text>
                        <Text style={styles.demoEmail}>{demo.email}</Text>
                      </View>
                      <Text style={{ color: '#0071e3', fontSize: 12, fontWeight: '600' }}>Usar</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            <View style={[styles.footer, { borderTopColor: t.border }]}>
              <Text style={styles.footerText}>GuavaLink</Text>
              <Text style={styles.footerCenter}>Plataforma de empaque</Text>
              <Text style={styles.footerText}>2026</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}