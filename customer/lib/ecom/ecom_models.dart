// Models mirroring the vijaylakshmi_ecom `/api/v1/*` JSON, adapted from that
// project's own Flutter app so the shapes match exactly. Ecommerce screens use
// these; the Live screens keep using the salesproject (VL Group) models.

// ── Catalog ──────────────────────────────────────────────────────────────────
class CategoryRef {
  final String id, name, slug;
  const CategoryRef({required this.id, required this.name, required this.slug});
  factory CategoryRef.fromJson(Map<String, dynamic> j) =>
      CategoryRef(id: j["id"] as String? ?? "", name: j["name"] as String? ?? "", slug: j["slug"] as String? ?? "");
}

class EcomCategory {
  final String id, name, slug;
  final String? parentId, description, imageUrl;
  final int sortOrder;
  final List<EcomCategory> children;
  const EcomCategory({
    required this.id,
    required this.name,
    required this.slug,
    required this.sortOrder,
    this.parentId,
    this.description,
    this.imageUrl,
    this.children = const [],
  });
  factory EcomCategory.fromJson(Map<String, dynamic> j) => EcomCategory(
        id: j["id"] as String? ?? "",
        name: j["name"] as String? ?? "",
        slug: j["slug"] as String? ?? "",
        parentId: j["parentId"] as String?,
        description: j["description"] as String?,
        imageUrl: j["imageUrl"] as String?,
        sortOrder: (j["sortOrder"] as num?)?.toInt() ?? 0,
        children: (j["children"] as List? ?? const [])
            .map((c) => EcomCategory.fromJson((c as Map).cast<String, dynamic>()))
            .toList(),
      );
}

class ProductImage {
  final String id, url;
  final String? altText;
  final int sortOrder;
  final bool isPrimary;
  const ProductImage({required this.id, required this.url, required this.sortOrder, required this.isPrimary, this.altText});
  factory ProductImage.fromJson(Map<String, dynamic> j) => ProductImage(
        id: j["id"] as String? ?? "",
        url: j["url"] as String? ?? "",
        altText: j["altText"] as String?,
        sortOrder: (j["sortOrder"] as num?)?.toInt() ?? 0,
        isPrimary: j["isPrimary"] == true,
      );
}

class ProductVariant {
  final String id, productId;
  final String colorName;
  final String? colorHex, colorHex2, sareeCode, barcode;
  final num costPrice, salePrice, originalPrice;
  final int stockQty, reservedQty, sortOrder;
  final bool isActive;
  final List<ProductImage> images;

  const ProductVariant({
    required this.id,
    required this.productId,
    required this.colorName,
    required this.costPrice,
    required this.salePrice,
    required this.originalPrice,
    required this.stockQty,
    required this.reservedQty,
    required this.sortOrder,
    required this.isActive,
    this.colorHex,
    this.colorHex2,
    this.sareeCode,
    this.barcode,
    this.images = const [],
  });

  bool get hasDiscount => originalPrice > salePrice;
  int get discountPercent => hasDiscount ? (((originalPrice - salePrice) / originalPrice) * 100).round() : 0;
  int get availableQty => stockQty - reservedQty;

  factory ProductVariant.fromJson(Map<String, dynamic> j) => ProductVariant(
        id: j["id"] as String? ?? "",
        productId: j["productId"] as String? ?? "",
        colorName: j["colorName"] as String? ?? "",
        colorHex: j["colorHex"] as String?,
        colorHex2: j["colorHex2"] as String?,
        sareeCode: j["sareeCode"] as String?,
        barcode: j["barcode"] as String?,
        costPrice: (j["costPrice"] as num?) ?? 0,
        salePrice: (j["salePrice"] as num?) ?? 0,
        originalPrice: (j["originalPrice"] as num?) ?? 0,
        stockQty: (j["stockQty"] as num?)?.toInt() ?? 0,
        reservedQty: (j["reservedQty"] as num?)?.toInt() ?? 0,
        sortOrder: (j["sortOrder"] as num?)?.toInt() ?? 0,
        isActive: j["isActive"] != false,
        images: (j["images"] as List? ?? const [])
            .map((i) => ProductImage.fromJson((i as Map).cast<String, dynamic>()))
            .toList(),
      );
}

