/**
 * BOM Component Types
 */

export interface BomItemDetail {
  itemName: string;
  itemCode: string;
  stockQty?: number;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Bom {
  id: string;
  bomNo: string;
  itemId: string;
  itemCode?: string;
  itemName?: string;
  quantity: number;
  status: 'Draft' | 'Submitted' | 'Cancelled';
  isActive: boolean;
  isDefault: boolean;
  rawMaterialCost: number;
  operatingCost: number;
  totalCost: number;
  createdAt: string;
  items?: BomItemDetail[];
}

export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  standardRate: number;
}

export interface BomItem {
  itemId: string;
  quantity: number;
  rate: number;
}

export type BomStatus = 'Draft' | 'Submitted' | 'Cancelled';
