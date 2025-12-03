-- Accunza Phase 2 - Chart of Accounts Templates (Seed Data)
-- Migration: Seed COA templates for different regions and industries
-- Created: 2025-10-21

-- =====================================================
-- US GAAP - STANDARD BUSINESS COA
-- =====================================================

INSERT INTO coa_templates (name, region, industry, template_data, is_active) VALUES
('Standard Business COA - US GAAP', 'US', 'general', '{
  "accounts": [
    {"code": "1000", "name": "Cash and Cash Equivalents", "type": "asset", "parent": null},
    {"code": "1010", "name": "Checking Account", "type": "asset", "parent": "1000"},
    {"code": "1020", "name": "Savings Account", "type": "asset", "parent": "1000"},
    {"code": "1030", "name": "Petty Cash", "type": "asset", "parent": "1000"},

    {"code": "1100", "name": "Accounts Receivable", "type": "asset", "parent": null},
    {"code": "1110", "name": "Accounts Receivable - Trade", "type": "asset", "parent": "1100"},
    {"code": "1120", "name": "Allowance for Doubtful Accounts", "type": "asset", "parent": "1100"},

    {"code": "1200", "name": "Other Current Assets", "type": "asset", "parent": null},
    {"code": "1210", "name": "Inventory", "type": "asset", "parent": "1200"},
    {"code": "1220", "name": "Prepaid Expenses", "type": "asset", "parent": "1200"},
    {"code": "1230", "name": "Employee Advances", "type": "asset", "parent": "1200"},

    {"code": "1500", "name": "Fixed Assets", "type": "asset", "parent": null},
    {"code": "1510", "name": "Equipment", "type": "asset", "parent": "1500"},
    {"code": "1520", "name": "Furniture and Fixtures", "type": "asset", "parent": "1500"},
    {"code": "1530", "name": "Vehicles", "type": "asset", "parent": "1500"},
    {"code": "1540", "name": "Accumulated Depreciation", "type": "asset", "parent": "1500"},

    {"code": "2000", "name": "Accounts Payable", "type": "liability", "parent": null},
    {"code": "2010", "name": "Accounts Payable - Trade", "type": "liability", "parent": "2000"},

    {"code": "2100", "name": "Credit Cards", "type": "liability", "parent": null},
    {"code": "2110", "name": "Business Credit Card", "type": "liability", "parent": "2100"},

    {"code": "2200", "name": "Other Current Liabilities", "type": "liability", "parent": null},
    {"code": "2210", "name": "Sales Tax Payable", "type": "liability", "parent": "2200"},
    {"code": "2220", "name": "Payroll Liabilities", "type": "liability", "parent": "2200"},
    {"code": "2230", "name": "Accrued Expenses", "type": "liability", "parent": "2200"},

    {"code": "2500", "name": "Long-Term Liabilities", "type": "liability", "parent": null},
    {"code": "2510", "name": "Notes Payable", "type": "liability", "parent": "2500"},
    {"code": "2520", "name": "Loans Payable", "type": "liability", "parent": "2500"},

    {"code": "3000", "name": "Equity", "type": "equity", "parent": null},
    {"code": "3010", "name": "Owner Capital", "type": "equity", "parent": "3000"},
    {"code": "3020", "name": "Owner Draws", "type": "equity", "parent": "3000"},
    {"code": "3030", "name": "Retained Earnings", "type": "equity", "parent": "3000"},

    {"code": "4000", "name": "Revenue", "type": "revenue", "parent": null},
    {"code": "4010", "name": "Sales Revenue", "type": "revenue", "parent": "4000"},
    {"code": "4020", "name": "Service Revenue", "type": "revenue", "parent": "4000"},
    {"code": "4030", "name": "Other Income", "type": "revenue", "parent": "4000"},

    {"code": "5000", "name": "Cost of Goods Sold", "type": "expense", "parent": null},
    {"code": "5010", "name": "Cost of Goods Sold - Materials", "type": "expense", "parent": "5000"},
    {"code": "5020", "name": "Cost of Goods Sold - Labor", "type": "expense", "parent": "5000"},

    {"code": "6000", "name": "Operating Expenses", "type": "expense", "parent": null},
    {"code": "6010", "name": "Advertising and Marketing", "type": "expense", "parent": "6000"},
    {"code": "6020", "name": "Bank Fees", "type": "expense", "parent": "6000"},
    {"code": "6030", "name": "Insurance", "type": "expense", "parent": "6000"},
    {"code": "6040", "name": "Rent", "type": "expense", "parent": "6000"},
    {"code": "6050", "name": "Utilities", "type": "expense", "parent": "6000"},
    {"code": "6060", "name": "Office Supplies", "type": "expense", "parent": "6000"},
    {"code": "6070", "name": "Professional Fees", "type": "expense", "parent": "6000"},
    {"code": "6080", "name": "Salaries and Wages", "type": "expense", "parent": "6000"},
    {"code": "6090", "name": "Payroll Taxes", "type": "expense", "parent": "6000"},
    {"code": "6100", "name": "Travel and Entertainment", "type": "expense", "parent": "6000"},
    {"code": "6110", "name": "Depreciation Expense", "type": "expense", "parent": "6000"}
  ]
}', true);

