/* eslint-disable react-hooks/set-state-in-effect */
import { ActionGlyph, AdminGlyph } from "@/components/dashboard-glyphs";
import { getThemedDashboardStyles } from "@/styles/dashboard";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import QRCodeReal from "../components/qr-code";
import { producerQrValue } from "../lib/domain";
import { supabase } from "../lib/supabase";

export const initialProducers: any[] = [
  {
    folio: "PR-001",
    nombres: "Productor",
    apellidos: "Demo",
    origen: "Uruapan",
    kilos: "0 kg",
    active: true,
  },
];

export const producerFullName = (p: any) => {
  if (!p) return "Productor No Encontrado";
  return p.name || `${p.nombres || ""} ${p.apellidos || ""}`.trim();
};

export interface Producer {
  id: string;
  folio: string;
  name: string;
  email: string | null;
  phone: string | null;
  municipality: string | null;
  qr_code: string;
  status: "Activo" | "Inactivo";
  created_at?: string;
}

const normalizeProducer = (row: any): Producer => ({
  id: String(row.id),
  folio: row.folio || "",
  name:
    `${row.nombres || ""} ${row.apellidos || ""}`.trim() ||
    "Productor sin nombre",
  email: row.email || null,
  phone: null,
  municipality: row.origen || null,
  qr_code: producerQrValue({ id: String(row.id) }),
  status:
    row.active === false || row.status === "Inactivo" ? "Inactivo" : "Activo",
  created_at: row.created_at,
});

interface ProducersScreenProps {
  isDarkMode?: boolean;
  onSelectProducer?: (producer: Producer) => void;
  compact?: boolean;
}

