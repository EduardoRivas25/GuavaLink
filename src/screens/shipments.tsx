/* eslint-disable react-hooks/set-state-in-effect */
import {
  ActionGlyph,
  AdminGlyph,
  NavGlyph,
  StatGlyph,
} from "@/components/dashboard-glyphs";
import { supabase } from "@/lib/supabase";
import {
  getDashboardTheme,
  getThemedDashboardStyles,
} from "@/styles/dashboard";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type ShipmentStatus =
  "En preparación" | "Listo para salir" | "En tránsito" | "Entregado";
type Shipment = {
  id: string;
  folio: string;
  destination: string;
  departure: string;
  kilos: number;
  status: ShipmentStatus;
  initials: string;
};
type PendingReception = {
  id: string;
  folio: string;
  producer_name: string | null;
  weight_kg: number | string | null;
};
const shipmentStatuses: ShipmentStatus[] = [
  "En preparación",
  "Listo para salir",
  "En tránsito",
  "Entregado",
];
export const initialShipments: Shipment[] = [];

const withInitials = (row: any): Shipment => ({
  ...row,
  kilos: Number(row.kilos) || 0,
  initials: String(row.destination || "")
    .split(/[ ,]+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
});

export default function ShipmentScreen({
  compact = false,
  isDarkMode = true,
}: {
  compact?: boolean;
  isDarkMode?: boolean;
}) {
  const dashboardStyles = getThemedDashboardStyles(isDarkMode);
  const theme = getDashboardTheme(isDarkMode);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | ShipmentStatus>("Todos");
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [destination, setDestination] = useState("");
  const [departure, setDeparture] = useState("");
  const [pendingReceptions, setPendingReceptions] = useState<PendingReception[]>([]);
  const [selectedReceptionIds, setSelectedReceptionIds] = useState<string[]>([]);
  const [targetShipmentId, setTargetShipmentId] = useState("");

  const loadShipments = useCallback(async () => {
    setLoading(true);
    const [shipmentsResult, receptionsResult] = await Promise.all([
      supabase.from("shipments").select("*").order("created_at", { ascending: false }),
      supabase
        .from("receptions")
        .select("id,folio,producer_name,weight_kg")
        .eq("status", "Validada")
        .is("shipment_id", null)
        .order("created_at", { ascending: false }),
    ]);
    setLoading(false);
    if (shipmentsResult.error || receptionsResult.error) {
      Alert.alert(
        "No se pudo cargar el flujo de embarques",
        shipmentsResult.error?.message || receptionsResult.error?.message,
      );
      return;
    }
    setShipments((shipmentsResult.data || []).map(withInitials));
    setPendingReceptions(receptionsResult.data || []);
  }, []);

  useEffect(() => {
    void loadShipments();
  }, [loadShipments]);

  const totalKilos = shipments.reduce(
    (sum, shipment) => sum + shipment.kilos,
    0,
  );
  const visible = shipments.filter(
    (shipment) =>
      `${shipment.destination} ${shipment.folio} ${shipment.status}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "Todos" || shipment.status === filter),
  );
  const assignableShipments = shipments.filter(
    (shipment) =>
      shipment.status === "En preparación" ||
      shipment.status === "Listo para salir",
  );
  const openForm = (shipment?: Shipment) => {
    setEditing(
      shipment || {
        id: "",
        folio: `EMB-${new Date().getFullYear()}-${String(shipments.length + 1).padStart(3, "0")}`,
        destination: "",
        departure: "",
        kilos: 0,
        status: "En preparación",
        initials: "",
      },
    );
    setDestination(shipment?.destination || "");
    setDeparture(shipment?.departure || "");
  };

  const save = async () => {
    if (!editing || !destination.trim() || !departure.trim()) {
      Alert.alert("Revisa los datos", "Ingresa destino y fecha de salida.");
      return;
    }
    const cleanDestination = destination.trim();
    const initials = cleanDestination
      .split(/[ ,]+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const payload = {
      folio: editing.folio,
      destination: cleanDestination,
      initials,
      departure: departure.trim(),
      status: editing.status,
      kilos: editing.kilos,
    };
    const result = editing.id
      ? await supabase.from("shipments").update(payload).eq("id", editing.id)
      : await supabase.from("shipments").insert([payload]);
    if (result.error) {
      Alert.alert("No se pudo guardar", result.error.message);
      return;
    }
    setEditing(null);
    void loadShipments();
  };

  const cycleStatus = async (shipment: Shipment) => {
    const currentIndex = shipmentStatuses.indexOf(shipment.status);
    if (currentIndex < 0 || currentIndex >= shipmentStatuses.length - 1) return;
    const status =
      shipmentStatuses[currentIndex + 1];
    const { error } = await supabase
      .from("shipments")
      .update({ status })
      .eq("id", shipment.id);
    if (error) {
      Alert.alert("No se pudo cambiar el estado", error.message);
      return;
    }
    setShipments((current) =>
      current.map((item) =>
        item.id === shipment.id ? { ...item, status } : item,
      ),
    );
  };

  const assignReceptions = async () => {
    const shipment = shipments.find((item) => item.id === targetShipmentId);
    if (!shipment || selectedReceptionIds.length === 0) {
      Alert.alert("Selecciona datos", "Elige un embarque y al menos una recepción.");
      return;
    }
    if (shipment.status === "En tránsito" || shipment.status === "Entregado") {
      Alert.alert("Embarque cerrado", "No se pueden asignar recepciones a este embarque.");
      return;
    }
    const { data, error } = await supabase
      .from("receptions")
      .update({
        shipment_id: shipment.id,
        shipment_folio: shipment.folio,
        concepto: `Recepción de guayaba · ${shipment.folio}`,
      })
      .in("id", selectedReceptionIds)
      .is("shipment_id", null)
      .select("id");
    if (error) {
      Alert.alert("No se pudieron asignar las recepciones", error.message);
      return;
    }
    if ((data || []).length !== selectedReceptionIds.length) {
      Alert.alert(
        "Asignación incompleta",
        "Algunas recepciones cambiaron desde que se cargó la lista. Actualiza y vuelve a seleccionar.",
      );
    }
    setSelectedReceptionIds([]);
    void loadShipments();
  };

  const toggleReception = (id: string) => {
    setSelectedReceptionIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const deleteShipment = async (shipment: Shipment) => {
    const { error } = await supabase
      .from("shipments")
      .delete()
      .eq("id", shipment.id);
    if (error) {
      Alert.alert(
        "No se pudo eliminar",
        "El embarque puede tener recepciones relacionadas.",
      );
      return;
    }
    setShipments((current) =>
      current.filter((item) => item.id !== shipment.id),
    );
  };
  const statusStyle = (status: ShipmentStatus) =>
    status === "Entregado"
      ? dashboardStyles.shipmentDelivered
      : status === "En tránsito"
        ? dashboardStyles.shipmentTransit
        : status === "Listo para salir"
          ? dashboardStyles.shipmentReady
          : dashboardStyles.shipmentPreparing;

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
            Embarques
          </Text>
          <Text style={dashboardStyles.subtitle}>
            Cada cosecha, camino a su próximo destino.
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
            onPress={loadShipments}
          >
            <Text style={dashboardStyles.exportText}>↻ Actualizar</Text>
          </Pressable>
          <Pressable
            style={dashboardStyles.newButton}
            onPress={() => openForm()}
          >
            <AdminGlyph name="add" />
            <Text style={dashboardStyles.newButtonText}>Nuevo embarque</Text>
          </Pressable>
        </View>
      </View>
      <View
        style={{
          backgroundColor: theme.card,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: 20,
          padding: compact ? 16 : 22,
          marginBottom: 20,
        }}
      >
        <Text style={dashboardStyles.panelTitle}>Asignación de recepciones validadas</Text>
        <Text style={dashboardStyles.formHint}>
          Selecciona recepciones pendientes y asígnalas a un embarque que aún no haya salido.
        </Text>
        {pendingReceptions.length === 0 ? (
          <Text style={dashboardStyles.emptyText}>No hay recepciones validadas pendientes de embarque.</Text>
        ) : (
          <>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 12 }}>
              {assignableShipments.length === 0 ? (
                <Text style={dashboardStyles.emptyText}>
                  Crea un embarque antes de iniciar la asignación.
                </Text>
              ) : (
                assignableShipments.map((shipment) => (
                  <Pressable
                    key={shipment.id}
                    accessibilityRole="button"
                    onPress={() => setTargetShipmentId(shipment.id)}
                    style={{
                      borderWidth: 1,
                      borderColor: targetShipmentId === shipment.id ? theme.primary : theme.inputBorder,
                      borderRadius: 18,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: targetShipmentId === shipment.id ? theme.primarySoft : "transparent",
                    }}
                  >
                    <Text style={{ color: theme.text, fontSize: 13 }}>
                      {shipment.folio} · {shipment.destination}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>
            {pendingReceptions.map((reception) => {
              const selected = selectedReceptionIds.includes(reception.id);
              return (
                <Pressable
                  key={reception.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggleReception(reception.id)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 10,
                    borderTopWidth: 1,
                    borderTopColor: theme.border,
                    gap: 10,
                  }}
                >
                  <Text style={{ color: selected ? theme.primary : theme.sub, fontSize: 18 }}>
                    {selected ? "☑" : "☐"}
                  </Text>
                  <Text style={{ flex: 1, color: theme.text }}>
                    {reception.folio} · {reception.producer_name || "Sin productor"}
                  </Text>
                  <Text style={{ color: theme.muted }}>
                    {Number(reception.weight_kg || 0).toLocaleString("es-MX")} kg
                  </Text>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              onPress={() => void assignReceptions()}
              style={[dashboardStyles.newButton, { alignSelf: "flex-start", marginTop: 14 }]}
            >
              <Text style={dashboardStyles.newButtonText}>
                Asignar {selectedReceptionIds.length || ""} recepción(es)
              </Text>
            </Pressable>
          </>
        )}
      </View>
      <View style={dashboardStyles.producerStats}>
        <View
          style={[
            dashboardStyles.producerStatCard,
            compact && dashboardStyles.producerStatCardCompact,
          ]}
        >
          <View style={dashboardStyles.statTop}>
            <Text style={dashboardStyles.statLabel}>Embarques registrados</Text>
            <View style={dashboardStyles.statIcon}>
              <NavGlyph name="shipments" active />
            </View>
          </View>
          <Text style={dashboardStyles.statValue}>
            {String(shipments.length).padStart(2, "0")}
          </Text>
          <Text style={dashboardStyles.producerStatNote}>
            Guardados en la base de datos
          </Text>
        </View>
        <View
          style={[
            dashboardStyles.producerStatCard,
            compact && dashboardStyles.producerStatCardCompact,
          ]}
        >
          <View style={dashboardStyles.statTop}>
            <Text style={dashboardStyles.statLabel}>Carga total recibida</Text>
            <View style={dashboardStyles.statIcon}>
              <StatGlyph name="truck" />
            </View>
          </View>
          <Text
            style={[dashboardStyles.statValue, compact && { fontSize: 27 }]}
          >
            {totalKilos.toLocaleString("es-MX")} kg
          </Text>
          <Text style={dashboardStyles.producerStatNote}>
            Actualizada desde las recepciones
          </Text>
        </View>
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
            placeholder="Buscar embarques..."
            placeholderTextColor="#86868b"
            style={dashboardStyles.producerSearchInput}
            accessibilityLabel="Buscar embarques"
          />
        </View>
        <Pressable
          style={dashboardStyles.filterButton}
          onPress={() =>
            setFilter((value) =>
              value === "Todos"
                ? "En preparación"
                : value === "En preparación"
                  ? "Listo para salir"
                  : value === "Listo para salir"
                    ? "En tránsito"
                    : value === "En tránsito"
                      ? "Entregado"
                      : "Todos",
            )
          }
        >
          <Text style={dashboardStyles.filterText}>{filter} ⌄</Text>
        </Pressable>
      </View>
      {loading ? (
        <View style={dashboardStyles.chartWrap}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : compact ? (
        <View style={dashboardStyles.producerCards}>
          {visible.map((shipment) => (
            <View key={shipment.id} style={dashboardStyles.producerCard}>
              <View style={dashboardStyles.producerMobileHeading}>
                <View style={dashboardStyles.producerAvatar}>
                  <Text style={dashboardStyles.producerInitials}>
                    {shipment.initials}
                  </Text>
                </View>
                <View style={dashboardStyles.producerMobileCopy}>
                  <Text style={dashboardStyles.producerName}>
                    {shipment.destination}
                  </Text>
                  <Text style={dashboardStyles.producerMeta}>
                    {shipment.folio} · Sale {shipment.departure}
                  </Text>
                </View>
              </View>
              <View style={dashboardStyles.shipmentMobileFooter}>
                <Text style={dashboardStyles.producerKilos}>
                  {shipment.kilos.toLocaleString("es-MX")} kg
                </Text>
                <Pressable
                  disabled={shipment.status === "Entregado"}
                  onPress={() => void cycleStatus(shipment)}
                  style={[
                    dashboardStyles.statusBadge,
                    statusStyle(shipment.status),
                  ]}
                >
                  <Text style={dashboardStyles.shipmentStatusText}>
                    {shipment.status} ›
                  </Text>
                </Pressable>
                <Pressable onPress={() => openForm(shipment)}>
                  <ActionGlyph name="edit" />
                </Pressable>
                <Pressable
                  onPress={() =>
                    Alert.alert(
                      "Eliminar embarque",
                      `¿Eliminar ${shipment.folio}?`,
                      [
                        { text: "Cancelar", style: "cancel" },
                        {
                          text: "Eliminar",
                          style: "destructive",
                          onPress: () => void deleteShipment(shipment),
                        },
                      ],
                    )
                  }
                >
                  <ActionGlyph name="delete" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={dashboardStyles.shipmentTable}>
            <View
              style={[
                dashboardStyles.producerTableRow,
                dashboardStyles.producerTableHeader,
              ]}
            >
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.shipmentDestinationCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                DESTINO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.shipmentFolioCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                FOLIO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.shipmentDateCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                SALIDA
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.shipmentKilosCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                KILOS RECIBIDOS
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.shipmentStatusCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                ESTADO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.producerColumnActions,
                  dashboardStyles.tableHeading,
                ]}
              >
                ACCIONES
              </Text>
            </View>
            {visible.map((shipment) => (
              <View key={shipment.id} style={dashboardStyles.producerTableRow}>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.shipmentDestinationCol,
                    dashboardStyles.producerNameCell,
                  ]}
                >
                  <View style={dashboardStyles.producerAvatar}>
                    <Text style={dashboardStyles.producerInitials}>
                      {shipment.initials}
                    </Text>
                  </View>
                  <Text style={dashboardStyles.producerName}>
                    {shipment.destination}
                  </Text>
                </View>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.shipmentFolioCol,
                    dashboardStyles.producerMeta,
                  ]}
                >
                  {shipment.folio}
                </Text>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.shipmentDateCol,
                    dashboardStyles.producerMeta,
                  ]}
                >
                  {shipment.departure}
                </Text>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.shipmentKilosCol,
                    dashboardStyles.producerName,
                  ]}
                >
                  {shipment.kilos.toLocaleString("es-MX")} kg
                </Text>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.shipmentStatusCol,
                  ]}
                >
                  <Pressable
                    disabled={shipment.status === "Entregado"}
                    onPress={() => void cycleStatus(shipment)}
                    style={[
                      dashboardStyles.statusBadge,
                      statusStyle(shipment.status),
                    ]}
                  >
                    <Text style={dashboardStyles.shipmentStatusText}>
                      {shipment.status} ›
                    </Text>
                  </Pressable>
                </View>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.producerColumnActions,
                  ]}
                >
                  <Pressable onPress={() => openForm(shipment)}>
                    <ActionGlyph name="edit" />
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        "Eliminar embarque",
                        `¿Eliminar ${shipment.folio}?`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Eliminar",
                            style: "destructive",
                            onPress: () => void deleteShipment(shipment),
                          },
                        ],
                      )
                    }
                  >
                    <ActionGlyph name="delete" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      {!loading && visible.length === 0 && (
        <Text style={dashboardStyles.emptyText}>
          No hay embarques que coincidan con la búsqueda.
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
                {editing?.id ? "Editar embarque" : "Nuevo embarque"}
              </Text>
              <Text style={dashboardStyles.formHint}>{editing?.folio}</Text>
              <Text style={dashboardStyles.formLabel}>Destino</Text>
              <TextInput
                value={destination}
                onChangeText={setDestination}
                placeholder="Ciudad, estado o país"
                placeholderTextColor="#86868b"
                style={dashboardStyles.formInput}
              />
              <Text style={dashboardStyles.formLabel}>Fecha de salida</Text>
              <TextInput
                value={departure}
                onChangeText={setDeparture}
                placeholder="05 oct, 2026"
                placeholderTextColor="#86868b"
                style={dashboardStyles.formInput}
              />
              <Text style={dashboardStyles.formHint}>
                Los kilos se suman automáticamente al registrar fruta desde
                recepción.
              </Text>
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
                  style={dashboardStyles.newButton}
                >
                  <Text style={dashboardStyles.newButtonText}>
                    Guardar embarque
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
