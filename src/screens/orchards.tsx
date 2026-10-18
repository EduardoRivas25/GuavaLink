/* eslint-disable react-hooks/set-state-in-effect */
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
import { ActionGlyph, AdminGlyph, NavGlyph, StatGlyph } from "@/components/dashboard-glyphs";
import { dashboardStyles } from "@/styles/dashboard";
import OrchardMap from "@/components/orchard-map";
import type { Orchard } from "@/types/orchard";
import { producerFullName } from "@/screens/producers";
import { supabase } from "@/lib/supabase";

export const demoOrchards: Orchard[] = [
  {
    id: "demo-orchard-1",
    producer_id: null,
    name: "La Esperanza",
    folio: "HRT-001",
    producer: "José Martínez López",
    hectares: 8.5,
    tenure: "Propia",
    latitude: 19.42,
    longitude: -102.06,
    active: true,
  },
  {
    id: "demo-orchard-2",
    producer_id: null,
    name: "El Guayabal",
    folio: "HRT-002",
    producer: "María Elena González",
    hectares: 5.2,
    tenure: "Rentada",
    latitude: 19.35,
    longitude: -102.2,
    active: true,
  },
  {
    id: "demo-orchard-3",
    producer_id: null,
    name: "Los Laureles",
    folio: "HRT-003",
    producer: "Roberto Díaz Ramírez",
    hectares: 12,
    tenure: "Propia",
    latitude: 19.51,
    longitude: -102.32,
    active: true,
  },
  {
    id: "demo-orchard-4",
    producer_id: null,
    name: "La Palma",
    folio: "HRT-004",
    producer: "Miguel Ángel Torres",
    hectares: 6.8,
    tenure: "Rentada",
    latitude: 19.28,
    longitude: -101.98,
    active: true,
  },
];

type ProducerOption = {
  id: string;
  folio: string;
  nombres: string | null;
  apellidos: string | null;
  active: boolean | null;
  status: string | null;
};

const normalizeOrchard = (row: any): Orchard => ({
  id: String(row.id),
  producer_id: row.producer_id ? String(row.producer_id) : null,
  name: row.name || "Huerta sin nombre",
  folio: row.folio || "",
  producer: row.producer || "Productor no asignado",
  hectares: Number(row.hectares) || 0,
  tenure: row.tenure === "Rentada" ? "Rentada" : "Propia",
  latitude: Number(row.latitude) || 0,
  longitude: Number(row.longitude) || 0,
  active: row.active !== false,
});

