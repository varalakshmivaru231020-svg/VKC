/// Mirrors the JSON shape returned by the v1 catalog endpoints.
/// Hand-written for now to avoid pulling in build_runner during the scaffold.

class CategoryRef {
  final String id, name, slug;
  const CategoryRef({required this.id, required this.name, required this.slug});
  factory CategoryRef.fromJson(Map<String, dynamic> j) =>
      CategoryRef(id: j["id"] as String, name: j["name"] as String, slug: j["slug"] as String);
}

class Category {
  final String id, name, slug;
  final String? parentId, description, imageUrl;
  final int sortOrder;
  final List<Category> children;
  const Category({
    required this.id, required this.name, required this.slug,
    required this.sortOrder,
    this.parentId, this.description, this.imageUrl,
    this.children = const [],
  });
  factory Category.fromJson(Map<String, dynamic> j) => Category(
        id: j["id"] as String,
        name: j["name"] as String,
        slug: j["slug"] as String,
        parentId:    j["parentId"]    as String?,
        description: j["description"] as String?,
        imageUrl:    j["imageUrl"]    as String?,
        sortOrder:   (j["sortOrder"] as num?)?.toInt() ?? 0,
        children: (j["children"] as List? ?? const [])
            .map((c) => Category.fromJson((c as Map).cast<String, dynamic>()))
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
        id: j["id"] as String,
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
    required this.id, required this.productId, required this.colorName,
    required this.costPrice, required this.salePrice, required this.originalPrice,
    required this.stockQty, required this.reservedQty, required this.sortOrder, required this.isActive,
    this.colorHex, this.colorHex2, this.sareeCode, this.barcode,
    this.images = const [],
  });

  bool get hasDiscount => originalPrice > salePrice;
  int get discountPercent => hasDiscount ? (((originalPrice - salePrice) / originalPrice) * 100).round() : 0;
  int get availableQty => stockQty - reservedQty;

  factory ProductVariant.fromJson(Map<String, dynamic> j) => ProductVariant(
        id: j["id"] as String,
        productId: j["productId"] as String,
        colorName: j["colorName"] as String? ?? "",
        colorHex:  j["colorHex"]  as String?,
        colorHex2: j["colorHex2"] as String?,
        sareeCode: j["sareeCode"] as String?,
        barcode:   j["barcode"]   as String?,
        costPrice:     (j["costPrice"]     as num?) ?? 0,
        salePrice:     (j["salePrice"]     as num?) ?? 0,
        originalPrice: (j["originalPrice"] as num?) ?? 0,
        stockQty:    (j["stockQty"]    as num?)?.toInt() ?? 0,
        reservedQty: (j["reservedQty"] as num?)?.toInt() ?? 0,
        sortOrder:   (j["sortOrder"]   as num?)?.toInt() ?? 0,
        isActive:    j["isActive"] != false,
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
      attributeId:   (j["attributeId"] as String?) ?? attr["id"] as String? ?? "",
      attributeName: (attr["name"] as String?) ?? "",
      values:        (j["values"] as List? ?? const []).map((v) => "$v").toList(),
    );
  }
}

class Product {
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

  const Product({
    required this.id, required this.name, required this.slug,
    required this.isActive, required this.isFeatured,
    required this.variants, required this.attributes,
    this.description, this.shortDesc, this.categoryId, this.category,
    this.fabric, this.weaveType, this.regionOfOrigin, this.careInstructions,
    this.occasions = const [], this.tags = const [],
    this.videoUrl,
  });

  ProductVariant get primaryVariant => variants.isNotEmpty ? variants.first : const ProductVariant(
        id: "", productId: "", colorName: "",
        costPrice: 0, salePrice: 0, originalPrice: 0,
        stockQty: 0, reservedQty: 0, sortOrder: 0, isActive: false,
      );

