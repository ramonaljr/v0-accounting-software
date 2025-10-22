/**
 * Database type definitions for OpportunityOS
 * Generated based on Supabase schema (Phase 1 & 2)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
export type OrgRole = 'owner' | 'admin' | 'accountant' | 'staff' | 'viewer'
export type SubscriptionTier = 'starter' | 'pro' | 'enterprise'
export type SubscriptionStatus = 'active' | 'trial' | 'suspended' | 'cancelled'
export type AccountingBasis = 'accrual' | 'cash'
export type SyncStatus = 'active' | 'error' | 'disconnected' | 'pending'
export type BankSyncLogStatus = 'success' | 'error' | 'partial' | 'running'

export interface Database {
  public: {
    Tables: {
      // =====================================================
      // CORE TABLES (Phase 1)
      // =====================================================
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          owner_id: string
          settings: Json
          subscription_tier: SubscriptionTier
          subscription_status: SubscriptionStatus
          fiscal_year_start_month: number
          accounting_basis: AccountingBasis
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          owner_id: string
          settings?: Json
          subscription_tier?: SubscriptionTier
          subscription_status?: SubscriptionStatus
          fiscal_year_start_month?: number
          accounting_basis?: AccountingBasis
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          owner_id?: string
          settings?: Json
          subscription_tier?: SubscriptionTier
          subscription_status?: SubscriptionStatus
          fiscal_year_start_month?: number
          accounting_basis?: AccountingBasis
          created_at?: string
          updated_at?: string
        }
      }
      org_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: OrgRole
          invited_by: string | null
          joined_at: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: OrgRole
          invited_by?: string | null
          joined_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          role?: OrgRole
          invited_by?: string | null
          joined_at?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          timezone: string
          locale: string
          preferences: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          locale?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          locale?: string
          preferences?: Json
          created_at?: string
          updated_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          org_id: string | null
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          changes: Json | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          changes?: Json | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          changes?: Json | null
          metadata?: Json
          created_at?: string
        }
      }
      // =====================================================
      // CHART OF ACCOUNTS (Phase 2.1)
      // =====================================================
      coa_templates: {
        Row: {
          id: string
          name: string
          region: string
          industry: string
          template_data: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          region: string
          industry: string
          template_data: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          region?: string
          industry?: string
          template_data?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          org_id: string
          code: string
          name: string
          account_type: AccountType
          parent_id: string | null
          currency: string
          is_system: boolean
          is_active: boolean
          balance: number
          balance_date: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          code: string
          name: string
          account_type: AccountType
          parent_id?: string | null
          currency?: string
          is_system?: boolean
          is_active?: boolean
          balance?: number
          balance_date?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          code?: string
          name?: string
          account_type?: AccountType
          parent_id?: string | null
          currency?: string
          is_system?: boolean
          is_active?: boolean
          balance?: number
          balance_date?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // =====================================================
      // GENERAL LEDGER (Phase 2.2)
      // =====================================================
      journal_entries: {
        Row: {
          id: string
          org_id: string
          entry_number: string
          entry_date: string
          posting_date: string | null
          description: string
          reference: string | null
          source: string
          source_id: string | null
          is_posted: boolean
          is_locked: boolean
          posted_by: string | null
          posted_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          entry_number?: string
          entry_date: string
          posting_date?: string | null
          description: string
          reference?: string | null
          source?: string
          source_id?: string | null
          is_posted?: boolean
          is_locked?: boolean
          posted_by?: string | null
          posted_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          entry_number?: string
          entry_date?: string
          posting_date?: string | null
          description?: string
          reference?: string | null
          source?: string
          source_id?: string | null
          is_posted?: boolean
          is_locked?: boolean
          posted_by?: string | null
          posted_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      journal_entry_lines: {
        Row: {
          id: string
          journal_entry_id: string
          org_id: string
          account_id: string
          description: string | null
          debit: number
          credit: number
          currency: string
          fx_rate: number | null
          base_debit: number
          base_credit: number
          dimension_1: string | null
          dimension_2: string | null
          created_at: string
        }
        Insert: {
          id?: string
          journal_entry_id: string
          org_id: string
          account_id: string
          description?: string | null
          debit?: number
          credit?: number
          currency?: string
          fx_rate?: number | null
          base_debit?: number
          base_credit?: number
          dimension_1?: string | null
          dimension_2?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          journal_entry_id?: string
          org_id?: string
          account_id?: string
          description?: string | null
          debit?: number
          credit?: number
          currency?: string
          fx_rate?: number | null
          base_debit?: number
          base_credit?: number
          dimension_1?: string | null
          dimension_2?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          org_id: string
          date: string
          description: string
          amount: number
          account_id: string | null
          category: string | null
          vendor_id: string | null
          customer_id: string | null
          reconciliation_id: string | null
          journal_entry_id: string | null
          is_reconciled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          date: string
          description: string
          amount: number
          account_id?: string | null
          category?: string | null
          vendor_id?: string | null
          customer_id?: string | null
          reconciliation_id?: string | null
          journal_entry_id?: string | null
          is_reconciled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          date?: string
          description?: string
          amount?: number
          account_id?: string | null
          category?: string | null
          vendor_id?: string | null
          customer_id?: string | null
          reconciliation_id?: string | null
          journal_entry_id?: string | null
          is_reconciled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      // =====================================================
      // BANK FEEDS (Phase 2.3)
      // =====================================================
      bank_connections: {
        Row: {
          id: string
          org_id: string
          provider: string
          provider_account_id: string | null
          institution_name: string
          account_name: string
          account_type: string
          account_number_last4: string | null
          currency: string
          access_token_encrypted: string | null
          refresh_token_encrypted: string | null
          linked_account_id: string | null
          sync_status: SyncStatus
          last_sync_at: string | null
          last_sync_error: string | null
          sync_frequency: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          provider: string
          provider_account_id?: string | null
          institution_name: string
          account_name: string
          account_type: string
          account_number_last4?: string | null
          currency?: string
          access_token_encrypted?: string | null
          refresh_token_encrypted?: string | null
          linked_account_id?: string | null
          sync_status?: SyncStatus
          last_sync_at?: string | null
          last_sync_error?: string | null
          sync_frequency?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          provider?: string
          provider_account_id?: string | null
          institution_name?: string
          account_name?: string
          account_type?: string
          account_number_last4?: string | null
          currency?: string
          access_token_encrypted?: string | null
          refresh_token_encrypted?: string | null
          linked_account_id?: string | null
          sync_status?: SyncStatus
          last_sync_at?: string | null
          last_sync_error?: string | null
          sync_frequency?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bank_transactions: {
        Row: {
          id: string
          org_id: string
          bank_connection_id: string
          provider_transaction_id: string
          date: string
          description: string
          amount: number
          currency: string
          category: string | null
          merchant_name: string | null
          pending: boolean
          reconciliation_id: string | null
          journal_entry_id: string | null
          is_reconciled: boolean
          categorization_confidence: number | null
          suggested_account_id: string | null
          suggested_by: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          bank_connection_id: string
          provider_transaction_id: string
          date: string
          description: string
          amount: number
          currency?: string
          category?: string | null
          merchant_name?: string | null
          pending?: boolean
          reconciliation_id?: string | null
          journal_entry_id?: string | null
          is_reconciled?: boolean
          categorization_confidence?: number | null
          suggested_account_id?: string | null
          suggested_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          bank_connection_id?: string
          provider_transaction_id?: string
          date?: string
          description?: string
          amount?: number
          currency?: string
          category?: string | null
          merchant_name?: string | null
          pending?: boolean
          reconciliation_id?: string | null
          journal_entry_id?: string | null
          is_reconciled?: boolean
          categorization_confidence?: number | null
          suggested_account_id?: string | null
          suggested_by?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      bank_sync_logs: {
        Row: {
          id: string
          org_id: string
          bank_connection_id: string
          started_at: string
          completed_at: string | null
          status: BankSyncLogStatus
          transactions_imported: number | null
          transactions_updated: number | null
          transactions_skipped: number | null
          error_message: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          bank_connection_id: string
          started_at?: string
          completed_at?: string | null
          status: BankSyncLogStatus
          transactions_imported?: number | null
          transactions_updated?: number | null
          transactions_skipped?: number | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          bank_connection_id?: string
          started_at?: string
          completed_at?: string | null
          status?: BankSyncLogStatus
          transactions_imported?: number | null
          transactions_updated?: number | null
          transactions_skipped?: number | null
          error_message?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      categorization_rules: {
        Row: {
          id: string
          org_id: string
          name: string
          rule_type: 'merchant' | 'description' | 'amount_range' | 'combined'
          pattern: string
          conditions: Json
          account_id: string
          auto_apply: boolean
          priority: number
          is_active: boolean
          match_count: number
          last_matched_at: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          rule_type: 'merchant' | 'description' | 'amount_range' | 'combined'
          pattern: string
          conditions?: Json
          account_id: string
          auto_apply?: boolean
          priority?: number
          is_active?: boolean
          match_count?: number
          last_matched_at?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          rule_type?: 'merchant' | 'description' | 'amount_range' | 'combined'
          pattern?: string
          conditions?: Json
          account_id?: string
          auto_apply?: boolean
          priority?: number
          is_active?: boolean
          match_count?: number
          last_matched_at?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      // =====================================================
      // MULTI-CURRENCY (Phase 2.4)
      // =====================================================
      currencies: {
        Row: {
          code: string
          name: string
          symbol: string
          decimal_places: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          code: string
          name: string
          symbol: string
          decimal_places?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          code?: string
          name?: string
          symbol?: string
          decimal_places?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      exchange_rates: {
        Row: {
          id: string
          from_currency: string
          to_currency: string
          rate: number
          rate_date: string
          source: string
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          from_currency: string
          to_currency: string
          rate: number
          rate_date: string
          source?: string
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          from_currency?: string
          to_currency?: string
          rate?: number
          rate_date?: string
          source?: string
          metadata?: Json
          created_at?: string
        }
      }
    }
    Views: {
      latest_exchange_rates: {
        Row: {
          from_currency: string
          to_currency: string
          rate: number
          rate_date: string
          source: string
        }
      }
    }
    Functions: {
      get_account_path: {
        Args: { account_id: string }
        Returns: string | null
      }
      get_account_balance: {
        Args: { p_account_id: string; p_as_of_date?: string }
        Returns: number
      }
      get_trial_balance: {
        Args: { p_org_id: string; p_as_of_date?: string }
        Returns: Array<{
          account_id: string
          account_code: string
          account_name: string
          account_type: AccountType
          total_debits: number
          total_credits: number
          balance: number
        }>
      }
      get_exchange_rate: {
        Args: { p_from_currency: string; p_to_currency: string; p_date?: string }
        Returns: number | null
      }
      convert_currency: {
        Args: { p_amount: number; p_from_currency: string; p_to_currency: string; p_date?: string }
        Returns: number
      }
      get_latest_rate: {
        Args: { p_from_currency: string; p_to_currency: string }
        Returns: number | null
      }
      get_org_base_currency: {
        Args: { p_org_id: string }
        Returns: string
      }
      apply_categorization_rules: {
        Args: { p_org_id: string; p_transaction_id: string }
        Returns: boolean
      }
      get_unreconciled_count: {
        Args: { p_org_id: string; p_bank_connection_id?: string }
        Returns: number
      }
    }
  }
}
