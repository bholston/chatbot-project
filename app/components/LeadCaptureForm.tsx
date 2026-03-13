"use client";

import { useState, FormEvent } from "react";
import { FormVariant } from "@/lib/chatbotContext";
import { LeadPayload } from "@/app/api/leads/route";

interface LeadCaptureFormProps {
  formVariant: FormVariant;
  formTitle: string;
  formSubtitle: string;
  merchantBypass: boolean;
  bypassText: string;
  ghlTag: string;
  ghlNoteContext: string;
  onComplete: (fullName: string) => void;
  onBypass: () => void;
}

interface FieldState {
  fullName: string;
  email: string;
  phone: string;
  businessName: string; // elite only
  orgName: string; // donate only
}

export default function LeadCaptureForm({
  formVariant,
  formTitle,
  formSubtitle,
  merchantBypass,
  bypassText,
  ghlTag,
  ghlNoteContext,
  onComplete,
  onBypass,
}: LeadCaptureFormProps) {
  const [fields, setFields] = useState<FieldState>({
    fullName: "",
    email: "",
    phone: "",
    businessName: "",
    orgName: "",
  });
  const [errors, setErrors] = useState<Partial<FieldState>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function set(key: keyof FieldState, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  }

  function validate(): boolean {
    const next: Partial<FieldState> = {};

    if (!fields.fullName.trim()) next.fullName = "Full name is required.";

    if (!fields.email.trim()) {
      next.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
      next.email = "Please enter a valid email address.";
    }

    if (formVariant === "elite") {
      if (!fields.businessName.trim())
        next.businessName = "Business name is required.";
      if (!fields.phone.trim()) next.phone = "Phone number is required.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);

    const payload: LeadPayload = {
      fullName: fields.fullName.trim(),
      email: fields.email.trim(),
      phone: fields.phone.trim() || undefined,
      businessName: fields.businessName.trim() || undefined,
      orgName: fields.orgName.trim() || undefined,
      ghlTag,
      ghlNoteContext,
    };

    try {
      // Fire-and-forget — we don't block the user on CRM success
      await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      // Log but don't surface CRM errors to the user
      console.warn("[LeadCaptureForm] GHL sync error:", err);
    }

    onComplete(fields.fullName.trim());
  }

  const inputClass =
    "w-full bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";

  const errorClass = "text-red-400 text-xs mt-1";

  const labelClass = "block text-xs font-medium text-gray-400 mb-1";

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 bg-gray-900 border-b border-gray-700">
        <div className="shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shadow-lg">
          E
        </div>
        <div>
          <h1 className="text-base font-semibold text-white leading-tight">
            Elite Card Processing
          </h1>
          <p className="text-xs text-gray-400">Powered by Eli AI Assistant</p>
        </div>
      </div>

      {/* Form body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Intro */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-600/30 mx-auto mb-3">
            E
          </div>
          <h2 className="text-white font-semibold text-lg">{formTitle}</h2>
          <p className="text-gray-400 text-sm mt-1">{formSubtitle}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Full Name */}
          <div>
            <label className={labelClass}>Full Name *</label>
            <input
              type="text"
              value={fields.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="John Smith"
              autoComplete="name"
              className={inputClass}
            />
            {errors.fullName && (
              <p className={errorClass}>{errors.fullName}</p>
            )}
          </div>

          {/* Business Name (elite) */}
          {formVariant === "elite" && (
            <div>
              <label className={labelClass}>Business Name *</label>
              <input
                type="text"
                value={fields.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                placeholder="Acme Retail LLC"
                autoComplete="organization"
                className={inputClass}
              />
              {errors.businessName && (
                <p className={errorClass}>{errors.businessName}</p>
              )}
            </div>
          )}

          {/* Organization Name (donate — optional) */}
          {formVariant === "donate" && (
            <div>
              <label className={labelClass}>Organization Name (optional)</label>
              <input
                type="text"
                value={fields.orgName}
                onChange={(e) => set("orgName", e.target.value)}
                placeholder="My Non-Profit"
                autoComplete="organization"
                className={inputClass}
              />
            </div>
          )}

          {/* Phone — required for elite, optional for donate */}
          <div>
            <label className={labelClass}>
              Phone Number {formVariant === "elite" ? "*" : "(optional)"}
            </label>
            <input
              type="tel"
              value={fields.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="(555) 123-4567"
              autoComplete="tel"
              className={inputClass}
            />
            {errors.phone && <p className={errorClass}>{errors.phone}</p>}
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email Address *</label>
            <input
              type="email"
              value={fields.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className={inputClass}
            />
            {errors.email && <p className={errorClass}>{errors.email}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl py-3 text-sm font-semibold transition-colors mt-2"
          >
            {isSubmitting ? "Starting chat…" : "Start Chatting with Eli →"}
          </button>
        </form>

        {/* Merchant bypass */}
        {merchantBypass && (
          <div className="mt-5 text-center">
            <div className="border-t border-gray-700 pt-5">
              <button
                type="button"
                onClick={onBypass}
                className="text-sm text-gray-400 hover:text-blue-400 transition-colors underline underline-offset-2"
              >
                {bypassText}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
