/**
 * OCR Types
 * Type definitions for OCR processing
 */

export interface OCRProvider {
  name: string;
  extractText(imageBuffer: Buffer): Promise<OCRResult>;
  extractStructuredData(imageBuffer: Buffer): Promise<StructuredReceiptData>;
}

export interface OCRResult {
  text: string;
  confidence: number;
  metadata?: Record<string, unknown>;
}

export interface StructuredReceiptData {
  vendor?: {
    name?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  date?: string; // ISO 8601 format
  total?: number;
  subtotal?: number;
  tax?: number;
  currency?: string;
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unitPrice?: number;
    amount: number;
  }>;
  confidence: number;
  rawText: string;
}

export interface OCRProcessingResult {
  success: boolean;
  data?: StructuredReceiptData;
  error?: string;
  processingTime?: number;
}
