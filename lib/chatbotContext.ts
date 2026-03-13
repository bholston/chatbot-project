export type ChatbotContextKey = "elite" | "donate" | "internal";
export type FormVariant = "elite" | "donate";

export interface LeadCaptureConfig {
  formVariant: FormVariant;
  formTitle: string;
  formSubtitle: string;
  merchantBypass: boolean;
  bypassText: string;
  ghlTag: string;
  ghlNoteContext: string;
}

export interface ContextConfig {
  collectionName: string;
  systemPrompt: string;
  introMessage: string;
  headerTitle: string;
  headerSubtitle: string;
  leadCapture: LeadCaptureConfig | null; // null = skip form entirely
}

const CONTEXTS: Record<ChatbotContextKey, ContextConfig> = {
  elite: {
    collectionName: "elite-card-processing",
    systemPrompt: `You are Eli, a professional sales and support assistant for Elite Card Processing. You help potential and existing merchants with questions about payment processing, rates, equipment, services, and getting started. Use the context below from our knowledge base to answer questions accurately and confidently. If you don't have enough information to answer, say: "I don't have that information yet. Please contact us directly or check with your manager." Never make up rates, fees, or policies.`,
    introMessage:
      "Hi, I'm Eli — your Elite Card Processing assistant. I can help with payment processing questions, rates, equipment, and merchant support. What can I help you with today?",
    headerTitle: "Eli",
    headerSubtitle: "Elite Card Processing Assistant",
    leadCapture: {
      formVariant: "elite",
      formTitle: "Chat with Eli",
      formSubtitle:
        "Please introduce yourself so Eli can better assist you.",
      merchantBypass: true,
      bypassText: "Already an Elite Merchant? Click Here",
      ghlTag: "Eli Chatbot Lead",
      ghlNoteContext: "Elite Card Processing",
    },
  },
  donate: {
    collectionName: "donate-money-now",
    systemPrompt: `You are Eli, a friendly and helpful assistant for Donate Money Now. You help donors and organizations with questions about the donation platform, setting up campaigns, processing donations, and using the platform's features. Use the context below from our knowledge base to answer questions accurately. If you don't have enough information to answer, say: "I don't have that information yet. Please contact us directly for help." Never make up information.`,
    introMessage:
      "Hi, I'm Eli — your Donate Money Now assistant. I can help with donations, campaigns, and using the platform. What can I help you with today?",
    headerTitle: "Eli",
    headerSubtitle: "Donate Money Now Assistant",
    leadCapture: {
      formVariant: "donate",
      formTitle: "Chat with Eli",
      formSubtitle:
        "Please introduce yourself so Eli can better assist you.",
      merchantBypass: true,
      bypassText: "Already a Donor? Click Here",
      ghlTag: "Eli Chatbot - Donate Money Now",
      ghlNoteContext: "Donate Money Now",
    },
  },
  internal: {
    collectionName: "internal-knowledge",
    systemPrompt: `You are Eli, a knowledgeable internal assistant for Elite Card Processing staff and sales representatives. You answer questions about company policies, sales scripts, onboarding procedures, pricing guidelines, internal tools, and operations. Use the context below from our knowledge base to answer accurately. If you don't have the information, say: "I don't have that information yet. Please check with your manager." Never guess at policies or procedures.`,
    introMessage:
      "Hi, I'm Eli — your internal Elite Card Processing assistant. Ask me about policies, sales scripts, procedures, or anything else you need. What can I help you with?",
    headerTitle: "Eli",
    headerSubtitle: "Internal Staff Assistant",
    leadCapture: null, // employees skip the form entirely
  },
};

export function getContextKey(): ChatbotContextKey {
  return ((process.env.CHATBOT_CONTEXT ?? "elite") as ChatbotContextKey) in
    CONTEXTS
    ? (process.env.CHATBOT_CONTEXT as ChatbotContextKey)
    : "elite";
}

export function getContextConfig(): ContextConfig {
  return CONTEXTS[getContextKey()];
}