class ProductAttribute {
  final String attributeId, attributeName;
  final List<String> values;
  const ProductAttribute({required this.attributeId, required this.attributeName, required this.values});
  factory ProductAttribute.fromJson(Map<String, dynamic> j) {
    final attr = (j["attribute"] as Map?)?.cast<String, dynamic>() ?? const {};
    return ProductAttribute(
      attributeId: (j["attributeId"] as String?) ?? attr["id"] as String? ?? "",
      attributeName: (attr["name"] as String?) ?? "",
      values: (j["values"] as List? ?? const []).map((v) => "$v").toList(),
    );
  }
}

class EcomProduct {
  final String id, name, slug;
  final String? description, shortDesc;
  final String? categoryId;
  final CategoryRef? category;
  final String? fabric, weaveType, regionOfOrigin, careInstructions;
  final List<String> occasions, tags;
  final bool isActive, isFeatured;
  final String? videoUrl;
  final List<ProductVariant> variants;
  final List<ProductAttribute> attributes;

  const EcomProduct({
    required this.id,
    required this.name,
    required this.slug,
    required this.isActive,
    required this.isFeatured,
    required this.variants,
    required this.attributes,
    this.description,
    this.shortDesc,
    this.categoryId,
    this.category,
    this.fabric,
    this.weaveType,
    this.regionOfOrigin,
    this.careInstructions,
    this.occasions = const [],
    this.tags = const [],
    this.videoUrl,
  });

  ProductVariant get primaryVariant => variants.isNotEmpty
      ? variants.first
      : const ProductVariant(
          id: "", productId: "", colorName: "",
          costPrice: 0, salePrice: 0, originalPrice: 0,
          stockQty: 0, reservedQty: 0, sortOrder: 0, isActive: false);

  num get price => primaryVariant.salePrice;
  num get mrp => primaryVariant.originalPrice;
  bool get inStock => variants.any((v) => v.availableQty > 0);
  String? get image {
    for (final v in variants) {
      if (v.images.isNotEmpty) return v.images.first.url;
    }
    return null;
  }

  factory EcomProduct.fromJson(Map<String, dynamic> j) => EcomProduct(
        id: j["id"] as String? ?? "",
        name: j["name"] as String? ?? "",
        slug: j["slug"] as String? ?? "",
        description: j["description"] as String?,
        shortDesc: j["shortDesc"] as String?,
        categoryId: j["categoryId"] as String?,
        category: j["category"] is Map ? CategoryRef.fromJson((j["category"] as Map).cast<String, dynamic>()) : null,
        fabric: j["fabric"] as String?,
        weaveType: j["weaveType"] as String?,
        regionOfOrigin: j["regionOfOrigin"] as String?,
        careInstructions: j["careInstructions"] as String?,
        occasions: (j["occasions"] as List? ?? const []).map((v) => "$v").toList(),
        tags: (j["tags"] as List? ?? const []).map((v) => "$v").toList(),
        isActive: j["isActive"] != false,
        isFeatured: j["isFeatured"] == true,
        videoUrl: j["videoUrl"] as String?,
        variants: (j["variants"] as List? ?? const [])
            .map((v) => ProductVariant.fromJson((v as Map).cast<String, dynamic>()))
            .toList(),
        attributes: (j["productAttributes"] as List? ?? const [])
            .map((a) => ProductAttribute.fromJson((a as Map).cast<String, dynamic>()))
            .toList(),
      );
}

class Pagination {
  final int page, limit, total, totalPages;
  final bool hasMore;
  const Pagination({required this.page, required this.limit, required this.total, required this.totalPages, required this.hasMore});
  factory Pagination.fromJson(Map<String, dynamic> j) => Pagination(
        page: (j["page"] as num?)?.toInt() ?? 1,
        limit: (j["limit"] as num?)?.toInt() ?? 20,
        total: (j["total"] as num?)?.toInt() ?? 0,
        totalPages: (j["totalPages"] as num?)?.toInt() ?? 0,
        hasMore: j["hasMore"] == true,
      );
}

class ProductPage {
  final List<EcomProduct> products;
  final Pagination pagination;
  const ProductPage({required this.products, required this.pagination});
  factory ProductPage.fromJson(Map<String, dynamic> j) => ProductPage(
        products: (j["products"] as List? ?? const [])
            .map((p) => EcomProduct.fromJson((p as Map).cast<String, dynamic>()))
            .toList(),
        pagination: Pagination.fromJson(((j["pagination"] as Map?) ?? const {}).cast<String, dynamic>()),
      );
}

