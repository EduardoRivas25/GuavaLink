import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { DemoAccount } from '@/data/demo-accounts';
import { roleHomeStyles as styles } from '@/styles/role-home';

type DemoCard = { title: string; value: string; detail: string };

type RoleHomeProps = {
  account: DemoAccount;
  roleLabel: string;
  description: string;
  cards: DemoCard[];
  onSignOut: () => void;
};

export default function RoleHome({ account, roleLabel, description, cards, onSignOut }: RoleHomeProps) {
  const { width } = useWindowDimensions();
  const compact = width < 700;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, compact && styles.headerCompact]}>
        <Image source={require('../../assets/images/guavalink-brand-horizontal-dark.png')} style={styles.logo} resizeMode="contain" accessibilityLabel="GuavaLink" />
        <Pressable accessibilityRole="button" accessibilityLabel="Cerrar sesión y volver al inicio" onPress={onSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={[styles.content, compact && styles.contentCompact]} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>VISTA DE DEMOSTRACIÓN · {roleLabel.toUpperCase()}</Text>
        <Text style={[styles.title, compact && styles.titleCompact]}>Hola, {account.name}.</Text>
        <Text style={styles.description}>{description}</Text>
        <Text style={styles.account}>Sesión de prueba: {account.email}</Text>
        <View style={[styles.cards, compact && styles.cardsCompact]}>
          {cards.map((card) => (
            <View key={card.title} style={[styles.card, compact && styles.cardCompact]}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardValue}>{card.value}</Text>
              <Text style={styles.cardDetail}>{card.detail}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.note}>Estos datos son ficticios. La información real se mostrará cuando se conecte el backend.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
