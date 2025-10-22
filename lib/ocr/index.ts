/**
 * OCR Service
 * Main entry point for OCR processing
 */

import { openAIVisionOCR } from "./openai-vision";
import type { OCRProvider, OCRProcessingResult, StructuredReceiptData } from "./types";

/**
 * Process a receipt image and extract structured data
 */
export async function processReceipt(
  imageBuffer: Buffer,
  provider: OCRProvider = openAIVisionOCR
): Promise<OCRProcessingResult> {
  const startTime = Date.now();

  try {
    const data = await provider.extractStructuredData(imageBuffer);
    const processingTime = Date.now() - startTime;

    return {
      success: true,
      data,
      processingTime,
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error("[OCR] Processing failed:", error);

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown OCR error",
      processingTime,
    };
  }
}

/**
 * Extract plain text from an image
 */
export async function extractText(
  imageBuffer: Buffer,
  provider: OCRProvider = openAIVisionOCR
): Promise<string> {
  const result = await provider.extractText(imageBuffer);
  return result.text;
}

// Re-export types
export type { OCRProvider, OCRProcessingResult, StructuredReceiptData };

// Re-export providers
export { openAIVisionOCR };
