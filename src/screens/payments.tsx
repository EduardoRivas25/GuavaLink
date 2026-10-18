/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { ActionGlyph, AdminGlyph, StatGlyph } from "@/components/dashboard-glyphs";
import { getThemedDashboardStyles } from "@/styles/dashboard";
import { producerFullName } from "@/screens/producers";
import { supabase } from "@/lib/supabase";

type PaymentStatus = "Pendiente" | "Pagado";
type Payment = {
  id: string;
  folio: string;
  producerFolio: string;
  producerName: string;
  orchard: string;
  amount: number;
  date: string;
  status: PaymentStatus;
};
type ProducerRecord = {
  id: string;
  folio: string;
  nombres: string | null;
  apellidos: string | null;
  active: boolean | null;
  status: string | null;
};

const normalizePayment = (row: any): Payment => ({
  id: String(row.id),
  folio: row.folio || "",
  producerFolio: row.producer_folio || "",
  producerName: row.producer_name || "Productor no disponible",
  orchard: row.orchard || "Sin huerta asignada",
  amount: Number(row.amount) || 0,
  date: row.date || "",
  status: row.status === "Pagado" ? "Pagado" : "Pendiente",
});

const localIsoDate = () => {
  const value = new Date();
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
};
const formatCurrency = (amount: number) =>
  `$${amount.toLocaleString("es-MX")} MXN`;

