// screens/login.tsx
import AdminDashboard from '@/screens/dashboard';
import PackerHome from '@/screens/packer-home';
import ProducerHome from '@/screens/producer-home';
import { styles } from '@/styles/login';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export const ThemeContext = createContext({ isDarkMode: true, toggleTheme: async () => {} });

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const compact = width < 900;
  const narrow = width < 380;
  const tablet = width >= 900 && width < 1100;
  const shortScreen = !compact && height < 820;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeAccount, setActiveAccount] = useState<any>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('producer');
  
  const [isDarkMode, setIsDarkMode] = useState(true);
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('themePreference').then((savedTheme) => {
      if (savedTheme === 'light') {
        setIsDarkMode(false);
        spinAnim.setValue(1);
      }
    });
  }, []);

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    Animated.timing(spinAnim, {
      toValue: newTheme ? 0 : 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
  };

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const validatePassword = (pass: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(pass);
  };

  const translateError = (errorMsg: string) => {
    if (errorMsg.includes('Invalid login credentials')) {
      return 'Correo o contraseña incorrectos. Verifica tus datos.';
    }
    if (errorMsg.includes('User already registered')) {
      return 'Ya existe una cuenta registrada con este correo.';
    }
    if (errorMsg.includes('rate limit')) {
      return 'Demasiados intentos. Intenta de nuevo más tarde.';
    }
    return 'Ocurrió un error. Verifica la información e intenta de nuevo.';
  };

  const handleAuth = async () => {
    if (isLogin) {
      if (!email.trim() || !password) {
        setMessage('Escribe tu correo y contraseña para continuar.');
        return;
      }
    } else {
      if (!name.trim() || !email.trim() || !password || !confirmPassword) {
        setMessage('Completa todos los campos para registrarte.');
        return;
      }
      if (password !== confirmPassword) {
        setMessage('Las contraseñas no coinciden.');
        return;
      }
      if (!validatePassword(password)) {
        setMessage('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.');
        return;
      }
    }
    setMessage('');
    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setMessage(translateError(error.message));
      } else if (data.user) {
        const userRole = data.user.user_metadata?.role || 'producer';
        const userName = data.user.user_metadata?.name || 'Usuario';
        setActiveAccount({ email: data.user.email, role: userRole, name: userName });
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            role: role,
            name: name.trim(),
          },
        },
      });
      if (error) {
        setMessage(translateError(error.message));
      } else {
        setMessage('');
        setIsLogin(true);
        setName('');
        setConfirmPassword('');
        Alert.alert('Éxito', `Cuenta de ${name.trim()} registrada. Ahora puedes iniciar sesión.`);
      }
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActiveAccount(null);
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
    setPasswordVisible(false);
    setConfirmPasswordVisible(false);
    setMessage('');
  };

  const fillDemoAccount = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('Guava2026!');
    if (!isLogin) {
      setRole(demoRole);
      setName('Usuario Demo');
      setConfirmPassword('Guava2026!');
    }
    setMessage('');
  };

  if (activeAccount) {
    if (activeAccount.role === 'admin') {
      return <AdminDashboard onSignOut={handleSignOut} account={activeAccount} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
    }
    if (activeAccount.role === 'producer' || activeAccount.role === 'productor') {
      return <ProducerHome account={activeAccount} onSignOut={handleSignOut} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
    }
    if (activeAccount.role === 'packer' || activeAccount.role === 'empacador') {
      return <PackerHome account={activeAccount} onSignOut={handleSignOut} isDarkMode={isDarkMode} toggleTheme={toggleTheme} />;
    }
  }

  const themeStyles = {
    bg: isDarkMode ? '#0a0a0a' : '#f3f4f6',
    cardBg: isDarkMode ? '#1a1a1a' : '#ffffff',
    text: isDarkMode ? '#ffffff' : '#111827',
    subText: isDarkMode ? '#777a75' : '#6b7280',
    inputBg: isDarkMode ? '#0a0a0a' : '#f9fafb',
    borderColor: isDarkMode ? '#333' : '#d1d5db',
    demoBg: isDarkMode ? 'rgba(0,0,0,0.5)' : '#f9fafb',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeStyles.bg }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.page, compact && styles.pageCompact, narrow && styles.pageNarrow, { backgroundColor: themeStyles.bg }]}>
            <View style={[styles.topBar, shortScreen && styles.topBarShort, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', paddingRight: 20 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', zIndex: 10 }}>
                <Pressable onPress={toggleTheme} style={{ marginRight: 15, padding: 5 }}>
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Text style={{ fontSize: 24 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
                  </Animated.View>
                </Pressable>
                <Image
                  source={require('../../assets/images/logo-horizontal-dark.png')}
                  style={[styles.logo, !isDarkMode && { tintColor: '#111827' }]}
                  resizeMode="contain"
                  accessibilityLabel="GuavaLink"
                />
              </View>
            </View>

            <View style={[styles.main, compact && styles.mainCompact, tablet && styles.mainTablet, shortScreen && styles.mainShort]}>
              <View style={[styles.intro, compact && styles.introCompact]}>
                <View style={styles.eyebrowRow}>
                  <View style={[styles.eyebrowLine, { backgroundColor: themeStyles.subText }]} />
                  <Text style={[styles.eyebrow, { color: themeStyles.subText }]}>EMPAQUE DE EXPORTACIÓN</Text>
                </View>
                <Text style={[styles.headline, tablet && styles.headlineTablet, compact && styles.headlineCompact, narrow && styles.headlineNarrow, { color: themeStyles.text }]}>Del campo{'\n'}a tu pantalla.</Text>
                <Text style={[styles.description, { color: themeStyles.subText }]}>
                  La operación de tu empaque, conectada de principio a fin.
                </Text>

                {!compact && (
                  <View style={[styles.produceFrame, shortScreen && styles.produceFrameShort, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]}>
                    <Image
                      source={require('../../assets/GUAYABA-1.webp')}
                      style={styles.produceImage}
                      resizeMode="contain"
                    />
                    <View style={[styles.imageCaption, { backgroundColor: isDarkMode ? '#333' : '#e5e7eb' }]}>
                      <View style={styles.captionDot} />
                      <Text style={[styles.captionText, { color: isDarkMode ? '#fff' : '#111827' }]}>DEL CAMPO A CADA EMBARQUE</Text>
                    </View>
                  </View>
                )}

                {!compact && <View style={[styles.featureList, shortScreen && styles.featureListShort]}>
                  <FeatureItem number="01" title="Recepciones trazables" detail="Cada kilo, desde el patio." isDark={isDarkMode} />
                  <FeatureItem number="02" title="Productores conectados" detail="Entregas y pagos al día." isDark={isDarkMode} />
                  <FeatureItem number="03" title="Embarques bajo control" detail="Información que fluye." last isDark={isDarkMode} />
                </View>}
              </View>

              <View style={[styles.loginCard, tablet && styles.loginCardTablet, compact && styles.loginCardCompact, narrow && styles.loginCardNarrow, shortScreen && styles.loginCardShort, { backgroundColor: themeStyles.cardBg, borderColor: themeStyles.borderColor }]}>
                <View style={styles.cardHeading}>
                  <View>
                    <Text style={[styles.cardEyebrow, { color: themeStyles.subText }]}>{isLogin ? 'BIENVENIDO DE NUEVO' : 'CREA TU CUENTA'}</Text>
                    <Text style={[styles.cardTitle, { color: themeStyles.text }]}>{isLogin ? 'Inicia sesión' : 'Regístrate'}</Text>
                  </View>
                  <Image
                    source={require('../../assets/images/guavalink-mark.png')}
                    style={[styles.cardMark, !isDarkMode && { tintColor: '#111827' }]}
                    resizeMode="contain"
                  />
                </View>

                {!isLogin && (
                  <>
                    <Text style={[styles.fieldLabel, { color: themeStyles.subText }]}>Nombre completo</Text>
                    <TextInput
                      autoCapitalize="words"
                      onChangeText={(value) => {
                        setName(value);
                        setMessage('');
                      }}
                      placeholder="Ej. Alejandro"
                      placeholderTextColor="#777a75"
                      returnKeyType="next"
                      style={[styles.input, { backgroundColor: themeStyles.inputBg, color: themeStyles.text, borderColor: themeStyles.borderColor }]}
                      value={name}
                    />
                  </>
                )}

                <Text style={[styles.fieldLabel, { color: themeStyles.subText }]}>Correo electrónico</Text>
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  onChangeText={(value) => {
                    setEmail(value);
                    setMessage('');
                  }}
                  placeholder="nombre@guavalink.mx"
                  placeholderTextColor="#777a75"
                  returnKeyType="next"
                  style={[styles.input, { backgroundColor: themeStyles.inputBg, color: themeStyles.text, borderColor: themeStyles.borderColor }]}
                  value={email}
                />

                <View style={styles.passwordLabelRow}>
                  <Text style={[styles.fieldLabel, { color: themeStyles.subText }]}>Contraseña</Text>
                  {isLogin && (
                    <Pressable onPress={() => setMessage('Solicita a tu administrador el restablecimiento de contraseña.')}>
                      <Text style={styles.linkText}>¿La olvidaste?</Text>
                    </Pressable>
                  )}
                </View>
                <View style={styles.passwordWrap}>
                  <TextInput
                    autoCapitalize="none"
                    onChangeText={(value) => {
                      setPassword(value);
                      setMessage('');
                    }}
                    onSubmitEditing={isLogin ? handleAuth : undefined}
                    placeholder="Tu contraseña"
                    placeholderTextColor="#777a75"
                    returnKeyType={isLogin ? "go" : "next"}
                    secureTextEntry={!passwordVisible}
                    style={[styles.passwordInput, { backgroundColor: themeStyles.inputBg, color: themeStyles.text, borderColor: themeStyles.borderColor }]}
                    value={password}
                  />
                  <Pressable onPress={() => setPasswordVisible(!passwordVisible)} style={styles.visibilityButton}>
                    <Text style={[styles.visibilityText, { color: themeStyles.subText }]}>{passwordVisible ? 'Ocultar' : 'Mostrar'}</Text>
                  </Pressable>
                </View>

                {!isLogin && (
                  <>
                    <View style={styles.passwordLabelRow}>
                      <Text style={[styles.fieldLabel, { color: themeStyles.subText }]}>Confirmar Contraseña</Text>
                    </View>
                    <View style={styles.passwordWrap}>
                      <TextInput
                        autoCapitalize="none"
                        onChangeText={(value) => {
                          setConfirmPassword(value);
                          setMessage('');
                        }}
                        onSubmitEditing={handleAuth}
                        placeholder="Repite tu contraseña"
                        placeholderTextColor="#777a75"
                        returnKeyType="go"
                        secureTextEntry={!confirmPasswordVisible}
                        style={[styles.passwordInput, { backgroundColor: themeStyles.inputBg, color: themeStyles.text, borderColor: themeStyles.borderColor }]}
                        value={confirmPassword}
                      />
                      <Pressable onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} style={styles.visibilityButton}>
                        <Text style={[styles.visibilityText, { color: themeStyles.subText }]}>{confirmPasswordVisible ? 'Ocultar' : 'Mostrar'}</Text>
                      </Pressable>
                    </View>

                    <View style={{ marginTop: 15, marginBottom: 5 }}>
                      <Text style={[styles.fieldLabel, { color: themeStyles.subText }]}>Selecciona tu rol</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        {['admin', 'producer', 'packer'].map(r => (
                          <Pressable 
                            key={r}
                            style={[
                              { flex: 1, padding: 12, borderWidth: 1, borderColor: themeStyles.borderColor, borderRadius: 8, marginHorizontal: 2, alignItems: 'center' },
                              role === r && { borderColor: '#007AFF', backgroundColor: 'rgba(0, 122, 255, 0.1)' }
                            ]}
                            onPress={() => setRole(r)}
                          >
                            <Text style={[{ color: themeStyles.subText, fontWeight: 'bold', fontSize: 12 }, role === r && { color: '#007AFF' }]}>
                              {r === 'admin' ? 'Admin' : r === 'producer' ? 'Productor' : 'Empacador'}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  </>
                )}

                <Pressable
                  disabled={loading}
                  onPress={handleAuth}
                  style={({ pressed }) => [styles.submitButton, pressed && !loading && styles.submitPressed, { marginTop: 24 }]}
                >
                  {loading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.submitText}>{isLogin ? 'Entrar a GuavaLink' : 'Registrar Cuenta'} <Text style={styles.arrow}>→</Text></Text>
                  )}
                </Pressable>

                <View style={styles.separatorRow}>
                  <View style={[styles.separatorLine, { backgroundColor: themeStyles.borderColor }]} />
                  <Text style={[styles.separatorText, { color: themeStyles.subText }]}>o continúa con</Text>
                  <View style={[styles.separatorLine, { backgroundColor: themeStyles.borderColor }]} />
                </View>

                <Pressable
                  onPress={() => {
                    setIsLogin(!isLogin);
                    setMessage('');
                    setName('');
                    setConfirmPassword('');
                  }}
                  style={({ pressed }) => [styles.googleButton, pressed && styles.googlePressed, { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.borderColor }]}
                >
                  <Text style={[styles.googleText, { color: themeStyles.text }]}>{isLogin ? 'Crear una cuenta nueva' : 'Ya tengo cuenta'}</Text>
                </Pressable>

                {message ? <Text accessibilityLiveRegion="polite" style={[styles.message, { color: '#ff4444', marginTop: 15 }]}>{message}</Text> : null}

                {isLogin && (
                  <View style={styles.demoAccounts}>
                    <Text style={[styles.demoTitle, { color: themeStyles.subText }]}>ACCESOS DE PRUEBA</Text>
                    
                    <Pressable onPress={() => fillDemoAccount('admin@prueba.com', 'admin')} style={[styles.demoAccount, { backgroundColor: themeStyles.demoBg, borderColor: themeStyles.borderColor }]}>
                      <Text style={[styles.demoRole, { color: themeStyles.text }]}>Administrador</Text>
                      <Text style={[styles.demoEmail, { color: themeStyles.subText }]}>admin@prueba.com</Text>
                    </Pressable>
                    
                    <Pressable onPress={() => fillDemoAccount('productor1@prueba.com', 'producer')} style={[styles.demoAccount, { backgroundColor: themeStyles.demoBg, borderColor: themeStyles.borderColor }]}>
                      <Text style={[styles.demoRole, { color: themeStyles.text }]}>Productor</Text>
                      <Text style={[styles.demoEmail, { color: themeStyles.subText }]}>productor1@prueba.com</Text>
                    </Pressable>
                    
                    <Pressable onPress={() => fillDemoAccount('empacador1@prueba.com', 'packer')} style={[styles.demoAccount, { backgroundColor: themeStyles.demoBg, borderColor: themeStyles.borderColor }]}>
                      <Text style={[styles.demoRole, { color: themeStyles.text }]}>Empacador</Text>
                      <Text style={[styles.demoEmail, { color: themeStyles.subText }]}>empacador1@prueba.com</Text>
                    </Pressable>
                    <Text style={[styles.demoHint, { color: themeStyles.subText }]}>Para esta demostración, la contraseña es Guava2026!</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.footer, compact && styles.footerCompact]}>
              <Text style={[styles.footerText, { color: themeStyles.subText }]}>© 2026 GuavaLink</Text>
              {!compact && <Text style={[styles.footerCenter, { color: themeStyles.subText }]}>De la huerta al mundo.</Text>}
              <Text style={[styles.footerText, { color: themeStyles.subText }]}>Hecho para el campo</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FeatureItem({ number, title, detail, last = false, isDark = true }: { number: string; title: string; detail: string; last?: boolean, isDark?: boolean }) {
  return (
    <View style={[styles.featureItem, last && styles.featureItemLast, !isDark && { borderBottomColor: '#e5e7eb' }]}>
      <Text style={styles.featureNumber}>{number}</Text>
      <View style={styles.featureCopy}>
        <Text style={[styles.featureTitle, !isDark && { color: '#111827' }]}>{title}</Text>
        <Text style={[styles.featureDetail, !isDark && { color: '#6b7280' }]}>{detail}</Text>
      </View>
      <Text style={styles.featureArrow}>→</Text>
    </View>
  );
}