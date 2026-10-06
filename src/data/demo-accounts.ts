export type DemoRole = 'admin' | 'productor' | 'empacador';

export type DemoAccount = {
  email: string;
  name: string;
  role: DemoRole;
};

export const demoAccounts: DemoAccount[] = [
  { email: 'admin@gmail.com', name: 'Alejandro Cruz', role: 'admin' },
  { email: 'productor@gmail.com', name: 'José Martínez López', role: 'productor' },
  { email: 'empacador@gmail.com', name: 'Equipo de recepción', role: 'empacador' },
];

export function findDemoAccount(email: string): DemoAccount | undefined {
  return demoAccounts.find((account) => account.email === email.trim().toLowerCase());
}
