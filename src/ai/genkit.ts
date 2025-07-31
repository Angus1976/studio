import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // The Gemini 1.5 Pro model is a powerful, general-purpose model.
  defaultModel: 'googleai/gemini-1.5-pro-latest',
  // Log all errors to the console.
  logLevel: 'error',
  // OTel is the standard for observability in modern cloud-native apps.
  // We will use it to export traces and metrics from our flows.
  telemetry: {
    instrumentation: {
      // Instrument the Genkit core library.
      // This will trace all calls to defineFlow, generate, and other
      // Genkit core functions.
      genkit: true,
      // Instrument the Google AI plugin.
      // This will trace all calls to Google AI models.
      'genkit-plugin-googleai': true,
    },
    // We will export traces and metrics to the console.
    // In a production environment, you would want to export to a
    // managed observability service like Google Cloud Trace and Monitoring.
    logger: 'console',
  },
});
