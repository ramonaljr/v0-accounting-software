/**
 * Products Component Types
 */

export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  description?: string;
  itemGroupId?: string;
  stockUomId?: string;
  standardRate: number;
  isStockItem: boolean;
  isSalesItem: boolean;
  isPurchaseItem: boolean;
  isActive: boolean;
  reorderLevel?: number;
  reorderQty?: number;
  currentStock?: number;
  stockValue?: number;
  item_groups?: { groupName: string };
  uoms?: { uomName: string };
}

export interface ItemGroup {
  id: string;
  groupName: string;
}

export interface Uom {
  id: string;
  uomName: string;
}

export interface ProductStats {
  totalItems: number;
  products: number;
  services: number;
  lowStock: number;
  totalValue: number;
}
