import type { GenerateUserProfileOutput } from "@/ai/flows/generate-user-profile";
import type { RecommendProductsOrServicesOutput } from "@/ai/flows/recommend-products-or-services";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageDataUri?: string;
  aiContent?: {
    userProfile: GenerateUserProfileOutput;
    recommendations: RecommendProductsOrServicesOutput;
  }
}
