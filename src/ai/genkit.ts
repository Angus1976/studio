import {config} from 'dotenv';
config({ path: `.env` });
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Initialize Genkit with the Google AI plugin, which will automatically
// use the GEMINI_API_KEY from your .env file if it's set.
export const ai = genkit({
  plugins: [
    googleAI({
      // You can explicitly pass the API key here, but it's better practice
      // to set it in your .env file as GEMINI_API_KEY.
      // apiKey: process.env.GEMINI_API_KEY,
    }),
  ],
  // logLevel: 'debug', // Note: logLevel is not a valid option in Genkit 1.x root config
  enableTracingAndMetrics: true,
});