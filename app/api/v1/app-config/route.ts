import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Public endpoint consumed by the Flutter app on launch (and refresh).
 * Returns everything the mobile client needs to bootstrap: theme tokens,
 * site identity, third-party SDK keys (publishable only), shipping config,
 * and version-gating info. NEVER include secrets here.
 */
export async function GET() {
  try {
    const rows = await db.siteSetting.findMany();
    const map: Record<string, string> = {};
    for (const r of rows) map[r.key] = r.value;

    const get = (k: string, fallback = "") => map[k] ?? fallback;

    return NextResponse.json({
      site: {
        name:        get("site.name", "VKC Gold"),
        tagline:     get("site.tagline"),
        logoUrl:     get("store_logo"),
        phone:       get("store_phone"),
        email:       get("store_email"),
        address:     get("store_address"),
        announcement: {
          text:   get("site.announcement"),
          active: get("site.announcement.active") === "true",
        },
        social: {
          instagram: get("social_instagram"),
          facebook:  get("social_facebook"),
          youtube:   get("social_youtube"),
          whatsapp:  get("social_whatsapp"),
        },
      },
      theme: {
        colors: {
          primary:        get("color.primary",        "#7B1E2E"),
          primaryDark:    get("color.primary.dark",   "#5C0E1F"),
          primaryLight:   get("color.primary.light",  "#A93D52"),
          primary50:      get("color.primary.50",     "#FBE9EC"),
          gold:           get("color.gold",           "#C8A24C"),
          goldDark:       get("color.gold.dark",      "#9B7E33"),
          goldLight:      get("color.gold.light",     "#E2C77A"),
          ivory:          get("color.ivory",          "#FBF8F3"),
          cream:          get("color.cream",          "#F5EFE3"),
          parchment:      get("color.parchment",      "#E5DBC7"),
          sand:           get("color.sand",           "#D9CDB3"),
          textPrimary:    get("color.text.primary",   "#1C1410"),
          textSecondary:  get("color.text.secondary", "#4A3F36"),
          textMuted:      get("color.text.muted",     "#7A6E62"),
          textDisabled:   get("color.text.disabled",  "#B5AB9C"),
          textInverse:    get("color.text.inverse",   "#FFFFFF"),
          success:        get("color.success",        "#2F7D49"),
          successBg:      get("color.success.bg",     "#E6F4EA"),
          error:          get("color.error",          "#B22222"),
          errorBg:        get("color.error.bg",       "#FCE7E7"),
          warning:        get("color.warning",        "#B8860B"),
          warningBg:      get("color.warning.bg",     "#FFF7E5"),
          border:         get("color.border",         "#D9CDB3"),
        },
        fonts: {
          heading: get("font.heading", "Cormorant Garamond"),
          body:    get("font.body",    "Inter"),
          accent:  get("font.accent",  "Cormorant Garamond"),
        },
      },
      shipping: {
        freeShippingThreshold: Number(get("free_shipping_threshold",        "2999")),
        firstSareeRate:        Number(get("shipping_first_saree_rate",      "100")),
        additionalSareeRate:   Number(get("shipping_additional_saree_rate", "50")),
        deliveryTitle:         get("domestic_delivery_title", "Standard Delivery"),
        deliveryNotes:         get("domestic_delivery_notes", "4–7 business days"),
        internationalNote:     get("international_shipping_note", ""),
      },
      payment: {
        razorpay: {
          // Publishable key only. Server still owns the secret + signature verification.
          keyId:   get("razorpay_key_id", ""),
          enabled: get("razorpay_enabled", "false") === "true",
        },
        codEnabled:  get("payment_cod_enabled",  "true") === "true",
        upiEnabled:  get("payment_upi_enabled",  "true") === "true",
        cardEnabled: get("payment_card_enabled", "true") === "true",
        netBankingEnabled: get("payment_netbanking_enabled", "true") === "true",
      },
      firebase: {
        // Public Firebase config — safe to expose. Mobile uses these to register for push.
        apiKey:            get("firebase_api_key", ""),
        appIdAndroid:      get("firebase_app_id_android", ""),
        appIdIos:          get("firebase_app_id_ios", ""),
        messagingSenderId: get("firebase_messaging_sender_id", ""),
        projectId:         get("firebase_project_id", ""),
        storageBucket:     get("firebase_storage_bucket", ""),
        enabled:           get("firebase_enabled", "false") === "true",
      },
      app: {
        // Lets you enforce minimum supported app version from the admin without a rebuild.
        minSupportedVersionAndroid: get("app_min_version_android", "1.0.0"),
        minSupportedVersionIos:     get("app_min_version_ios",     "1.0.0"),
        latestVersionAndroid:       get("app_latest_version_android", "1.0.0"),
        latestVersionIos:           get("app_latest_version_ios",     "1.0.0"),
        playStoreUrl:               get("app_play_store_url", ""),
        appStoreUrl:                get("app_app_store_url",  ""),
        maintenanceMode:            get("app_maintenance_mode", "false") === "true",
        maintenanceMessage:         get("app_maintenance_message", ""),
      },
      legal: {
        privacyUrl:        get("legal_privacy_url", ""),
        termsUrl:          get("legal_terms_url", ""),
        returnsPolicyUrl:  get("legal_returns_policy_url", ""),
        shippingPolicyUrl: get("legal_shipping_policy_url", ""),
      },
    });
  } catch (err) {
    console.error("[v1/app-config]", err);
    return NextResponse.json({ error: "Failed to load app config" }, { status: 500 });
  }
}
