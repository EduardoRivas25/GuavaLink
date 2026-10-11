export type Orchard = {
  name: string;
  folio: string;
  producer: string;
  hectares: number;
  tenure: 'Propia' | 'Rentada';
  latitude: number;
  longitude: number;
  active: boolean;
};

export type OrchardMapProps = {
  orchards: Orchard[];
  selectedFolio: string;
  onSelect: (folio: string) => void;
};
