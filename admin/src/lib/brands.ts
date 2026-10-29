export type BrandId = 'legends' | 'kraalboss';
export const BRANDS: { id: BrandId; label: string; operator: string; color: string }[] = [
  { id: 'legends',   label: 'Legends of the Kraal', operator: 'Telkom', color: '#E8A020' },
  { id: 'kraalboss', label: 'Kraal Boss',           operator: 'MTN',    color: '#FFD400' },
];
export const brandLabel = (id: string) => BRANDS.find((b) => b.id === id)?.label ?? id;
export const brandOperator = (id: string) => BRANDS.find((b) => b.id === id)?.operator ?? id;
