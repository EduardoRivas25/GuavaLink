/* eslint-disable react-hooks/set-state-in-effect */
import { producerName, producerQrValue } from "@/lib/domain";
import { AppBrand } from "@/components/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { roleHomeStyles as styles } from "@/styles/role-home";
import { getDashboardTheme } from "@/styles/dashboard";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCodeReal from "../components/qr-code";
import { supabase } from "../lib/supabase";

interface ProducerHomeProps {
  account: any;
  onSignOut: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export default function ProducerHome({
  account,
  onSignOut,
  isDarkMode,
  toggleTheme,
}: ProducerHomeProps) {
  const { width } = useWindowDimensions();
  const compact = width < 700;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [schemaReady, setSchemaReady] = useState(true);
  const [message, setMessage] = useState("");
  const [producerRecord, setProducerRecord] = useState<any | null>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [orchards, setOrchards] = useState<any[]>([]);
  const [editingOrchard, setEditingOrchard] = useState<any | null>(null);
  const [deleteOrchardTarget, setDeleteOrchardTarget] = useState<any | null>(
    null,
  );
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [orchardName, setOrchardName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [hectares, setHectares] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const theme = getDashboardTheme(isDarkMode);
  const loadProducerData = useCallback(async () => {
    setLoading(true);
    setSchemaReady(true);
    try {
      const email = (account?.email || "productor@gmail.com").toLowerCase();
      const { data: prod, error: producerError } = await supabase
        .from("producers")
        .select("id,folio,nombres,apellidos,email,status")
        .ilike("email", email)
        .maybeSingle();
      if (producerError) throw producerError;
      if (!prod)
        throw new Error("No se encontró el productor vinculado a esta cuenta.");
      setProducerRecord(prod);
      const [
        receptionsResult,
        paymentsResult,
        orchardsResult,
        registrationsResult,
      ] = await Promise.all([
        supabase
          .from("receptions")
          .select("*")
          .eq("producer_id", prod.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("payments")
          .select("*")
          .eq("producer_id", prod.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("orchards")
          .select("*")
          .eq("producer_id", prod.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("export_registrations")
          .select("*")
          .eq("producer_id", prod.id)
          .order("created_at", { ascending: false }),
      ]);
      if (receptionsResult.error) throw receptionsResult.error;
      if (orchardsResult.error) throw orchardsResult.error;
      if (registrationsResult.error) throw registrationsResult.error;
      setDeliveries(receptionsResult.data || []);
      setPayments(paymentsResult.data || []);
      setOrchards(orchardsResult.data || []);
      setRegistrations(registrationsResult.data || []);
      setMessage("");
    } catch (error: any) {
      const missingSchema =
        error?.code === "42P01" ||
        error?.code === "42703" ||
        /does not exist|schema cache|column .*producer_id/i.test(
          error?.message || "",
        );
      setSchemaReady(!missingSchema);
      setMessage(
        missingSchema
          ? "La base de datos aún no tiene instalada la migración de huertas y registros de exportación."
          : error.message ||
              "No fue posible cargar la información del productor.",
      );
    } finally {
      setLoading(false);
    }
  }, [account]);

  useEffect(() => {
    void loadProducerData();
  }, [loadProducerData]);

  const saveOrchard = async () => {
    if (!schemaReady) {
      setMessage(
        "Primero debe aplicarse la migración de trazabilidad en Supabase.",
      );
      return;
    }
    const parsedHectares = Number(hectares),
      parsedLatitude = Number(latitude),
      parsedLongitude = Number(longitude);
    if (
      !producerRecord ||
      !orchardName.trim() ||
      parsedHectares <= 0 ||
      !Number.isFinite(parsedLatitude) ||
      parsedLatitude < -90 ||
      parsedLatitude > 90 ||
      !Number.isFinite(parsedLongitude) ||
      parsedLongitude < -180 ||
      parsedLongitude > 180
    ) {
      setMessage("Completa nombre, superficie y coordenadas válidas.");
      return;
    }
    const payload = {
      folio:
        editingOrchard?.folio ?? `HRT-${Date.now().toString().slice(-7)}`,
      name: orchardName.trim(),
      producer_id: producerRecord.id,
      producer: producerName(producerRecord),
      hectares: parsedHectares,
      latitude: parsedLatitude,
      longitude: parsedLongitude,
      tenure: editingOrchard?.tenure ?? "Propia",
      active: editingOrchard?.active ?? true,
    };
    setSaving(true);
    try {
      const { data, error } = editingOrchard
        ? await supabase
            .from("orchards")
            .update(payload)
            .eq("id", editingOrchard.id)
            .eq("producer_id", producerRecord.id)
            .select("id")
            .maybeSingle()
        : await supabase
            .from("orchards")
            .insert([payload])
            .select("id")
            .single();
      if (error) throw error;
      if (!data) throw new Error("Supabase no permitió modificar la huerta.");
      setOrchardName("");
      setLatitude("");
      setLongitude("");
      setHectares("");
      setEditingOrchard(null);
      await loadProducerData();
      setMessage(
        editingOrchard
          ? "✅ Huerta actualizada correctamente."
          : "✅ Huerta registrada correctamente.",
      );
    } catch (error: any) {
      setMessage(error.message || "No fue posible guardar la huerta.");
    } finally {
      setSaving(false);
    }
  };

  const startEditingOrchard = (orchard: any) => {
    setEditingOrchard(orchard);
    setOrchardName(orchard.name || "");
    setHectares(String(orchard.hectares ?? ""));
    setLatitude(String(orchard.latitude ?? ""));
    setLongitude(String(orchard.longitude ?? ""));
    setMessage("");
  };

  const cancelEditingOrchard = () => {
    setEditingOrchard(null);
    setOrchardName("");
    setHectares("");
    setLatitude("");
    setLongitude("");
  };

  const confirmDeleteOrchard = async () => {
    if (!deleteOrchardTarget || !producerRecord) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("orchards")
        .delete()
        .eq("id", deleteOrchardTarget.id)
        .eq("producer_id", producerRecord.id)
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Supabase no permitió eliminar la huerta.");
      setDeleteOrchardTarget(null);
      if (editingOrchard?.id === deleteOrchardTarget.id) {
        cancelEditingOrchard();
      }
      await loadProducerData();
      setMessage("✅ Huerta eliminada correctamente.");
    } catch (error: any) {
      setDeleteOrchardTarget(null);
      setMessage(
        error.message ||
          "No fue posible eliminar la huerta. Verifica que no tenga recepciones asociadas.",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveRegistration = async () => {
    if (!schemaReady) {
      setMessage(
        "Primero debe aplicarse la migración de trazabilidad en Supabase.",
      );
      return;
    }
    if (!producerRecord || !registrationNumber.trim()) {
      setMessage("Ingresa el número de registro de exportación.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("export_registrations")
      .insert([
        {
          producer_id: producerRecord.id,
          registration_number: registrationNumber.trim().toUpperCase(),
        },
      ]);
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setRegistrationNumber("");
    await loadProducerData();
    setMessage("✅ Registro de exportación guardado.");
  };

  const totalKilos = deliveries.reduce(
    (sum, item) => sum + (Number(item.weight_kg) || 0),
    0,
  );
  const totalBoxes = deliveries.reduce(
    (sum, item) => sum + (Number(item.boxes) || 0),
    0,
  );
  const qrValue = producerRecord
    ? producerQrValue(producerRecord)
    : "GUAVALINK:PRODUCER:NO-DISPONIBLE";
  const qrSize = compact ? Math.max(96, Math.min(160, width - 150)) : 180;
  const t = {
    bg: theme.bg,
    card: theme.card,
    text: theme.text,
    sub: theme.sub,
    border: theme.border,
    primary: theme.primary,
  };
  const inputStyle = [
    styles.input,
    { backgroundColor: t.bg, borderColor: t.border, color: t.text },
  ];

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
          compact={width < 430}
          style={width < 430 ? styles.logoCompact : styles.logo}
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
          PANEL DE PRODUCTOR
        </Text>
        <Text
          style={[
            styles.title,
            compact && styles.titleCompact,
            { color: t.text },
          ]}
        >
          Hola, {producerRecord ? producerName(producerRecord) : account.name}.
        </Text>
        <Text style={[styles.description, { color: t.sub }]}>
          Registra tus huertas y registros de exportación, muestra tu QR y
          consulta las cajas y kilos recibidos.
        </Text>
        <Text style={[styles.account, { color: t.sub }]}>
          Cuenta verificada: {account.email}
        </Text>
        {message ? (
          <Text
            style={[
              styles.note,
              {
                color: message.startsWith("✅") ? "#16a34a" : "#ef4444",
                fontWeight: "600",
              },
            ]}
          >
            {message}
          </Text>
        ) : null}
        {loading ? (
          <ActivityIndicator
            size="large"
            color={t.primary}
            style={{ marginVertical: 40 }}
          />
        ) : (
          <>
            <View style={[styles.cards, compact && styles.cardsCompact]}>
              <View
                style={[
                  styles.card,
                  compact && styles.cardCompact,
                  { backgroundColor: t.card, borderColor: t.border },
                ]}
              >
                <Text style={[styles.cardTitle, { color: t.sub }]}>
                  ENTREGAS REALIZADAS
                </Text>
                <Text style={[styles.cardValue, { color: t.text }]}>
                  {deliveries.length}
                </Text>
                <Text style={[styles.cardDetail, { color: t.sub }]}>
                  Viajes registrados en patio
                </Text>
              </View>
              <View
                style={[
                  styles.card,
                  compact && styles.cardCompact,
                  { backgroundColor: t.card, borderColor: t.border },
                ]}
              >
                <Text style={[styles.cardTitle, { color: t.sub }]}>
                  CAJAS TOTALES
                </Text>
                <Text style={[styles.cardValue, { color: t.primary }]}>
                  {totalBoxes.toLocaleString()}
                </Text>
                <Text style={[styles.cardDetail, { color: t.sub }]}>
                  Cajas físicas contadas
                </Text>
              </View>
              <View
                style={[
                  styles.card,
                  compact && styles.cardCompact,
                  { backgroundColor: t.card, borderColor: t.border },
                ]}
              >
                <Text style={[styles.cardTitle, { color: t.sub }]}>
                  KILOGRAMOS RECIBIDOS
                </Text>
                <Text style={[styles.cardValue, { color: "#16a34a" }]}>
                  {totalKilos.toLocaleString()} kg
                </Text>
                <Text style={[styles.cardDetail, { color: t.sub }]}>
                  Peso neto documentado
                </Text>
              </View>
            </View>
            <View style={[styles.gridTwo, compact && styles.gridTwoCompact]}>
              <View
                style={[
                  styles.panel,
                  !compact && styles.panelDesktop,
                  compact && styles.panelCompact,
                  { backgroundColor: t.card, borderColor: t.border },
                ]}
              >
                <Text style={[styles.panelTitle, { color: t.text }]}>
                  {editingOrchard ? "Editar huerta" : "Registrar huerta"}
                </Text>
                <Text style={[styles.label, { color: t.text }]}>Nombre</Text>
                <TextInput
                  style={inputStyle}
                  value={orchardName}
                  onChangeText={setOrchardName}
                  placeholder="Ej. La Esperanza"
                  placeholderTextColor={t.sub}
                />
                <Text style={[styles.label, { color: t.text }]}>
                  Superficie en hectáreas
                </Text>
                <TextInput
                  style={inputStyle}
                  value={hectares}
                  onChangeText={setHectares}
                  keyboardType="decimal-pad"
                  placeholder="Ej. 8.5"
                  placeholderTextColor={t.sub}
                />
                <View
                  style={{ flexDirection: compact ? "column" : "row", gap: 12 }}
                >
                  <View style={compact ? { width: "100%" } : { flex: 1 }}>
                    <Text style={[styles.label, { color: t.text }]}>
                      Latitud
                    </Text>
                    <TextInput
                      style={inputStyle}
                      value={latitude}
                      onChangeText={setLatitude}
                      keyboardType="numbers-and-punctuation"
                      placeholder="19.4200"
                      placeholderTextColor={t.sub}
                    />
                  </View>
                  <View style={compact ? { width: "100%" } : { flex: 1 }}>
                    <Text style={[styles.label, { color: t.text }]}>
                      Longitud
                    </Text>
                    <TextInput
                      style={inputStyle}
                      value={longitude}
                      onChangeText={setLongitude}
                      keyboardType="numbers-and-punctuation"
                      placeholder="-102.0600"
                      placeholderTextColor={t.sub}
                    />
                  </View>
                </View>
                <Pressable
                  style={[
                    styles.primaryButton,
                    !schemaReady && { opacity: 0.5 },
                  ]}
                  onPress={saveOrchard}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {editingOrchard ? "Actualizar huerta" : "Guardar huerta"}
                    </Text>
                  )}
                </Pressable>
                {editingOrchard ? (
                  <Pressable onPress={cancelEditingOrchard} disabled={saving}>
                    <Text
                      style={{
                        color: t.sub,
                        textAlign: "center",
                        marginTop: 12,
                        fontWeight: "600",
                      }}
                    >
                      Cancelar edición
                    </Text>
                  </Pressable>
                ) : null}
                {!schemaReady && (
                  <Text style={{ color: "#ef4444", fontSize: 12 }}>
                    Falta aplicar la migración de trazabilidad en Supabase.
                  </Text>
                )}
                {orchards.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.listItem, { borderTopColor: t.border }]}
                  >
                    <View>
                      <Text style={{ color: t.text, fontWeight: "600" }}>
                        {item.name}
                      </Text>
                      <Text style={{ color: t.sub, fontSize: 12 }}>
                        {item.latitude}, {item.longitude}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 8 }}>
                      <Text style={{ color: "#16a34a", fontWeight: "700" }}>
                        {item.hectares} ha
                      </Text>
                      <View style={{ flexDirection: "row", gap: 14 }}>
                        <Pressable onPress={() => startEditingOrchard(item)}>
                          <Text style={{ color: t.primary, fontWeight: "700" }}>
                            Editar
                          </Text>
                        </Pressable>
                        <Pressable onPress={() => setDeleteOrchardTarget(item)}>
                          <Text style={{ color: "#dc2626", fontWeight: "700" }}>
                            Eliminar
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              <View
                style={[
                  styles.panel,
                  !compact && styles.panelDesktop,
                  compact && styles.panelCompact,
                  { backgroundColor: t.card, borderColor: t.border },
                ]}
              >
                <Text style={[styles.panelTitle, { color: t.text }]}>
                  Registro de exportación
                </Text>
                <Text style={[styles.panelSubtitle, { color: t.sub }]}>
                  Captura el número o ID oficial que se usará para identificar
                  cada entrega.
                </Text>
                <Text style={[styles.label, { color: t.text }]}>
                  Número de registro (ID)
                </Text>
                <TextInput
                  style={inputStyle}
                  value={registrationNumber}
                  onChangeText={setRegistrationNumber}
                  autoCapitalize="characters"
                  placeholder="Ej. EXP-MX-2026-001"
                  placeholderTextColor={t.sub}
                />
                <Pressable
                  style={[
                    styles.primaryButton,
                    !schemaReady && { opacity: 0.5 },
                  ]}
                  onPress={saveRegistration}
                  disabled={saving}
                >
                  <Text style={styles.primaryButtonText}>Guardar registro</Text>
                </Pressable>
                {!schemaReady && (
                  <Text style={{ color: "#ef4444", fontSize: 12 }}>
                    Falta aplicar la migración de trazabilidad en Supabase.
                  </Text>
                )}
                {registrations.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.listItem, { borderTopColor: t.border }]}
                  >
                    <Text style={{ color: t.text, fontWeight: "600" }}>
                      {item.registration_number}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={[styles.gridTwo, compact && styles.gridTwoCompact]}>
              <View
                style={[
                  styles.panel,
                  compact && styles.panelCompact,
                  { backgroundColor: t.card, borderColor: t.border },
                  !compact && { flex: 0.8 },
                ]}
              >
                <Text style={[styles.panelTitle, { color: t.text }]}>
                  Código QR de identificación
                </Text>
                <Text style={[styles.panelSubtitle, { color: t.sub }]}>
                  Muestra este código al empacador; contiene tu ID de productor.
                </Text>
                <View
                  style={[
                    styles.qrContainer,
                    { borderColor: t.border, backgroundColor: t.bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.qrCodeString,
                      { color: t.text, backgroundColor: t.border },
                    ]}
                  >
                    {producerRecord?.id}
                  </Text>
                  <QRCodeReal value={qrValue} size={qrSize} />
                </View>
              </View>
              <View
                style={
                  compact
                    ? { width: "100%", flexGrow: 0, flexShrink: 0, gap: 24 }
                    : { flex: 1, gap: 24 }
                }
              >
                <View
                  style={[
                    styles.panel,
                    !compact && styles.panelDesktop,
                    compact && styles.panelCompact,
                    { backgroundColor: t.card, borderColor: t.border },
                  ]}
                >
                  <Text style={[styles.panelTitle, { color: t.text }]}>
                    Recepciones recientes
                  </Text>
                  {deliveries.length === 0 ? (
                    <Text style={{ color: t.sub, fontSize: 13 }}>
                      Sin recepciones registradas.
                    </Text>
                  ) : (
                    deliveries.slice(0, 8).map((item) => (
                      <View
                        key={item.id}
                        style={[styles.listItem, { borderTopColor: t.border }]}
                      >
                        <View>
                          <Text style={{ color: t.text, fontWeight: "600" }}>
                            {item.folio}
                          </Text>
                          <Text style={{ color: t.sub, fontSize: 12 }}>
                            {item.orchard_name} · {item.shipment_folio}
                          </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                          <Text style={{ color: "#16a34a", fontWeight: "700" }}>
                            {item.weight_kg} kg
                          </Text>
                          <Text style={{ color: t.sub, fontSize: 12 }}>
                            {item.boxes} cajas
                          </Text>
                        </View>
                      </View>
                    ))
                  )}
                </View>
                <View
                  style={[
                    styles.panel,
                    !compact && styles.panelDesktop,
                    compact && styles.panelCompact,
                    { backgroundColor: t.card, borderColor: t.border },
                  ]}
                >
                  <Text style={[styles.panelTitle, { color: t.text }]}>
                    Pagos y liquidaciones
                  </Text>
                  {payments.length === 0 ? (
                    <Text style={{ color: t.sub, fontSize: 13 }}>
                      Sin pagos registrados.
                    </Text>
                  ) : (
                    payments.map((item) => (
                      <View
                        key={item.id}
                        style={[styles.listItem, { borderTopColor: t.border }]}
                      >
                        <Text style={{ color: t.text, fontWeight: "600" }}>
                          {item.folio}
                        </Text>
                        <Text style={{ color: t.text, fontWeight: "700" }}>
                          ${Number(item.amount).toLocaleString()}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={Boolean(deleteOrchardTarget)}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteOrchardTarget(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.72)",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 440,
              padding: 24,
              borderRadius: 22,
              borderWidth: 1,
              backgroundColor: t.card,
              borderColor: t.border,
            }}
          >
            <Text style={[styles.panelTitle, { color: t.text }]}>
              Eliminar huerta
            </Text>
            <Text style={{ color: t.sub, lineHeight: 21, marginTop: 10 }}>
              ¿Deseas eliminar {deleteOrchardTarget?.name}? Esta acción no se
              puede deshacer.
            </Text>
            <View
              style={{
                flexDirection: compact ? "column" : "row",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: 24,
              }}
            >
              <Pressable
                onPress={() => setDeleteOrchardTarget(null)}
                disabled={saving}
                style={[
                  styles.primaryButton,
                  { backgroundColor: t.border, marginTop: 0 },
                ]}
              >
                <Text style={[styles.primaryButtonText, { color: t.text }]}>
                  Cancelar
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void confirmDeleteOrchard()}
                disabled={saving}
                style={[
                  styles.primaryButton,
                  { backgroundColor: "#dc2626", marginTop: 0 },
                  saving && { opacity: 0.6 },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Eliminar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