class HeroSlide {
  final String id;
  final String? tag, heading, subtext;
  final String? ctaLabel, ctaHref, ctaSecLabel, ctaSecHref;
  final String? bgColor, imageBg, imageUrl;
  final int sortOrder;
  const HeroSlide({
    required this.id,
    required this.sortOrder,
    this.tag,
    this.heading,
    this.subtext,
    this.ctaLabel,
    this.ctaHref,
    this.ctaSecLabel,
    this.ctaSecHref,
    this.bgColor,
    this.imageBg,
    this.imageUrl,
  });
  factory HeroSlide.fromJson(Map<String, dynamic> j) => HeroSlide(
        id: j["id"] as String? ?? "",
        sortOrder: (j["sortOrder"] as num?)?.toInt() ?? 0,
        tag: j["tag"] as String?,
        heading: j["heading"] as String?,
        subtext: j["subtext"] as String?,
        ctaLabel: j["ctaLabel"] as String?,
        ctaHref: j["ctaHref"] as String?,
        ctaSecLabel: j["ctaSecLabel"] as String?,
        ctaSecHref: j["ctaSecHref"] as String?,
        bgColor: j["bgColor"] as String?,
        imageBg: j["imageBg"] as String?,
        imageUrl: j["imageUrl"] as String?,
      );
}

// ── Editorial (blogs, banners, popups) ───────────────────────────────────────
class BlogPost {
  final String id, title, slug;
  final String? excerpt, imageUrl, content;
  final List<String> tags;
  final DateTime? publishedAt;
  const BlogPost({
    required this.id,
    required this.title,
    required this.slug,
    this.excerpt,
    this.imageUrl,
    this.content,
    this.tags = const [],
    this.publishedAt,
  });
  factory BlogPost.fromJson(Map<String, dynamic> j) => BlogPost(
        id: j["id"] as String? ?? "",
        title: j["title"] as String? ?? "",
        slug: j["slug"] as String? ?? "",
        excerpt: j["excerpt"] as String?,
        imageUrl: j["imageUrl"] as String?,
        content: j["content"] as String?,
        tags: (j["tags"] as List? ?? const []).map((t) => "$t").toList(),
        publishedAt: DateTime.tryParse("${j["publishedAt"] ?? j["createdAt"]}"),
      );
}

class Banner {
  final String id, position;
  final String? title, subtitle, imageUrl, mobileImageUrl, linkUrl;
  final int sortOrder;
  const Banner({
    required this.id,
    required this.position,
    required this.sortOrder,
    this.title,
    this.subtitle,
    this.imageUrl,
    this.mobileImageUrl,
    this.linkUrl,
  });
  /// The phone-sized art when the store uploaded one, else the wide image.
  String? get image => (mobileImageUrl?.isNotEmpty == true) ? mobileImageUrl : imageUrl;
  factory Banner.fromJson(Map<String, dynamic> j) => Banner(
        id: j["id"] as String? ?? "",
        position: j["position"] as String? ?? "",
        title: j["title"] as String?,
        subtitle: j["subtitle"] as String?,
        imageUrl: j["imageUrl"] as String?,
        mobileImageUrl: j["mobileImageUrl"] as String?,
        linkUrl: j["linkUrl"] as String?,
        sortOrder: (j["sortOrder"] as num?)?.toInt() ?? 0,
      );
}

class Popup {
  final String id;
  final String? imageUrl, linkUrl;
  final DateTime? startsAt, endsAt;
  const Popup({required this.id, this.imageUrl, this.linkUrl, this.startsAt, this.endsAt});
  factory Popup.fromJson(Map<String, dynamic> j) => Popup(
        id: j["id"] as String? ?? "",
        imageUrl: j["imageUrl"] as String?,
        linkUrl: j["linkUrl"] as String?,
        startsAt: DateTime.tryParse("${j["startsAt"]}"),
        endsAt: DateTime.tryParse("${j["endsAt"]}"),
      );

  /// Live right now — the API already filters by isActive, but the window is
  /// ours to respect.
  bool get isLive {
    final now = DateTime.now();
    if (startsAt != null && now.isBefore(startsAt!)) return false;
    if (endsAt != null && now.isAfter(endsAt!)) return false;
    return (imageUrl ?? '').isNotEmpty;
  }
}

