/**
 * OpenAI Vision OCR Provider
 * Uses GPT-4 Vision to extract structured data from receipts
 */

import { getOpenAIClient } from "@/lib/ai/openai-client";
import type { OCRProvider, StructuredReceiptData, OCRResult } from "./types";

const RECEIPT_EXTRACTION_PROMPT = `You are an expert at extracting structured data from receipt images.

Analyze this receipt image and extract the following information in JSON format:

{
  "vendor": {
    "name": "Vendor name",
    "address": "Full address if visible",
    "phone": "Phone number if visible",
    "email": "Email if visible"
  },
  "date": "YYYY-MM-DD (ISO 8601 format)",
  "total": 0.00,
  "subtotal": 0.00,
  "tax": 0.00,
  "currency": "USD",
  "lineItems": [
    {
      "description": "Item description",
      "quantity": 1,
      "unitPrice": 0.00,
      "amount": 0.00
    }
  ],
  "confidence": 0.95,
  "rawText": "Full text content of the receipt"
}

Rules:
- Extract ALL numeric values as numbers (not strings)
- Use ISO 8601 date format (YYYY-MM-DD)
- Include confidence score (0.0 to 1.0) based on image quality and data clarity
- If a field is not visible or unclear, omit it or set to null
- Capture the complete raw text of the receipt
- Be precise with amounts - double-check calculations`;

export class OpenAIVisionOCR implements OCRProvider {
  name = "OpenAI Vision";

  async extractText(imageBuffer: Buffer): Promise<OCRResult> {
    try {
      const openai = getOpenAIClient();
      const base64Image = imageBuffer.toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract all text from this receipt image. Return only the text content, line by line.",
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const text = response.choices[0]?.message?.content || "";

      return {
        text,
        confidence: 0.9, // Vision API generally has high confidence
        metadata: {
          model: response.model,
          tokens: response.usage?.total_tokens,
        },
      };
    } catch (error) {
      console.error("[OCR] Text extraction failed:", error);
      throw new Error(`OCR text extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async extractStructuredData(imageBuffer: Buffer): Promise<StructuredReceiptData> {
    try {
      const openai = getOpenAIClient();
      const base64Image = imageBuffer.toString("base64");
      const dataUrl = `data:image/jpeg;base64,${base64Image}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: RECEIPT_EXTRACTION_PROMPT,
              },
              {
                type: "image_url",
                image_url: { url: dataUrl },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content in OCR response");
      }

      const data = JSON.parse(content) as StructuredReceiptData;

      // Ensure confidence is set
      if (!data.confidence) {
        data.confidence = 0.85; // Default confidence
      }

      return data;
    } catch (error) {
      console.error("[OCR] Structured data extraction failed:", error);
      throw new Error(`OCR structured extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}

// Singleton instance
export const openAIVisionOCR = new OpenAIVisionOCR();
