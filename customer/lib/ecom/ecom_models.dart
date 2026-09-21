// Models mirroring the vkcgoldikshu `/api/v1/*` JSON. Every image field is
// passed through [mediaUrl] so the site-relative paths the admin panel saves
// become loadable URLs.
import 'ecom_env.dart';

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

  /// Active products in the category, when the API reports it.
  final int? productCount;
  final List<EcomCategory> children;
  const EcomCategory({
    required this.id,
    required this.name,
    required this.slug,
    required this.sortOrder,
    this.parentId,
    this.description,
    this.imageUrl,
    this.productCount,
    this.children = const [],
  });
  factory EcomCategory.fromJson(Map<String, dynamic> j) => EcomCategory(
        id: j["id"] as String? ?? "",
        name: j["name"] as String? ?? "",
        slug: j["slug"] as String? ?? "",
        parentId: j["parentId"] as String?,
        description: j["description"] as String?,
        imageUrl: mediaUrl(j["imageUrl"]),
        productCount: (j["productCount"] as num?)?.toInt(),
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
        url: mediaUrl(j["url"]) ?? "",
        altText: j["altText"] as String?,
        sortOrder: (j["sortOrder"] as num?)?.toInt() ?? 0,
        isPrimary: j["isPrimary"] == true,
      );
}

class ProductVariant {
  final String id, productId;
  /// The variant's label ("500 g", "1 kg"). The API field is a legacy name.
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
  int get availableQty => (stockQty - reservedQty).clamp(0, 1 << 30);

  /// Variant label for chips; falls back to the product code.
  String get label => colorName.trim().isNotEmpty ? colorName.trim() : (sareeCode ?? '').trim();

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
            .where((i) => i.url.isNotEmpty)
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
  final DateTime? createdAt;

  /// Approved-review summary. Listings carry it; zero when nobody has reviewed.
  final double ratingAverage;
  final int ratingCount;

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
    this.createdAt,
    this.ratingAverage = 0,
    this.ratingCount = 0,
  });

  ProductVariant get primaryVariant => variants.isNotEmpty
      ? variants.first
      : const ProductVariant(
          id: "", productId: "", colorName: "",
          costPrice: 0, salePrice: 0, originalPrice: 0,
          stockQty: 0, reservedQty: 0, sortOrder: 0, isActive: false);

  /// The variant a card stands for: the first one in stock, else the first.
  ProductVariant get displayVariant {
    for (final v in variants) {
      if (v.availableQty > 0) return v;
    }
    return primaryVariant;
  }

  num get price => displayVariant.salePrice;
  num get mrp => displayVariant.originalPrice;
  bool get inStock => variants.any((v) => v.availableQty > 0);
  int get availableQty => variants.fold(0, (s, v) => s + v.availableQty);

  /// Added within the last 30 days.
  bool get isNew => createdAt != null && DateTime.now().difference(createdAt!).inDays <= 30;

  String? get image {
    for (final v in variants) {
      if (v.images.isNotEmpty) return v.images.first.url;
    }
    return null;
  }

  /// Every photo across variants, primary first, de-duplicated.
  List<String> get allImages {
    final seen = <String>{};
    final out = <String>[];
    for (final v in variants) {
      for (final i in v.images) {
        if (seen.add(i.url)) out.add(i.url);
      }
    }
    return out;
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
        createdAt: DateTime.tryParse("${j["createdAt"] ?? ''}"),
        ratingAverage: ((j["ratingAverage"] as num?) ?? 0).toDouble(),
        ratingCount: (j["ratingCount"] as num?)?.toInt() ?? 0,
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
        imageUrl: mediaUrl(j["imageUrl"]),
      );
}

// ── Editorial (blogs, banners, popups, gallery, testimonials, story) ─────────
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
        imageUrl: mediaUrl(j["imageUrl"]),
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
        imageUrl: mediaUrl(j["imageUrl"]),
        mobileImageUrl: mediaUrl(j["mobileImageUrl"]),
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
        imageUrl: mediaUrl(j["imageUrl"]),
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

/// One photo or video from Admin → Gallery (GET /v1/gallery).
class GalleryItem {
  final String id;
  final String type; // IMAGE | VIDEO | FACEBOOK
  final String url;
  final String? caption;
  const GalleryItem({required this.id, required this.type, required this.url, this.caption});

  bool get isVideo => type == 'VIDEO' || type == 'FACEBOOK';

  /// YouTube id when the URL is a YouTube link, for thumbnails and embeds.
  String? get youtubeId {
    final m = RegExp(r'(?:youtube\.com/(?:watch\?v=|shorts/|embed/)|youtu\.be/)([\w-]{6,})').firstMatch(url);
    return m?.group(1);
  }

  String? get vimeoId => RegExp(r'vimeo\.com/(?:video/)?(\d+)').firstMatch(url)?.group(1);

  bool get isFacebookVideo =>
      RegExp(r'facebook\.com/.*/videos/|fb\.watch/|facebook\.com/reel/|facebook\.com/watch/?\?v=').hasMatch(url);

  /// A page that plays the video inside the app's WebView, or null for a
  /// direct file the WebView can play natively.
  String? get embedUrl {
    final yt = youtubeId;
    if (yt != null) return 'https://www.youtube.com/embed/$yt?playsinline=1&rel=0';
    final vm = vimeoId;
    if (vm != null) return 'https://player.vimeo.com/video/$vm';
    if (isFacebookVideo) {
      return 'https://www.facebook.com/plugins/video.php?href=${Uri.encodeComponent(url)}&show_text=false';
    }
    return null;
  }