// ── Cart line (matches POST /checkout item shape) ────────────────────────────
class CartItem {
  final String productId;
  final String variantId;
  final String productName;
  final String variantColor;
  final String? sareeCode;
  final int quantity;
  final num salePrice;
  final num originalPrice;
  final String? imageUrl;
  final int stockQty;

  const CartItem({
    required this.productId,
    required this.variantId,
    required this.productName,
    required this.variantColor,
    required this.quantity,
    required this.salePrice,
    required this.originalPrice,
    required this.stockQty,
    this.sareeCode,
    this.imageUrl,
  });

  CartItem copyWith({int? quantity}) => CartItem(
        productId: productId,
        variantId: variantId,
        productName: productName,
        variantColor: variantColor,
        sareeCode: sareeCode,
        quantity: quantity ?? this.quantity,
        salePrice: salePrice,
        originalPrice: originalPrice,
        imageUrl: imageUrl,
        stockQty: stockQty,
      );

  Map<String, dynamic> toJson() => {
        "productId": productId,
        "variantId": variantId,
        "productName": productName,
        "variantColor": variantColor,
        "sareeCode": sareeCode,
        "quantity": quantity,
        "salePrice": salePrice,
        "originalPrice": originalPrice,
        "imageUrl": imageUrl,
        "stockQty": stockQty,
      };

  factory CartItem.fromJson(Map<String, dynamic> j) => CartItem(
        productId: j["productId"] as String? ?? "",
        variantId: j["variantId"] as String? ?? "",
        productName: j["productName"] as String? ?? "",
        variantColor: j["variantColor"] as String? ?? "",
        sareeCode: j["sareeCode"] as String?,
        quantity: (j["quantity"] as num?)?.toInt() ?? 1,
        salePrice: (j["salePrice"] as num?) ?? 0,
        originalPrice: (j["originalPrice"] as num?) ?? 0,
        imageUrl: j["imageUrl"] as String?,
        stockQty: (j["stockQty"] as num?)?.toInt() ?? 0,
      );

  /// Build a cart line from a product + chosen variant.
  factory CartItem.of(EcomProduct p, ProductVariant v, {int quantity = 1}) => CartItem(
        productId: p.id,
        variantId: v.id,
        productName: p.name,
        variantColor: v.colorName,
        sareeCode: v.sareeCode,
        quantity: quantity,
        salePrice: v.salePrice,
        originalPrice: v.originalPrice,
        imageUrl: v.images.isNotEmpty ? v.images.first.url : p.image,
        stockQty: v.stockQty,
      );
}

// ── Wishlist ─────────────────────────────────────────────────────────────────
/// One saved variant plus the product it belongs to.
class WishlistEntry {
  final String variantId;
  final EcomProduct product;
  const WishlistEntry({required this.variantId, required this.product});
}

// ── Coupon ───────────────────────────────────────────────────────────────────
class CouponResult {
  final bool valid;
  final String code;
  final String type; // PERCENTAGE | FIXED | FREE_SHIPPING
  final num discount;
  final bool freeShipping;
  final String? description;
  const CouponResult({
    required this.valid,
    required this.code,
    required this.type,
    required this.discount,
    required this.freeShipping,
    this.description,
  });
  factory CouponResult.fromJson(Map<String, dynamic> j) => CouponResult(
        valid: j["valid"] == true,
        code: j["code"] as String? ?? "",
        type: j["type"] as String? ?? "",
        discount: (j["discount"] as num?) ?? 0,
        freeShipping: j["freeShipping"] == true,
        description: j["description"] as String?,
      );
}

// ── Orders ───────────────────────────────────────────────────────────────────
class OrderItem {
  final String id, productName, variantColor;
  final String? sareeCode, imageUrl, productSlug;
  final int quantity;
  final num unitPrice, totalPrice;
  const OrderItem({
    required this.id,
    required this.productName,
    required this.variantColor,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.sareeCode,
    this.imageUrl,
    this.productSlug,
  });
  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        id: j["id"] as String? ?? "",
        productName: j["productName"] as String? ?? "",
        variantColor: j["variantColor"] as String? ?? "",
        sareeCode: j["sareeCode"] as String?,
        imageUrl: j["imageUrl"] as String?,
        productSlug: j["productSlug"] as String?,
        quantity: (j["quantity"] as num?)?.toInt() ?? 1,
        unitPrice: num.tryParse("${j["unitPrice"]}") ?? 0,
        totalPrice: num.tryParse("${j["totalPrice"]}") ?? 0,
      );
}

