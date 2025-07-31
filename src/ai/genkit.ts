import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI({
      // The Gemini 1.5 Pro model is a powerful, general-purpose model.
      defaultModel: 'gemini-1.5-pro-latest',
    }),
  ],
  // Log all errors to the console.
  logLevel: 'debug',
  // OTel is the standard for observability in modern cloud-native apps.
  // We will use it to export traces and metrics from our flows.
  enableTracingAndMetrics: true,
});
