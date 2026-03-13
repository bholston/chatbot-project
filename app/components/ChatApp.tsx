"use client";

import { useState } from "react";
import ChatWindow from "./ChatWindow";
import LeadCaptureForm from "./LeadCaptureForm";
import { ChatMessage } from "@/app/api/chat/route";
import { FormVariant, LeadCaptureConfig } from "@/lib/chatbotContext";

interface ChatAppProps {
  // Lead capture
  requireLeadCapture: boolean;
  leadCapture: LeadCaptureConfig | null;
  contextKey: string;
  // Chat window
  introMessage: string;
  headerTitle: string;
  headerSubtitle: string;
}

type Phase = "capture" | "chat";

function buildGreeting(contextKey: string, name: string): string {
  switch (contextKey) {
    case "donate":
      return `Hi ${name}! I'm Eli, your Donate Money Now assistant. How can I help you today?`;
    default:
      return `Hi ${name}! I'm Eli, your Elite Card Processing assistant. I'm here to help with payment processing questions, rates, equipment, and merchant services. What can I help you with today?`;
  }
}

export default function ChatApp({
  requireLeadCapture,
  leadCapture,
  contextKey,
  introMessage,
  headerTitle,
  headerSubtitle,
}: ChatAppProps) {
  const showForm = requireLeadCapture && leadCapture !== null;

  const [phase, setPhase] = useState<Phase>(showForm ? "capture" : "chat");
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);

  function handleLeadComplete(fullName: string) {
    const firstName = fullName.trim().split(/\s+/)[0] ?? fullName.trim();
    setInitialMessages([
      {
        role: "assistant",
        content: buildGreeting(contextKey, firstName),
      },
    ]);
    setPhase("chat");
  }

  function handleBypass() {
    setInitialMessages([
      {
        role: "assistant",
        content: "Welcome back! How can I help you today?",
      },
    ]);
    setPhase("chat");
  }

  if (phase === "capture" && leadCapture) {
    return (
      <LeadCaptureForm
        formVariant={leadCapture.formVariant as FormVariant}
        formTitle={leadCapture.formTitle}
        formSubtitle={leadCapture.formSubtitle}
        merchantBypass={leadCapture.merchantBypass}
        bypassText={leadCapture.bypassText}
        ghlTag={leadCapture.ghlTag}
        ghlNoteContext={leadCapture.ghlNoteContext}
        onComplete={handleLeadComplete}
        onBypass={handleBypass}
      />
    );
  }

  return (
    <ChatWindow
      introMessage={introMessage}
      headerTitle={headerTitle}
      headerSubtitle={headerSubtitle}
      initialMessages={initialMessages}
    />
  );
}
