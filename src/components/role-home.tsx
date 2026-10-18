// components/role-home.tsx
import type { DemoAccount } from '@/data/demo-accounts';
import { roleHomeStyles as styles } from '@/styles/role-home';
import { useEffect, useRef } from 'react';
import { Animated, Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type DemoCard = { title: string; value: string; detail: string };

type RoleHomeProps = {
  account: DemoAccount;
  roleLabel: string;
  description: string;
  cards: DemoCard[];
  onSignOut: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
};

export default function RoleHome({ account, roleLabel, description, cards, onSignOut, isDarkMode, toggleTheme }: RoleHomeProps) {
  const { width } = useWindowDimensions();
  const compact = width < 700;

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

  const t = {
    bg: isDarkMode ? '#000000' : '#f3f4f6',
    card: isDarkMode ? '#1d1d1f' : '#ffffff',
    text: isDarkMode ? '#f5f5f7' : '#111827',
    sub: isDarkMode ? '#86868b' : '#6b7280',
    border: isDarkMode ? '#292929' : '#d1d5db',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.bg }]}>
      <View style={[styles.header, compact && styles.headerCompact, { borderBottomColor: t.border }]}>
        <Image 
          source={isDarkMode ? require('../../assets/images/guavalink-brand-horizontal-dark.png') : require('../../assets/images/logo-horizontal-dark.png')} 
          style={[styles.logo, !isDarkMode && { tintColor: '#111827' }]} 
          resizeMode="contain" 
          accessibilityLabel="GuavaLink" 
        />
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          <Pressable onPress={toggleTheme}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Text style={{ fontSize: 24 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </Animated.View>
          </Pressable>

          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión y volver al inicio" onPress={onSignOut} style={[styles.signOutButton, { borderColor: t.border }]}>
            <Text style={[styles.signOutText, { color: t.text }]}>Cerrar sesión</Text>
          </Pressable>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
        <Text style={[styles.eyebrow, { color: t.sub }]}>VISTA DE DEMOSTRACIÓN • {roleLabel.toUpperCase()}</Text>
        <Text style={[styles.title, compact && styles.titleCompact, { color: t.text }]}>Hola, {account.name}.</Text>
        <Text style={[styles.description, { color: t.sub }]}>{description}</Text>
        <Text style={[styles.account, { color: t.sub }]}>Sesión de prueba: {account.email}</Text>
        
        <View style={[styles.cards, compact && styles.cardsCompact]}>
          {cards.map((card) => (
            <View key={card.title} style={[styles.card, compact && styles.cardCompact, { backgroundColor: t.card }]}>
              <Text style={[styles.cardTitle, { color: t.sub }]}>{card.title}</Text>
              <Text style={[styles.cardValue, { color: t.text }]}>{card.value}</Text>
              <Text style={[styles.cardDetail, { color: t.sub }]}>{card.detail}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.note, { color: t.sub }]}>Estos datos son ficticios. La información real se mostrará cuando se conecte el backend.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}