/**
 * Dashboard Presets
 * Role-based and industry-specific dashboard layouts
 */

import type { WidgetConfig, PresetRole, IndustryType } from './types';
import { createDefaultWidget } from './widget-registry';

/**
 * Owner Preset - Full overview with all key metrics
 */
export function getOwnerPreset(): WidgetConfig[] {
  return [
    createDefaultWidget('bank_accounts', 1, 0),
    createDefaultWidget('ar_summary', 1, 6),
    createDefaultWidget('profit_loss', 2, 0),
    createDefaultWidget('expenses', 2, 6),
    createDefaultWidget('sales_trend', 3, 0),
    createDefaultWidget('cash_flow', 3, 6),
    createDefaultWidget('ap_summary', 4, 0),
    createDefaultWidget('taxes', 4, 6),
    createDefaultWidget('balance_sheet', 5, 0),
    createDefaultWidget('reconciliation', 5, 4),
    createDefaultWidget('kpis', 5, 8),
    createDefaultWidget('working_capital', 6, 0),
    createDefaultWidget('ai_insights', 6, 6),
    createDefaultWidget('quick_actions', 7, 0),
  ];
}

/**
 * Admin Preset - Operations focused
 */
export function getAdminPreset(): WidgetConfig[] {
  return [
    createDefaultWidget('bank_accounts', 1, 0),
    createDefaultWidget('reconciliation', 1, 6),
    createDefaultWidget('ar_summary', 2, 0),
    createDefaultWidget('ap_summary', 2, 6),
    createDefaultWidget('expenses', 3, 0),
    createDefaultWidget('taxes', 3, 6),
    createDefaultWidget('quick_actions', 4, 0),
    createDefaultWidget('profit_loss', 5, 0),
    createDefaultWidget('cash_flow', 5, 6),
    createDefaultWidget('ai_insights', 6, 0),
    createDefaultWidget('kpis', 6, 6),
  ];
}

/**
 * Accountant Preset - Compliance and accuracy focused
 */
export function getAccountantPreset(): WidgetConfig[] {
  return [
    createDefaultWidget('reconciliation', 1, 0),
    createDefaultWidget('balance_sheet', 1, 6),
    createDefaultWidget('profit_loss', 2, 0),
    createDefaultWidget('cash_flow', 2, 6),
    createDefaultWidget('ar_summary', 3, 0),
    createDefaultWidget('ap_summary', 3, 6),
    createDefaultWidget('taxes', 4, 0),
    createDefaultWidget('kpis', 4, 6),
    createDefaultWidget('bank_accounts', 5, 0),
    createDefaultWidget('working_capital', 5, 6),
    createDefaultWidget('quick_actions', 6, 0),
  ];
}

/**
 * Staff Preset - Daily operations focused
 */
export function getStaffPreset(): WidgetConfig[] {
  return [
    createDefaultWidget('quick_actions', 1, 0),
    createDefaultWidget('ar_summary', 2, 0),
    createDefaultWidget('ap_summary', 2, 6),
    createDefaultWidget('expenses', 3, 0),
    createDefaultWidget('bank_accounts', 3, 6),
    createDefaultWidget('ai_insights', 4, 0),
    createDefaultWidget('sales_trend', 4, 6),
  ];
}

/**
 * Viewer Preset - Read-only overview
 */
export function getViewerPreset(): WidgetConfig[] {
  return [
    createDefaultWidget('profit_loss', 1, 0),
    createDefaultWidget('sales_trend', 1, 6),
    createDefaultWidget('kpis', 2, 0),
    createDefaultWidget('balance_sheet', 2, 6),
    createDefaultWidget('cash_flow', 3, 0),
    createDefaultWidget('expenses', 3, 6),
  ];
}

/**
 * Get preset by role
 */
export function getPresetByRole(role: PresetRole): WidgetConfig[] {
  switch (role) {
    case 'owner':
      return getOwnerPreset();
    case 'admin':
      return getAdminPreset();
    case 'accountant':
      return getAccountantPreset();
    case 'staff':
      return getStaffPreset();
    case 'viewer':
      return getViewerPreset();
    default:
      return getOwnerPreset();
  }
}

/**
 * Industry-specific presets
 */

/**
 * Retail Preset - Inventory and sales focused
 */