class EcomOrder {
  final String id, orderNumber, status, paymentStatus;
  final String? paymentMethod, trackingNumber, trackingUrl, courierPartner;
  final num subtotal, shippingAmount, totalAmount, discountAmount, walletAmountUsed;
  final Map<String, dynamic>? shippingAddress;
  final List<OrderItem> items;
  final DateTime createdAt;
  final DateTime? shippedAt, deliveredAt, cancelledAt;

  const EcomOrder({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.subtotal,
    required this.shippingAmount,
    required this.totalAmount,
    required this.discountAmount,
    required this.walletAmountUsed,
    required this.items,
    required this.createdAt,
    this.paymentMethod,
    this.trackingNumber,
    this.trackingUrl,
    this.courierPartner,
    this.shippingAddress,
    this.shippedAt,
    this.deliveredAt,
    this.cancelledAt,
  });

  factory EcomOrder.fromJson(Map<String, dynamic> j) => EcomOrder(
        id: j["id"] as String? ?? "",
        orderNumber: j["orderNumber"] as String? ?? "",
        status: j["status"] as String? ?? "PENDING",
        paymentStatus: j["paymentStatus"] as String? ?? "PENDING",
        paymentMethod: j["paymentMethod"] as String?,
        trackingNumber: j["trackingNumber"] as String?,
        trackingUrl: j["trackingUrl"] as String?,
        courierPartner: j["courierPartner"] as String?,
        subtotal: num.tryParse("${j["subtotal"]}") ?? 0,
        shippingAmount: num.tryParse("${j["shippingAmount"]}") ?? 0,
        discountAmount: num.tryParse("${j["discountAmount"]}") ?? 0,
        totalAmount: num.tryParse("${j["totalAmount"]}") ?? 0,
        walletAmountUsed: num.tryParse("${j["walletAmountUsed"]}") ?? 0,
        shippingAddress: j["shippingAddress"] is Map ? (j["shippingAddress"] as Map).cast<String, dynamic>() : null,
        items: (j["items"] as List? ?? const [])
            .map((e) => OrderItem.fromJson((e as Map).cast<String, dynamic>()))
            .toList(),
        createdAt: DateTime.tryParse("${j["createdAt"]}") ?? DateTime.now(),
        shippedAt: j["shippedAt"] != null ? DateTime.tryParse("${j["shippedAt"]}") : null,
        deliveredAt: j["deliveredAt"] != null ? DateTime.tryParse("${j["deliveredAt"]}") : null,
        cancelledAt: j["cancelledAt"] != null ? DateTime.tryParse("${j["cancelledAt"]}") : null,
      );

  bool get canCancel => const ["PENDING", "CONFIRMED", "PROCESSING"].contains(status);
  bool get canReturn => status == "DELIVERED";
  bool get isDelivered => status == "DELIVERED";
}

// ── Address ──────────────────────────────────────────────────────────────────
class Address {
  final String id;
  final String? label;
  final String fullName, phone, addressLine1;
  final String? addressLine2;
  final String city, state, pincode, country;
  final bool isDefault;

  const Address({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.addressLine1,
    required this.city,
    required this.state,
    required this.pincode,
    required this.country,
    required this.isDefault,
    this.label,
    this.addressLine2,
  });

  factory Address.fromJson(Map<String, dynamic> j) => Address(
        id: j["id"] as String? ?? "",
        label: j["label"] as String?,
        fullName: j["fullName"] as String? ?? "",
        phone: j["phone"] as String? ?? "",
        addressLine1: j["addressLine1"] as String? ?? "",
        addressLine2: j["addressLine2"] as String?,
        city: j["city"] as String? ?? "",
        state: j["state"] as String? ?? "",
        pincode: j["pincode"] as String? ?? "",
        country: j["country"] as String? ?? "India",
        isDefault: j["isDefault"] == true,
      );

  Map<String, dynamic> toJson() => {
        "fullName": fullName,
        "phone": phone,
        "addressLine1": addressLine1,
        "addressLine2": addressLine2,
        "city": city,
        "state": state,
        "pincode": pincode,
        "country": country,
        if (label != null) "label": label,
        "isDefault": isDefault,
      };

