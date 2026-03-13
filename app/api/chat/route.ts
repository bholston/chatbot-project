import { NextRequest, NextResponse } from "next/server";
import { anthropic, MODEL } from "@/lib/claude";
import { queryDocuments } from "@/lib/vectorstore";
import { getContextConfig } from "@/lib/chatbotContext";
import Anthropic from "@anthropic-ai/sdk";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: ChatMessage[] } = await req.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const ctx = getContextConfig();
    console.log(
      `[chat] context=${process.env.CHATBOT_CONTEXT ?? "elite"} collection=${ctx.collectionName}`
    );

    const latestUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");

    let systemPrompt = ctx.systemPrompt;

    if (latestUserMessage) {
      // queryDocuments never throws — it returns [] on any error
      const relevantDocs = await queryDocuments(
        ctx.collectionName,
        latestUserMessage.content,
        5
      );
      console.log(`[chat] retrieved ${relevantDocs.length} context chunks`);

      if (relevantDocs.length > 0) {
        const context = relevantDocs.join("\n\n---\n\n");
        systemPrompt = `${ctx.systemPrompt}\n\nContext:\n${context}`;
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[chat] ANTHROPIC_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: missing API key." },
        { status: 500 }
      );
    }

    const apiMessages: Anthropic.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: apiMessages,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
        } catch (err) {
          console.error("[chat] stream error:", err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[chat] unhandled error:", message, error);
    return NextResponse.json(
      { error: `Chat error: ${message}` },
      { status: 500 }
    );
  }
}
