import { ActionGlyph } from '@/components/dashboard-glyphs';
import { dashboardStyles } from '@/styles/dashboard';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCodeReal from '../components/qr-code';
import { supabase } from '../lib/supabase';

export const initialProducers: any[] = [
  { folio: 'PR-001', nombres: 'Productor', apellidos: 'Demo', origen: 'Uruapan', kilos: '0 kg', active: true }
];

export const producerFullName = (p: any) => {
  if (!p) return 'Productor No Encontrado';
  return p.name || `${p.nombres || ''} ${p.apellidos || ''}`.trim();
};

export interface Producer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  municipality: string | null;
  qr_code: string;
  status: 'Activo' | 'Inactivo';
  created_at?: string;
}

interface ProducersScreenProps {
  isDarkMode?: boolean;
  onSelectProducer?: (producer: Producer) => void;
  compact?: boolean;
}

export default function ProducersScreen({
  isDarkMode = true,
  compact = false,
}: ProducersScreenProps = {}) {
  const [producers, setProducers] = useState<Producer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [qrModalProducer, setQrModalProducer] = useState<Producer | null>(null);
  const [editingProducer, setEditingProducer] = useState<Producer | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [status, setStatus] = useState<'Activo' | 'Inactivo'>('Activo');

  const fetchProducers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('producers')
        .select('*')
        .order('created_at', { ascending: false });
      setProducers((data as Producer[]) || []);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducers();
  }, [fetchProducers]);

  const makeNewQr = () => `GL-PROD-${Math.floor(1000 + Math.random() * 9000)}`;

  const openCreateModal = () => {
    setEditingProducer(null);
    setName('');
    setEmail('');
    setPhone('');
    setMunicipality('Uruapan / Jungapeo');
    setQrCode(makeNewQr());
    setStatus('Activo');
    setModalVisible(true);
  };

  const openEditModal = (producer: Producer) => {
    setEditingProducer(producer);
    setName(producer.name);
    setEmail(producer.email || '');
    setPhone(producer.phone || '');
    setMunicipality(producer.municipality || '');
    setQrCode(producer.qr_code);
    setStatus(producer.status);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim().toLowerCase() || null,
        phone: phone.trim() || null,
        municipality: municipality.trim() || null,
        qr_code: qrCode.trim() || makeNewQr(),
        status,
      };

      if (editingProducer) {
        await supabase.from('producers').update(payload).eq('id', editingProducer.id);
      } else {
        await supabase.from('producers').insert([payload]);
      }
      setModalVisible(false);
      fetchProducers();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('producers').delete().eq('id', id);
    setProducers((prev) => prev.filter((p) => p.id !== id));
  };

  const filtered = producers.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.qr_code.toLowerCase().includes(q) ||
      (p.municipality && p.municipality.toLowerCase().includes(q))
    );
  });

  return (
    <ScrollView contentContainerStyle={[dashboardStyles.producerContent, compact && dashboardStyles.contentCompact]} showsVerticalScrollIndicator={false}>
      <View style={[dashboardStyles.producerHeading, compact && dashboardStyles.producerHeadingCompact]}>
        <View style={dashboardStyles.welcomeCopy}>
          <Text style={dashboardStyles.eyebrow}>MI EMPAQUE</Text>
          <Text style={[dashboardStyles.producerTitle, compact && dashboardStyles.producerTitleCompact]}>Productores</Text>
          <Text style={dashboardStyles.subtitle}>Padrón de productores vinculados a Supabase.</Text>
        </View>
        <View style={dashboardStyles.welcomeActions}>
          <Pressable style={dashboardStyles.newButton} onPress={openCreateModal}>
            <Text style={dashboardStyles.newButtonText}>+ Nuevo productor</Text>
          </Pressable>
        </View>
      </View>

      <View style={[dashboardStyles.producerToolbar, compact && dashboardStyles.producerToolbarCompact]}>
        <View style={[dashboardStyles.producerSearch, compact && dashboardStyles.producerSearchCompact]}>
          <Text style={dashboardStyles.searchGlyph}>🔍</Text>
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
        <Text style={dashboardStyles.emptyText}>No hay productores registrados.</Text>
      ) : (
        <View style={dashboardStyles.userTable}>
          <View style={[dashboardStyles.producerTableRow, dashboardStyles.producerTableHeader]}>
            <Text style={[dashboardStyles.producerColumn, dashboardStyles.userNameCol, dashboardStyles.tableHeading]}>PRODUCTOR</Text>
            <Text style={[dashboardStyles.producerColumn, dashboardStyles.userEmailCol, dashboardStyles.tableHeading]}>MUNICIPIO</Text>
            <Text style={[dashboardStyles.producerColumn, dashboardStyles.userRoleCol, dashboardStyles.tableHeading]}>CÓDIGO QR</Text>
            <Text style={[dashboardStyles.producerColumn, dashboardStyles.userStatusCol, dashboardStyles.tableHeading]}>ESTADO</Text>
            <Text style={[dashboardStyles.producerColumn, dashboardStyles.userActionsCol, dashboardStyles.tableHeading]}>ACCIONES</Text>
          </View>
          {filtered.map((producer) => (
            <View key={producer.id} style={dashboardStyles.producerTableRow}>
              <View style={[dashboardStyles.producerColumn, dashboardStyles.userNameCol, dashboardStyles.producerNameCell]}>
                <View style={dashboardStyles.producerAvatar}>
                  <Text style={dashboardStyles.producerInitials}>
                    {producer.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                  </Text>
                </View>
                <Text style={dashboardStyles.producerName}>{producer.name}</Text>
              </View>
              <Text style={[dashboardStyles.producerColumn, dashboardStyles.userEmailCol, dashboardStyles.producerMeta]}>
                {producer.municipality || 'No especificado'}
              </Text>
              <View style={[dashboardStyles.producerColumn, dashboardStyles.userRoleCol]}>
                <Text style={{ color: '#22C55E', fontWeight: '700', fontSize: 13 }}>{producer.qr_code}</Text>
              </View>
              <View style={[dashboardStyles.producerColumn, dashboardStyles.userStatusCol]}>
                <Text style={[dashboardStyles.statusBadge, producer.status === 'Activo' ? dashboardStyles.statusActive : dashboardStyles.statusInactive]}>
                  {producer.status}
                </Text>
              </View>
              <View style={[dashboardStyles.producerColumn, dashboardStyles.userActionsCol]}>
                <Pressable style={dashboardStyles.userActionButton} onPress={() => setQrModalProducer(producer)}>
                  <ActionGlyph name="qr" />
                  <Text style={dashboardStyles.userActionText}>Ver QR</Text>
                </Pressable>
                <Pressable style={dashboardStyles.userActionButton} onPress={() => openEditModal(producer)}>
                  <ActionGlyph name="edit" />
                </Pressable>
                <Pressable style={dashboardStyles.userActionButton} onPress={() => handleDelete(producer.id)}>
                  <ActionGlyph name="delete" />
                </Pressable>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={!!qrModalProducer} transparent animationType="fade">
        <View style={dashboardStyles.modalBackdrop}>
          <View style={dashboardStyles.formCard}>
            <Text style={[dashboardStyles.panelTitle, { textAlign: 'center' }]}>{qrModalProducer?.name}</Text>
            <Text style={{ color: '#22C55E', fontWeight: '700', textAlign: 'center', marginBottom: 16 }}>
              {qrModalProducer?.qr_code}
            </Text>
            <View style={{ alignItems: 'center' }}>
              {qrModalProducer && <QRCodeReal value={qrModalProducer.qr_code} size={220} />}
            </View>
            <Pressable style={[dashboardStyles.newButton, { marginTop: 20 }]} onPress={() => setQrModalProducer(null)}>
              <Text style={dashboardStyles.newButtonText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={dashboardStyles.modalBackdrop}>
          <ScrollView style={dashboardStyles.formScroll} contentContainerStyle={dashboardStyles.formScrollContent}>
            <View style={dashboardStyles.formCard}>
              <Text style={dashboardStyles.panelTitle}>{editingProducer ? 'Editar productor' : 'Nuevo productor'}</Text>
              
              <Text style={dashboardStyles.formLabel}>Nombre completo</Text>
              <TextInput style={dashboardStyles.formInput} value={name} onChangeText={setName} placeholderTextColor="#86868b" placeholder="Ej. Roberto Sánchez" />

              <Text style={dashboardStyles.formLabel}>Municipio</Text>
              <TextInput style={dashboardStyles.formInput} value={municipality} onChangeText={setMunicipality} placeholderTextColor="#86868b" placeholder="Ej. Uruapan" />

              <Text style={dashboardStyles.formLabel}>Teléfono</Text>
              <TextInput style={dashboardStyles.formInput} value={phone} onChangeText={setPhone} placeholderTextColor="#86868b" placeholder="452 123 4567" />

              <Text style={dashboardStyles.formLabel}>Código QR</Text>
              <TextInput style={dashboardStyles.formInput} value={qrCode} onChangeText={setQrCode} placeholderTextColor="#86868b" />

              <View style={dashboardStyles.formActions}>
                <Pressable onPress={() => setModalVisible(false)}>
                  <Text style={dashboardStyles.cancelText}>Cancelar</Text>
                </Pressable>
                <Pressable onPress={handleSave} style={dashboardStyles.newButton} disabled={saving}>
                  <Text style={dashboardStyles.newButtonText}>{saving ? 'Guardando...' : 'Guardar'}</Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}