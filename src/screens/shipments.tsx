/* eslint-disable react-hooks/set-state-in-effect */
import {
  ActionGlyph,
  AdminGlyph,
  NavGlyph,
  StatGlyph,
} from "@/components/dashboard-glyphs";
import { supabase } from "@/lib/supabase";
import { getThemedDashboardStyles } from "@/styles/dashboard";
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
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | ShipmentStatus>("Todos");
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [destination, setDestination] = useState("");
  const [departure, setDeparture] = useState("");

  const loadShipments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .order("created_at", { ascending: false });
    setLoading(false);
    if (error) {
      Alert.alert("No se pudieron cargar los embarques", error.message);
      return;
    }
    setShipments((data || []).map(withInitials));
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
    const status =
      shipmentStatuses[
        (shipmentStatuses.indexOf(shipment.status) + 1) %
          shipmentStatuses.length
      ];
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
          <ActivityIndicator size="large" color="#0071e3" />
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
