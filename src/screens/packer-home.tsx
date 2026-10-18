/* eslint-disable react-hooks/refs, react-hooks/set-state-in-effect */
import { roleHomeStyles as styles } from "@/styles/role-home";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
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

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scannedLock, setScannedLock] = useState(false);

  const [producers, setProducers] = useState<any[]>([]);
  const [receptions, setReceptions] = useState<any[]>([]);
  const [selectedProducer, setSelectedProducer] = useState<any | null>(null);
  const [orchards, setOrchards] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [selectedOrchard, setSelectedOrchard] = useState<any | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<any | null>(
    null,
  );
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);

  const [qrInput, setQrInput] = useState("");
  const [boxes, setBoxes] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [incidents, setIncidents] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const spinAnim = useRef(new Animated.Value(isDarkMode ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(spinAnim, {
      toValue: isDarkMode ? 0 : 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [isDarkMode, spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const loadData = useCallback(async () => {
    const { data: prodData } = await supabase
      .from("producers")
      .select("id,folio,nombres,apellidos,email,status")
      .order("nombres");
    setProducers(prodData || []);

    const { data: shipmentData } = await supabase
      .from("shipments")
      .select("*")
      .neq("status", "Entregado")
      .order("created_at", { ascending: false });
    setShipments(shipmentData || []);

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
      !selectedShipment ||
      !numBoxes ||
      !numKg
    ) {
      setStatusMessage(
        "Escanea al productor y selecciona huerta, registro, embarque, cajas y kilos.",
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
          concepto: `Recepción de guayaba · ${selectedShipment.folio}`,
          orchard_id: selectedOrchard.id,
          orchard_name: selectedOrchard.name,
          export_registration_id: selectedRegistration.id,
          export_registration_number: selectedRegistration.registration_number,
          shipment_id: selectedShipment.id,
          shipment_folio: selectedShipment.folio,
          boxes: numBoxes,
          weight_kg: numKg,
          incidents: incidents.trim() || "Sin daños",
          received_by: account?.email || "empacador@gmail.com",
        },
      ]);

      if (error) throw error;

      setBoxes("");
      setWeightKg("");
      setIncidents("");
      setStatusMessage(
        `✅ Recepción ${folio} guardada: ${numBoxes} cajas (${numKg} kg) de ${selectedProducerName}.`,
      );
      loadData();
    } catch (err: any) {
      setStatusMessage(err.message || "Error al registrar la recepción.");
    } finally {
      setSaving(false);
    }
  };

  const t = {
    bg: isDarkMode ? "#000000" : "#f3f4f6",
    card: isDarkMode ? "#1d1d1f" : "#ffffff",
    text: isDarkMode ? "#f5f5f7" : "#111827",
    sub: isDarkMode ? "#86868b" : "#6b7280",
    border: isDarkMode ? "#292929" : "#d1d5db",
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
        <Image
          source={
            isDarkMode
              ? require("../../assets/images/logo-horizontal-dark.png")
              : require("../../assets/images/guavalink-logo.png")
          }
          style={[styles.logo, !isDarkMode && { tintColor: "#111827" }]}
          resizeMode="contain"
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 15 }}>
          <Pressable onPress={toggleTheme}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Text style={{ fontSize: 24 }}>{isDarkMode ? "☀️" : "🌙"}</Text>
            </Animated.View>
          </Pressable>
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
        <Text style={[styles.eyebrow, { color: "#0071e3" }]}>
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

            <Text style={[styles.label, { color: t.text }]}>
              Embarque creado por administración *
            </Text>
            <View style={styles.chipRow}>
              {shipments.map((item) => (
                <Pressable
                  key={item.id}
                  style={[
                    styles.chip,
                    { borderColor: t.border },
                    selectedShipment?.id === item.id && styles.chipActive,
                  ]}
                  onPress={() => setSelectedShipment(item)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: t.sub },
                      selectedShipment?.id === item.id && styles.chipTextActive,
                    ]}
                  >
                    {item.folio} · {item.destination}
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
                      {r.folio} · Embarque: {r.shipment_folio}
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