export default function PaymentScreen({ compact, isDarkMode = true }: { compact: boolean; isDarkMode?: boolean }) {
  const dashboardStyles = getThemedDashboardStyles(isDarkMode);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [producers, setProducers] = useState<ProducerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | PaymentStatus>("Todos");
  const [editing, setEditing] = useState<Payment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Payment | null>(null);
  const [producerFolio, setProducerFolio] = useState("");
  const [orchard, setOrchard] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<PaymentStatus>("Pendiente");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsResult, producersResult] = await Promise.all([
        supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("producers")
          .select("id,folio,nombres,apellidos,active,status")
          .order("nombres"),
      ]);
      if (paymentsResult.error) throw paymentsResult.error;
      if (producersResult.error) throw producersResult.error;
      setPayments((paymentsResult.data || []).map(normalizePayment));
      setProducers((producersResult.data || []) as ProducerRecord[]);
      setMessage("");
    } catch (error: any) {
      setMessage(error.message || "No fue posible cargar los pagos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const activeProducers = producers.filter(
    (item) => item.active !== false && item.status !== "Inactivo",
  );
  const pending = payments.filter((payment) => payment.status === "Pendiente");
  const visible = payments.filter((payment) => {
    const producer = producers.find(
      (item) => item.folio === payment.producerFolio,
    );
    const matches =
      `${producer ? producerFullName(producer) : ""} ${payment.folio} ${payment.orchard}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return matches && (filter === "Todos" || payment.status === filter);
  });
  const openForm = (payment?: Payment) => {
    const nextFolio =
      Math.max(
        0,
        ...payments.map((item) => Number(item.folio.split("-")[1]) || 0),
      ) + 1;
    const defaultProducer = activeProducers[0];
    setEditing(
      payment ?? {
        id: "",
        folio: `PAG-${String(nextFolio).padStart(3, "0")}`,
        producerFolio: defaultProducer?.folio || "",
        producerName: defaultProducer
          ? producerFullName(defaultProducer)
          : "",
        orchard: "",
        amount: 0,
        date: "",
        status: "Pendiente",
      },
    );
    setProducerFolio(payment?.producerFolio ?? defaultProducer?.folio ?? "");
    setOrchard(
      payment?.orchard === "Sin huerta asignada"
        ? ""
        : (payment?.orchard ?? ""),
    );
    setAmount(payment ? String(payment.amount) : "");
    setDate(
      payment?.date ?? localIsoDate(),
    );
    setStatus(payment?.status ?? "Pendiente");
  };
  const save = async () => {
    const parsedAmount = Number(amount.replace(/[,$\s]/g, ""));
    const selectedProducer = producers.find(
      (item) => item.folio === producerFolio,
    );
    if (
      !editing ||
      !selectedProducer ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0 ||
      !date.trim()
    ) {
      Alert.alert(
        "Revisa los datos",
        "Selecciona un productor e ingresa un importe mayor a cero y una fecha.",
      );
      return;
    }
    const payload = {
      folio: editing.folio,
      producer_folio: selectedProducer.folio,
      producer_name: producerFullName(selectedProducer),
      orchard: orchard.trim() || "Sin huerta asignada",
      amount: parsedAmount,
      date: date.trim(),
      status,
    };
    setSaving(true);
    try {
      const { data, error } = editing.id
        ? await supabase
            .from("payments")
            .update(payload)
            .eq("id", editing.id)
            .select("id")
            .maybeSingle()
        : await supabase
            .from("payments")
            .insert([payload])
            .select("id")
            .single();
      if (error) throw error;
      if (!data) throw new Error("Supabase no permitió guardar el pago.");
      setEditing(null);
      await loadData();
      setMessage("✅ Pago guardado correctamente.");
    } catch (error: any) {
      setMessage(error.message || "No fue posible guardar el pago.");
    } finally {
      setSaving(false);
    }
  };
  const producerName = (payment: Payment) => {
    const producer = producers.find(
      (item) => item.folio === payment.producerFolio,
    );
    return producer ? producerFullName(producer) : payment.producerName;
  };
  const statusStyle = (value: PaymentStatus) =>
    value === "Pagado"
      ? dashboardStyles.paymentPaid
      : dashboardStyles.paymentPending;
  const markAsPaid = async (payment: Payment) => {
    const { data, error } = await supabase
      .from("payments")
      .update({ status: "Pagado" })
      .eq("id", payment.id)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      setMessage(error?.message || "No fue posible registrar el pago.");
      return;
    }
    setPayments((items) =>
      items.map((item) =>
        item.id === payment.id ? { ...item, status: "Pagado" } : item,
      ),
    );
    setMessage("✅ Pago marcado como pagado.");
  };

  const removePayment = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("payments")
        .delete()
        .eq("id", deleteTarget.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Supabase no permitió eliminar el pago.");
      setPayments((items) =>
        items.filter((item) => item.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setMessage("✅ Pago eliminado correctamente.");
    } catch (error: any) {
      setDeleteTarget(null);
      setMessage(error.message || "No fue posible eliminar el pago.");
    } finally {
      setSaving(false);
    }
  };

  const exportPayments = async () => {
    const rows = [
      ["Folio", "Productor", "Folio productor", "Huerta", "Importe MXN", "Fecha", "Estado"],
      ...payments.map((payment) => [
        payment.folio,
        producerName(payment),
        payment.producerFolio,
        payment.orchard,
        String(payment.amount),
        payment.date,
        payment.status,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n")}`;
    if (Platform.OS === "web") {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `guavalink-pagos-${localIsoDate()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }
    await Share.share({ title: "Pagos GuavaLink.csv", message: csv });
  };

  return (
    <ScrollView
      contentContainerStyle={[
        dashboardStyles.producerContent,
        compact && dashboardStyles.contentCompact,
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          dashboardStyles.producerHeading,
          compact && dashboardStyles.producerHeadingCompact,
        ]}
      >
        <View style={dashboardStyles.welcomeCopy}>
          <Text style={dashboardStyles.eyebrow}>MI EMPAQUE</Text>
          <Text
            style={[
              dashboardStyles.producerTitle,
              compact && dashboardStyles.producerTitleCompact,
            ]}
          >
            Pagos a productores
          </Text>
          <Text style={dashboardStyles.subtitle}>
            Cuentas claras. Relaciones que crecen.
          </Text>
        </View>
        <View
          style={[
            dashboardStyles.welcomeActions,
            compact && dashboardStyles.welcomeActionsCompact,
          ]}
        >
          <Pressable
            style={dashboardStyles.exportButton}
            onPress={() => void exportPayments()}
          >
            <AdminGlyph name="download" />
            <Text style={dashboardStyles.exportText}>Exportar</Text>
          </Pressable>
          <Pressable
            style={dashboardStyles.newButton}
            onPress={() => openForm()}
          >
            <AdminGlyph name="add" />
            <Text style={dashboardStyles.newButtonText}>Nuevo pago</Text>
          </Pressable>
        </View>
      </View>

      {message ? (
        <Text
          style={[
            dashboardStyles.emptyText,
            { color: message.includes("✅") ? "#16a34a" : "#ef4444" },
          ]}
        >
          {message}
        </Text>
      ) : null}
      {loading ? <ActivityIndicator color="#0071e3" size="large" /> : null}

      <View style={dashboardStyles.paymentStats}>
        <PaymentMetric
          compact={compact}
          isDarkMode={isDarkMode}
          label="Pendiente de pago"
          value={formatCurrency(
            pending.reduce((sum, payment) => sum + payment.amount, 0),
          )}
          note="Según pagos registrados"
          icon="wallet"
        />
        <PaymentMetric
          compact={compact}
          isDarkMode={isDarkMode}
          label="Productores por liquidar"
          value={String(
            new Set(pending.map((payment) => payment.producerFolio)).size,
          )}
          note="Con pagos pendientes"
          icon="farmers"
        />
        <PaymentMetric
          compact={compact}
          isDarkMode={isDarkMode}
          label="Pagos realizados"
          value={String(
            payments.filter((payment) => payment.status === "Pagado").length,
          )}
          note="Guardados en Supabase"
          icon="check"
        />
        <PaymentMetric
          compact={compact}
          isDarkMode={isDarkMode}
          label="Total pagado"
          value={formatCurrency(
            payments
              .filter((payment) => payment.status === "Pagado")
              .reduce((sum, payment) => sum + payment.amount, 0),
          )}
          note="Importe liquidado"
          icon="orchards"
        />
      </View>

      <View
        style={[
          dashboardStyles.producerToolbar,
          compact && dashboardStyles.producerToolbarCompact,
        ]}
      >
        <View
          style={[
            dashboardStyles.producerSearch,
            compact && dashboardStyles.producerSearchCompact,
          ]}
        >
          <AdminGlyph name="search" color="#86868b" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar pagos..."
            placeholderTextColor="#86868b"
            style={dashboardStyles.producerSearchInput}
            accessibilityLabel="Buscar pagos"
          />
        </View>
        <Pressable
          style={dashboardStyles.filterButton}
          onPress={() =>
            setFilter((value) =>
              value === "Todos"
                ? "Pendiente"
                : value === "Pendiente"
                  ? "Pagado"
                  : "Todos",
            )
          }
        >
          <Text style={dashboardStyles.filterText}>{filter} ⌄</Text>
        </Pressable>
      </View>

      {compact ? (
        <View style={dashboardStyles.producerCards}>
          {visible.map((payment) => (
            <View key={payment.folio} style={dashboardStyles.producerCard}>
              <View style={dashboardStyles.producerMobileHeading}>
                <View style={dashboardStyles.producerAvatar}>
                  <Text style={dashboardStyles.producerInitials}>
                    {producerName(payment)
                      .split(" ")
                      .slice(0, 2)
                      .map((word: string) => word[0])
                      .join("")}
                  </Text>
                </View>
                <View style={dashboardStyles.producerMobileCopy}>
                  <Text style={dashboardStyles.producerName}>
                    {producerName(payment)}
                  </Text>
                  <Text style={dashboardStyles.producerMeta}>
                    {payment.folio} · {payment.orchard}
                  </Text>
                  <Text style={dashboardStyles.producerMeta}>
                    {payment.date}
                  </Text>
                </View>
                <Text
                  style={[
                    dashboardStyles.statusBadge,
                    statusStyle(payment.status),
                  ]}
                >
                  {payment.status}
                </Text>
              </View>
              <View style={dashboardStyles.paymentMobileFooter}>
                <Text style={dashboardStyles.paymentAmount}>
                  {formatCurrency(payment.amount)}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openForm(payment)}
                >
                  <ActionGlyph name="edit" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDeleteTarget(payment)}
                >
                  <ActionGlyph name="delete" />
                </Pressable>
                {payment.status === "Pendiente" && (
                  <Pressable
                    style={dashboardStyles.registerPaymentButton}
                    onPress={() => void markAsPaid(payment)}
                  >
                    <Text style={dashboardStyles.registerPaymentText}>
                      Registrar pago
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={dashboardStyles.paymentTable}>
            <View
              style={[
                dashboardStyles.producerTableRow,
                dashboardStyles.producerTableHeader,
              ]}
            >
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.paymentNameCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                NOMBRE
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.paymentFolioCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                FOLIO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.paymentOrchardCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                UBICACIÓN / HUERTA
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.paymentAmountCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                IMPORTE
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.paymentStatusCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                ESTADO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.paymentActionsCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                ACCIONES
              </Text>
            </View>
            {visible.map((payment) => (
              <View
                key={payment.folio}
                style={dashboardStyles.producerTableRow}
              >
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.paymentNameCol,
                    dashboardStyles.producerNameCell,
                  ]}
                >
                  <View style={dashboardStyles.producerAvatar}>
                    <Text style={dashboardStyles.producerInitials}>
                      {producerName(payment)
                        .split(" ")
                        .slice(0, 2)
                        .map((word: string) => word[0])
                        .join("")}
                    </Text>
                  </View>
                  <Text style={dashboardStyles.producerName}>
                    {producerName(payment)}
                  </Text>
                </View>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.paymentFolioCol,
                    dashboardStyles.producerMeta,
                  ]}
                >
                  {payment.folio}
                </Text>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.paymentOrchardCol,
                  ]}
                >
                  <Text style={dashboardStyles.producerMeta}>
                    {payment.orchard}
                  </Text>
                  <Text style={dashboardStyles.producerSubMeta}>
                    {payment.date}
                  </Text>
                </View>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.paymentAmountCol,
                    dashboardStyles.producerName,
                  ]}
                >
                  {formatCurrency(payment.amount)}
                </Text>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.paymentStatusCol,
                  ]}
                >
                  <Text
                    style={[
                      dashboardStyles.statusBadge,
                      statusStyle(payment.status),
                    ]}
                  >
                    {payment.status}
                  </Text>
                </View>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.paymentActionsCol,
                  ]}
                >
                  {payment.status === "Pendiente" && (
                    <Pressable
                      style={dashboardStyles.registerPaymentButton}
                      onPress={() => void markAsPaid(payment)}
                    >
                      <Text style={dashboardStyles.registerPaymentText}>
                        Registrar pago
                      </Text>
                    </Pressable>
                  )}
                  <Pressable
                    accessibilityLabel={`Editar pago ${payment.folio}`}
                    onPress={() => openForm(payment)}
                  >
                    <ActionGlyph name="edit" />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Eliminar pago ${payment.folio}`}
                    onPress={() => setDeleteTarget(payment)}
                  >
                    <ActionGlyph name="delete" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      {visible.length === 0 && (
        <Text style={dashboardStyles.emptyText}>
          No hay pagos que coincidan con la búsqueda.
        </Text>
      )}

      <Modal
        visible={!!editing}
        transparent
        animationType="fade"
        onRequestClose={() => setEditing(null)}
      >
        <View
          style={[
            dashboardStyles.modalBackdrop,
            compact && dashboardStyles.modalBackdropCompact,
          ]}
        >
          <ScrollView
            style={dashboardStyles.formScroll}
            contentContainerStyle={dashboardStyles.formScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                dashboardStyles.formCard,
                compact && dashboardStyles.formCardCompact,
              ]}
            >
              <Text style={dashboardStyles.panelTitle}>
                {payments.some((payment) => payment.folio === editing?.folio)
                  ? "Editar pago"
                  : "Crear pago"}
              </Text>
              <Text style={dashboardStyles.formHint}>
                Elige al productor y registra el importe del pago.
              </Text>
              <Text style={dashboardStyles.fieldLabel}>Productor</Text>
              <View style={dashboardStyles.paymentProducerOptions}>
                {activeProducers.map((producer) => (
                  <Pressable
                    key={producer.folio}
                    onPress={() => setProducerFolio(producer.folio)}
                    style={[
                      dashboardStyles.paymentProducerOption,
                      producerFolio === producer.folio &&
                        dashboardStyles.paymentProducerOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        dashboardStyles.paymentProducerOptionText,
                        producerFolio === producer.folio &&
                          dashboardStyles.paymentProducerOptionTextSelected,
                      ]}
                    >
                      {producerFullName(producer)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={dashboardStyles.fieldLabel}>Huerta (opcional)</Text>
              <TextInput
                value={orchard}
                onChangeText={setOrchard}
                placeholder="Nombre de la huerta o déjalo vacío"
                placeholderTextColor="#86868b"
                style={dashboardStyles.formInput}
              />
              <Text style={dashboardStyles.fieldLabel}>Importe (MXN)</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="Ej. 22500"
                placeholderTextColor="#86868b"
                style={dashboardStyles.formInput}
              />
              <Text style={dashboardStyles.fieldLabel}>Fecha</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="Ej. 03 oct, 2026"
                placeholderTextColor="#86868b"
                style={dashboardStyles.formInput}
              />
              <Text style={dashboardStyles.fieldLabel}>Estado del pago</Text>
              <View style={dashboardStyles.paymentStatusOptions}>
                {(["Pendiente", "Pagado"] as PaymentStatus[]).map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setStatus(value)}
                    style={[
                      dashboardStyles.paymentStatusOption,
                      status === value &&
                        dashboardStyles.paymentStatusOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        dashboardStyles.paymentStatusOptionText,
                        status === value &&
                          dashboardStyles.paymentStatusOptionTextSelected,
                      ]}
                    >
                      {value}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View
                style={[
                  dashboardStyles.formActions,
                  compact && dashboardStyles.formActionsCompact,
                ]}
              >
                <Pressable onPress={() => setEditing(null)}>
                  <Text style={dashboardStyles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() => void save()}
                  disabled={saving}
                  style={[
                    dashboardStyles.newButton,
                    saving && { opacity: 0.6 },
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={dashboardStyles.newButtonText}>
                      Guardar pago
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={Boolean(deleteTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View
          style={[
            dashboardStyles.modalBackdrop,
            compact && dashboardStyles.modalBackdropCompact,
          ]}
        >
          <View
            style={[
              dashboardStyles.formCard,
              compact && dashboardStyles.formCardCompact,
            ]}
          >
            <Text style={dashboardStyles.panelTitle}>Eliminar pago</Text>
            <Text style={dashboardStyles.modalDescription}>
              ¿Deseas eliminar el pago {deleteTarget?.folio}? Esta acción no se
              puede deshacer.
            </Text>
            <View
              style={[
                dashboardStyles.formActions,
                compact && dashboardStyles.formActionsCompact,
              ]}
            >
              <Pressable onPress={() => setDeleteTarget(null)} disabled={saving}>
                <Text style={dashboardStyles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => void removePayment()}
                disabled={saving}
                style={[
                  dashboardStyles.newButton,
                  { backgroundColor: "#dc2626" },
                  saving && { opacity: 0.6 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={dashboardStyles.newButtonText}>Eliminar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function PaymentMetric({
  compact,
  isDarkMode,
  label,
  value,
  note,
  icon,
}: {
  compact: boolean;
  isDarkMode: boolean;
  label: string;
  value: string;
  note: string;
  icon: "wallet" | "farmers" | "check" | "orchards";
}) {
  const dashboardStyles = getThemedDashboardStyles(isDarkMode);
  return (
    <View
      style={[
        dashboardStyles.paymentMetric,
        !compact && dashboardStyles.paymentMetricDesktop,
        compact && dashboardStyles.paymentMetricCompact,
      ]}
    >
      <View style={dashboardStyles.statTop}>
        <Text style={dashboardStyles.statLabel}>{label}</Text>
        <View style={dashboardStyles.statIcon}>
          {icon === "check" ? (
            <AdminGlyph name="check" color="#16a34a" size={20} />
          ) : (
            <StatGlyph name={icon} />
          )}
        </View>
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={dashboardStyles.statValue}
      >
        {value}
      </Text>
      <Text style={dashboardStyles.producerStatNote}>{note}</Text>
    </View>
  );
}
