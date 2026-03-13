import ChatApp from "@/app/components/ChatApp";
import { getContextConfig, getContextKey } from "@/lib/chatbotContext";

export default function Home() {
  const ctx = getContextConfig();
  const contextKey = getContextKey();

  // REQUIRE_LEAD_CAPTURE=false disables lead capture globally (e.g. for testing)
  const requireLeadCapture =
    process.env.REQUIRE_LEAD_CAPTURE !== "false" &&
    ctx.leadCapture !== null;

  return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-[85vh]">
        <ChatApp
          requireLeadCapture={requireLeadCapture}
          leadCapture={ctx.leadCapture}
          contextKey={contextKey}
          introMessage={ctx.introMessage}
          headerTitle={ctx.headerTitle}
          headerSubtitle={ctx.headerSubtitle}
        />
      </div>
    </main>
  );
}