export default function ProducersScreen({
  isDarkMode = true,
  compact = false,
}: ProducersScreenProps = {}) {
  const dashboardStyles = getThemedDashboardStyles(isDarkMode);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalProducer, setQrModalProducer] = useState<Producer | null>(null);
  const [editingProducer, setEditingProducer] = useState<Producer | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [status, setStatus] = useState<"Activo" | "Inactivo">("Activo");

  const fetchProducers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("producers")
        .select(
          "id,folio,nombres,apellidos,origen,email,active,status,created_at",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      setProducers((data || []).map(normalizeProducer));
      setLoadError("");
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar los productores.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducers();
  }, [fetchProducers]);

  const openCreateModal = () => {
    setEditingProducer(null);
    setName("");
    setEmail("");
    setPhone("");
    setMunicipality("Uruapan / Jungapeo");
    setQrCode("Se generará al guardar");
    setStatus("Activo");
    setModalVisible(true);
  };

  const openEditModal = (producer: Producer) => {
    setEditingProducer(producer);
    setName(producer.name);
    setEmail(producer.email || "");
    setPhone(producer.phone || "");
    setMunicipality(producer.municipality || "");
    setQrCode(producer.qr_code);
    setStatus(producer.status);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const nameParts = name.trim().split(/\s+/);
      const payload = {
        folio:
          editingProducer?.folio || `PR-${Date.now().toString().slice(-8)}`,
        nombres: nameParts.shift() || "",
        apellidos: nameParts.join(" "),
        email: email.trim().toLowerCase() || null,
        origen: municipality.trim() || null,
        active: status === "Activo",
        status,
      };

      let error;
      if (editingProducer) {
        ({ error } = await supabase
          .from("producers")
          .update(payload)
          .eq("id", editingProducer.id));
      } else {
        ({ error } = await supabase.from("producers").insert([payload]));
      }
      if (error) throw error;
      setModalVisible(false);
      void fetchProducers();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("producers").delete().eq("id", id);
    setProducers((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = producers.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.qr_code || "").toLowerCase().includes(q) ||
      (p.municipality && p.municipality.toLowerCase().includes(q))
    );
  });

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
            Productores
          </Text>
          <Text style={dashboardStyles.subtitle}>
            Padrón de productores vinculados a Supabase.
          </Text>
        </View>
        <View
          style={[
            dashboardStyles.welcomeActions,
            compact && dashboardStyles.welcomeActionsCompact,
          ]}
        >
          <Pressable
            style={dashboardStyles.newButton}
            onPress={openCreateModal}
          >
            <AdminGlyph name="add" />
            <Text style={dashboardStyles.newButtonText}>Nuevo productor</Text>
          </Pressable>
        </View>
      </View>

      {loadError ? (
        <Text
          accessibilityRole="alert"
          style={{
            marginBottom: 16,
            color: isDarkMode ? "#fca5a5" : "#b91c1c",
            fontSize: 13,
          }}
        >
          No se pudieron cargar los productores: {loadError}
        </Text>
      ) : null}

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
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre, municipio o código QR..."
            placeholderTextColor="#86868b"
            style={dashboardStyles.producerSearchInput}
          />
        </View>
      </View>

      {loading ? (
        <View style={dashboardStyles.chartWrap}>
          <ActivityIndicator size="large" color="#0071e3" />
        </View>
      ) : filtered.length === 0 ? (
        <Text style={dashboardStyles.emptyText}>
          {searchQuery.trim()
            ? "No hay productores que coincidan con la búsqueda."
            : "No hay productores registrados."}
        </Text>
      ) : compact ? (
        <View style={dashboardStyles.producerCards}>
          {filtered.map((producer) => (
            <View key={producer.id} style={dashboardStyles.producerCard}>
              <View style={dashboardStyles.producerMobileHeading}>
                <View style={dashboardStyles.producerAvatar}>
                  <Text style={dashboardStyles.producerInitials}>
                    {producer.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={dashboardStyles.producerMobileCopy}>
                  <Text style={dashboardStyles.producerName}>{producer.name}</Text>
                  <Text style={dashboardStyles.producerMeta}>
                    {producer.municipality || "No especificado"}
                  </Text>
                  <Text numberOfLines={1} style={dashboardStyles.producerSubMeta}>
                    {producer.id}
                  </Text>
                </View>
                <Text
                  style={[
                    dashboardStyles.statusBadge,
                    producer.status === "Activo"
                      ? dashboardStyles.statusActive
                      : dashboardStyles.statusInactive,
                  ]}
                >
                  {producer.status}
                </Text>
              </View>
              <View style={dashboardStyles.producerMobileFooter}>
                <Pressable
                  style={dashboardStyles.userActionButton}
                  onPress={() => setQrModalProducer(producer)}
                >
                  <ActionGlyph name="qr" />
                  <Text style={dashboardStyles.userActionText}>Ver QR</Text>
                </Pressable>
                <Pressable
                  style={dashboardStyles.userActionButton}
                  onPress={() => openEditModal(producer)}
                >
                  <ActionGlyph name="edit" />
                  <Text style={dashboardStyles.userActionText}>Editar</Text>
                </Pressable>
                <Pressable
                  style={dashboardStyles.userActionButton}
                  onPress={() => handleDelete(producer.id)}
                >
                  <ActionGlyph name="delete" />
                  <Text style={dashboardStyles.userActionText}>Eliminar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={dashboardStyles.producerDirectory}
        >
          <View style={dashboardStyles.userTable}>
            <View
              style={[
                dashboardStyles.producerTableRow,
                dashboardStyles.producerTableHeader,
              ]}
            >
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.userNameCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                PRODUCTOR
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.userEmailCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                MUNICIPIO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.userRoleCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                FOLIO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.userStatusCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                ESTADO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.userActionsCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                ACCIONES
              </Text>
            </View>
            {filtered.map((producer) => (
              <View key={producer.id} style={dashboardStyles.producerTableRow}>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.userNameCol,
                    dashboardStyles.producerNameCell,
                  ]}
                >
                  <View style={dashboardStyles.producerAvatar}>
                    <Text style={dashboardStyles.producerInitials}>
                      {producer.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </Text>
                  </View>
                  <Text style={dashboardStyles.producerName}>
                    {producer.name}
                  </Text>
                </View>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.userEmailCol,
                    dashboardStyles.producerMeta,
                  ]}
                >
                  {producer.municipality || "No especificado"}
                </Text>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.userRoleCol,
                  ]}
                >
                  <Text
                    style={[
                      dashboardStyles.producerName,
                      { color: isDarkMode ? "#4ade80" : "#15803d" },
                    ]}
                  >
                    {producer.folio}
                  </Text>
                </View>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.userStatusCol,
                  ]}
                >
                  <Text
                    style={[
                      dashboardStyles.statusBadge,
                      producer.status === "Activo"
                        ? dashboardStyles.statusActive
                        : dashboardStyles.statusInactive,
                    ]}
                  >
                    {producer.status}
                  </Text>
                </View>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.userActionsCol,
                  ]}
                >
                  <Pressable
                    style={dashboardStyles.userActionButton}
                    onPress={() => setQrModalProducer(producer)}
                  >
                    <ActionGlyph name="qr" />
                    <Text style={dashboardStyles.userActionText}>Ver QR</Text>
                  </Pressable>
                  <Pressable
                    style={dashboardStyles.userActionButton}
                    onPress={() => openEditModal(producer)}
                  >
                    <ActionGlyph name="edit" />
                  </Pressable>
                  <Pressable
                    style={dashboardStyles.userActionButton}
                    onPress={() => handleDelete(producer.id)}
                  >
                    <ActionGlyph name="delete" />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      <Modal visible={!!qrModalProducer} transparent animationType="fade">
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
            <Text style={[dashboardStyles.panelTitle, { textAlign: "center" }]}>
              {qrModalProducer?.name}
            </Text>
            <Text
              style={{
                color: isDarkMode ? "#4ade80" : "#15803d",
                fontWeight: "700",
                textAlign: "center",
                marginBottom: 16,
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              Folio del productor: {qrModalProducer?.folio}
            </Text>
            <View style={{ alignItems: "center" }}>
              {qrModalProducer && (
                <QRCodeReal value={qrModalProducer.qr_code} size={compact ? 160 : 220} />
              )}
            </View>
            <Pressable
              style={[dashboardStyles.newButton, { marginTop: 20 }]}
              onPress={() => setQrModalProducer(null)}
            >
              <Text style={dashboardStyles.newButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View
          style={[
            dashboardStyles.modalBackdrop,
            compact && dashboardStyles.modalBackdropCompact,
          ]}
        >
          <ScrollView
            style={dashboardStyles.formScroll}
            contentContainerStyle={dashboardStyles.formScrollContent}
          >
            <View
              style={[
                dashboardStyles.formCard,
                compact && dashboardStyles.formCardCompact,
              ]}
            >
              <Text style={dashboardStyles.panelTitle}>
                {editingProducer ? "Editar productor" : "Nuevo productor"}
              </Text>

              <Text style={dashboardStyles.formLabel}>Nombre completo</Text>
              <TextInput
                style={dashboardStyles.formInput}
                value={name}
                onChangeText={setName}
                placeholderTextColor="#86868b"
                placeholder="Ej. Roberto Sánchez"
              />

              <Text style={dashboardStyles.formLabel}>Municipio</Text>
              <TextInput
                style={dashboardStyles.formInput}
                value={municipality}
                onChangeText={setMunicipality}
                placeholderTextColor="#86868b"
                placeholder="Ej. Uruapan"
              />

              <Text style={dashboardStyles.formLabel}>Teléfono</Text>
              <TextInput
                style={dashboardStyles.formInput}
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor="#86868b"
                placeholder="452 123 4567"
              />

              <Text style={dashboardStyles.formLabel}>Código QR</Text>
              <TextInput
                style={dashboardStyles.formInput}
                value={qrCode}
                editable={false}
                placeholderTextColor="#86868b"
              />

              <View
                style={[
                  dashboardStyles.formActions,
                  compact && dashboardStyles.formActionsCompact,
                ]}
              >
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={dashboardStyles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={dashboardStyles.newButton}
                  disabled={saving}
                >
                  <Text style={dashboardStyles.newButtonText}>
                    {saving ? "Guardando..." : "Guardar"}
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
