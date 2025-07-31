import type { GenerateUserProfileOutput } from "@/ai/flows/generate-user-profile";
import type { RecommendProductsOrServicesOutput } from "@/ai/flows/recommend-products-or-services";

export interface Product {
    name: string;
    description: string;
    panoramicImage: string;
    price: string;
    purchaseUrl: string;
}
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

