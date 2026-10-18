import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { NavGlyph } from '@/components/dashboard-glyphs';
import { dashboardStyles } from '@/styles/dashboard';
import { initialProducers, producerFullName } from '@/screens/producers';

type AccountRole = 'Productor' | 'Empacador';
type UserAccount = { id: string; name: string; email: string; role: AccountRole; producerFolio?: string; active: boolean; password: string };
const initialUserAccounts: UserAccount[] = [
  ...initialProducers.filter((producer) => producer.active).map((producer, index): UserAccount => ({ id: `USR-${producer.folio}`, name: producerFullName(producer), email: `${producer.nombres.toLowerCase().replaceAll(' ', '.')}@guavalink.mx`, role: 'Productor', producerFolio: producer.folio, active: true, password: `Demo-${index + 1}-Guava` })),
  { id: 'USR-EMP-001', name: 'Alejandro Cruz', email: 'alejandro.cruz@guavalink.mx', role: 'Empacador', active: true, password: 'Demo-Empacador-1' },
  { id: 'USR-EMP-002', name: 'Equipo de recepción', email: 'recepcion@guavalink.mx', role: 'Empacador', active: true, password: 'Demo-Empacador-2' },
];

export default function UsersRolesScreen({ compact }: { compact: boolean }) {
  const [accounts, setAccounts] = useState(initialUserAccounts);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Todos' | 'Activas' | 'Inactivas'>('Todos');
  const [roleFilter, setRoleFilter] = useState<'Todos' | AccountRole>('Todos');
  const [mode, setMode] = useState<'new' | 'password' | null>(null);
  const [role, setRole] = useState<AccountRole>('Empacador');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [producerFolio, setProducerFolio] = useState('');
  const [target, setTarget] = useState<UserAccount | null>(null);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [notice, setNotice] = useState('');

  const linkedProducerFolios = accounts.filter((account) => account.role === 'Productor').map((account) => account.producerFolio);
  const availableProducers = initialProducers.filter((producer) => producer.active && !linkedProducerFolios.includes(producer.folio));
  const visible = accounts.filter((account) => {
    const matchesText = `${account.name} ${account.email} ${account.role} ${account.producerFolio ?? ''}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (filter === 'Todos' || account.active === (filter === 'Activas')) && (roleFilter === 'Todos' || account.role === roleFilter);
  });
  const openNew = () => {
    setRole('Empacador'); setName(''); setEmail(''); setPassword(''); setProducerFolio(availableProducers[0]?.folio ?? ''); setNotice(''); setMode('new');
  };
  const openPassword = (account: UserAccount) => {
    setTarget(account); setPassword(''); setConfirmation(''); setNotice(''); setMode('password');
  };
  const saveNew = () => {
    if (role === 'Productor') {
      const producer = initialProducers.find((item) => item.folio === producerFolio && item.active);
      if (!producer || linkedProducerFolios.includes(producerFolio)) { setNotice('Selecciona un productor activo que aún no tenga cuenta.'); return; }
      if (password.trim().length < 8) { setNotice('La contraseña debe tener al menos 8 caracteres.'); return; }
      const account: UserAccount = { id: `USR-${producer.folio}`, name: producerFullName(producer), email: email.trim().toLowerCase(), role, producerFolio: producer.folio, active: true, password };
      setAccounts((current) => [...current, account]); setMode(null); return;
    }
    if (!name.trim() || !email.trim() || !email.includes('@')) { setNotice('Escribe el nombre y un correo electrónico válido.'); return; }
    if (password.trim().length < 8) { setNotice('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (accounts.some((account) => account.email.toLowerCase() === email.trim().toLowerCase())) { setNotice('Ya existe una cuenta con ese correo.'); return; }
    setAccounts((current) => [...current, { id: `USR-EMP-${String(current.filter((account) => account.role === 'Empacador').length + 1).padStart(3, '0')}-${Date.now()}`, name: name.trim(), email: email.trim().toLowerCase(), role: 'Empacador', active: true, password }]); setMode(null);
  };
  const savePassword = () => {
    if (!target) return;
    if (password.trim().length < 8) { setNotice('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (password !== confirmation) { setNotice('Las contraseñas no coinciden.'); return; }
    setAccounts((current) => current.map((account) => account.id === target.id ? { ...account, password } : account)); setMode(null);
  };
  const toggleAccount = (account: UserAccount) => {
    setAccounts((current) => current.map((item) => item.id === account.id ? { ...item, active: !item.active } : item));
  };

  return <ScrollView contentContainerStyle={[dashboardStyles.producerContent, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
    <View style={[dashboardStyles.producerHeading, compact && dashboardStyles.producerHeadingCompact]}>
      <View style={dashboardStyles.welcomeCopy}><Text style={dashboardStyles.eyebrow}>MI EMPAQUE</Text><Text style={[dashboardStyles.producerTitle, compact && dashboardStyles.producerTitleCompact]}>Usuarios y roles</Text><Text style={dashboardStyles.subtitle}>Administra accesos de productores y personal de recepción.</Text></View>
      <Pressable style={dashboardStyles.newButton} onPress={openNew}><Text style={dashboardStyles.newButtonText}>＋  Nueva cuenta</Text></Pressable>
    </View>
    <View style={dashboardStyles.producerStats}>
      <View style={[dashboardStyles.producerStatCard, compact && dashboardStyles.producerStatCardCompact]}><View style={dashboardStyles.statTop}><Text style={dashboardStyles.statLabel}>Cuentas registradas</Text><View style={dashboardStyles.statIcon}><NavGlyph name="users" /></View></View><Text style={dashboardStyles.statValue}>{String(accounts.length).padStart(2, '0')}</Text><Text style={dashboardStyles.producerStatNote}>Accesos del empaque</Text></View>
      <View style={[dashboardStyles.producerStatCard, compact && dashboardStyles.producerStatCardCompact]}><View style={dashboardStyles.statTop}><Text style={dashboardStyles.statLabel}>Cuentas activas</Text><View style={dashboardStyles.statIcon}><Text style={dashboardStyles.statGlyph}>✓</Text></View></View><Text style={dashboardStyles.statValue}>{String(accounts.filter((account) => account.active).length).padStart(2, '0')}</Text><Text style={dashboardStyles.producerStatNote}>Pueden iniciar sesión</Text></View>
    </View>
    <View style={[dashboardStyles.producerToolbar, compact && dashboardStyles.producerToolbarCompact]}>
      <View style={[dashboardStyles.producerSearch, compact && dashboardStyles.producerSearchCompact]}><Text style={dashboardStyles.searchGlyph}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Buscar por nombre, correo o folio..." placeholderTextColor="#86868b" style={dashboardStyles.producerSearchInput} accessibilityLabel="Buscar cuentas" /></View>
      <View style={dashboardStyles.userFilters}>
        <Pressable style={dashboardStyles.filterButton} onPress={() => setRoleFilter((value) => value === 'Todos' ? 'Productor' : value === 'Productor' ? 'Empacador' : 'Todos')}><Text style={dashboardStyles.filterText}>{roleFilter}  ⌄</Text></Pressable>
        <Pressable style={dashboardStyles.filterButton} onPress={() => setFilter((value) => value === 'Todos' ? 'Activas' : value === 'Activas' ? 'Inactivas' : 'Todos')}><Text style={dashboardStyles.filterText}>{filter}  ⌄</Text></Pressable>
      </View>
    </View>
    {compact ? <View style={dashboardStyles.producerCards}>{visible.map((account) => <View key={account.id} style={dashboardStyles.producerCard}><View style={dashboardStyles.producerMobileHeading}><View style={dashboardStyles.producerAvatar}><Text style={dashboardStyles.producerInitials}>{account.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</Text></View><View style={dashboardStyles.producerMobileCopy}><Text style={dashboardStyles.producerName}>{account.name}</Text><Text style={dashboardStyles.producerMeta}>{account.email}</Text><View style={dashboardStyles.userRoleLine}><NavGlyph name={account.role === 'Productor' ? 'role-producer' : 'role-packer'} /><Text style={dashboardStyles.userRoleLabel}>{account.role}{account.producerFolio ? ` · ${account.producerFolio}` : ''}</Text></View></View><Text style={[dashboardStyles.statusBadge, account.active ? dashboardStyles.statusActive : dashboardStyles.statusInactive]}>{account.active ? 'Activa' : 'Inactiva'}</Text></View><View style={dashboardStyles.producerMobileFooter}><Pressable accessibilityRole="button" accessibilityLabel={`Cambiar contraseña de ${account.name}`} style={dashboardStyles.userActionButton} onPress={() => openPassword(account)}><NavGlyph name="key" active /><Text style={dashboardStyles.userActionText}>Contraseña</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`${account.active ? 'Dar de baja' : 'Reactivar'} cuenta de ${account.name}`} style={dashboardStyles.userActionButton} onPress={() => toggleAccount(account)}><NavGlyph name={account.active ? 'disable' : 'enable'} active /><Text style={dashboardStyles.userActionText}>{account.active ? 'Dar de baja' : 'Reactivar'}</Text></Pressable></View></View>)}</View> : <ScrollView horizontal showsHorizontalScrollIndicator><View style={dashboardStyles.userTable}><View style={[dashboardStyles.producerTableRow, dashboardStyles.producerTableHeader]}><Text style={[dashboardStyles.producerColumn, dashboardStyles.userNameCol, dashboardStyles.tableHeading]}>USUARIO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.userEmailCol, dashboardStyles.tableHeading]}>CORREO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.userRoleCol, dashboardStyles.tableHeading]}>ROL / FOLIO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.userStatusCol, dashboardStyles.tableHeading]}>ESTADO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.userActionsCol, dashboardStyles.tableHeading]}>ACCIONES</Text></View>{visible.map((account) => <View key={account.id} style={dashboardStyles.producerTableRow}><View style={[dashboardStyles.producerColumn, dashboardStyles.userNameCol, dashboardStyles.producerNameCell]}><View style={dashboardStyles.producerAvatar}><Text style={dashboardStyles.producerInitials}>{account.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}</Text></View><Text style={dashboardStyles.producerName}>{account.name}</Text></View><Text style={[dashboardStyles.producerColumn, dashboardStyles.userEmailCol, dashboardStyles.producerMeta]}>{account.email}</Text><View style={[dashboardStyles.producerColumn, dashboardStyles.userRoleCol]}><View style={dashboardStyles.userRoleLine}><NavGlyph name={account.role === 'Productor' ? 'role-producer' : 'role-packer'} /><Text style={dashboardStyles.userRoleLabel}>{account.role}</Text></View><Text style={dashboardStyles.producerSubMeta}>{account.producerFolio ?? 'Personal de recepción'}</Text></View><View style={[dashboardStyles.producerColumn, dashboardStyles.userStatusCol]}><Text style={[dashboardStyles.statusBadge, account.active ? dashboardStyles.statusActive : dashboardStyles.statusInactive]}>{account.active ? 'Activa' : 'Inactiva'}</Text></View><View style={[dashboardStyles.producerColumn, dashboardStyles.userActionsCol]}><Pressable accessibilityRole="button" accessibilityLabel={`Cambiar contraseña de ${account.name}`} style={dashboardStyles.userActionButton} onPress={() => openPassword(account)}><NavGlyph name="key" active /><Text style={dashboardStyles.userActionText}>Contraseña</Text></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`${account.active ? 'Dar de baja' : 'Reactivar'} cuenta de ${account.name}`} style={dashboardStyles.userActionButton} onPress={() => toggleAccount(account)}><NavGlyph name={account.active ? 'disable' : 'enable'} active /><Text style={dashboardStyles.userActionText}>{account.active ? 'Dar de baja' : 'Reactivar'}</Text></Pressable></View></View>)}</View></ScrollView>}
    {visible.length === 0 && <Text style={dashboardStyles.emptyText}>No hay cuentas que coincidan con la búsqueda.</Text>}
    <Text style={dashboardStyles.reportFootnote}>Datos locales de demostración. La gestión real de accesos requiere conectar un servicio de autenticación.</Text>
    <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={() => setMode(null)}><View style={dashboardStyles.modalBackdrop}><ScrollView style={dashboardStyles.formScroll} contentContainerStyle={dashboardStyles.formScrollContent} keyboardShouldPersistTaps="handled"><View style={dashboardStyles.formCard}>
      <Text style={dashboardStyles.panelTitle}>{mode === 'password' ? 'Cambiar contraseña' : 'Crear cuenta'}</Text><Text style={dashboardStyles.formHint}>{mode === 'password' ? `Actualiza el acceso de ${target?.name}.` : 'Asigna el acceso correspondiente para el empaque.'}</Text>
      {mode === 'new' && <><Text style={dashboardStyles.fieldLabel}>Tipo de cuenta</Text><View style={dashboardStyles.userRolePicker}>{(['Productor', 'Empacador'] as AccountRole[]).map((value) => <Pressable key={value} onPress={() => { setRole(value); setNotice(''); }} style={[dashboardStyles.paymentStatusOption, role === value && dashboardStyles.paymentStatusOptionSelected]}><Text style={[dashboardStyles.paymentStatusOptionText, role === value && dashboardStyles.paymentStatusOptionTextSelected]}>{value}</Text></Pressable>)}</View>
        {role === 'Productor' ? <><Text style={dashboardStyles.fieldLabel}>Productor registrado</Text>{availableProducers.length ? <View style={dashboardStyles.producerPicker}>{availableProducers.map((producer) => <Pressable key={producer.folio} onPress={() => { setProducerFolio(producer.folio); setEmail(`${producer.nombres.toLowerCase().replaceAll(' ', '.')}@guavalink.mx`); }} style={[dashboardStyles.producerChoice, producerFolio === producer.folio && dashboardStyles.producerChoiceSelected]}><Text style={[dashboardStyles.producerChoiceText, producerFolio === producer.folio && dashboardStyles.producerChoiceTextSelected]}>{producerFullName(producer)} · {producer.folio}</Text></Pressable>)}</View> : <Text style={dashboardStyles.userNoProducers}>No hay productores activos sin cuenta.</Text>}<Text style={dashboardStyles.fieldLabel}>Correo electrónico</Text><TextInput value={email} onChangeText={setEmail} placeholder="productor@correo.mx" placeholderTextColor="#86868b" style={dashboardStyles.formInput} keyboardType="email-address" autoCapitalize="none" /></> : <><Text style={dashboardStyles.fieldLabel}>Nombre del empacador</Text><TextInput value={name} onChangeText={setName} placeholder="Nombre completo" placeholderTextColor="#86868b" style={dashboardStyles.formInput} autoCapitalize="words" /><Text style={dashboardStyles.fieldLabel}>Correo electrónico</Text><TextInput value={email} onChangeText={setEmail} placeholder="nombre@guavalink.mx" placeholderTextColor="#86868b" style={dashboardStyles.formInput} keyboardType="email-address" autoCapitalize="none" /></>}
        <Text style={dashboardStyles.fieldLabel}>Contraseña inicial</Text><TextInput value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" placeholderTextColor="#86868b" style={dashboardStyles.formInput} secureTextEntry autoCapitalize="none" />
      </>}
      {mode === 'password' && <><Text style={dashboardStyles.fieldLabel}>Nueva contraseña</Text><TextInput value={password} onChangeText={setPassword} placeholder="Mínimo 8 caracteres" placeholderTextColor="#86868b" style={dashboardStyles.formInput} secureTextEntry autoCapitalize="none" /><Text style={dashboardStyles.fieldLabel}>Confirmar contraseña</Text><TextInput value={confirmation} onChangeText={setConfirmation} placeholder="Repite la contraseña" placeholderTextColor="#86868b" style={dashboardStyles.formInput} secureTextEntry autoCapitalize="none" /></>}
      {!!notice && <Text style={dashboardStyles.userNotice}>{notice}</Text>}
      <View style={dashboardStyles.formActions}><Pressable onPress={() => setMode(null)}><Text style={dashboardStyles.cancelText}>Cancelar</Text></Pressable><Pressable onPress={mode === 'password' ? savePassword : saveNew} style={dashboardStyles.newButton}><Text style={dashboardStyles.newButtonText}>{mode === 'password' ? 'Actualizar' : 'Crear cuenta'}</Text></Pressable></View>
    </View></ScrollView></View></Modal>
  </ScrollView>;
}
