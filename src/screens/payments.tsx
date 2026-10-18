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
  receptionCount: number;
};
type Reception = {
  id: string;
  folio: string;
  producer_id: string | null;
  producer_name: string | null;
  orchard_name: string | null;
  weight_kg: number | string | null;
  accepted_weight_kg: number | string | null;
  price_per_kg: number | string | null;
  validated_at: string | null;
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
  receptionCount: Number(row.reception_count) || 0,
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
  const [receptions, setReceptions] = useState<Reception[]>([]);
  const [paidReceptionIds, setPaidReceptionIds] = useState<string[]>([]);
  const [receptionDrafts, setReceptionDrafts] = useState<
    Record<string, { acceptedWeight: string; pricePerKg: string }>
  >({});
  const [selectedReceptionIds, setSelectedReceptionIds] = useState<string[]>(
    [],
  );
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
      const [
        paymentsResult,
        producersResult,
        paymentReceptionsResult,
        receptionsResult,
      ] = await Promise.all([
        supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("producers")
          .select("id,folio,nombres,apellidos,active,status")
          .order("nombres"),
        supabase.from("payment_receptions").select("payment_id,reception_id"),
        supabase
          .from("receptions")
          .select(
            "id,folio,producer_id,producer_name,orchard_name,weight_kg,accepted_weight_kg,price_per_kg,validated_at",
          )
          .order("created_at", { ascending: false }),
      ]);
      if (paymentsResult.error) throw paymentsResult.error;
      if (producersResult.error) throw producersResult.error;
      if (paymentReceptionsResult.error) throw paymentReceptionsResult.error;
      if (receptionsResult.error) throw receptionsResult.error;
      const receptionCounts = new Map<string, number>();
      for (const row of paymentReceptionsResult.data || []) {
        receptionCounts.set(
          row.payment_id,
          (receptionCounts.get(row.payment_id) || 0) + 1,
        );
      }
      setPayments(
        (paymentsResult.data || []).map((row) =>
          normalizePayment({
            ...row,
            reception_count: receptionCounts.get(row.id) || 0,
          }),
        ),
      );
      setProducers((producersResult.data || []) as ProducerRecord[]);
      setReceptions((receptionsResult.data || []) as Reception[]);
      setPaidReceptionIds(
        (paymentReceptionsResult.data || []).map((row) => row.reception_id),
      );
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
  const receptionsAwaitingValidation = receptions.filter(
    (reception) => !reception.validated_at,
  );
  const producerAvailableReceptions = receptions.filter(
    (reception) =>
      reception.validated_at &&
      reception.producer_id ===
        producers.find((item) => item.folio === producerFolio)?.id &&
      !paidReceptionIds.includes(reception.id),
  );
  const selectedReceptions = producerAvailableReceptions.filter((item) =>
    selectedReceptionIds.includes(item.id),
  );
  const selectedAmount = selectedReceptions.reduce((sum, reception) => {
    const acceptedWeight = Number(reception.accepted_weight_kg) || 0;
    const pricePerKg = Number(reception.price_per_kg) || 0;
    return sum + Math.round(acceptedWeight * pricePerKg * 100) / 100;
  }, 0);
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
    if (payment?.receptionCount) {
      Alert.alert(
        "Pago vinculado a recepciones",
        "Este pago conserva el detalle de sus recepciones y no puede editarse desde el formulario.",
      );
      return;
    }
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
        receptionCount: 0,
      },
    );
    setProducerFolio(payment?.producerFolio ?? defaultProducer?.folio ?? "");
    setSelectedReceptionIds([]);
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
  const validateReception = async (reception: Reception) => {
    const draft = receptionDrafts[reception.id];
    const acceptedWeight = Number(
      draft?.acceptedWeight ?? reception.weight_kg ?? 0,
    );
    const pricePerKg = Number(draft?.pricePerKg ?? "");
    if (
      !Number.isFinite(acceptedWeight) ||
      acceptedWeight <= 0 ||
      !Number.isFinite(pricePerKg) ||
      pricePerKg <= 0
    ) {
      Alert.alert(
        "Revisa los datos",
        "Los kilos aceptados y el precio por kilo deben ser mayores a cero.",
      );
      return;
    }
    setSaving(true);
    try {
      const validatedAt = new Date().toISOString();
      const { data, error } = await supabase
        .from("receptions")
        .update({
          accepted_weight_kg: acceptedWeight,
          price_per_kg: pricePerKg,
          validated_at: validatedAt,
          status: "Validada",
        })
        .eq("id", reception.id)
        .is("validated_at", null)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error("La recepción ya fue validada o no se pudo actualizar.");
      }
      setReceptions((items) =>
        items.map((item) =>
          item.id === reception.id
            ? {
                ...item,
                accepted_weight_kg: acceptedWeight,
                price_per_kg: pricePerKg,
                validated_at: validatedAt,
              }
            : item,
        ),
      );
      setMessage(`✅ Recepción ${reception.folio} validada.`);
    } catch (error: any) {
      setMessage(error.message || "No fue posible validar la recepción.");
    } finally {
      setSaving(false);
    }
  };
  const save = async () => {
    const parsedAmount = Number(amount.replace(/[,$\s]/g, ""));
    const selectedProducer = producers.find(
      (item) => item.folio === producerFolio,
    );
    if (
      !editing ||
      !selectedProducer ||
      !date.trim() ||
      (Boolean(editing.id) &&
        (!Number.isFinite(parsedAmount) || parsedAmount <= 0)) ||
      (!editing.id &&
        (selectedReceptions.length === 0 || selectedAmount <= 0))
    ) {
      Alert.alert(
        "Revisa los datos",
        editing?.id
          ? "Selecciona un productor e ingresa un importe mayor a cero y una fecha."
          : "Selecciona productor, al menos una recepción disponible y una fecha.",
      );
      return;
    }
    if (!editing.id) {
      const orchards = [
        ...new Set(
          selectedReceptions
            .map((reception) => reception.orchard_name)
            .filter((name): name is string => Boolean(name)),
        ),
      ];
      setSaving(true);
      try {
        const { data, error } = await supabase.rpc(
          "create_payment_from_receptions",
          {
            p_folio: editing.folio,
            p_producer_id: selectedProducer.id,
            p_producer_folio: selectedProducer.folio,
            p_producer_name: producerFullName(selectedProducer),
            p_orchard: orchards.join(", "),
            p_date: date.trim(),
            p_reception_ids: selectedReceptionIds,
          },
        );
        if (error) throw error;
        if (!data) throw new Error("Supabase no confirmó la creación del pago.");
        setEditing(null);
        await loadData();
        setMessage("✅ Pago creado con las recepciones seleccionadas.");
      } catch (error: any) {
        setMessage(error.message || "No fue posible crear el pago.");
      } finally {
        setSaving(false);
      }
      return;
    }
    const payload = {
      folio: editing.folio,
      producer_id: selectedProducer.id,
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
    if (deleteTarget.receptionCount > 0) {
      setMessage("Los pagos vinculados a recepciones no se pueden eliminar.");
      setDeleteTarget(null);
      return;
    }
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

      <View
        style={{
          marginBottom: 20,
          padding: 18,
          borderRadius: 18,
          backgroundColor: isDarkMode ? "#1d1d1f" : "#ffffff",
          borderWidth: 1,
          borderColor: isDarkMode ? "#333336" : "#e5e7eb",
        }}
      >
        <Text style={dashboardStyles.panelTitle}>Recepciones por validar</Text>
        <Text style={dashboardStyles.formHint}>
          Confirma los kilos aceptados y el precio por kilo antes de incluir una
          recepción en un pago.
        </Text>
        {receptionsAwaitingValidation.length === 0 ? (
          <Text style={dashboardStyles.emptyText}>
            No hay recepciones pendientes de validación.
          </Text>
        ) : (
          receptionsAwaitingValidation.map((reception) => {
            const draft = receptionDrafts[reception.id];
            return (
              <View
                key={reception.id}
                style={{
                  marginTop: 14,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: isDarkMode ? "#333336" : "#e5e7eb",
                }}
              >
                <Text style={dashboardStyles.producerName}>
                  {reception.folio} · {reception.producer_name || "Productor"}
                </Text>
                <Text style={dashboardStyles.producerMeta}>
                  {reception.orchard_name || "Huerta sin especificar"} ·{" "}
                  {Number(reception.weight_kg) || 0} kg recibidos
                </Text>
                <Text style={dashboardStyles.fieldLabel}>
                  Kilos aceptados
                </Text>
                <TextInput
                  value={
                    draft?.acceptedWeight ??
                    String(Number(reception.weight_kg) || "")
                  }
                  onChangeText={(value) =>
                    setReceptionDrafts((items) => ({
                      ...items,
                      [reception.id]: {
                        acceptedWeight: value,
                        pricePerKg:
                          items[reception.id]?.pricePerKg ??
                          String(Number(reception.price_per_kg) || ""),
                      },
                    }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="Ej. 450"
                  placeholderTextColor="#86868b"
                  style={dashboardStyles.formInput}
                  accessibilityLabel={`Kilos aceptados para recepción ${reception.folio}`}
                />
                <Text style={dashboardStyles.fieldLabel}>
                  Precio por kilo (MXN)
                </Text>
                <TextInput
                  value={
                    draft?.pricePerKg ??
                    String(Number(reception.price_per_kg) || "")
                  }
                  onChangeText={(value) =>
                    setReceptionDrafts((items) => ({
                      ...items,
                      [reception.id]: {
                        acceptedWeight:
                          items[reception.id]?.acceptedWeight ??
                          String(Number(reception.weight_kg) || ""),
                        pricePerKg: value,
                      },
                    }))
                  }
                  keyboardType="decimal-pad"
                  placeholder="Ej. 12.50"
                  placeholderTextColor="#86868b"
                  style={dashboardStyles.formInput}
                  accessibilityLabel={`Precio por kilo de recepción ${reception.folio}`}
                />
                <Pressable
                  onPress={() => void validateReception(reception)}
                  disabled={saving}
                  style={[
                    dashboardStyles.newButton,
                    { alignSelf: "flex-start", marginTop: 12 },
                    saving && { opacity: 0.6 },
                  ]}
                >
                  <Text style={dashboardStyles.newButtonText}>
                    Validar recepción
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>

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
                  {payment.receptionCount > 0 ? (
                    <Text style={dashboardStyles.producerMeta}>
                      {payment.receptionCount} recepciones incluidas
                    </Text>
                  ) : null}
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
                {payment.receptionCount === 0 ? (
                  <>
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
                  </>
                ) : null}
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
                  {payment.receptionCount > 0 ? (
                    <Text style={dashboardStyles.producerSubMeta}>
                      {payment.receptionCount} recepciones incluidas
                    </Text>
                  ) : null}
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
                  {payment.receptionCount === 0 ? (
                    <>
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
                    </>
                  ) : null}
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
                {editing?.id
                  ? "Actualiza los datos del pago existente."
                  : "Selecciona las recepciones validadas que cubrirá este pago."}
              </Text>
              <Text style={dashboardStyles.fieldLabel}>Productor</Text>
              <View style={dashboardStyles.paymentProducerOptions}>
                {activeProducers.map((producer) => (
                  <Pressable
                    key={producer.folio}
                    onPress={() => {
                      setProducerFolio(producer.folio);
                      setSelectedReceptionIds([]);
                    }}
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
              {editing?.id ? (
                <>
                  <Text style={dashboardStyles.fieldLabel}>
                    Huerta (opcional)
                  </Text>
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
                </>
              ) : (
                <>
                  <Text style={dashboardStyles.fieldLabel}>
                    Recepciones disponibles
                  </Text>
                  {producerAvailableReceptions.length === 0 ? (
                    <Text style={dashboardStyles.emptyText}>
                      Este productor no tiene recepciones validadas y pendientes
                      de pago.
                    </Text>
                  ) : (
                    producerAvailableReceptions.map((reception) => {
                      const selected = selectedReceptionIds.includes(
                        reception.id,
                      );
                      const kilos = Number(reception.accepted_weight_kg) || 0;
                      const price = Number(reception.price_per_kg) || 0;
                      return (
                        <Pressable
                          key={reception.id}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: selected }}
                          onPress={() =>
                            setSelectedReceptionIds((ids) =>
                              selected
                                ? ids.filter((id) => id !== reception.id)
                                : [...ids, reception.id],
                            )
                          }
                          style={{
                            marginTop: 8,
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: selected ? "#0071e3" : "#86868b",
                            backgroundColor: selected
                              ? isDarkMode
                                ? "#13253a"
                                : "#eff6ff"
                              : "transparent",
                          }}
                        >
                          <Text style={dashboardStyles.producerName}>
                            {selected ? "☑ " : "☐ "}
                            {reception.folio} · {reception.orchard_name || "Sin huerta"}
                          </Text>
                          <Text style={dashboardStyles.producerMeta}>
                            {kilos} kg × {formatCurrency(price)}/kg ={" "}
                            {formatCurrency(kilos * price)}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                  <Text style={[dashboardStyles.fieldLabel, { marginTop: 12 }]}>
                    Total calculado: {formatCurrency(selectedAmount)}
                  </Text>
                </>
              )}
              <Text style={dashboardStyles.fieldLabel}>Fecha</Text>
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="Ej. 03 oct, 2026"
                placeholderTextColor="#86868b"
                style={dashboardStyles.formInput}
              />
              {editing?.id ? (
                <>
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
                </>
              ) : null}
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
