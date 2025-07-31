'use server';

import { processSupplierData } from '@/ai/flows/process-supplier-data';
import type { ProcessSupplierDataOutput } from '@/ai/flows/process-supplier-data';

export async function handleFileUpload(csvData: string): Promise<ProcessSupplierDataOutput> {
  if (!csvData) {
    throw new Error('CSV data is empty.');
  }

  try {
    const result = await processSupplierData({ csvData });
    return result;
  } catch (error) {
    console.error('Error processing supplier data:', error);
    // Rethrow or return a custom error object
    throw new Error('Failed to process supplier data with AI.');
  }
}
