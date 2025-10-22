# Lib Directory

This directory contains shared utilities, helpers, and service integrations.

## Structure

- **supabase/** - Supabase client (server & client-side)
- **auth/** - Auth utilities and helpers
- **rls/** - Row Level Security helpers
- **audit/** - Audit logging utilities
- **crypto/** - Encryption utilities for sensitive data
- **ai/** - OpenAI and LangGraph utilities
- **ocr/** - OCR processing (receipt scanning)
- **pdf/** - PDF generation for reports
- **emails/** - Email service integration
- **integrations/** - Third-party API integrations (Plaid, Wise, Stripe, etc.)

## Guidelines

- All utilities should be pure functions when possible
- External service integrations should have clear error handling
- Sensitive operations (crypto, auth) must be well-tested
