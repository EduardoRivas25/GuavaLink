// screens/producer-home.tsx
import RoleHome from '@/components/role-home';
import type { DemoAccount } from '@/data/demo-accounts';

export default function ProducerHome({ account, onSignOut, isDarkMode, toggleTheme }: { account: DemoAccount; onSignOut: () => void; isDarkMode: boolean; toggleTheme: () => void }) {
  return (
    <RoleHome
      account={account}
      roleLabel="Productor"
      description="Consulta un resumen sencillo de tu huerta y tus entregas."
      cards={[
        { title: 'Mi huerta', value: 'La Esperanza', detail: 'Folio HRT-001 • Michoacán' },
        { title: 'Entregas registradas', value: '03', detail: '2,450 kg entregados este mes' },
      ]}
      onSignOut={onSignOut}
      isDarkMode={isDarkMode}
      toggleTheme={toggleTheme}
    />
  );
}