-- =====================================================
-- US GAAP - SAAS COMPANY COA
-- =====================================================

INSERT INTO coa_templates (name, region, industry, template_data, is_active) VALUES
('SaaS Company COA - US GAAP', 'US', 'saas', '{
  "accounts": [
    {"code": "1000", "name": "Cash and Cash Equivalents", "type": "asset", "parent": null},
    {"code": "1010", "name": "Operating Cash", "type": "asset", "parent": "1000"},
    {"code": "1020", "name": "Stripe Balance", "type": "asset", "parent": "1000"},
    {"code": "1030", "name": "PayPal Balance", "type": "asset", "parent": "1000"},

    {"code": "1100", "name": "Accounts Receivable", "type": "asset", "parent": null},
    {"code": "1110", "name": "Accounts Receivable - Subscriptions", "type": "asset", "parent": "1100"},

    {"code": "1200", "name": "Other Current Assets", "type": "asset", "parent": null},
    {"code": "1210", "name": "Prepaid Software Licenses", "type": "asset", "parent": "1200"},
    {"code": "1220", "name": "Prepaid Hosting", "type": "asset", "parent": "1200"},

    {"code": "1500", "name": "Fixed Assets", "type": "asset", "parent": null},
    {"code": "1510", "name": "Computer Equipment", "type": "asset", "parent": "1500"},
    {"code": "1520", "name": "Software", "type": "asset", "parent": "1500"},
    {"code": "1540", "name": "Accumulated Depreciation", "type": "asset", "parent": "1500"},

    {"code": "2000", "name": "Accounts Payable", "type": "liability", "parent": null},
    {"code": "2010", "name": "Accounts Payable - Vendors", "type": "liability", "parent": "2000"},

    {"code": "2200", "name": "Deferred Revenue", "type": "liability", "parent": null},
    {"code": "2210", "name": "Deferred Revenue - Annual Plans", "type": "liability", "parent": "2200"},
    {"code": "2220", "name": "Deferred Revenue - Monthly Plans", "type": "liability", "parent": "2200"},

    {"code": "2300", "name": "Other Current Liabilities", "type": "liability", "parent": null},
    {"code": "2310", "name": "Sales Tax Payable", "type": "liability", "parent": "2300"},
    {"code": "2320", "name": "Payment Processing Fees Payable", "type": "liability", "parent": "2300"},

    {"code": "3000", "name": "Equity", "type": "equity", "parent": null},
    {"code": "3010", "name": "Common Stock", "type": "equity", "parent": "3000"},
    {"code": "3020", "name": "Retained Earnings", "type": "equity", "parent": "3000"},

    {"code": "4000", "name": "Revenue", "type": "revenue", "parent": null},
    {"code": "4010", "name": "Subscription Revenue - Starter", "type": "revenue", "parent": "4000"},
    {"code": "4020", "name": "Subscription Revenue - Pro", "type": "revenue", "parent": "4000"},
    {"code": "4030", "name": "Subscription Revenue - Enterprise", "type": "revenue", "parent": "4000"},
    {"code": "4040", "name": "Professional Services Revenue", "type": "revenue", "parent": "4000"},

    {"code": "5000", "name": "Cost of Revenue", "type": "expense", "parent": null},
    {"code": "5010", "name": "Hosting and Infrastructure", "type": "expense", "parent": "5000"},
    {"code": "5020", "name": "Payment Processing Fees", "type": "expense", "parent": "5000"},
    {"code": "5030", "name": "Customer Support", "type": "expense", "parent": "5000"},

    {"code": "6000", "name": "Sales and Marketing", "type": "expense", "parent": null},
    {"code": "6010", "name": "Advertising - Google Ads", "type": "expense", "parent": "6000"},
    {"code": "6020", "name": "Advertising - Social Media", "type": "expense", "parent": "6000"},
    {"code": "6030", "name": "Marketing Software", "type": "expense", "parent": "6000"},
    {"code": "6040", "name": "Sales Commissions", "type": "expense", "parent": "6000"},

    {"code": "7000", "name": "Research and Development", "type": "expense", "parent": null},
    {"code": "7010", "name": "Engineering Salaries", "type": "expense", "parent": "7000"},
    {"code": "7020", "name": "Software Development Tools", "type": "expense", "parent": "7000"},
    {"code": "7030", "name": "Third-Party APIs", "type": "expense", "parent": "7000"},

    {"code": "8000", "name": "General and Administrative", "type": "expense", "parent": null},
    {"code": "8010", "name": "Office Rent", "type": "expense", "parent": "8000"},
    {"code": "8020", "name": "Legal and Accounting", "type": "expense", "parent": "8000"},
    {"code": "8030", "name": "Insurance", "type": "expense", "parent": "8000"},
    {"code": "8040", "name": "Bank Fees", "type": "expense", "parent": "8000"}
  ]
}', true);