  Address copyWith({bool? isDefault}) => Address(
        id: id,
        label: label,
        fullName: fullName,
        phone: phone,
        addressLine1: addressLine1,
        addressLine2: addressLine2,
        city: city,
        state: state,
        pincode: pincode,
        country: country,
        isDefault: isDefault ?? this.isDefault,
      );

  String get oneLine =>
      "$addressLine1${addressLine2 != null && addressLine2!.isNotEmpty ? ', $addressLine2' : ''}, $city, $state — $pincode";
}

// ── Payment methods ──────────────────────────────────────────────────────────
/// The store's enabled payment methods, exactly as GET /api/payment-config
/// reports them — the same response the website checkout renders from.
///
/// Nothing here is defaulted on: whatever the admin panel says is what the app
/// offers. The endpoint already applies the store's own fallbacks (Razorpay and
/// COD default on when the setting row has never been written).
class PaymentMethods {
  final bool razorpay, cashfree, icici, iciciPg, cod;
  const PaymentMethods({
    this.razorpay = false,
    this.cashfree = false,
    this.icici = false,
    this.iciciPg = false,
    this.cod = false,
  });

  factory PaymentMethods.fromJson(Map<String, dynamic> j) => PaymentMethods(
        razorpay: j['razorpay'] == true,
        cashfree: j['cashfree'] == true,
        icici: j['icici'] == true,
        iciciPg: j['iciciPg'] == true,
        cod: j['cod'] == true,
      );

  /// The methods this app can carry through to a paid order. ICICI PG has no
  /// handler under /api/v1, and Cashfree needs its Flutter SDK, so neither can
  /// be completed here — offering them would only strand the customer with an
  /// unpaid order.
  bool get hasAny => cod || razorpay || icici;
}

// ── User / auth ──────────────────────────────────────────────────────────────
class EcomUser {
  final String id;
  final String? firstName, lastName, email, phone;
  final String role;
  const EcomUser({required this.id, required this.role, this.firstName, this.lastName, this.email, this.phone});

  String get displayName {
    final parts = [firstName, lastName].whereType<String>().where((p) => p.isNotEmpty).toList();
    if (parts.isNotEmpty) return parts.join(" ");
    return phone?.isNotEmpty == true ? phone! : (email?.isNotEmpty == true ? email! : "Guest");
  }

  String get initials {
    final parts = [firstName, lastName].whereType<String>().where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return "U";
    return parts.map((p) => p[0].toUpperCase()).take(2).join();
  }

  factory EcomUser.fromJson(Map<String, dynamic> j) => EcomUser(
        id: j["id"] as String? ?? "",
        firstName: j["firstName"] as String?,
        lastName: j["lastName"] as String?,
        email: j["email"] as String?,
        phone: j["phone"] as String?,
        role: (j["role"] as String?) ?? "CUSTOMER",
      );

  /// Cached beside the tokens so a returning customer is signed in before
  /// /auth/me answers — see [EcomAuth.load].
  Map<String, dynamic> toJson() => {
        "id": id,
        "firstName": firstName,
        "lastName": lastName,
        "email": email,
        "phone": phone,
        "role": role,
      };
}

class AuthSession {
  final EcomUser user;
  final String accessToken, refreshToken;
  final bool isNew;
  const AuthSession({required this.user, required this.accessToken, required this.refreshToken, required this.isNew});
  /// Tolerant of the token key the server uses. A hard cast used to throw a
  /// bare TypeError *after* the OTP had already been accepted, which surfaced
  /// as "Something went wrong" on a correct code and left no session behind.
  factory AuthSession.fromJson(Map<String, dynamic> j) {
    String? pick(List<String> keys) {
      for (final k in keys) {
        final v = j[k];
        if (v is String && v.isNotEmpty) return v;
      }
      return null;
    }

    final access = pick(['accessToken', 'access_token', 'token']);
    if (access == null) {
      throw StateError('Sign-in succeeded but no access token came back (keys: ${j.keys.join(', ')})');
    }
    final userJson = j["user"];
    return AuthSession(
      user: EcomUser.fromJson(userJson is Map ? userJson.cast<String, dynamic>() : const {}),
      accessToken: access,
      refreshToken: pick(['refreshToken', 'refresh_token']) ?? '',
      isNew: j["isNew"] == true,
    );
  }
}
