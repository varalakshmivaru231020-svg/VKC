"use client";

import { useState, useCallback, useTransition, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Save, RotateCcw, Eye, Palette, Type, Settings2, Check } from "lucide-react";
import type { ThemeSettings } from "@/lib/theme/types";
import { DEFAULT_THEME, SETTING_METAS, buildThemeStyle, toCssVar } from "@/lib/theme/defaults";
import { HEADING_FONTS, BODY_FONTS, buildAllFontsUrl } from "@/lib/theme/fonts";
import { cn } from "@/lib/utils";

interface Props {
  initialSettings: ThemeSettings;
}

export default function DesignClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState<ThemeSettings>(initialSettings);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Inject live preview into the page whenever settings change
  useEffect(() => {
    const style = document.getElementById("vl-theme");
    if (style) style.innerHTML = buildThemeStyle(settings);
  }, [settings]);

  // Load all fonts for the admin preview
  useEffect(() => {
    const existing = document.getElementById("vl-admin-fonts");
    if (!existing) {
      const link = document.createElement("link");
      link.id = "vl-admin-fonts";
      link.rel = "stylesheet";
      link.href = buildAllFontsUrl();
      document.head.appendChild(link);
    }
  }, []);

  const update = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }, []);

  const handleSave = () => {
    startTransition(async () => {
      await fetch("/api/admin/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    });
  };

  const handleReset = () => {
    if (!confirm("Reset all design settings to defaults? This cannot be undone.")) return;
    startTransition(async () => {
      await fetch("/api/admin/theme/reset", { method: "POST" });
      setSettings(DEFAULT_THEME);
      setSaved(false);
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary font-body">Design & Branding</h1>
          <p className="text-sm text-text-muted mt-1 font-body">
            All changes apply live across the entire storefront — no code required.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleReset} disabled={isPending}>
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Reset to defaults
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            loading={isPending}
            className={cn(saved && "bg-success hover:bg-success")}
          >
            {saved ? <><Check className="h-3.5 w-3.5 mr-1.5" />Saved</> : <><Save className="h-3.5 w-3.5 mr-1.5" />Save changes</>}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="colors">
            <Palette className="h-3.5 w-3.5 mr-1.5" />Colors
          </TabsTrigger>
          <TabsTrigger value="typography">
            <Type className="h-3.5 w-3.5 mr-1.5" />Typography
          </TabsTrigger>
          <TabsTrigger value="general">
            <Settings2 className="h-3.5 w-3.5 mr-1.5" />General
          </TabsTrigger>
          <TabsTrigger value="preview">
            <Eye className="h-3.5 w-3.5 mr-1.5" />Live Preview
          </TabsTrigger>
        </TabsList>

        {/* ── COLORS TAB ── */}
        <TabsContent value="colors">
          <div className="bg-white border border-[#E8DDD0] rounded-md p-6 space-y-8">
            <ColorGroup
              title="Brand Colors"
              description="Primary colors that define your brand identity"
              keys={[
                "color.primary", "color.primary.dark", "color.primary.light", "color.primary.50",
              ]}
              settings={settings}
              onChange={update}
            />
            <Separator />
            <ColorGroup
              title="Gold / Accent"
              description="Accent colors used for borders, highlights, and premium elements"
              keys={["color.gold", "color.gold.light", "color.gold.dark"]}
              settings={settings}
              onChange={update}
            />
            <Separator />
            <ColorGroup
              title="Background Tones"
              description="Page and section background colors"
              keys={["color.ivory", "color.cream", "color.parchment", "color.sand"]}
              settings={settings}
              onChange={update}
            />
            <Separator />
            <ColorGroup
              title="Text Colors"
              description="Typography color hierarchy"
              keys={[
                "color.text.primary", "color.text.secondary",
                "color.text.muted", "color.text.disabled", "color.text.inverse",
              ]}
              settings={settings}
              onChange={update}
            />
            <Separator />
            <ColorGroup
              title="Semantic Colors"
              description="Status and feedback colors"
              keys={[
                "color.success", "color.success.bg",
                "color.error", "color.error.bg",
                "color.warning", "color.warning.bg",
                "color.border",
              ]}
              settings={settings}
              onChange={update}
            />
          </div>
        </TabsContent>

        {/* ── TYPOGRAPHY TAB ── */}
        <TabsContent value="typography">
          <div className="bg-white border border-[#E8DDD0] rounded-md p-6 space-y-8">

            {/* Font Families */}
            <section>
              <h3 className="text-base font-semibold text-text-primary font-body mb-1">Font Families</h3>
              <p className="text-sm text-text-muted mb-5">
                Choose typefaces for headings and body text. Previews show how each font looks.
              </p>
              <div className="space-y-6">
                <FontFamilyPicker
                  label="Heading Font"
                  description="Applied to H1–H5, product names, hero headlines, section titles"
                  value={settings["font.heading"]}
                  options={HEADING_FONTS}
                  onChange={(v) => update("font.heading", v)}
                  previewText="The Art of Handwoven Silk"
                  previewSize="28px"
                />
                <FontFamilyPicker
                  label="Body / UI Font"
                  description="Applied to body copy, buttons, inputs, navigation, labels"
                  value={settings["font.body"]}
                  options={BODY_FONTS}
                  onChange={(v) => update("font.body", v)}
                  previewText="Discover our curated collection of handwoven sarees from across India."
                  previewSize="15px"
                />
              </div>
            </section>

            <Separator />

            {/* Font Sizes */}
            <section>
              <h3 className="text-base font-semibold text-text-primary font-body mb-1">Font Sizes</h3>
              <p className="text-sm text-text-muted mb-5">
                Sizes can be plain values (e.g. <code className="bg-cream px-1.5 py-0.5 rounded text-xs">1.75rem</code>) or responsive clamp expressions.
              </p>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {(
                  [
                    ["text.display",  "Display / Hero"],
                    ["text.h1",       "H1 — Page Title"],
                    ["text.h2",       "H2 — Section Heading"],
                    ["text.h3",       "H3 — Sub-section"],
                    ["text.h4",       "H4 — Card Title"],
                    ["text.h5",       "H5 — Small Heading"],
                    ["text.body",     "Body Text"],
                    ["text.sm",       "Small / Caption"],
                    ["text.price",    "Price Display"],
                    ["text.price.sm", "Price Small"],
                  ] as [keyof ThemeSettings, string][]
                ).map(([key, label]) => (
                  <FontSizeInput
                    key={key}
                    label={label}
                    value={settings[key]}
                    onChange={(v) => update(key, v)}
                    preview={previewForKey(key, settings)}
                    previewFont={
                      key.startsWith("text.h") || key.startsWith("text.display") || key.startsWith("text.price")
                        ? settings["font.heading"]
                        : settings["font.body"]
                    }
                  />
                ))}
              </div>
            </section>

            <Separator />

            {/* Font Weights */}
            <section>
              <h3 className="text-base font-semibold text-text-primary font-body mb-1">Font Weights</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {(
                  [
                    ["weight.heading",    "Heading Weight"],
                    ["weight.subheading", "Subheading Weight"],
                    ["weight.body",       "Body Weight"],
                    ["weight.label",      "Label Weight"],
                  ] as [keyof ThemeSettings, string][]
                ).map(([key, label]) => {
                  const meta = SETTING_METAS.find((m) => m.key === key);
                  return (
                    <WeightSelect
                      key={key}
                      label={label}
                      value={settings[key]}
                      options={meta?.options ?? []}
                      onChange={(v) => update(key, v)}
                    />
                  );
                })}
              </div>
            </section>
          </div>
        </TabsContent>

        {/* ── GENERAL TAB ── */}
        <TabsContent value="general">
          <div className="bg-white border border-[#E8DDD0] rounded-md p-6 space-y-6">
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-text-primary font-body">Store Identity</h3>
              <TextField label="Store Name" value={settings["site.name"]} onChange={(v) => update("site.name", v)} />
              <TextField label="Tagline" value={settings["site.tagline"]} onChange={(v) => update("site.tagline", v)} />
              <TextField label="Currency Symbol" value={settings["site.currency.symbol"]} onChange={(v) => update("site.currency.symbol", v)} />
              <TextField label="Currency Code" value={settings["site.currency.code"]} onChange={(v) => update("site.currency.code", v)} />
            </section>
            <Separator />
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-text-primary font-body">Announcement Bar</h3>
              <div className="flex items-center gap-3">
                <Switch
                  checked={settings["site.announcement.active"] === "true"}
                  onCheckedChange={(v) => update("site.announcement.active", v ? "true" : "false")}
                />
                <span className="text-sm text-text-secondary font-body">Show announcement bar at top of store</span>
              </div>
              <TextField
                label="Announcement Text"
                value={settings["site.announcement"]}
                onChange={(v) => update("site.announcement", v)}
              />
              <div
                className="rounded-sm p-3 text-sm text-center font-medium"
                style={{
                  background: settings["color.primary"],
                  color: settings["color.gold.light"],
                  fontFamily: settings["font.body"],
                }}
              >
                Preview: {settings["site.announcement"] || "Announcement text here"}
              </div>
            </section>
          </div>
        </TabsContent>

        {/* ── LIVE PREVIEW TAB ── */}
        <TabsContent value="preview">
          <LivePreview settings={settings} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

function ColorGroup({
  title, description, keys, settings, onChange,
}: {
  title: string;
  description: string;
  keys: (keyof ThemeSettings)[];
  settings: ThemeSettings;
  onChange: (key: keyof ThemeSettings, value: string) => void;
}) {
  return (
    <section>
      <h3 className="text-base font-semibold text-text-primary font-body">{title}</h3>
      <p className="text-sm text-text-muted mt-0.5 mb-4">{description}</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {keys.map((key) => {
          const meta = SETTING_METAS.find((m) => m.key === key);
          return (
            <ColorPicker
              key={key}
              label={meta?.label ?? key}
              description={meta?.description}
              value={settings[key]}
              onChange={(v) => onChange(key, v)}
            />
          );
        })}
      </div>
    </section>
  );
}

function ColorPicker({
  label, description, value, onChange,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-text-secondary font-body block">{label}</label>
      <div className="flex items-center gap-2.5 p-2.5 border border-[#E8DDD0] rounded-sm bg-[#FAFAF9]">
        <label className="relative cursor-pointer shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="sr-only"
          />
          <div
            className="w-9 h-9 rounded-xs border border-black/10 shadow-xs cursor-pointer transition-transform hover:scale-105"
            style={{ background: value }}
          />
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value);
          }}
          className="flex-1 min-w-0 text-sm font-mono bg-transparent border-none outline-none text-text-primary"
          spellCheck={false}
          maxLength={7}
        />
      </div>
      {description && (
        <p className="text-[11px] text-text-muted leading-snug">{description}</p>
      )}
    </div>
  );
}

function FontFamilyPicker({
  label, description, value, options, onChange, previewText, previewSize,
}: {
  label: string;
  description: string;
  value: string;
  options: typeof HEADING_FONTS;
  onChange: (v: string) => void;
  previewText: string;
  previewSize: string;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-text-primary font-body">{label}</p>
        <p className="text-xs text-text-muted mt-0.5">{description}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {options.map((font) => {
          const isSelected = value === font.value;
          return (
            <button
              key={font.value}
              type="button"
              onClick={() => onChange(font.value)}
              className={cn(
                "text-left p-3 rounded-sm border transition-all duration-fast cursor-pointer",
                isSelected
                  ? "border-primary bg-primary-50 ring-1 ring-primary"
                  : "border-[#E8DDD0] bg-[#FAFAF9] hover:border-primary/40 hover:bg-primary-50/50"
              )}
            >
              <p
                className="text-xs font-semibold font-body mb-1.5"
                style={{ color: isSelected ? "var(--color-primary)" : "var(--color-text-muted)" }}
              >
                {font.name}
                {isSelected && <Check className="inline h-3 w-3 ml-1.5" />}
              </p>
              <p
                style={{
                  fontFamily: font.value,
                  fontSize: previewSize,
                  lineHeight: 1.3,
                  color: "var(--color-text-primary)",
                }}
              >
                {previewText}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FontSizeInput({
  label, value, onChange, preview, previewFont,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  preview?: string;
  previewFont?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-text-secondary font-body block">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-9 px-3 text-sm font-mono bg-[#FAFAF9] border border-[#E8DDD0] rounded-xs
                     focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
        />
      </div>
      {preview && (
        <p
          className="mt-1 text-text-primary leading-tight truncate"
          style={{ fontSize: value, fontFamily: previewFont, lineHeight: 1.2 }}
        >
          {preview}
        </p>
      )}
    </div>
  );
}

function WeightSelect({
  label, value, options, onChange,
}: {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-text-secondary font-body block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 text-sm bg-[#FAFAF9] border border-[#E8DDD0] rounded-xs
                   focus:outline-none focus:border-primary transition-colors font-body"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function TextField({
  label, value, onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary font-body block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 px-4 text-sm bg-[#FAFAF9] border border-[#E8DDD0] rounded-sm
                   focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary
                   transition-colors font-body text-text-primary"
      />
    </div>
  );
}

function LivePreview({ settings }: { settings: ThemeSettings }) {
  return (
    <div
      className="rounded-md border border-[#E8DDD0] overflow-hidden"
      style={{
        fontFamily: settings["font.body"],
        background: settings["color.ivory"],
        color: settings["color.text.primary"],
      }}
    >
      {/* Mock announcement bar */}
      {settings["site.announcement.active"] === "true" && (
        <div
          className="py-2.5 px-6 text-center text-sm"
          style={{ background: settings["color.primary"], color: settings["color.gold.light"], fontFamily: settings["font.body"] }}
        >
          {settings["site.announcement"]}
        </div>
      )}

      {/* Mock header */}
      <div
        className="px-8 py-4 border-b flex items-center justify-between"
        style={{ borderColor: settings["color.parchment"], background: settings["color.ivory"] }}
      >
        <p
          style={{
            fontFamily: settings["font.heading"],
            fontSize: "22px",
            fontWeight: settings["weight.heading"],
            color: settings["color.primary"],
          }}
        >
          {settings["site.name"]}
        </p>
        <div className="flex gap-6">
          {["New Arrivals", "Collections", "Shop", "Our Story"].map((item) => (
            <span key={item} className="text-sm" style={{ color: settings["color.text.secondary"], fontFamily: settings["font.body"] }}>
              {item}
            </span>
          ))}
        </div>
        <div className="flex gap-3">
          {["Search", "Wishlist", "Cart"].map((item) => (
            <span
              key={item}
              className="text-xs px-2.5 py-1.5 rounded-xs"
              style={{
                color: settings["color.text.muted"],
                border: `1px solid ${settings["color.parchment"]}`,
                fontFamily: settings["font.body"],
              }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Mock hero */}
      <div
        className="px-8 py-16 text-center space-y-4"
        style={{ background: settings["color.cream"] }}
      >
        <p
          className="text-label"
          style={{ color: settings["color.gold"], letterSpacing: "0.12em", fontFamily: settings["font.body"], fontWeight: settings["weight.label"] }}
        >
          NEW ARRIVALS
        </p>
        <p
          style={{
            fontFamily: settings["font.heading"],
            fontSize: settings["text.h1"],
            fontWeight: settings["weight.heading"],
            lineHeight: 1.15,
            color: settings["color.text.primary"],
          }}
        >
          The Art of Handwoven Silk
        </p>
        <p
          className="max-w-md mx-auto"
          style={{
            fontFamily: settings["font.body"],
            fontSize: settings["text.body"],
            color: settings["color.text.secondary"],
            lineHeight: settings["leading.body"],
          }}
        >
          {settings["site.tagline"]}. Explore timeless weaves from across India.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            className="px-7 py-3 rounded-xs text-sm font-medium"
            style={{
              background: settings["color.primary"],
              color: settings["color.text.inverse"],
              fontFamily: settings["font.body"],
            }}
          >
            Explore Collection
          </button>
          <button
            className="px-7 py-3 rounded-xs text-sm font-medium border"
            style={{
              borderColor: settings["color.primary"],
              color: settings["color.primary"],
              fontFamily: settings["font.body"],
            }}
          >
            View Lookbook
          </button>
        </div>
      </div>

      {/* Mock product cards */}
      <div className="px-8 py-10">
        <p
          className="text-center mb-8"
          style={{
            fontFamily: settings["font.heading"],
            fontSize: settings["text.h2"],
            fontWeight: settings["weight.heading"],
            color: settings["color.text.primary"],
          }}
        >
          Featured Sarees
        </p>
        <div className="grid grid-cols-4 gap-5">
          {["Kanjivaram Silk", "Banarasi Georgette", "Patola Silk", "Chanderi Cotton"].map((name, i) => {
            const saved = i % 2 === 0;
            return (
              <div key={name} className="space-y-2.5">
                <div
                  className="product-card-ratio rounded-sm"
                  style={{ background: settings["color.cream"], border: `1px solid ${settings["color.parchment"]}` }}
                />
                <div className="space-y-1">
                  <div className="flex gap-1.5">
                    {["#8B1A2E", "#1B4B6B", "#C4922A"].map((hex) => (
                      <div
                        key={hex}
                        className="w-4 h-4 rounded-full border border-white"
                        style={{ background: hex, boxShadow: `0 0 0 1px ${settings["color.parchment"]}` }}
                      />
                    ))}
                  </div>
                  <p
                    className="text-sm leading-snug"
                    style={{ fontFamily: settings["font.body"], fontWeight: 500, color: settings["color.text.primary"] }}
                  >
                    {name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        fontFamily: settings["font.heading"],
                        fontSize: settings["text.price.sm"],
                        fontStyle: "italic",
                        color: settings["color.primary"],
                      }}
                    >
                      {settings["site.currency.symbol"]}14,500
                    </span>
                    {saved && (
                      <span
                        className="text-xs line-through"
                        style={{ color: settings["color.text.muted"], fontFamily: settings["font.body"] }}
                      >
                        {settings["site.currency.symbol"]}18,000
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mock footer strip */}
      <div
        className="px-8 py-5 border-t flex items-center justify-between"
        style={{ background: settings["color.cream"], borderColor: settings["color.parchment"] }}
      >
        <p
          style={{ fontFamily: settings["font.heading"], fontSize: "18px", color: settings["color.primary"] }}
        >
          {settings["site.name"]}
        </p>
        <p
          className="text-xs"
          style={{ color: settings["color.text.muted"], fontFamily: settings["font.body"] }}
        >
          {settings["site.tagline"]}
        </p>
        <div className="flex gap-2">
          {["Home", "Shop", "About", "Contact"].map((item) => (
            <span
              key={item}
              className="text-xs"
              style={{ color: settings["color.text.muted"], fontFamily: settings["font.body"] }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function previewForKey(key: string, settings: ThemeSettings): string {
  if (key === "text.display") return "The Art of Handwoven Silk";
  if (key === "text.h1") return "Kanjivaram Collection";
  if (key === "text.h2") return "Featured Sarees";
  if (key === "text.h3") return "Pure Silk Weaves";
  if (key === "text.h4") return "New Arrivals";
  if (key === "text.h5") return "Free Shipping Above ₹2,999";
  if (key === "text.body") return "Handwoven with love from across India.";
  if (key === "text.sm") return "In stock · Ships in 3–5 days";
  if (key === "text.price") return `${settings["site.currency.symbol"]}18,500`;
  if (key === "text.price.sm") return `${settings["site.currency.symbol"]}14,200`;
  return "Preview text";
}
