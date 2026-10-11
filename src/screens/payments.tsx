import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { ActionGlyph, StatGlyph } from '@/components/dashboard-glyphs';
import { dashboardStyles } from '@/styles/dashboard';
import { initialProducers, producerFullName } from '@/screens/producers';

type PaymentStatus = 'Pendiente' | 'Pagado';
type Payment = { folio: string; producerFolio: string; orchard: string; amount: number; date: string; status: PaymentStatus };
const initialPayments: Payment[] = [
  { folio: 'PAG-001', producerFolio: 'PR-001', orchard: 'La Esperanza', amount: 22500, date: '03 oct, 2026', status: 'Pendiente' },
  { folio: 'PAG-002', producerFolio: 'PR-002', orchard: 'Los Pinos', amount: 17640, date: '02 oct, 2026', status: 'Pendiente' },
  { folio: 'PAG-003', producerFolio: 'PR-003', orchard: 'Sin huerta asignada', amount: 16260, date: '01 oct, 2026', status: 'Pendiente' },
  { folio: 'PAG-004', producerFolio: 'PR-004', orchard: 'El Encino', amount: 16260, date: '30 sep, 2026', status: 'Pendiente' },
  { folio: 'PAG-005', producerFolio: 'PR-005', orchard: 'La Palma', amount: 16260, date: '29 sep, 2026', status: 'Pendiente' },
  { folio: 'PAG-006', producerFolio: 'PR-006', orchard: 'Los Pinos', amount: 17940, date: '28 sep, 2026', status: 'Pagado' },
];
const formatCurrency = (amount: number) => `$${amount.toLocaleString('es-MX')} MXN`;

