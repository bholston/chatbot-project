import { NextRequest, NextResponse } from "next/server";

export interface LeadPayload {
  fullName: string;
  email: string;
  phone?: string;
  businessName?: string;
  orgName?: string;
  ghlTag: string;
  ghlNoteContext: string;
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  return {
    firstName: parts[0] ?? "",
    lastName: parts.slice(1).join(" "),
  };
}

/**
 * GHL has two API systems that use different keys and base URLs:
 *
 *   v2 (Private Integration / OAuth JWT)
 *      Key looks like: eyJ...
 *      Base URL: https://services.leadconnectorhq.com
 *      Required header: Version: 2021-07-28
 *
 *   v1 (Location API Key — found in Settings → Business Profile → API Key)
 *      Key is a short alphanumeric string
 *      Base URL: https://rest.gohighlevel.com/v1
 *      No Version header needed
 *
 * We detect which key type is present and use the matching endpoint.
 */
// v2 keys are JWTs (eyJ...) or Private Integration Tokens (pit...).
// Set GHL_API_VERSION=v1 in .env.local to force the legacy endpoint.
function isV2Key(key: string): boolean {
  if (process.env.GHL_API_VERSION === "v1") return false;
  if (process.env.GHL_API_VERSION === "v2") return true;
  const k = key.trim().toLowerCase();
  return k.startsWith("eyj") || k.startsWith("pit");
}

interface GhlConfig {
  contactsUrl: string;
  notesUrl: (contactId: string) => string;
  headers: Record<string, string>;
  // v1 doesn't accept locationId in the body — it's implicit from the key
  includeLocationId: boolean;
}

function buildGhlConfig(apiKey: string): GhlConfig {
  if (isV2Key(apiKey)) {
    console.log("[leads] detected v2 Private Integration key");
    return {
      contactsUrl: "https://services.leadconnectorhq.com/contacts/",
      notesUrl: (id) => `https://services.leadconnectorhq.com/contacts/${id}/notes`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Version: "2021-07-28",
      },
      includeLocationId: true,
    };
  }

  console.log("[leads] detected v1 Location API key");
  return {
    contactsUrl: "https://rest.gohighlevel.com/v1/contacts/",
    notesUrl: (id) => `https://rest.gohighlevel.com/v1/contacts/${id}/notes/`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    includeLocationId: false, // v1 keys are scoped to the location already
  };
}

export async function POST(req: NextRequest) {
  try {
    const lead: LeadPayload = await req.json();
    console.log("[leads] received lead:", {
      fullName: lead.fullName,
      email: lead.email,
      phone: lead.phone ?? "(none)",
      businessName: lead.businessName ?? "(none)",
      orgName: lead.orgName ?? "(none)",
      ghlTag: lead.ghlTag,
      ghlNoteContext: lead.ghlNoteContext,
    });

    const apiKey = process.env.GHL_API_KEY;
    const locationId = process.env.GHL_LOCATION_ID;

    console.log("[leads] GHL_API_KEY present:", !!apiKey);
    console.log("[leads] GHL_LOCATION_ID present:", !!locationId);

    if (!apiKey || !locationId) {
      console.warn("[leads] GHL credentials not configured — skipping CRM sync");
      return NextResponse.json({ success: true, skipped: true });
    }

    const ghl = buildGhlConfig(apiKey);
    const { firstName, lastName } = splitName(lead.fullName);

    const contactBody: Record<string, unknown> = {
      firstName,
      lastName,
      email: lead.email || undefined,
      phone: lead.phone || undefined,
      companyName: lead.businessName ?? lead.orgName ?? undefined,
      tags: [lead.ghlTag],
      source: "Eli Chatbot",
    };

    // Only include locationId for v2 (v1 derives it from the key)
    if (ghl.includeLocationId) {
      contactBody.locationId = locationId;
    }

    console.log("[leads] POST", ghl.contactsUrl);
    console.log("[leads] contact body:", JSON.stringify(contactBody));

    const contactRes = await fetch(ghl.contactsUrl, {
      method: "POST",
      headers: ghl.headers,
      body: JSON.stringify(contactBody),
    });

    const contactRawText = await contactRes.text();
    console.log(
      `[leads] GHL contacts response — status: ${contactRes.status}, body: ${contactRawText}`
    );

    if (!contactRes.ok) {
      return NextResponse.json({
        success: true,
        ghlError: { status: contactRes.status, body: contactRawText },
      });
    }

    const contactData = JSON.parse(contactRawText);
    const contactId: string | undefined =
      contactData?.contact?.id ?? contactData?.id;

    console.log("[leads] GHL contact created, id:", contactId);

    // Add a note
    if (contactId) {
      const date = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // contactId goes in the URL only — GHL v2 rejects it in the body
      const noteBody = {
        body: `Lead captured via Eli chatbot on ${lead.ghlNoteContext} context on ${date}.`,
      };

      const notesUrl = ghl.notesUrl(contactId);
      console.log("[leads] POST", notesUrl);

      const noteRes = await fetch(notesUrl, {
        method: "POST",
        headers: ghl.headers,
        body: JSON.stringify(noteBody),
      });

      const noteRawText = await noteRes.text();
      if (!noteRes.ok) {
        console.warn(
          `[leads] GHL note failed — status: ${noteRes.status}, body: ${noteRawText}`
        );
      } else {
        console.log("[leads] GHL note added successfully");
      }
    }

    return NextResponse.json({ success: true, contactId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[leads] unhandled error:", message, error);
    return NextResponse.json({ success: true, error: message });
  }
}