  factory Product.fromJson(Map<String, dynamic> j) => Product(
        id: j["id"] as String,
        name: j["name"] as String? ?? "",
        slug: j["slug"] as String? ?? "",
        description:    j["description"] as String?,
        shortDesc:      j["shortDesc"]   as String?,
        categoryId:     j["categoryId"]  as String?,
        category: j["category"] is Map ? CategoryRef.fromJson((j["category"] as Map).cast<String, dynamic>()) : null,
        fabric:         j["fabric"]    as String?,
        weaveType:      j["weaveType"] as String?,
        regionOfOrigin: j["regionOfOrigin"]   as String?,
        careInstructions: j["careInstructions"] as String?,
        occasions: (j["occasions"] as List? ?? const []).map((v) => "$v").toList(),
        tags:      (j["tags"]      as List? ?? const []).map((v) => "$v").toList(),
        isActive:    j["isActive"]   != false,
        isFeatured:  j["isFeatured"] == true,
        videoUrl:    j["videoUrl"]   as String?,
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
        page:       (j["page"]       as num?)?.toInt() ?? 1,
        limit:      (j["limit"]      as num?)?.toInt() ?? 20,
        total:      (j["total"]      as num?)?.toInt() ?? 0,
        totalPages: (j["totalPages"] as num?)?.toInt() ?? 0,
        hasMore:    j["hasMore"] == true,
      );
}

class ProductPage {
  final List<Product> products;
  final Pagination pagination;
  const ProductPage({required this.products, required this.pagination});
  factory ProductPage.fromJson(Map<String, dynamic> j) => ProductPage(
        products: (j["products"] as List? ?? const [])
            .map((p) => Product.fromJson((p as Map).cast<String, dynamic>()))
            .toList(),
        pagination: Pagination.fromJson((j["pagination"] as Map).cast<String, dynamic>()),
      );
}

class HeroSlide {
  final String id;
  final String? tag, heading, subtext;
  final String? ctaLabel, ctaHref, ctaSecLabel, ctaSecHref;
  final String? bgColor, imageBg, imageUrl;
  final int sortOrder;
  const HeroSlide({
    required this.id, required this.sortOrder,
    this.tag, this.heading, this.subtext,
    this.ctaLabel, this.ctaHref, this.ctaSecLabel, this.ctaSecHref,
    this.bgColor, this.imageBg, this.imageUrl,
  });
  factory HeroSlide.fromJson(Map<String, dynamic> j) => HeroSlide(
        id: j["id"] as String,
        sortOrder: (j["sortOrder"] as num?)?.toInt() ?? 0,
        tag: j["tag"] as String?,
        heading: j["heading"] as String?,
        subtext: j["subtext"] as String?,
        ctaLabel:   j["ctaLabel"]   as String?,
        ctaHref:    j["ctaHref"]    as String?,
        ctaSecLabel: j["ctaSecLabel"] as String?,
        ctaSecHref:  j["ctaSecHref"]  as String?,
        bgColor:  j["bgColor"]  as String?,
        imageBg:  j["imageBg"]  as String?,
        imageUrl: j["imageUrl"] as String?,
      );
}

class Banner {
  final String id;
  final String? title, subtitle, imageUrl, mobileImageUrl, linkUrl;
  final String? position;
  final int sortOrder;
  const Banner({
    required this.id, required this.sortOrder,
    this.title, this.subtitle, this.imageUrl, this.mobileImageUrl,
    this.linkUrl, this.position,
  });

  /// Prefers the mobile-specific image, falling back to the desktop one.
  /// Mobile/app should always read this getter.
  String? get appImageUrl => (mobileImageUrl != null && mobileImageUrl!.isNotEmpty) ? mobileImageUrl : imageUrl;

  factory Banner.fromJson(Map<String, dynamic> j) => Banner(
        id: j["id"] as String,
        sortOrder: (j["sortOrder"] as num?)?.toInt() ?? 0,
        title:    j["title"]    as String?,
        subtitle: j["subtitle"] as String?,
        imageUrl:       j["imageUrl"]       as String?,
        mobileImageUrl: j["mobileImageUrl"] as String?,
        linkUrl:        j["linkUrl"]        as String?,
        position:       j["position"]       as String?,
      );
}