export default function PaymentScreen({ compact }: { compact: boolean }) {
  const [payments, setPayments] = useState(initialPayments);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'Todos' | PaymentStatus>('Todos');
  const [editing, setEditing] = useState<Payment | null>(null);
  const [producerFolio, setProducerFolio] = useState('PR-001');
  const [orchard, setOrchard] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<PaymentStatus>('Pendiente');
  const pending = payments.filter((payment) => payment.status === 'Pendiente');
  const visible = payments.filter((payment) => {
    const producer = initialProducers.find((item) => item.folio === payment.producerFolio);
    const matches = `${producer ? producerFullName(producer) : ''} ${payment.folio} ${payment.orchard}`.toLowerCase().includes(query.toLowerCase());
    return matches && (filter === 'Todos' || payment.status === filter);
  });
  const openForm = (payment?: Payment) => {
    const nextFolio = Math.max(0, ...payments.map((item) => Number(item.folio.split('-')[1]) || 0)) + 1;
    setEditing(payment ?? { folio: `PAG-${String(nextFolio).padStart(3, '0')}`, producerFolio: initialProducers[0].folio, orchard: '', amount: 0, date: '', status: 'Pendiente' });
    setProducerFolio(payment?.producerFolio ?? initialProducers[0].folio);
    setOrchard(payment?.orchard === 'Sin huerta asignada' ? '' : payment?.orchard ?? '');
    setAmount(payment ? String(payment.amount) : '');
    setDate(payment?.date ?? new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }));
    setStatus(payment?.status ?? 'Pendiente');
  };
  const save = () => {
    const parsedAmount = Number(amount.replace(/[,$\s]/g, ''));
    if (!editing || !producerFolio || !Number.isFinite(parsedAmount) || parsedAmount <= 0 || !date.trim()) {
      Alert.alert('Revisa los datos', 'Selecciona un productor e ingresa un importe mayor a cero y una fecha.');
      return;
    }
    const saved: Payment = { ...editing, producerFolio, orchard: orchard.trim() || 'Sin huerta asignada', amount: parsedAmount, date: date.trim(), status };
    setPayments((items) => items.some((item) => item.folio === editing.folio) ? items.map((item) => item.folio === editing.folio ? saved : item) : [...items, saved]);
    setEditing(null);
  };
  const producerName = (payment: Payment) => {
    const producer = initialProducers.find((item) => item.folio === payment.producerFolio);
    return producer ? producerFullName(producer) : 'Productor eliminado';
  };
  const statusStyle = (value: PaymentStatus) => value === 'Pagado' ? dashboardStyles.paymentPaid : dashboardStyles.paymentPending;
  const removePayment = (payment: Payment) => Alert.alert('Eliminar pago', `¿Quieres eliminar el pago ${payment.folio}?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: () => setPayments((items) => items.filter((item) => item.folio !== payment.folio)) },
  ]);

  return <ScrollView contentContainerStyle={[dashboardStyles.producerContent, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
    <View style={[dashboardStyles.producerHeading, compact && dashboardStyles.producerHeadingCompact]}>
      <View style={dashboardStyles.welcomeCopy}><Text style={dashboardStyles.eyebrow}>MI EMPAQUE</Text><Text style={[dashboardStyles.producerTitle, compact && dashboardStyles.producerTitleCompact]}>Pagos a productores</Text><Text style={dashboardStyles.subtitle}>Cuentas claras. Relaciones que crecen.</Text></View>
      <View style={dashboardStyles.welcomeActions}><Pressable style={dashboardStyles.exportButton} onPress={() => Alert.alert('Exportar pagos', 'La exportación estará disponible al conectar los datos del empaque.')}><Text style={dashboardStyles.exportText}>⇩  Exportar</Text></Pressable><Pressable style={dashboardStyles.newButton} onPress={() => openForm()}><Text style={dashboardStyles.newButtonText}>＋  Nuevo pago</Text></Pressable></View>
    </View>

    <View style={dashboardStyles.paymentStats}>
      <PaymentMetric compact={compact} label="Pendiente de pago" value={formatCurrency(pending.reduce((sum, payment) => sum + payment.amount, 0))} note="Datos de demostración" icon="wallet" />
      <PaymentMetric compact={compact} label="Productores por liquidar" value={String(new Set(pending.map((payment) => payment.producerFolio)).size)} note="Con pagos pendientes" icon="farmers" />
      <PaymentMetric compact={compact} label="Pagos realizados" value={String(payments.filter((payment) => payment.status === 'Pagado').length)} note="Datos de demostración" icon="check" />
      <PaymentMetric compact={compact} label="Precio de ejemplo / kg" value="$18 MXN" note="Referencia de demostración" icon="orchards" />
    </View>

    <View style={[dashboardStyles.producerToolbar, compact && dashboardStyles.producerToolbarCompact]}>
      <View style={[dashboardStyles.producerSearch, compact && dashboardStyles.producerSearchCompact]}><Text style={dashboardStyles.searchGlyph}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Buscar pagos..." placeholderTextColor="#86868b" style={dashboardStyles.producerSearchInput} accessibilityLabel="Buscar pagos" /></View>
      <Pressable style={dashboardStyles.filterButton} onPress={() => setFilter((value) => value === 'Todos' ? 'Pendiente' : value === 'Pendiente' ? 'Pagado' : 'Todos')}><Text style={dashboardStyles.filterText}>{filter}  ⌄</Text></Pressable>
    </View>

    {compact ? <View style={dashboardStyles.producerCards}>{visible.map((payment) => <View key={payment.folio} style={dashboardStyles.producerCard}><View style={dashboardStyles.producerMobileHeading}><View style={dashboardStyles.producerAvatar}><Text style={dashboardStyles.producerInitials}>{producerName(payment).split(' ').slice(0, 2).map((word) => word[0]).join('')}</Text></View><View style={dashboardStyles.producerMobileCopy}><Text style={dashboardStyles.producerName}>{producerName(payment)}</Text><Text style={dashboardStyles.producerMeta}>{payment.folio} · {payment.orchard}</Text><Text style={dashboardStyles.producerMeta}>{payment.date}</Text></View><Text style={[dashboardStyles.statusBadge, statusStyle(payment.status)]}>{payment.status}</Text></View><View style={dashboardStyles.paymentMobileFooter}><Text style={dashboardStyles.paymentAmount}>{formatCurrency(payment.amount)}</Text><Pressable accessibilityRole="button" onPress={() => openForm(payment)}><ActionGlyph name="edit" /></Pressable><Pressable accessibilityRole="button" onPress={() => removePayment(payment)}><ActionGlyph name="delete" /></Pressable>{payment.status === 'Pendiente' && <Pressable style={dashboardStyles.registerPaymentButton} onPress={() => setPayments((items) => items.map((item) => item.folio === payment.folio ? { ...item, status: 'Pagado' } : item))}><Text style={dashboardStyles.registerPaymentText}>Registrar pago</Text></Pressable>}</View></View>)}</View> : <ScrollView horizontal showsHorizontalScrollIndicator><View style={dashboardStyles.paymentTable}><View style={[dashboardStyles.producerTableRow, dashboardStyles.producerTableHeader]}><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentNameCol, dashboardStyles.tableHeading]}>NOMBRE</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentFolioCol, dashboardStyles.tableHeading]}>FOLIO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentOrchardCol, dashboardStyles.tableHeading]}>UBICACIÓN / HUERTA</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentAmountCol, dashboardStyles.tableHeading]}>IMPORTE</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentStatusCol, dashboardStyles.tableHeading]}>ESTADO</Text><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentActionsCol, dashboardStyles.tableHeading]}>ACCIONES</Text></View>{visible.map((payment) => <View key={payment.folio} style={dashboardStyles.producerTableRow}><View style={[dashboardStyles.producerColumn, dashboardStyles.paymentNameCol, dashboardStyles.producerNameCell]}><View style={dashboardStyles.producerAvatar}><Text style={dashboardStyles.producerInitials}>{producerName(payment).split(' ').slice(0, 2).map((word) => word[0]).join('')}</Text></View><Text style={dashboardStyles.producerName}>{producerName(payment)}</Text></View><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentFolioCol, dashboardStyles.producerMeta]}>{payment.folio}</Text><View style={[dashboardStyles.producerColumn, dashboardStyles.paymentOrchardCol]}><Text style={dashboardStyles.producerMeta}>{payment.orchard}</Text><Text style={dashboardStyles.producerSubMeta}>{payment.date}</Text></View><Text style={[dashboardStyles.producerColumn, dashboardStyles.paymentAmountCol, dashboardStyles.producerName]}>{formatCurrency(payment.amount)}</Text><View style={[dashboardStyles.producerColumn, dashboardStyles.paymentStatusCol]}><Text style={[dashboardStyles.statusBadge, statusStyle(payment.status)]}>{payment.status}</Text></View><View style={[dashboardStyles.producerColumn, dashboardStyles.paymentActionsCol]}>{payment.status === 'Pendiente' && <Pressable style={dashboardStyles.registerPaymentButton} onPress={() => setPayments((items) => items.map((item) => item.folio === payment.folio ? { ...item, status: 'Pagado' } : item))}><Text style={dashboardStyles.registerPaymentText}>Registrar pago</Text></Pressable>}<Pressable accessibilityLabel={`Editar pago ${payment.folio}`} onPress={() => openForm(payment)}><ActionGlyph name="edit" /></Pressable><Pressable accessibilityLabel={`Eliminar pago ${payment.folio}`} onPress={() => removePayment(payment)}><ActionGlyph name="delete" /></Pressable></View></View>)}</View></ScrollView>}
    {visible.length === 0 && <Text style={dashboardStyles.emptyText}>No hay pagos que coincidan con la búsqueda.</Text>}

    <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}><View style={dashboardStyles.modalBackdrop}><ScrollView style={dashboardStyles.formScroll} contentContainerStyle={dashboardStyles.formScrollContent} keyboardShouldPersistTaps="handled"><View style={dashboardStyles.formCard}><Text style={dashboardStyles.panelTitle}>{payments.some((payment) => payment.folio === editing?.folio) ? 'Editar pago' : 'Crear pago'}</Text><Text style={dashboardStyles.formHint}>Elige al productor y registra el importe del pago.</Text><Text style={dashboardStyles.fieldLabel}>Productor</Text><View style={dashboardStyles.paymentProducerOptions}>{initialProducers.map((producer) => <Pressable key={producer.folio} onPress={() => setProducerFolio(producer.folio)} style={[dashboardStyles.paymentProducerOption, producerFolio === producer.folio && dashboardStyles.paymentProducerOptionSelected]}><Text style={[dashboardStyles.paymentProducerOptionText, producerFolio === producer.folio && dashboardStyles.paymentProducerOptionTextSelected]}>{producerFullName(producer)}</Text></Pressable>)}</View><Text style={dashboardStyles.fieldLabel}>Huerta (opcional)</Text><TextInput value={orchard} onChangeText={setOrchard} placeholder="Nombre de la huerta o déjalo vacío" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.fieldLabel}>Importe (MXN)</Text><TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="Ej. 22500" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.fieldLabel}>Fecha</Text><TextInput value={date} onChangeText={setDate} placeholder="Ej. 03 oct, 2026" placeholderTextColor="#86868b" style={dashboardStyles.formInput} /><Text style={dashboardStyles.fieldLabel}>Estado del pago</Text><View style={dashboardStyles.paymentStatusOptions}>{(['Pendiente', 'Pagado'] as PaymentStatus[]).map((value) => <Pressable key={value} onPress={() => setStatus(value)} style={[dashboardStyles.paymentStatusOption, status === value && dashboardStyles.paymentStatusOptionSelected]}><Text style={[dashboardStyles.paymentStatusOptionText, status === value && dashboardStyles.paymentStatusOptionTextSelected]}>{value}</Text></Pressable>)}</View><View style={dashboardStyles.formActions}><Pressable onPress={() => setEditing(null)}><Text style={dashboardStyles.cancelText}>Cancelar</Text></Pressable><Pressable onPress={save} style={dashboardStyles.newButton}><Text style={dashboardStyles.newButtonText}>Guardar pago</Text></Pressable></View></View></ScrollView></View></Modal>
  </ScrollView>;
}

function PaymentMetric({ compact, label, value, note, icon }: { compact: boolean; label: string; value: string; note: string; icon: 'wallet' | 'farmers' | 'check' | 'orchards' }) {
  return <View style={[dashboardStyles.paymentMetric, compact && dashboardStyles.paymentMetricCompact]}><View style={dashboardStyles.statTop}><Text style={dashboardStyles.statLabel}>{label}</Text><View style={dashboardStyles.statIcon}>{icon === 'check' ? <Text style={dashboardStyles.statGlyph}>✓</Text> : <StatGlyph name={icon} />}</View></View><Text numberOfLines={1} adjustsFontSizeToFit style={dashboardStyles.statValue}>{value}</Text><Text style={dashboardStyles.producerStatNote}>{note}</Text></View>;
}
