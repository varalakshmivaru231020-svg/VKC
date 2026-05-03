/// Mirrors `/api/v1/orders` and `/api/v1/orders/{id}` responses.

class OrderItem {
  final String id, productName, variantColor;
  final String? sareeCode, imageUrl, productSlug;
  final int quantity;
  final num unitPrice, totalPrice;
  const OrderItem({
    required this.id, required this.productName, required this.variantColor,
    required this.quantity, required this.unitPrice, required this.totalPrice,
    this.sareeCode, this.imageUrl, this.productSlug,
  });
  factory OrderItem.fromJson(Map<String, dynamic> j) => OrderItem(
        id:           j["id"] as String,
        productName:  j["productName"]  as String? ?? "",
        variantColor: j["variantColor"] as String? ?? "",
        sareeCode:    j["sareeCode"]    as String?,
        imageUrl:     j["imageUrl"]     as String?,
        productSlug:  j["productSlug"]  as String?,
        quantity:    (j["quantity"]   as num?)?.toInt() ?? 1,
        unitPrice:   num.tryParse("${j["unitPrice"]}")  ?? 0,
        totalPrice:  num.tryParse("${j["totalPrice"]}") ?? 0,
      );
}

class Order {
  final String id, orderNumber, status, paymentStatus;
  final String? paymentMethod, trackingNumber, trackingUrl, courierPartner;
  final num subtotal, shippingAmount, totalAmount, discountAmount, walletAmountUsed;
  final Map<String, dynamic>? shippingAddress;
  final List<OrderItem> items;
  final DateTime createdAt;
  final DateTime? shippedAt, deliveredAt, cancelledAt;

  const Order({
    required this.id, required this.orderNumber,
    required this.status, required this.paymentStatus,
    required this.subtotal, required this.shippingAmount,
    required this.totalAmount, required this.discountAmount, required this.walletAmountUsed,
    required this.items, required this.createdAt,
    this.paymentMethod, this.trackingNumber, this.trackingUrl, this.courierPartner,
    this.shippingAddress,
    this.shippedAt, this.deliveredAt, this.cancelledAt,
  });

  factory Order.fromJson(Map<String, dynamic> j) => Order(
        id:            j["id"]            as String,
        orderNumber:   j["orderNumber"]   as String,
        status:        j["status"]        as String,
        paymentStatus: j["paymentStatus"] as String? ?? "PENDING",
        paymentMethod: j["paymentMethod"] as String?,
        trackingNumber: j["trackingNumber"] as String?,
        trackingUrl:    j["trackingUrl"]    as String?,
        courierPartner: j["courierPartner"] as String?,
        subtotal:        num.tryParse("${j["subtotal"]}")        ?? 0,
        shippingAmount:  num.tryParse("${j["shippingAmount"]}")  ?? 0,
        discountAmount:  num.tryParse("${j["discountAmount"]}")  ?? 0,
        totalAmount:     num.tryParse("${j["totalAmount"]}")     ?? 0,
        walletAmountUsed:num.tryParse("${j["walletAmountUsed"]}")?? 0,
        shippingAddress: j["shippingAddress"] is Map ? (j["shippingAddress"] as Map).cast<String, dynamic>() : null,
        items: (j["items"] as List? ?? const [])
            .map((e) => OrderItem.fromJson((e as Map).cast<String, dynamic>()))
            .toList(),
        createdAt:    DateTime.tryParse("${j["createdAt"]}")   ?? DateTime.now(),
        shippedAt:    j["shippedAt"]   != null ? DateTime.tryParse("${j["shippedAt"]}")   : null,
        deliveredAt:  j["deliveredAt"] != null ? DateTime.tryParse("${j["deliveredAt"]}") : null,
        cancelledAt:  j["cancelledAt"] != null ? DateTime.tryParse("${j["cancelledAt"]}") : null,
      );

  bool get canCancel => const ["PENDING", "CONFIRMED", "PROCESSING"].contains(status);
  bool get canReturn => status == "DELIVERED";
}
