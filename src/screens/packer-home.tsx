/* eslint-disable react-hooks/set-state-in-effect */
import { AppBrand } from "@/components/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleHomeStyles as styles } from "@/styles/role-home";
import { getDashboardTheme } from "@/styles/dashboard";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { producerIdFromQr, producerName, producerQrValue } from "../lib/domain";
import { supabase } from "../lib/supabase";

interface PackerHomeProps {
  account: any;
  onSignOut: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function PackerHome({
  account,
  onSignOut,
  isDarkMode,
  toggleTheme,
}: PackerHomeProps) {
  const { width } = useWindowDimensions();
  const compact = width < 800;
  const narrow = width < 430;
  const theme = getDashboardTheme(isDarkMode);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scannedLock, setScannedLock] = useState(false);

  const [producers, setProducers] = useState<any[]>([]);
  const [receptions, setReceptions] = useState<any[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<any | null>(null);
  const [orchards, setOrchards] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [selectedOrchard, setSelectedOrchard] = useState<any | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(
    null,
  );

  const [qrInput, setQrInput] = useState("");
  const [boxes, setBoxes] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [incidents, setIncidents] = useState("");
  const [incidentType, setIncidentType] = useState("Otro");
  const [incidentSeverity, setIncidentSeverity] = useState("Media");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadData = useCallback(async () => {
    const { data: prodData } = await supabase
      .from("producers")
      .select("id,folio,nombres,apellidos,email,status")
      .order("nombres");
    setProducers(prodData || []);

    const { data: recData } = await supabase
      .from("receptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(15);
    setReceptions(recData || []);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectProducer = async (producer: any) => {
    setSelectedProducer(producer);
    setQrInput(producer.id);
    setSelectedOrchard(null);
    setSelectedRegistration(null);
    const [orchardsResult, registrationsResult] = await Promise.all([
      supabase
        .from("orchards")
        .select("*")
        .eq("producer_id", producer.id)
        .eq("active", true)
        .order("name"),
      supabase
        .from("export_registrations")
        .select("*")
        .eq("producer_id", producer.id)
        .order("created_at", { ascending: false }),
    ]);
    setOrchards(orchardsResult.data || []);
    setRegistrations(registrationsResult.data || []);
    setStatusMessage(
      `Productor identificado: ${producerName(producer)} (${producer.id})`,
    );
  };

  const matchProducerByQr = async (code: string) => {
    const clean = code.trim();
    setQrInput(clean);
    const producerId = producerIdFromQr(clean);
    if (!producerId) {
      setSelectedProducer(null);
      setStatusMessage("El QR no contiene un ID de productor válido.");
      return;
    }
    const { data: found, error } = await supabase
      .from("producers")
      .select("id,folio,nombres,apellidos,email,status")
      .eq("id", producerId)
      .maybeSingle();
    if (error || !found) {
      setSelectedProducer(null);
      setStatusMessage("No se encontró el productor indicado por el QR.");
      return;
    }
    await selectProducer(found);
  };

  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        setStatusMessage(
          "Permiso de cámara denegado. Actívalo en los ajustes de tu dispositivo.",
        );
        return;
      }
    }
    setScannedLock(false);
    setCameraOpen(true);
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scannedLock) return;
    setScannedLock(true);
    setCameraOpen(false);
    void matchProducerByQr(data);
  };

  const handleRegisterReception = async () => {
    const selectedProducerName = producerName(selectedProducer);
    const numBoxes = Number(boxes);
    const numKg = Number(weightKg);

    if (
      !selectedProducer ||
      !selectedOrchard ||
      !selectedRegistration ||
      !Number.isInteger(numBoxes) ||
      numBoxes <= 0 ||
      !Number.isFinite(numKg) ||
      numKg <= 0
    ) {
      setStatusMessage(
        "Escanea al productor, selecciona huerta y registro, e indica cajas y kilos mayores a cero.",
      );
      return;
    }

    setSaving(true);
    try {
      const folio = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
      const producerQr = producerQrValue(selectedProducer);
      const receptionDate = new Date();
      const fecha = [
        receptionDate.getFullYear(),
        String(receptionDate.getMonth() + 1).padStart(2, "0"),
        String(receptionDate.getDate()).padStart(2, "0"),
      ].join("-");
      const { error } = await supabase.from("receptions").insert([
        {
          folio,
          fecha,
          producer_id: selectedProducer.id,
          producer_folio: selectedProducer.folio,
          producer_name: selectedProducerName,
          producer_qr: producerQr,
          qr_code: producerQr,
          concepto: "Recepción de guayaba · Pendiente de embarque",
          orchard_id: selectedOrchard.id,
          orchard_name: selectedOrchard.name,
          export_registration_id: selectedRegistration.id,
          export_registration_number: selectedRegistration.registration_number,
          shipment_id: null,
          shipment_folio: null,
          boxes: numBoxes,
          weight_kg: numKg,
          incidents: incidents.trim() || "Sin daños",
          incident_type: incidents.trim() ? incidentType : null,
          incident_severity: incidents.trim() ? incidentSeverity : null,
          status: "Pendiente",
          received_by: account?.email || "empacador@gmail.com",
        },
      ]);

      if (error) throw error;

      setBoxes("");
      setWeightKg("");
      setIncidents("");
      setIncidentType("Otro");
      setIncidentSeverity("Media");
      setStatusMessage(
        `✅ Recepción ${folio} guardada: ${numBoxes} cajas (${numKg} kg) de ${selectedProducerName} · pendiente de validación y embarque.`,
      );
      loadData();
    } catch (err: any) {
      setStatusMessage(err.message || "Error al registrar la recepción.");
    } finally {
      setSaving(false);
    }
  };