export default function OrchardScreen({ compact }: { compact: boolean }) {
  const [orchards, setOrchards] = useState<Orchard[]>([]);
  const [producers, setProducers] = useState<ProducerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | "Activas" | "Inactivas">(
    "Todos",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Orchard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Orchard | null>(null);
  const [selectedFolio, setSelectedFolio] = useState("");
  const [name, setName] = useState("");
  const [producerId, setProducerId] = useState("");
  const [hectares, setHectares] = useState("");
  const [tenure, setTenure] = useState<"Propia" | "Rentada">("Propia");
  const [latitude, setLatitude] = useState("19.4200");
  const [longitude, setLongitude] = useState("-102.0600");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [orchardsResult, producersResult] = await Promise.all([
        supabase.from("orchards").select("*").order("created_at", {
          ascending: false,
        }),
        supabase
          .from("producers")
          .select("id,folio,nombres,apellidos,active,status")
          .order("nombres"),
      ]);
      if (orchardsResult.error) throw orchardsResult.error;
      if (producersResult.error) throw producersResult.error;
      const loadedOrchards = (orchardsResult.data || []).map(normalizeOrchard);
      setOrchards(loadedOrchards);
      setProducers((producersResult.data || []) as ProducerOption[]);
      setSelectedFolio((current) =>
        loadedOrchards.some((item) => item.folio === current)
          ? current
          : loadedOrchards[0]?.folio || "",
      );
      setMessage("");
    } catch (error: any) {
      setMessage(error.message || "No fue posible cargar las huertas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const activeProducers = producers.filter(
    (item) => item.active !== false && item.status !== "Inactivo",
  );

  const visible = orchards.filter(
    (orchard) =>
      `${orchard.name} ${orchard.folio} ${orchard.producer}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "Todos" || orchard.active === (filter === "Activas")),
  );
  const openForm = (orchard?: Orchard) => {
    setEditing(orchard ?? null);
    setName(orchard?.name ?? "");
    setProducerId(orchard?.producer_id ?? activeProducers[0]?.id ?? "");
    setHectares(orchard ? String(orchard.hectares) : "");
    setTenure(orchard?.tenure ?? "Propia");
    setLatitude(orchard ? String(orchard.latitude) : "19.4200");
    setLongitude(orchard ? String(orchard.longitude) : "-102.0600");
    setMessage("");
    setModalOpen(true);
  };
  const saveOrchard = async () => {
    const parsedHectares = Number(hectares);
    const parsedLatitude = Number(latitude);
    const parsedLongitude = Number(longitude);
    const selectedProducer = producers.find((item) => item.id === producerId);
    if (
      !name.trim() ||
      !selectedProducer ||
      !parsedHectares ||
      parsedHectares < 0 ||
      !Number.isFinite(parsedLatitude) ||
      parsedLatitude < -90 ||
      parsedLatitude > 90 ||
      !Number.isFinite(parsedLongitude) ||
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      Alert.alert(
        "Revisa los datos",
        "Completa el nombre, productor, hectáreas y coordenadas válidas.",
      );
      return;
    }
    const payload = {
      name: name.trim(),
      producer_id: selectedProducer.id,
      producer: producerFullName(selectedProducer),
      hectares: parsedHectares,
      tenure,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      folio:
        editing?.folio ?? `HRT-${Date.now().toString().slice(-7)}`,
      active: editing?.active ?? true,
    };
    setSaving(true);
    try {
      const { data, error } = editing
        ? await supabase
            .from("orchards")
            .update(payload)
            .eq("id", editing.id)
            .select("id")
            .maybeSingle()
        : await supabase
            .from("orchards")
            .insert([payload])
            .select("id")
            .single();
      if (error) throw error;
      if (!data) throw new Error("Supabase no permitió modificar la huerta.");
      setSelectedFolio(payload.folio);
      setModalOpen(false);
      await fetchData();
      setMessage(
        editing
          ? "✅ Huerta actualizada correctamente."
          : "✅ Huerta registrada correctamente.",
      );
    } catch (error: any) {
      setMessage(error.message || "No fue posible guardar la huerta.");
    } finally {
      setSaving(false);
    }
  };

  const deleteOrchard = (orchard: Orchard) => {
    setDeleteTarget(orchard);
  };

  const confirmDeleteOrchard = async () => {
    if (!deleteTarget) return;
    const orchard = deleteTarget;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("orchards")
        .delete()
        .eq("id", orchard.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Supabase no permitió eliminar la huerta.");
      setOrchards((items) =>
        items.filter((item) => item.id !== orchard.id),
      );
      if (selectedFolio === orchard.folio) setSelectedFolio("");
      setDeleteTarget(null);
      setMessage("✅ Huerta eliminada correctamente.");
    } catch (error: any) {
      setDeleteTarget(null);
      setMessage(
        error.message ||
          "No fue posible eliminar la huerta. Verifica que no tenga recepciones asociadas.",
      );
    } finally {
      setSaving(false);
    }
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
            Huertas
          </Text>
          <Text style={dashboardStyles.subtitle}>
            El origen de cada fruto, siempre a la vista.
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
            onPress={() =>
              Alert.alert(
                "Exportar huertas",
                "La exportación estará disponible al conectar los datos del empaque.",
              )
            }
          >
            <AdminGlyph name="download" />
            <Text style={dashboardStyles.exportText}>Exportar</Text>
          </Pressable>
          <Pressable
            style={dashboardStyles.newButton}
            onPress={() => openForm()}
          >
            <AdminGlyph name="add" />
            <Text style={dashboardStyles.newButtonText}>Nueva huerta</Text>
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

      <View style={dashboardStyles.producerStats}>
        <View
          style={[
            dashboardStyles.producerStatCard,
            compact && dashboardStyles.producerStatCardCompact,
          ]}
        >
          <View style={dashboardStyles.statTop}>
            <Text style={dashboardStyles.statLabel}>Huertas registradas</Text>
            <View style={dashboardStyles.statIcon}>
              <NavGlyph name="orchards" active />
            </View>
          </View>
          <Text style={dashboardStyles.statValue}>
            {String(orchards.length).padStart(2, "0")}
          </Text>
          <Text style={dashboardStyles.producerStatNote}>
            En el padrón del empaque
          </Text>
        </View>
        <View
          style={[
            dashboardStyles.producerStatCard,
            compact && dashboardStyles.producerStatCardCompact,
          ]}
        >
          <View style={dashboardStyles.statTop}>
            <Text style={dashboardStyles.statLabel}>Superficie activa</Text>
            <View style={dashboardStyles.statIcon}>
              <StatGlyph name="farmers" />
            </View>
          </View>
          <Text style={dashboardStyles.statValue}>
            {orchards
              .filter((item) => item.active)
              .reduce((sum, item) => sum + item.hectares, 0)
              .toFixed(1)}{" "}
            <Text style={dashboardStyles.receiptUnit}>ha</Text>
          </Text>
          <Text style={dashboardStyles.producerStatNote}>
            Propias y rentadas
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
            placeholder="Buscar huertas o productores..."
            placeholderTextColor="#86868b"
            style={dashboardStyles.producerSearchInput}
            accessibilityLabel="Buscar huertas"
          />
        </View>
        <Pressable
          style={dashboardStyles.filterButton}
          onPress={() =>
            setFilter((value) =>
              value === "Todos"
                ? "Activas"
                : value === "Activas"
                  ? "Inactivas"
                  : "Todos",
            )
          }
        >
          <Text style={dashboardStyles.filterText}>{filter} ⌄</Text>
        </Pressable>
      </View>

      {compact ? (
        <View style={dashboardStyles.producerCards}>
          {visible.map((orchard) => (
            <View key={orchard.folio} style={dashboardStyles.producerCard}>
              <View style={dashboardStyles.producerMobileHeading}>
                <View style={dashboardStyles.producerAvatar}>
                  <NavGlyph name="orchards" active />
                </View>
                <View style={dashboardStyles.producerMobileCopy}>
                  <Text style={dashboardStyles.producerName}>
                    {orchard.name}
                  </Text>
                  <Text style={dashboardStyles.producerMeta}>
                    {orchard.folio} · {orchard.producer}
                  </Text>
                </View>
                <Text
                  style={[
                    dashboardStyles.statusBadge,
                    dashboardStyles.statusActive,
                  ]}
                >
                  Activa
                </Text>
              </View>
              <View
                style={[
                  dashboardStyles.orchardDetails,
                  compact && dashboardStyles.orchardDetailsCompact,
                ]}
              >
                <Text style={dashboardStyles.producerKilos}>
                  {orchard.hectares} ha · {orchard.tenure}
                </Text>
                <Text style={dashboardStyles.producerMeta}>
                  {orchard.latitude.toFixed(4)}, {orchard.longitude.toFixed(4)}
                </Text>
                <View style={{ flexDirection: "row", gap: 18 }}>
                  <Pressable onPress={() => openForm(orchard)}>
                    <Text style={dashboardStyles.rowAction}>Editar</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteOrchard(orchard)}>
                    <Text style={dashboardStyles.rowDelete}>Eliminar</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
          <View style={dashboardStyles.producerTable}>
            <View
              style={[
                dashboardStyles.producerTableRow,
                dashboardStyles.producerTableHeader,
              ]}
            >
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.producerColumnName,
                  dashboardStyles.tableHeading,
                ]}
              >
                HUERTA
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.producerColumnFolio,
                  dashboardStyles.tableHeading,
                ]}
              >
                FOLIO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.orchardProducerCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                PRODUCTOR
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.orchardHectaresCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                SUPERFICIE
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.orchardTenureCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                TENENCIA
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.producerColumnStatus,
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
            {visible.map((orchard) => (
              <Pressable
                key={orchard.folio}
                onPress={() => setSelectedFolio(orchard.folio)}
                style={[
                  dashboardStyles.producerTableRow,
                  selectedFolio === orchard.folio &&
                    dashboardStyles.orchardRowSelected,
                ]}
              >
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.producerColumnName,
                    dashboardStyles.producerNameCell,
                  ]}
                >
                  <View style={dashboardStyles.producerAvatar}>
                    <NavGlyph name="orchards" active />
                  </View>
                  <Text style={dashboardStyles.producerName}>
                    {orchard.name}
                  </Text>
                </View>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.producerColumnFolio,
                    dashboardStyles.producerMeta,
                  ]}
                >
                  {orchard.folio}
                </Text>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.orchardProducerCol,
                    dashboardStyles.producerMeta,
                  ]}
                >
                  {orchard.producer}
                </Text>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.orchardHectaresCol,
                    dashboardStyles.producerName,
                  ]}
                >
                  {orchard.hectares} ha
                </Text>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.orchardTenureCol,
                    dashboardStyles.producerMeta,
                  ]}
                >
                  {orchard.tenure}
                </Text>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.producerColumnStatus,
                  ]}
                >
                  <Text
                    style={[
                      dashboardStyles.statusBadge,
                      dashboardStyles.statusActive,
                    ]}
                  >
                    Activa
                  </Text>
                </View>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.producerColumnActions,
                  ]}
                >
                  <Pressable
                    accessibilityLabel={`Editar ${orchard.name}`}
                    onPress={() => openForm(orchard)}
                  >
                    <ActionGlyph name="edit" />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Eliminar ${orchard.name}`}
                    onPress={() => deleteOrchard(orchard)}
                  >
                    <ActionGlyph name="delete" />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
      {visible.length === 0 && (
        <Text style={dashboardStyles.emptyText}>
          No hay huertas que coincidan con la búsqueda.
        </Text>
      )}

      <View style={dashboardStyles.mapSection}>
        <View
          style={[
            dashboardStyles.mapHeading,
            compact && dashboardStyles.mapHeadingCompact,
          ]}
        >
          <View>
            <Text style={dashboardStyles.panelTitle}>Ubicación de huertas</Text>
            <Text style={dashboardStyles.panelSubtitle}>
              Localiza cada predio por sus coordenadas.
            </Text>
          </View>
          <View style={dashboardStyles.mapLegend}>
            <View style={dashboardStyles.legendDot} />
            <Text style={dashboardStyles.mapLegendText}>
              {visible.length} huertas
            </Text>
          </View>
        </View>
        <OrchardMap
          orchards={visible}
          selectedFolio={selectedFolio}
          onSelect={setSelectedFolio}
        />
        {orchards.find((item) => item.folio === selectedFolio) && (
          <View style={dashboardStyles.selectedOrchard}>
            <View style={dashboardStyles.mapPinMini}>
              <AdminGlyph name="location" />
            </View>
            <View style={dashboardStyles.selectedOrchardCopy}>
              <Text style={dashboardStyles.producerName}>
                {orchards.find((item) => item.folio === selectedFolio)?.name}
              </Text>
              <Text style={dashboardStyles.producerMeta}>
                {orchards
                  .find((item) => item.folio === selectedFolio)
                  ?.latitude.toFixed(4)}
                ,{" "}
                {orchards
                  .find((item) => item.folio === selectedFolio)
                  ?.longitude.toFixed(4)}{" "}
                ·{" "}
                {
                  orchards.find((item) => item.folio === selectedFolio)
                    ?.producer
                }
              </Text>
            </View>
            <Text style={dashboardStyles.producerKilos}>
              {orchards.find((item) => item.folio === selectedFolio)?.hectares}{" "}
              ha
            </Text>
          </View>
        )}
      </View>

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View
          style={[
            dashboardStyles.modalBackdrop,
            compact && dashboardStyles.modalBackdropCompact,
          ]}
        >
          <ScrollView
            contentContainerStyle={dashboardStyles.orchardModalScroll}
          >
            <View
              style={[
                dashboardStyles.formCard,
                compact && dashboardStyles.formCardCompact,
              ]}
            >
              <Text style={dashboardStyles.panelTitle}>
                {editing ? "Editar huerta" : "Nueva huerta"}
              </Text>
              <Text style={dashboardStyles.modalDescription}>
                Registra el predio y su ubicación para mantenerlo en el mapa.
              </Text>
              <Text style={dashboardStyles.formLabel}>Nombre de la huerta</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ej. La Esperanza"
                placeholderTextColor="#86868b"
                style={dashboardStyles.formInput}
              />
              <Text style={dashboardStyles.formLabel}>
                Productor registrado
              </Text>
              <View style={dashboardStyles.producerPicker}>
                {activeProducers.map((item) => {
                    const fullName = producerFullName(item);
                    return (
                      <Pressable
                        key={item.folio}
                        onPress={() => setProducerId(item.id)}
                        style={[
                          dashboardStyles.producerChoice,
                          producerId === item.id &&
                            dashboardStyles.producerChoiceSelected,
                        ]}
                      >
                        <Text
                          style={[
                            dashboardStyles.producerChoiceText,
                            producerId === item.id &&
                              dashboardStyles.producerChoiceTextSelected,
                          ]}
                        >
                          {fullName}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>
              <Text style={dashboardStyles.formLabel}>Tenencia del predio</Text>
              <View style={dashboardStyles.tenurePicker}>
                {(["Propia", "Rentada"] as const).map((value) => (
                  <Pressable
                    key={value}
                    onPress={() => setTenure(value)}
                    style={[
                      dashboardStyles.tenureOption,
                      tenure === value && dashboardStyles.tenureOptionSelected,
                    ]}
                  >
                    <Text
                      style={[
                        dashboardStyles.tenureOptionText,
                        tenure === value &&
                          dashboardStyles.tenureOptionTextSelected,
                      ]}
                    >
                      {value === "Propia" ? "⌂  Propiedad" : "▤  Rentada"}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Text style={dashboardStyles.formLabel}>
                Superficie (hectáreas)
              </Text>
              <TextInput
                value={hectares}
                onChangeText={setHectares}
                keyboardType="decimal-pad"
                placeholder="Ej. 8.5"
                placeholderTextColor="#86868b"
                style={dashboardStyles.formInput}
              />
              <Text style={dashboardStyles.formLabel}>
                Coordenadas del predio
              </Text>
              <View
                style={[
                  dashboardStyles.coordinateRow,
                  compact && dashboardStyles.coordinateRowCompact,
                ]}
              >
                <TextInput
                  value={latitude}
                  onChangeText={setLatitude}
                  keyboardType="decimal-pad"
                  placeholder="Latitud"
                  placeholderTextColor="#86868b"
                  style={[
                    dashboardStyles.formInput,
                    dashboardStyles.coordinateInput,
                  ]}
                />
                <TextInput
                  value={longitude}
                  onChangeText={setLongitude}
                  keyboardType="decimal-pad"
                  placeholder="Longitud"
                  placeholderTextColor="#86868b"
                  style={[
                    dashboardStyles.formInput,
                    dashboardStyles.coordinateInput,
                  ]}
                />
              </View>
              <Text style={dashboardStyles.modalHint}>
                Ejemplo para Michoacán: 19.4200, -102.0600
              </Text>
              <View
                style={[
                  dashboardStyles.formActions,
                  compact && dashboardStyles.formActionsCompact,
                ]}
              >
                <Pressable onPress={() => setModalOpen(false)}>
                  <Text style={dashboardStyles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={saveOrchard}
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
                      Guardar huerta
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
            <Text style={dashboardStyles.panelTitle}>Eliminar huerta</Text>
            <Text style={dashboardStyles.modalDescription}>
              ¿Deseas eliminar {deleteTarget?.name}? Esta acción no se puede
              deshacer.
            </Text>
            <View
              style={[
                dashboardStyles.formActions,
                compact && dashboardStyles.formActionsCompact,
              ]}
            >
              <Pressable
                onPress={() => setDeleteTarget(null)}
                disabled={saving}
              >
                <Text style={dashboardStyles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={() => void confirmDeleteOrchard()}
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