-- =====================================================
-- PHILIPPINES - BIR COMPLIANT COA
-- =====================================================

INSERT INTO coa_templates (name, region, industry, template_data, is_active) VALUES
('Standard Business COA - Philippines BIR', 'PH', 'general', '{
  "accounts": [
    {"code": "1010", "name": "Cash on Hand", "type": "asset", "parent": null},
    {"code": "1020", "name": "Cash in Bank - Current Account", "type": "asset", "parent": null},
    {"code": "1030", "name": "Cash in Bank - Savings Account", "type": "asset", "parent": null},

    {"code": "1110", "name": "Accounts Receivable - Trade", "type": "asset", "parent": null},
    {"code": "1120", "name": "Allowance for Bad Debts", "type": "asset", "parent": null},

    {"code": "1210", "name": "Inventory - Merchandise", "type": "asset", "parent": null},
    {"code": "1220", "name": "Prepaid Expenses", "type": "asset", "parent": null},
    {"code": "1230", "name": "Input VAT", "type": "asset", "parent": null},

    {"code": "1510", "name": "Land", "type": "asset", "parent": null},
    {"code": "1520", "name": "Building", "type": "asset", "parent": null},
    {"code": "1530", "name": "Machinery and Equipment", "type": "asset", "parent": null},
    {"code": "1540", "name": "Furniture and Fixtures", "type": "asset", "parent": null},
    {"code": "1550", "name": "Transportation Equipment", "type": "asset", "parent": null},
    {"code": "1560", "name": "Accumulated Depreciation", "type": "asset", "parent": null},

    {"code": "2010", "name": "Accounts Payable - Trade", "type": "liability", "parent": null},
    {"code": "2020", "name": "Output VAT", "type": "liability", "parent": null},
    {"code": "2030", "name": "Withholding Tax Payable - Expanded", "type": "liability", "parent": null},
    {"code": "2040", "name": "Withholding Tax Payable - Compensation", "type": "liability", "parent": null},
    {"code": "2050", "name": "SSS Contributions Payable", "type": "liability", "parent": null},
    {"code": "2060", "name": "PhilHealth Contributions Payable", "type": "liability", "parent": null},
    {"code": "2070", "name": "Pag-IBIG Contributions Payable", "type": "liability", "parent": null},

    {"code": "2510", "name": "Notes Payable - Long Term", "type": "liability", "parent": null},

    {"code": "3010", "name": "Capital Stock", "type": "equity", "parent": null},
    {"code": "3020", "name": "Retained Earnings", "type": "equity", "parent": null},
    {"code": "3030", "name": "Current Year Net Income", "type": "equity", "parent": null},

    {"code": "4010", "name": "Sales - Domestic", "type": "revenue", "parent": null},
    {"code": "4020", "name": "Sales - Export", "type": "revenue", "parent": null},
    {"code": "4030", "name": "Service Income", "type": "revenue", "parent": null},
    {"code": "4040", "name": "Other Income", "type": "revenue", "parent": null},

    {"code": "5010", "name": "Cost of Sales - Merchandise", "type": "expense", "parent": null},

    {"code": "6010", "name": "Salaries and Wages", "type": "expense", "parent": null},
    {"code": "6020", "name": "SSS Contributions - Employer Share", "type": "expense", "parent": null},
    {"code": "6030", "name": "PhilHealth - Employer Share", "type": "expense", "parent": null},
    {"code": "6040", "name": "Pag-IBIG - Employer Share", "type": "expense", "parent": null},
    {"code": "6050", "name": "Rent Expense", "type": "expense", "parent": null},
    {"code": "6060", "name": "Utilities Expense", "type": "expense", "parent": null},
    {"code": "6070", "name": "Transportation and Travel", "type": "expense", "parent": null},
    {"code": "6080", "name": "Professional Fees", "type": "expense", "parent": null},
    {"code": "6090", "name": "Office Supplies", "type": "expense", "parent": null},
    {"code": "6100", "name": "Depreciation Expense", "type": "expense", "parent": null},
    {"code": "6110", "name": "Taxes and Licenses", "type": "expense", "parent": null}
  ]
}', true);