  const t = {
    bg: theme.bg,
    card: theme.card,
    text: theme.text,
    sub: theme.sub,
    border: theme.border,
    primary: theme.primary,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.bg }]}>
      <View
        style={[
          styles.header,
          compact && styles.headerCompact,
          { borderBottomColor: t.border },
        ]}
      >
        <AppBrand
          isDarkMode={isDarkMode}
          compact={narrow}
          style={narrow ? styles.logoCompact : styles.logo}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          <ThemeToggle isDarkMode={isDarkMode} onPress={toggleTheme} />
          <Pressable
            style={[styles.signOutButton, { borderColor: t.border }]}
            onPress={onSignOut}
          >
            <Text style={[styles.signOutText, { color: t.text }]}>
              Cerrar sesión
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          compact && styles.contentCompact,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.eyebrow, { color: t.primary }]}>
          RECEPCIÓN EN PATIO
        </Text>
        <Text
          style={[
            styles.title,
            compact && styles.titleCompact,
            { color: t.text },
          ]}
        >
          Hola, {account.name}.
        </Text>
        <Text style={[styles.description, { color: t.sub }]}>
          Utiliza la cámara del dispositivo para escanear el código QR del
          productor o búscalo manualmente para registrar su fruta.
        </Text>

        {statusMessage ? (
          <Text
            style={[
              styles.note,
              {
                color: statusMessage.includes("✅") ? "#16a34a" : "#ef4444",
                fontWeight: "600",
              },
            ]}
          >
            {statusMessage}
          </Text>
        ) : null}

        <View style={[styles.gridTwo, compact && styles.gridTwoCompact]}>
          <View
            style={[
              styles.panel,
              { backgroundColor: t.card, borderColor: t.border },
              !compact && { flex: 1.2 },
              compact && styles.panelCompact,
            ]}
          >
            <Text style={[styles.panelTitle, { color: t.text }]}>
              Nueva Recepción
            </Text>

            <Text style={[styles.label, { color: t.text }]}>
              Código QR o Productor
            </Text>
            <View
              style={{ flexDirection: compact ? "column" : "row", gap: 10 }}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    flexGrow: compact ? 0 : 1,
                    flexShrink: compact ? 0 : 1,
                    flexBasis: compact ? "auto" : 0,
                    width: compact ? "100%" : undefined,
                    backgroundColor: t.bg,
                    borderColor: t.border,
                    color: t.text,
                  },
                ]}
                placeholder="GL-PROD-..."
                placeholderTextColor={t.sub}
                value={qrInput}
                onChangeText={setQrInput}
                onSubmitEditing={() => void matchProducerByQr(qrInput)}
              />
              <Pressable
                style={[
                  styles.primaryButton,
                  { marginTop: 0, width: compact ? "100%" : undefined },
                ]}
                onPress={handleOpenCamera}
              >
                <Text style={styles.primaryButtonText}>Escanear QR</Text>
              </Pressable>
            </View>

            <View style={styles.chipRow}>
              {producers.map((p) => {
                const selected = selectedProducer?.id === p.id;
                return (
                  <Pressable
                    key={p.id}
                    style={[
                      styles.chip,
                      { borderColor: t.border },
                      selected && styles.chipActive,
                    ]}
                    onPress={() => {
                      void selectProducer(p);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: t.sub },
                        selected && styles.chipTextActive,
                      ]}
                    >
                      {producerName(p)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ flexDirection: narrow ? "column" : "row", gap: 12 }}>
              <View style={narrow ? { width: "100%" } : { flex: 1 }}>
                <Text style={[styles.label, { color: t.text }]}>Cajas *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: t.bg,
                      borderColor: t.border,
                      color: t.text,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={t.sub}
                  keyboardType="numeric"
                  value={boxes}
                  onChangeText={setBoxes}
                />
              </View>
              <View style={narrow ? { width: "100%" } : { flex: 1 }}>
                <Text style={[styles.label, { color: t.text }]}>Kilos *</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: t.bg,
                      borderColor: t.border,
                      color: t.text,
                    },
                  ]}
                  placeholder="0"
                  placeholderTextColor={t.sub}
                  keyboardType="numeric"
                  value={weightKg}
                  onChangeText={setWeightKg}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: t.text }]}>
              Huerta del productor *
            </Text>
            <View style={styles.chipRow}>
              {orchards.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.chip,
                    { borderColor: t.border },
                    selectedOrchard?.id === item.id && styles.chipActive,
                  ]}
                  onPress={() => setSelectedOrchard(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: t.sub },
                      selectedOrchard?.id === item.id && styles.chipTextActive,
                    ]}
                  >
                    {item.name}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: t.text }]}>
              Registro de exportación *
            </Text>
            <View style={styles.chipRow}>
              {registrations.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.chip,
                    { borderColor: t.border },
                    selectedRegistration?.id === item.id && styles.chipActive,
                  ]}
                  onPress={() => setSelectedRegistration(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: t.sub },
                      selectedRegistration?.id === item.id &&
                        styles.chipTextActive,
                    ]}
                  >
                    {item.registration_number}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Guardar recepción de fruta"
              style={[styles.primaryButton, { marginTop: 12 }]}
              onPress={handleRegisterReception}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Guardar recepción</Text>
              )}
            </Pressable>

            <Text style={[styles.label, { color: t.text }]}>Observaciones</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: t.bg, borderColor: t.border, color: t.text },
              ]}
              placeholder="Estado de la fruta..."
              placeholderTextColor={t.sub}
              value={incidents}
              onChangeText={setIncidents}
            />
            {incidents.trim() ? (
              <>
                <Text style={[styles.label, { color: t.text }]}>
                  Tipo de incidencia
                </Text>
                <View style={styles.chipRow}>
                  {["Daño", "Calidad", "Peso", "Documentación", "Otro"].map(
                    (type) => (
                      <Pressable
                        key={type}
                        style={[
                          styles.chip,
                          { borderColor: t.border },
                          incidentType === type && styles.chipActive,
                        ]}
                        onPress={() => setIncidentType(type)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: t.sub },
                            incidentType === type && styles.chipTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    ),
                  )}
                </View>
                <Text style={[styles.label, { color: t.text }]}>
                  Severidad
                </Text>
                <View style={styles.chipRow}>
                  {["Baja", "Media", "Alta"].map((severity) => (
                    <Pressable
                      key={severity}
                      style={[
                        styles.chip,
                        { borderColor: t.border },
                        incidentSeverity === severity && styles.chipActive,
                      ]}
                      onPress={() => setIncidentSeverity(severity)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: t.sub },
                          incidentSeverity === severity &&
                            styles.chipTextActive,
                        ]}
                      >
                        {severity}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}
          </View>

          <View
            style={[
              styles.panel,
              { backgroundColor: t.card, borderColor: t.border },
              !compact && styles.panelDesktop,
              compact && styles.panelCompact,
            ]}
          >
            <Text style={[styles.panelTitle, { color: t.text }]}>
              Registros de hoy
            </Text>
            {receptions.length === 0 ? (
              <Text style={{ color: t.sub, fontSize: 13, marginTop: 10 }}>
                Sin recepciones capturadas.
              </Text>
            ) : (
              receptions.map((r) => (
                <View
                  key={r.id}
                  style={[styles.listItem, { borderTopColor: t.border }]}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text
                      style={{ color: t.text, fontWeight: "700", fontSize: 14 }}
                    >
                      {r.producer_name}
                    </Text>
                    <Text style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>
                      {r.folio} · {r.shipment_folio ? `Embarque: ${r.shipment_folio}` : "Pendiente de validación/embarque"}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        color: "#16a34a",
                        fontWeight: "800",
                        fontSize: 15,
                      }}
                    >
                      {r.weight_kg} kg
                    </Text>
                    <Text style={{ color: t.sub, fontSize: 12 }}>
                      {r.boxes} cajas
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <Modal visible={cameraOpen} transparent animationType="slide">
        <View style={localStyles.modalBg}>
          <View
            style={[
              localStyles.modalContainer,
              { backgroundColor: t.card, borderColor: t.border },
            ]}
          >
            <Text
              style={[styles.panelTitle, { color: t.text, marginBottom: 16 }]}
            >
              Apunta al código QR
            </Text>
            <View style={localStyles.cameraBox}>
              <CameraView
                style={{ flex: 1, width: "100%", height: "100%" }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={localStyles.cameraTarget} />
            </View>
            <Pressable
              style={[
                styles.primaryButton,
                { width: "100%", backgroundColor: "#ef4444" },
              ]}
              onPress={() => setCameraOpen(false)}
            >
              <Text style={styles.primaryButtonText}>Cerrar cámara</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const localStyles = StyleSheet.create({
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 440,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
  },
  cameraBox: {
    width: "100%",
    height: 320,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000000",
    marginBottom: 20,
  },
  cameraTarget: {
    width: 200,
    height: 200,
    borderWidth: 2,
    borderColor: "#0071e3",
    borderRadius: 16,
    position: "absolute",
  },
});
