export type ProducerRow = {
  id: string;
  folio: string;
  nombres: string | null;
  apellidos: string | null;
  email: string | null;
  status: string | null;
};

export type OrchardRow = {
  id: string;
  folio: string;
  name: string;
  producer_id: string;
  producer: string;
  hectares: number;
  latitude: number;
  longitude: number;
  tenure: 'Propia' | 'Rentada';
  active: boolean;
};

export type ExportRegistrationRow = {
  id: string;
  producer_id: string;
  registration_number: string;
  created_at: string;
};

export type ShipmentRow = {
  id: string;
  folio: string;
  destination: string;
  departure: string;
  kilos: number;
  status: 'En preparación' | 'Listo para salir' | 'En tránsito' | 'Entregado';
};

export function producerName(producer: Partial<ProducerRow> | null | undefined) {
  return `${producer?.nombres || ''} ${producer?.apellidos || ''}`.trim() || 'Productor';
}

export function producerQrValue(producer: Pick<ProducerRow, 'id'>) {
  return `GUAVALINK:PRODUCER:${producer.id}`;
}

export function producerIdFromQr(value: string) {
  const clean = value.trim();
  const match = /^GUAVALINK:PRODUCER:([0-9a-f-]{36})$/i.exec(clean);
  return match?.[1] || (/^[0-9a-f-]{36}$/i.test(clean) ? clean : null);
}