-- =====================================================
-- IFRS - EUROPEAN UNION COA
-- =====================================================

INSERT INTO coa_templates (name, region, industry, template_data, is_active) VALUES
('Standard Business COA - IFRS (EU)', 'EU', 'general', '{
  "accounts": [
    {"code": "1000", "name": "Cash and Cash Equivalents", "type": "asset", "parent": null},
    {"code": "1010", "name": "Bank Current Account", "type": "asset", "parent": "1000"},

    {"code": "1100", "name": "Trade Receivables", "type": "asset", "parent": null},
    {"code": "1110", "name": "Trade Debtors", "type": "asset", "parent": "1100"},
    {"code": "1120", "name": "Provision for Doubtful Debts", "type": "asset", "parent": "1100"},

    {"code": "1200", "name": "Inventories", "type": "asset", "parent": null},
    {"code": "1210", "name": "Raw Materials", "type": "asset", "parent": "1200"},
    {"code": "1220", "name": "Work in Progress", "type": "asset", "parent": "1200"},
    {"code": "1230", "name": "Finished Goods", "type": "asset", "parent": "1200"},

    {"code": "1300", "name": "Other Current Assets", "type": "asset", "parent": null},
    {"code": "1310", "name": "Prepayments", "type": "asset", "parent": "1300"},
    {"code": "1320", "name": "VAT Receivable", "type": "asset", "parent": "1300"},

    {"code": "1500", "name": "Property, Plant and Equipment", "type": "asset", "parent": null},
    {"code": "1510", "name": "Land and Buildings", "type": "asset", "parent": "1500"},
    {"code": "1520", "name": "Plant and Machinery", "type": "asset", "parent": "1500"},
    {"code": "1530", "name": "Motor Vehicles", "type": "asset", "parent": "1500"},
    {"code": "1540", "name": "Accumulated Depreciation", "type": "asset", "parent": "1500"},

    {"code": "2000", "name": "Trade Payables", "type": "liability", "parent": null},
    {"code": "2010", "name": "Trade Creditors", "type": "liability", "parent": "2000"},

    {"code": "2100", "name": "Other Current Liabilities", "type": "liability", "parent": null},
    {"code": "2110", "name": "VAT Payable", "type": "liability", "parent": "2100"},
    {"code": "2120", "name": "Social Security Payable", "type": "liability", "parent": "2100"},
    {"code": "2130", "name": "Accruals", "type": "liability", "parent": "2100"},

    {"code": "2500", "name": "Non-Current Liabilities", "type": "liability", "parent": null},
    {"code": "2510", "name": "Long-Term Borrowings", "type": "liability", "parent": "2500"},

    {"code": "3000", "name": "Equity", "type": "equity", "parent": null},
    {"code": "3010", "name": "Share Capital", "type": "equity", "parent": "3000"},
    {"code": "3020", "name": "Retained Earnings", "type": "equity", "parent": "3000"},

    {"code": "4000", "name": "Revenue", "type": "revenue", "parent": null},
    {"code": "4010", "name": "Sales Revenue", "type": "revenue", "parent": "4000"},
    {"code": "4020", "name": "Service Revenue", "type": "revenue", "parent": "4000"},

    {"code": "5000", "name": "Cost of Sales", "type": "expense", "parent": null},
    {"code": "5010", "name": "Purchase of Goods", "type": "expense", "parent": "5000"},
    {"code": "5020", "name": "Direct Labour", "type": "expense", "parent": "5000"},

    {"code": "6000", "name": "Operating Expenses", "type": "expense", "parent": null},
    {"code": "6010", "name": "Staff Costs", "type": "expense", "parent": "6000"},
    {"code": "6020", "name": "Rent and Rates", "type": "expense", "parent": "6000"},
    {"code": "6030", "name": "Motor Expenses", "type": "expense", "parent": "6000"},
    {"code": "6040", "name": "Professional Fees", "type": "expense", "parent": "6000"},
    {"code": "6050", "name": "Depreciation", "type": "expense", "parent": "6000"}
  ]
}', true);

