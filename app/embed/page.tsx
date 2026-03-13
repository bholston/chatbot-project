import ChatApp from "@/app/components/ChatApp";
import { getContextConfig, getContextKey } from "@/lib/chatbotContext";

export default function EmbedPage() {
  const ctx = getContextConfig();
  const contextKey = getContextKey();

  const requireLeadCapture =
    process.env.REQUIRE_LEAD_CAPTURE !== "false" && ctx.leadCapture !== null;

  return (
    <div className="w-full h-screen bg-transparent">
      <ChatApp
        requireLeadCapture={requireLeadCapture}
        leadCapture={ctx.leadCapture}
        contextKey={contextKey}
        introMessage={ctx.introMessage}
        headerTitle={ctx.headerTitle}
        headerSubtitle={ctx.headerSubtitle}
      />
    </div>
  );
}