  /// Poster for a video tile: YouTube's own thumbnail when we have one.
  String? get thumbnail {
    if (!isVideo) return url;
    final yt = youtubeId;
    return yt == null ? null : 'https://img.youtube.com/vi/$yt/hqdefault.jpg';
  }

  factory GalleryItem.fromJson(Map<String, dynamic> j) {
    final type = (j["type"] as String? ?? "IMAGE").toUpperCase();
    final raw = j["url"] as String? ?? "";
    // Video links are pages on other sites; only files and images are ours.
    final url = type == 'IMAGE' || RegExp(r'\.(mp4|webm|ogg|mov)(\?.*)?$', caseSensitive: false).hasMatch(raw)
        ? (mediaUrl(raw) ?? raw)
        : raw;
    return GalleryItem(id: j["id"] as String? ?? "", type: type, url: url, caption: j["caption"] as String?);
  }
}

/// A customer quote from Admin → Testimonials (GET /v1/testimonials).
class Testimonial {
  final String id, name, quote;
  final String? location, tag, avatarUrl;
  final int rating;
  const Testimonial({
    required this.id,
    required this.name,
    required this.quote,
    required this.rating,
    this.location,
    this.tag,
    this.avatarUrl,
  });
  String get initial => name.trim().isEmpty ? 'V' : name.trim()[0].toUpperCase();
  factory Testimonial.fromJson(Map<String, dynamic> j) => Testimonial(
        id: j["id"] as String? ?? "",
        name: j["name"] as String? ?? "",
        quote: j["quote"] as String? ?? "",
        rating: ((j["rating"] as num?)?.toInt() ?? 5).clamp(0, 5),
        location: j["location"] as String?,
        tag: j["tag"] as String?,
        avatarUrl: mediaUrl(j["avatarUrl"]),
      );
}

/// The brand story block (GET /v1/about) — the same copy the website's
/// "Our Heritage" section and About page read from Admin → Settings → About.
class AboutContent {
  final String eyebrow, heading, body, quote, ctaLabel;
  final String? storyImage;
  final String captionTop, captionBottom;
  final int returnsDays;
  const AboutContent({
    required this.eyebrow,
    required this.heading,
    required this.body,
    required this.quote,
    required this.ctaLabel,
    required this.captionTop,
    required this.captionBottom,
    required this.returnsDays,
    this.storyImage,
  });
  factory AboutContent.fromJson(Map<String, dynamic> j) {
    final a = (j["about"] as Map?)?.cast<String, dynamic>() ?? j;
    String s(String k, [String d = '']) {
      final v = a[k];
      return v is String && v.trim().isNotEmpty ? v.trim() : d;
    }

    return AboutContent(
      eyebrow: s('homeEyebrow', 'Our Heritage'),
      heading: s('homeHeading', 'Rooted in Mandya Since 1988').replaceAll('\n', ' '),
      body: s('homeBody'),
      quote: s('homeQuote'),
      ctaLabel: s('homeCtaLabel', 'Read Our Story'),
      captionTop: s('storyCaptionTop', '100% Natural'),
      captionBottom: s('storyCaptionBottom', 'No chemicals, ever'),
      storyImage: mediaUrl(a['storyImage']),
      returnsDays: (j["returnsDays"] as num?)?.toInt() ?? 0,
    );
  }
}

/// A published product review (GET /v1/products/:slug/reviews).
class ProductReview {
  final String id, author;
  final int rating;
  final String? title, body;
  final List<String> images;
  final DateTime? createdAt;
  const ProductReview({
    required this.id,
    required this.author,
    required this.rating,
    this.title,
    this.body,
    this.images = const [],
    this.createdAt,
  });
  factory ProductReview.fromJson(Map<String, dynamic> j) => ProductReview(
        id: j["id"] as String? ?? "",
        author: j["author"] as String? ?? "Customer",
        rating: ((j["rating"] as num?)?.toInt() ?? 0).clamp(0, 5),
        title: j["title"] as String?,
        body: j["body"] as String?,
        images: (j["images"] as List? ?? const []).map((u) => mediaUrl(u)).whereType<String>().toList(),
        createdAt: DateTime.tryParse("${j["createdAt"] ?? ''}"),
      );
}

class ReviewPage {
  final List<ProductReview> reviews;
  final double average;
  final int total;
  const ReviewPage({required this.reviews, required this.average, required this.total});
  factory ReviewPage.fromJson(Map<String, dynamic> j) {
    final summary = (j["summary"] as Map?)?.cast<String, dynamic>() ?? const {};
    return ReviewPage(
      reviews: (j["reviews"] as List? ?? const [])
          .map((r) => ProductReview.fromJson((r as Map).cast<String, dynamic>()))
          .toList(),
      average: ((summary["averageRating"] as num?) ?? 0).toDouble(),
      total: (summary["totalReviews"] as num?)?.toInt() ?? 0,
    );
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

  /// The product slug, so a cart line can open its product page.
  final String? productSlug;

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
    this.productSlug,
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
        productSlug: productSlug,
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
        "productSlug": productSlug,
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
        imageUrl: mediaUrl(j["imageUrl"]),
        stockQty: (j["stockQty"] as num?)?.toInt() ?? 0,
        productSlug: j["productSlug"] as String?,
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
        stockQty: v.availableQty,
        productSlug: p.slug,
      );

  /// "500 g · VKC-101" — whatever the variant carries.
  String get meta => [variantColor, sareeCode].where((s) => (s ?? '').trim().isNotEmpty).join(' · ');
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
        imageUrl: mediaUrl(j["imageUrl"]),
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

  /// True when the customer has given a name (not just a phone number).
  bool get hasName => [firstName, lastName].any((p) => (p ?? '').trim().isNotEmpty);

  String get initials {
    final parts = [firstName, lastName].whereType<String>().where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return "V";
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
