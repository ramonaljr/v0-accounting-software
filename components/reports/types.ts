/**
 * Reports Component Types
 */

export interface Report {
  name: string
  hasIcon?: boolean
  isFavorite?: boolean
}

export interface ReportCategory {
  name: string
  reports: Report[]
}

export interface KPIData {
  name: string
  lastMonth: string
  prevPeriod: string
  variance: string
  variancePct: string
}

export interface ReportTab {
  id: string
  label: string
  badge?: boolean
}