-- =====================================================
-- JAPAN - J-GAAP COA
-- =====================================================

INSERT INTO coa_templates (name, region, industry, template_data, is_active) VALUES
('Standard Business COA - Japan J-GAAP', 'JP', 'general', '{
  "accounts": [
    {"code": "1010", "name": "現金 (Cash)", "type": "asset", "parent": null},
    {"code": "1020", "name": "普通預金 (Checking Account)", "type": "asset", "parent": null},
    {"code": "1030", "name": "定期預金 (Savings Account)", "type": "asset", "parent": null},

    {"code": "1110", "name": "売掛金 (Accounts Receivable)", "type": "asset", "parent": null},
    {"code": "1120", "name": "貸倒引当金 (Allowance for Doubtful Accounts)", "type": "asset", "parent": null},

    {"code": "1210", "name": "棚卸資産 (Inventory)", "type": "asset", "parent": null},
    {"code": "1220", "name": "前払費用 (Prepaid Expenses)", "type": "asset", "parent": null},
    {"code": "1230", "name": "仮払消費税 (Input Consumption Tax)", "type": "asset", "parent": null},

    {"code": "1510", "name": "建物 (Buildings)", "type": "asset", "parent": null},
    {"code": "1520", "name": "機械装置 (Machinery)", "type": "asset", "parent": null},
    {"code": "1530", "name": "車両運搬具 (Vehicles)", "type": "asset", "parent": null},
    {"code": "1540", "name": "減価償却累計額 (Accumulated Depreciation)", "type": "asset", "parent": null},

    {"code": "2010", "name": "買掛金 (Accounts Payable)", "type": "liability", "parent": null},
    {"code": "2020", "name": "仮受消費税 (Output Consumption Tax)", "type": "liability", "parent": null},
    {"code": "2030", "name": "未払金 (Accrued Expenses)", "type": "liability", "parent": null},
    {"code": "2040", "name": "預り金 (Deposits Received)", "type": "liability", "parent": null},

    {"code": "2510", "name": "長期借入金 (Long-Term Debt)", "type": "liability", "parent": null},

    {"code": "3010", "name": "資本金 (Capital Stock)", "type": "equity", "parent": null},
    {"code": "3020", "name": "利益剰余金 (Retained Earnings)", "type": "equity", "parent": null},

    {"code": "4010", "name": "売上高 (Sales Revenue)", "type": "revenue", "parent": null},
    {"code": "4020", "name": "営業外収益 (Non-Operating Income)", "type": "revenue", "parent": null},

    {"code": "5010", "name": "売上原価 (Cost of Goods Sold)", "type": "expense", "parent": null},

    {"code": "6010", "name": "給料手当 (Salaries and Wages)", "type": "expense", "parent": null},
    {"code": "6020", "name": "地代家賃 (Rent)", "type": "expense", "parent": null},
    {"code": "6030", "name": "水道光熱費 (Utilities)", "type": "expense", "parent": null},
    {"code": "6040", "name": "旅費交通費 (Travel Expenses)", "type": "expense", "parent": null},
    {"code": "6050", "name": "減価償却費 (Depreciation Expense)", "type": "expense", "parent": null},
    {"code": "6060", "name": "支払手数料 (Professional Fees)", "type": "expense", "parent": null}
  ]
}', true);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE coa_templates IS 'Pre-built Chart of Accounts templates for different regions and industries';