export function getRetailPreset(): WidgetConfig[] {
  return [
    createDefaultWidget('sales_trend', 1, 0),
    createDefaultWidget('ar_summary', 1, 6),
    createDefaultWidget('inventory', 2, 0),
    createDefaultWidget('profit_loss', 2, 6),
    createDefaultWidget('cash_flow', 3, 0),
    createDefaultWidget('expenses', 3, 6),
    createDefaultWidget('kpis', 4, 0),
    createDefaultWidget('quick_actions', 4, 6),
  ];
}

/**
 * Service Preset - AR and project focused
 */
export function getServicePreset(): WidgetConfig[] {
  return [
    createDefaultWidget('ar_summary', 1, 0),
    createDefaultWidget('profit_loss', 1, 6),
    createDefaultWidget('cash_flow', 2, 0),
    createDefaultWidget('expenses', 2, 6),
    createDefaultWidget('working_capital', 3, 0),
    createDefaultWidget('kpis', 3, 6),
    createDefaultWidget('quick_actions', 4, 0),
    createDefaultWidget('ai_insights', 4, 6),
  ];
}

/**
 * E-commerce Preset - Sales channels and revenue focused
 */
export function getEcommercePreset(): WidgetConfig[] {
  return [
    createDefaultWidget('sales_trend', 1, 0),
    createDefaultWidget('profit_loss', 1, 6),
    createDefaultWidget('cash_flow', 2, 0),
    createDefaultWidget('ar_summary', 2, 6),
    createDefaultWidget('inventory', 3, 0),
    createDefaultWidget('expenses', 3, 6),
    createDefaultWidget('kpis', 4, 0),
    createDefaultWidget('ai_insights', 4, 6),
  ];
}

/**
 * Get preset by industry
 */
export function getPresetByIndustry(industry: IndustryType): WidgetConfig[] {
  switch (industry) {
    case 'retail':
      return getRetailPreset();
    case 'service':
      return getServicePreset();
    case 'ecommerce':
      return getEcommercePreset();
    case 'general':
    default:
      return getOwnerPreset();
  }
}

/**
 * Preset metadata
 */
export interface PresetMetadata {
  id: string;
  name: string;
  description: string;
  category: 'role' | 'industry';
  icon: string;
  widgetCount: number;
  recommended?: string[]; // Recommended for these roles/industries
}

export const PRESET_METADATA: Record<string, PresetMetadata> = {
  owner: {
    id: 'owner',
    name: 'Owner',
    description: 'Complete business overview with all key metrics and AI insights',
    category: 'role',
    icon: 'Crown',
    widgetCount: 14,
    recommended: ['owner'],
  },
  admin: {
    id: 'admin',
    name: 'Admin',
    description: 'Operations-focused with reconciliation and compliance tools',
    category: 'role',
    icon: 'Shield',
    widgetCount: 11,
    recommended: ['admin'],
  },
  accountant: {
    id: 'accountant',
    name: 'Accountant',
    description: 'Compliance and accuracy with financial statements and reconciliation',
    category: 'role',
    icon: 'Calculator',
    widgetCount: 11,
    recommended: ['accountant'],
  },
  staff: {
    id: 'staff',
    name: 'Staff',
    description: 'Daily operations with quick actions and AR/AP management',
    category: 'role',
    icon: 'Users',
    widgetCount: 7,
    recommended: ['staff'],
  },
  viewer: {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only overview of financial performance',
    category: 'role',
    icon: 'Eye',
    widgetCount: 6,
    recommended: ['viewer'],
  },
  retail: {
    id: 'retail',
    name: 'Retail',
    description: 'Inventory, sales trends, and point-of-sale metrics',
    category: 'industry',
    icon: 'ShoppingCart',
    widgetCount: 8,
    recommended: ['owner', 'admin'],
  },
  service: {
    id: 'service',
    name: 'Service',
    description: 'AR management, project tracking, and working capital',
    category: 'industry',
    icon: 'Briefcase',
    widgetCount: 8,
    recommended: ['owner', 'admin'],
  },
  ecommerce: {
    id: 'ecommerce',
    name: 'E-commerce',
    description: 'Sales channels, inventory, and online revenue tracking',
    category: 'industry',
    icon: 'Globe',
    widgetCount: 8,
    recommended: ['owner', 'admin'],
  },
};
