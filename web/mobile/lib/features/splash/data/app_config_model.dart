/// Strongly-typed view of the JSON returned by `GET /api/v1/app-config`.
/// Kept as a hand-written class rather than freezed/json_serializable for the
/// bootstrap layer so the splash screen can run *before* `build_runner`
/// outputs are needed during initial setup.
class AppConfig {
  final SiteConfig site;
  final ThemeConfig theme;
  final ShippingConfig shipping;
  final PaymentConfig payment;
  final FirebaseConfig firebase;
  final AppMetaConfig app;
  final LegalConfig legal;

  const AppConfig({
    required this.site,
    required this.theme,
    required this.shipping,
    required this.payment,
    required this.firebase,
    required this.app,
    required this.legal,
  });

  factory AppConfig.fromJson(Map<String, dynamic> json) => AppConfig(
        site:     SiteConfig.fromJson((json["site"]     as Map?)?.cast<String, dynamic>() ?? {}),
        theme:    ThemeConfig.fromJson((json["theme"]    as Map?)?.cast<String, dynamic>() ?? {}),
        shipping: ShippingConfig.fromJson((json["shipping"] as Map?)?.cast<String, dynamic>() ?? {}),
        payment:  PaymentConfig.fromJson((json["payment"]  as Map?)?.cast<String, dynamic>() ?? {}),
        firebase: FirebaseConfig.fromJson((json["firebase"] as Map?)?.cast<String, dynamic>() ?? {}),
        app:      AppMetaConfig.fromJson((json["app"]      as Map?)?.cast<String, dynamic>() ?? {}),
        legal:    LegalConfig.fromJson((json["legal"]    as Map?)?.cast<String, dynamic>() ?? {}),
      );
}

class SiteConfig {
  final String name, tagline, logoUrl, phone, email, address;
  final AnnouncementConfig announcement;
  final SocialConfig social;
  const SiteConfig({
    required this.name, required this.tagline, required this.logoUrl,
    required this.phone, required this.email, required this.address,
    required this.announcement, required this.social,
  });
  factory SiteConfig.fromJson(Map<String, dynamic> j) => SiteConfig(
        name: j["name"] as String? ?? "Vijaylakshmi Sarees",
        tagline: j["tagline"] as String? ?? "",
        logoUrl: j["logoUrl"] as String? ?? "",
        phone:   j["phone"]   as String? ?? "",
        email:   j["email"]   as String? ?? "",
        address: j["address"] as String? ?? "",
        announcement: AnnouncementConfig.fromJson((j["announcement"] as Map?)?.cast<String, dynamic>() ?? {}),
        social:       SocialConfig.fromJson((j["social"] as Map?)?.cast<String, dynamic>() ?? {}),
      );
}

class AnnouncementConfig {
  final String text;
  final bool active;
  const AnnouncementConfig({required this.text, required this.active});
  factory AnnouncementConfig.fromJson(Map<String, dynamic> j) => AnnouncementConfig(
        text: j["text"] as String? ?? "",
        active: j["active"] == true,
      );
}

class SocialConfig {
  final String instagram, facebook, youtube, whatsapp;
  const SocialConfig({required this.instagram, required this.facebook, required this.youtube, required this.whatsapp});
  factory SocialConfig.fromJson(Map<String, dynamic> j) => SocialConfig(
        instagram: j["instagram"] as String? ?? "",
        facebook:  j["facebook"]  as String? ?? "",
        youtube:   j["youtube"]   as String? ?? "",
        whatsapp:  j["whatsapp"]  as String? ?? "",
      );
}

class ThemeConfig {
  final Map<String, dynamic> colors;
  final String headingFont;
  final String bodyFont;
  const ThemeConfig({required this.colors, required this.headingFont, required this.bodyFont});
  factory ThemeConfig.fromJson(Map<String, dynamic> j) => ThemeConfig(
        colors: (j["colors"] as Map?)?.cast<String, dynamic>() ?? const {},
        headingFont: ((j["fonts"] as Map?)?["heading"] as String?) ?? "Cormorant Garamond",
        bodyFont:    ((j["fonts"] as Map?)?["body"]    as String?) ?? "Inter",
      );
}

