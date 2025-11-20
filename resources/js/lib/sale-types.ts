/**
 * Tipos de venta disponibles para productos en sucursales
 */
export type SaleType = 'unit' | 'weight' | 'length' | 'volume' | 'area';

/**
 * Etiquetas legibles para los tipos de venta
 */
export const saleTypeLabels: Record<SaleType, string> = {
  unit: 'Por unidad',
  weight: 'Por peso (kg / g)',
  length: 'Por longitud (m / cm)',
  volume: 'Por volumen (L / ml)',
  area: 'Por área (m²)',
};

/**
 * Opciones para select de tipos de venta
 */
export const saleTypeOptions: Array<{ value: SaleType; label: string }> = [
  { value: 'unit', label: 'Por unidad' },
  { value: 'weight', label: 'Por peso (kg / g)' },
  { value: 'length', label: 'Por longitud (m / cm)' },
  { value: 'volume', label: 'Por volumen (L / ml)' },
  { value: 'area', label: 'Por área (m²)' },
];

/**
 * Obtiene la etiqueta legible de un tipo de venta
 */
export function getSaleTypeLabel(saleType: SaleType | string): string {
  return saleTypeLabels[saleType as SaleType] || 'Por unidad';
}
