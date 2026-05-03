/// One line in the local cart. Mirrors the JSON the checkout API expects
/// at `POST /api/v1/checkout` so we can ship it directly.
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
        productId: productId, variantId: variantId,
        productName: productName, variantColor: variantColor,
        sareeCode: sareeCode, quantity: quantity ?? this.quantity,
        salePrice: salePrice, originalPrice: originalPrice,
        imageUrl: imageUrl, stockQty: stockQty,
      );

  Map<String, dynamic> toJson() => {
        "productId":     productId,
        "variantId":     variantId,
        "productName":   productName,
        "variantColor":  variantColor,
        "sareeCode":     sareeCode,
        "quantity":      quantity,
        "salePrice":     salePrice,
        "originalPrice": originalPrice,
        "imageUrl":      imageUrl,
        "stockQty":      stockQty,
      };

  factory CartItem.fromJson(Map<String, dynamic> j) => CartItem(
        productId:     j["productId"]    as String,
        variantId:     j["variantId"]    as String,
        productName:   j["productName"]  as String? ?? "",
        variantColor:  j["variantColor"] as String? ?? "",
        sareeCode:     j["sareeCode"]    as String?,
        quantity:     (j["quantity"]     as num?)?.toInt() ?? 1,
        salePrice:    (j["salePrice"]    as num?) ?? 0,
        originalPrice:(j["originalPrice"]as num?) ?? 0,
        imageUrl:      j["imageUrl"]     as String?,
        stockQty:     (j["stockQty"]     as num?)?.toInt() ?? 0,
      );
}
