import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // OTel is the standard for observability in modern cloud-native apps.
  // We will use it to export traces and metrics from our flows.
  enableTracingAndMetrics: true,
});