class ShippingConfig {
  final num freeShippingThreshold, firstSareeRate, additionalSareeRate;
  final String deliveryTitle, deliveryNotes, internationalNote;
  const ShippingConfig({
    required this.freeShippingThreshold, required this.firstSareeRate, required this.additionalSareeRate,
    required this.deliveryTitle, required this.deliveryNotes, required this.internationalNote,
  });
  factory ShippingConfig.fromJson(Map<String, dynamic> j) => ShippingConfig(
        freeShippingThreshold: (j["freeShippingThreshold"] as num?) ?? 2999,
        firstSareeRate:        (j["firstSareeRate"]        as num?) ?? 100,
        additionalSareeRate:   (j["additionalSareeRate"]   as num?) ?? 50,
        deliveryTitle:         j["deliveryTitle"]     as String? ?? "Standard Delivery",
        deliveryNotes:         j["deliveryNotes"]     as String? ?? "4–7 business days",
        internationalNote:     j["internationalNote"] as String? ?? "",
      );
}

class PaymentConfig {
  final RazorpayConfig razorpay;
  final bool codEnabled, upiEnabled, cardEnabled, netBankingEnabled;
  const PaymentConfig({required this.razorpay, required this.codEnabled, required this.upiEnabled, required this.cardEnabled, required this.netBankingEnabled});
  factory PaymentConfig.fromJson(Map<String, dynamic> j) => PaymentConfig(
        razorpay: RazorpayConfig.fromJson((j["razorpay"] as Map?)?.cast<String, dynamic>() ?? {}),
        codEnabled:        j["codEnabled"]        != false,
        upiEnabled:        j["upiEnabled"]        != false,
        cardEnabled:       j["cardEnabled"]       != false,
        netBankingEnabled: j["netBankingEnabled"] != false,
      );
}

class RazorpayConfig {
  final String keyId;
  final bool enabled;
  const RazorpayConfig({required this.keyId, required this.enabled});
  factory RazorpayConfig.fromJson(Map<String, dynamic> j) => RazorpayConfig(
        keyId: j["keyId"] as String? ?? "",
        enabled: j["enabled"] == true,
      );
}

class FirebaseConfig {
  final String apiKey, appIdAndroid, appIdIos, messagingSenderId, projectId, storageBucket;
  final bool enabled;
  const FirebaseConfig({
    required this.apiKey, required this.appIdAndroid, required this.appIdIos,
    required this.messagingSenderId, required this.projectId, required this.storageBucket, required this.enabled,
  });
  factory FirebaseConfig.fromJson(Map<String, dynamic> j) => FirebaseConfig(
        apiKey: j["apiKey"] as String? ?? "",
        appIdAndroid: j["appIdAndroid"] as String? ?? "",
        appIdIos:     j["appIdIos"]     as String? ?? "",
        messagingSenderId: j["messagingSenderId"] as String? ?? "",
        projectId:    j["projectId"]    as String? ?? "",
        storageBucket: j["storageBucket"] as String? ?? "",
        enabled: j["enabled"] == true,
      );
}

class AppMetaConfig {
  final String minSupportedVersionAndroid, minSupportedVersionIos;
  final String latestVersionAndroid,       latestVersionIos;
  final String playStoreUrl,               appStoreUrl;
  final bool   maintenanceMode;
  final String maintenanceMessage;
  const AppMetaConfig({
    required this.minSupportedVersionAndroid, required this.minSupportedVersionIos,
    required this.latestVersionAndroid,       required this.latestVersionIos,
    required this.playStoreUrl,               required this.appStoreUrl,
    required this.maintenanceMode,            required this.maintenanceMessage,
  });
  factory AppMetaConfig.fromJson(Map<String, dynamic> j) => AppMetaConfig(
        minSupportedVersionAndroid: j["minSupportedVersionAndroid"] as String? ?? "1.0.0",
        minSupportedVersionIos:     j["minSupportedVersionIos"]     as String? ?? "1.0.0",
        latestVersionAndroid:       j["latestVersionAndroid"]       as String? ?? "1.0.0",
        latestVersionIos:           j["latestVersionIos"]           as String? ?? "1.0.0",
        playStoreUrl: j["playStoreUrl"] as String? ?? "",
        appStoreUrl:  j["appStoreUrl"]  as String? ?? "",
        maintenanceMode: j["maintenanceMode"] == true,
        maintenanceMessage: j["maintenanceMessage"] as String? ?? "",
      );
}

class LegalConfig {
  final String privacyUrl, termsUrl, returnsPolicyUrl, shippingPolicyUrl;
  const LegalConfig({required this.privacyUrl, required this.termsUrl, required this.returnsPolicyUrl, required this.shippingPolicyUrl});
  factory LegalConfig.fromJson(Map<String, dynamic> j) => LegalConfig(
        privacyUrl: j["privacyUrl"] as String? ?? "",
        termsUrl:   j["termsUrl"]   as String? ?? "",
        returnsPolicyUrl:  j["returnsPolicyUrl"]  as String? ?? "",
        shippingPolicyUrl: j["shippingPolicyUrl"] as String? ?? "",
      );
}
