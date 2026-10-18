/* eslint-disable react-hooks/set-state-in-effect */
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
import { AdminGlyph, NavGlyph } from "@/components/dashboard-glyphs";
import { dashboardStyles } from "@/styles/dashboard";
import { producerFullName } from "@/screens/producers";
import { supabase } from "@/lib/supabase";

type AccountRole = "Administrador" | "Productor" | "Empacador";
type CreatableRole = "Productor" | "Empacador";
type UserAccount = {
  id: string;
  name: string;
  email: string;
  role: AccountRole;
  producerFolio?: string;
  active: boolean;
};

type ProducerRecord = {
  id: string;
  folio: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  active: boolean | null;
  status: string | null;
};

const accountRole = (value: string): AccountRole => {
  const role = value.toLowerCase();
  if (role === "admin" || role === "administrador") return "Administrador";
  if (role === "packer" || role === "empacador") return "Empacador";
  return "Productor";
};

export default function UsersRolesScreen({ compact }: { compact: boolean }) {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [producers, setProducers] = useState<ProducerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"Todos" | "Activas" | "Inactivas">(
    "Todos",
  );
  const [roleFilter, setRoleFilter] = useState<"Todos" | AccountRole>("Todos");
  const [mode, setMode] = useState<"new" | "password" | null>(null);
  const [role, setRole] = useState<CreatableRole>("Empacador");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [producerFolio, setProducerFolio] = useState("");
  const [target, setTarget] = useState<UserAccount | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [notice, setNotice] = useState("");

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const [accountsResult, producersResult] = await Promise.all([
        supabase
          .from("users_roles")
          .select("id,email,name,role,status,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("producers")
          .select("id,folio,nombres,apellidos,email,active,status")
          .order("nombres"),
      ]);
      if (accountsResult.error) throw accountsResult.error;
      if (producersResult.error) throw producersResult.error;
      const loadedProducers = (producersResult.data || []) as ProducerRecord[];
      setProducers(loadedProducers);
      setAccounts(
        (accountsResult.data || []).map((row: any) => ({
          id: String(row.id),
          name: row.name || row.email,
          email: row.email || "",
          role: accountRole(row.role || "productor"),
          producerFolio: loadedProducers.find(
            (producer) =>
              producer.email?.toLowerCase() === String(row.email).toLowerCase(),
          )?.folio,
          active: row.status !== "Inactivo",
        })),
      );
      setNotice("");
    } catch (error: any) {
      setNotice(error.message || "No fue posible cargar las cuentas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const linkedProducerFolios = accounts
    .filter((account) => account.role === "Productor")
    .map((account) => account.producerFolio);
  const availableProducers = producers.filter(
    (producer) =>
      producer.active !== false &&
      producer.status !== "Inactivo" &&
      !linkedProducerFolios.includes(producer.folio),
  );
  const visible = accounts.filter((account) => {
    const matchesText =
      `${account.name} ${account.email} ${account.role} ${account.producerFolio ?? ""}`
        .toLowerCase()
        .includes(query.toLowerCase());
    return (
      matchesText &&
      (filter === "Todos" || account.active === (filter === "Activas")) &&
      (roleFilter === "Todos" || account.role === roleFilter)
    );
  });
  const openNew = () => {
    setRole("Empacador");
    setName("");
    setEmail("");
    setPassword("");
    setProducerFolio(availableProducers[0]?.folio ?? "");
    setNotice("");
    setMode("new");
  };
  const openPassword = (account: UserAccount) => {
    setTarget(account);
    setPassword("");
    setConfirmation("");
    setNotice("");
    setMode("password");
  };
  const saveNew = async () => {
    if (role === "Productor") {
      const producer = producers.find(
        (item) =>
          item.folio === producerFolio &&
          item.active !== false &&
          item.status !== "Inactivo",
      );
      if (!producer || linkedProducerFolios.includes(producerFolio)) {
        setNotice("Selecciona un productor activo que aún no tenga cuenta.");
        return;
      }
      if (password.trim().length < 8) {
        setNotice("La contraseña debe tener al menos 8 caracteres.");
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setNotice("Escribe un correo electrónico válido.");
        return;
      }
      setSaving(true);
      const { error } = await supabase.from("users_roles").insert([
        {
        name: producerFullName(producer),
        email: email.trim().toLowerCase(),
          role: "productor",
        password,
          status: "Activo",
        },
      ]);
      setSaving(false);
      if (error) {
        setNotice(error.message);
        return;
      }
      setMode(null);
      await loadAccounts();
      return;
    }
    if (!name.trim() || !email.trim() || !email.includes("@")) {
      setNotice("Escribe el nombre y un correo electrónico válido.");
      return;
    }
    if (password.trim().length < 8) {
      setNotice("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (
      accounts.some(
        (account) => account.email.toLowerCase() === email.trim().toLowerCase(),
      )
    ) {
      setNotice("Ya existe una cuenta con ese correo.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("users_roles").insert([
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: "empacador",
        password,
        status: "Activo",
      },
    ]);
    setSaving(false);
    if (error) {
      setNotice(error.message);
      return;
    }
    setMode(null);
    await loadAccounts();
  };
  const savePassword = async () => {
    if (!target) return;
    if (password.trim().length < 8) {
      setNotice("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmation) {
      setNotice("Las contraseñas no coinciden.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("users_roles")
      .update({ password })
      .eq("id", target.id)
      .select("id")
      .maybeSingle();
    setSaving(false);
    if (error || !data) {
      setNotice(error?.message || "No fue posible cambiar la contraseña.");
      return;
    }
    setMode(null);
  };
  const toggleAccount = async (account: UserAccount) => {
    if (
      account.role === "Administrador" &&
      account.active &&
      accounts.filter((item) => item.role === "Administrador" && item.active)
        .length <= 1
    ) {
      setNotice("No puedes dar de baja la única cuenta administradora activa.");
      return;
    }
    const active = !account.active;
    const { data, error } = await supabase
      .from("users_roles")
      .update({ status: active ? "Activo" : "Inactivo" })
      .eq("id", account.id)
      .select("id")
      .maybeSingle();
    if (error || !data) {
      setNotice(error?.message || "No fue posible cambiar el estado.");
      return;
    }
    setAccounts((current) =>
      current.map((item) => (item.id === account.id ? { ...item, active } : item)),
    );
    setNotice(active ? "✅ Cuenta reactivada." : "✅ Cuenta dada de baja.");
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
            Usuarios y roles
          </Text>
          <Text style={dashboardStyles.subtitle}>
            Administra accesos de productores y personal de recepción.
          </Text>
        </View>
        <Pressable style={dashboardStyles.newButton} onPress={openNew}>
          <AdminGlyph name="add" />
          <Text style={dashboardStyles.newButtonText}>Nueva cuenta</Text>
        </Pressable>
      </View>
      {notice && mode === null ? (
        <Text
          style={[
            dashboardStyles.emptyText,
            { color: notice.includes("✅") ? "#16a34a" : "#ef4444" },
          ]}
        >
          {notice}
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
            <Text style={dashboardStyles.statLabel}>Cuentas registradas</Text>
            <View style={dashboardStyles.statIcon}>
              <NavGlyph name="users" />
            </View>
          </View>
          <Text style={dashboardStyles.statValue}>
            {String(accounts.length).padStart(2, "0")}
          </Text>
          <Text style={dashboardStyles.producerStatNote}>
            Accesos del empaque
          </Text>
        </View>
        <View
          style={[
            dashboardStyles.producerStatCard,
            compact && dashboardStyles.producerStatCardCompact,
          ]}
        >
          <View style={dashboardStyles.statTop}>
            <Text style={dashboardStyles.statLabel}>Cuentas activas</Text>
            <View style={dashboardStyles.statIcon}>
              <AdminGlyph name="check" color="#16a34a" size={20} />
            </View>
          </View>
          <Text style={dashboardStyles.statValue}>
            {String(
              accounts.filter((account) => account.active).length,
            ).padStart(2, "0")}
          </Text>
          <Text style={dashboardStyles.producerStatNote}>
            Pueden iniciar sesión
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
            placeholder="Buscar por nombre, correo o folio..."
            placeholderTextColor="#86868b"
            style={dashboardStyles.producerSearchInput}
            accessibilityLabel="Buscar cuentas"
          />
        </View>
        <View style={dashboardStyles.userFilters}>
          <Pressable
            style={dashboardStyles.filterButton}
            onPress={() =>
              setRoleFilter((value) =>
                value === "Todos"
                  ? "Productor"
                  : value === "Productor"
                    ? "Empacador"
                    : "Todos",
              )
            }
          >
            <Text style={dashboardStyles.filterText}>{roleFilter} ⌄</Text>
          </Pressable>
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
      </View>
      {compact ? (
        <View style={dashboardStyles.producerCards}>
          {visible.map((account) => (
            <View key={account.id} style={dashboardStyles.producerCard}>
              <View style={dashboardStyles.producerMobileHeading}>
                <View style={dashboardStyles.producerAvatar}>
                  <Text style={dashboardStyles.producerInitials}>
                    {account.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </Text>
                </View>
                <View style={dashboardStyles.producerMobileCopy}>
                  <Text style={dashboardStyles.producerName}>
                    {account.name}
                  </Text>
                  <Text style={dashboardStyles.producerMeta}>
                    {account.email}
                  </Text>
                  <View style={dashboardStyles.userRoleLine}>
                    <NavGlyph
                      name={
                        account.role === "Productor"
                          ? "role-producer"
                          : account.role === "Empacador"
                            ? "role-packer"
                            : "users"
                      }
                    />
                    <Text style={dashboardStyles.userRoleLabel}>
                      {account.role}
                      {account.producerFolio
                        ? ` · ${account.producerFolio}`
                        : ""}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    dashboardStyles.statusBadge,
                    account.active
                      ? dashboardStyles.statusActive
                      : dashboardStyles.statusInactive,
                  ]}
                >
                  {account.active ? "Activa" : "Inactiva"}
                </Text>
              </View>
              <View style={dashboardStyles.producerMobileFooter}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Cambiar contraseña de ${account.name}`}
                  style={dashboardStyles.userActionButton}
                  onPress={() => openPassword(account)}
                >
                  <NavGlyph name="key" active />
                  <Text style={dashboardStyles.userActionText}>Contraseña</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${account.active ? "Dar de baja" : "Reactivar"} cuenta de ${account.name}`}
                  style={dashboardStyles.userActionButton}
                  onPress={() => toggleAccount(account)}
                >
                  <NavGlyph
                    name={account.active ? "disable" : "enable"}
                    active
                  />
                  <Text style={dashboardStyles.userActionText}>
                    {account.active ? "Dar de baja" : "Reactivar"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator>
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
                USUARIO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.userEmailCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                CORREO
              </Text>
              <Text
                style={[
                  dashboardStyles.producerColumn,
                  dashboardStyles.userRoleCol,
                  dashboardStyles.tableHeading,
                ]}
              >
                ROL / FOLIO
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
            {visible.map((account) => (
              <View key={account.id} style={dashboardStyles.producerTableRow}>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.userNameCol,
                    dashboardStyles.producerNameCell,
                  ]}
                >
                  <View style={dashboardStyles.producerAvatar}>
                    <Text style={dashboardStyles.producerInitials}>
                      {account.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </Text>
                  </View>
                  <Text style={dashboardStyles.producerName}>
                    {account.name}
                  </Text>
                </View>
                <Text
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.userEmailCol,
                    dashboardStyles.producerMeta,
                  ]}
                >
                  {account.email}
                </Text>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.userRoleCol,
                  ]}
                >
                  <View style={dashboardStyles.userRoleLine}>
                    <NavGlyph
                      name={
                        account.role === "Productor"
                          ? "role-producer"
                          : account.role === "Empacador"
                            ? "role-packer"
                            : "users"
                      }
                    />
                    <Text style={dashboardStyles.userRoleLabel}>
                      {account.role}
                    </Text>
                  </View>
                  <Text style={dashboardStyles.producerSubMeta}>
                    {account.producerFolio ??
                      (account.role === "Administrador"
                        ? "Administración"
                        : "Personal de recepción")}
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
                      account.active
                        ? dashboardStyles.statusActive
                        : dashboardStyles.statusInactive,
                    ]}
                  >
                    {account.active ? "Activa" : "Inactiva"}
                  </Text>
                </View>
                <View
                  style={[
                    dashboardStyles.producerColumn,
                    dashboardStyles.userActionsCol,
                  ]}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Cambiar contraseña de ${account.name}`}
                    style={dashboardStyles.userActionButton}
                    onPress={() => openPassword(account)}
                  >
                    <NavGlyph name="key" active />
                    <Text style={dashboardStyles.userActionText}>
                      Contraseña
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${account.active ? "Dar de baja" : "Reactivar"} cuenta de ${account.name}`}
                    style={dashboardStyles.userActionButton}
                    onPress={() => void toggleAccount(account)}
                  >
                    <NavGlyph
                      name={account.active ? "disable" : "enable"}
                      active
                    />
                    <Text style={dashboardStyles.userActionText}>
                      {account.active ? "Dar de baja" : "Reactivar"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      {visible.length === 0 && (
        <Text style={dashboardStyles.emptyText}>
          No hay cuentas que coincidan con la búsqueda.
        </Text>
      )}
      <Text style={dashboardStyles.reportFootnote}>
        Cuentas cargadas desde Supabase. Dar de baja impide el acceso por la
        tabla de roles de GuavaLink.
      </Text>
      <Modal
        visible={mode !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMode(null)}
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
                {mode === "password" ? "Cambiar contraseña" : "Crear cuenta"}
              </Text>
              <Text style={dashboardStyles.formHint}>
                {mode === "password"
                  ? `Actualiza el acceso de ${target?.name}.`
                  : "Asigna el acceso correspondiente para el empaque."}
              </Text>
              {mode === "new" && (
                <>
                  <Text style={dashboardStyles.fieldLabel}>Tipo de cuenta</Text>
                  <View style={dashboardStyles.userRolePicker}>
                    {(["Productor", "Empacador"] as CreatableRole[]).map(
                      (value) => (
                        <Pressable
                          key={value}
                          onPress={() => {
                            setRole(value);
                            setNotice("");
                          }}
                          style={[
                            dashboardStyles.paymentStatusOption,
                            role === value &&
                              dashboardStyles.paymentStatusOptionSelected,
                          ]}
                        >
                          <Text
                            style={[
                              dashboardStyles.paymentStatusOptionText,
                              role === value &&
                                dashboardStyles.paymentStatusOptionTextSelected,
                            ]}
                          >
                            {value}
                          </Text>
                        </Pressable>
                      ),
                    )}
                  </View>
                  {role === "Productor" ? (
                    <>
                      <Text style={dashboardStyles.fieldLabel}>
                        Productor registrado
                      </Text>
                      {availableProducers.length ? (
                        <View style={dashboardStyles.producerPicker}>
                          {availableProducers.map((producer) => (
                            <Pressable
                              key={producer.folio}
                              onPress={() => {
                                setProducerFolio(producer.folio);
                                setEmail(
                                  producer.email ||
                                    `${String(producer.nombres || "productor").toLowerCase().replaceAll(" ", ".")}@guavalink.mx`,
                                );
                              }}
                              style={[
                                dashboardStyles.producerChoice,
                                producerFolio === producer.folio &&
                                  dashboardStyles.producerChoiceSelected,
                              ]}
                            >
                              <Text
                                style={[
                                  dashboardStyles.producerChoiceText,
                                  producerFolio === producer.folio &&
                                    dashboardStyles.producerChoiceTextSelected,
                                ]}
                              >
                                {producerFullName(producer)} · {producer.folio}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      ) : (
                        <Text style={dashboardStyles.userNoProducers}>
                          No hay productores activos sin cuenta.
                        </Text>
                      )}
                      <Text style={dashboardStyles.fieldLabel}>
                        Correo electrónico
                      </Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="productor@correo.mx"
                        placeholderTextColor="#86868b"
                        style={dashboardStyles.formInput}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </>
                  ) : (
                    <>
                      <Text style={dashboardStyles.fieldLabel}>
                        Nombre del empacador
                      </Text>
                      <TextInput
                        value={name}
                        onChangeText={setName}
                        placeholder="Nombre completo"
                        placeholderTextColor="#86868b"
                        style={dashboardStyles.formInput}
                        autoCapitalize="words"
                      />
                      <Text style={dashboardStyles.fieldLabel}>
                        Correo electrónico
                      </Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="nombre@guavalink.mx"
                        placeholderTextColor="#86868b"
                        style={dashboardStyles.formInput}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </>
                  )}
                  <Text style={dashboardStyles.fieldLabel}>
                    Contraseña inicial
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="#86868b"
                    style={dashboardStyles.formInput}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </>
              )}
              {mode === "password" && (
                <>
                  <Text style={dashboardStyles.fieldLabel}>
                    Nueva contraseña
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Mínimo 8 caracteres"
                    placeholderTextColor="#86868b"
                    style={dashboardStyles.formInput}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                  <Text style={dashboardStyles.fieldLabel}>
                    Confirmar contraseña
                  </Text>
                  <TextInput
                    value={confirmation}
                    onChangeText={setConfirmation}
                    placeholder="Repite la contraseña"
                    placeholderTextColor="#86868b"
                    style={dashboardStyles.formInput}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </>
              )}
              {!!notice && (
                <Text style={dashboardStyles.userNotice}>{notice}</Text>
              )}
              <View
                style={[
                  dashboardStyles.formActions,
                  compact && dashboardStyles.formActionsCompact,
                ]}
              >
                <Pressable onPress={() => setMode(null)}>
                  <Text style={dashboardStyles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    void (mode === "password" ? savePassword() : saveNew())
                  }
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
                      {mode === "password" ? "Actualizar" : "Crear cuenta"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
