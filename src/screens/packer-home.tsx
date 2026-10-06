import RoleHome from '@/components/role-home';
import type { DemoAccount } from '@/data/demo-accounts';

export default function PackerHome({ account, onSignOut }: { account: DemoAccount; onSignOut: () => void }) {
  return (
    <RoleHome
      account={account}
      roleLabel="Empacador"
      description="Revisa un resumen sencillo del trabajo del empaque."
      cards={[
        { title: 'Recepciones de hoy', value: '08', detail: 'Fruta recibida en el empaque' },
        { title: 'Embarques activos', value: '03', detail: 'Uno listo para salir hoy' },
      ]}
      onSignOut={onSignOut}
    />
  );
}
