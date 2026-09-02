// Models for the customer app. Parsing is tolerant: the real public API supplies
// the essential fields (ids, prices, chat, stream, order timeline); decorative
// bits (palette, rating badge) fall back to design defaults where absent.

int _int(dynamic v, [int d = 0]) => v is int ? v : int.tryParse('${v ?? ''}') ?? d;
double? _numOrNull(dynamic v) => v == null ? null : (v is num ? v.toDouble() : double.tryParse('$v'));
double _num(dynamic v, [double d = 0]) => _numOrNull(v) ?? d;

/// Deterministic palette index from an id, so a product/live always looks the same.
int paletteFor(String? key) {
  final s = key ?? '';
  var h = 0;
  for (final c in s.codeUnits) {
    h = (h * 31 + c) & 0x7fffffff;
  }
  return h % 9;
}

class LiveSession {
  final String id; // uuid
  final String liveId; // sessionNumber preferred (public key), else id
  final String title;
  final String host;
  final String studio;
  final int viewers;
  final int productCount;
  final String discount;
  final int palette;
  final String? streamUrl;
  final String? streamType; // youtube | instagram | facebook
  final String startedAgo;

  /// When an upcoming show is due to start, and when a past one finished.
  final DateTime? scheduledAt;
  final DateTime? endedAt;

  /// True when the host actually named this show in the admin console.
  ///
  /// [title] falls back to "Live now — pure cane jaggery", which is right on the
  /// Live tab and wrong on a show that finished last week. Screens that aren't
  /// showing a live broadcast use this to pick their own wording.
  final bool hasTitle;

  LiveSession({
    required this.id,
    required this.liveId,
    required this.title,
    required this.host,
    required this.studio,
    required this.viewers,
    required this.productCount,
    required this.discount,
    required this.palette,
    this.streamUrl,
    this.streamType,
    this.startedAgo = 'live now',
    this.scheduledAt,
    this.endedAt,
    this.hasTitle = false,
  });

  factory LiveSession.fromJson(Map<String, dynamic> j) {
    final id = (j['id'] ?? '').toString();
    final number = (j['sessionNumber'] ?? j['number'] ?? id).toString();
    // liveTitle / liveHost / liveDiscount are what the host sets in the admin
    // live console; the generic strings are only the fallback for a show
    // nobody has titled yet.
    String pick(dynamic a, dynamic b, String fallback) {
      final v = (a ?? b ?? '').toString().trim();
      return v.isEmpty ? fallback : v;
    }

    return LiveSession(
      id: id,
      liveId: number.isNotEmpty ? number : id,
      title: pick(j['liveTitle'], j['title'] ?? j['name'], 'Live now — pure cane jaggery'),
      host: pick(j['liveHost'], j['host'] ?? j['hostName'], 'VKC Gold Studio'),
      studio: (j['studio'] ?? 'VKC Gold').toString(),
      viewers: _int(j['viewers']),
      productCount: _int(j['productCount'] ?? j['productsCount'] ?? j['availableProducts'] ?? j['totalProducts']),
      discount: (j['liveDiscount'] ?? j['discount'] ?? '').toString().trim(),
      palette: paletteFor(id),
      streamUrl: j['streamUrl'] as String?,
      streamType: j['streamType'] as String?,
      startedAgo: (j['startedAgo'] ?? 'live now').toString(),
      scheduledAt: _date(j['scheduledAt']),
      endedAt: _date(j['endedAt']),
      hasTitle: '${j['liveTitle'] ?? j['title'] ?? j['name'] ?? ''}'.trim().isNotEmpty,
    );
  }

  /// A copy with a fresh viewer count, for the realtime badge.
  LiveSession withViewers(int n) => LiveSession(
        id: id,
        liveId: liveId,
        title: title,
        host: host,
        studio: studio,
        viewers: n,
        productCount: productCount,
        discount: discount,
        palette: palette,
        streamUrl: streamUrl,
        streamType: streamType,
        startedAgo: startedAgo,
        scheduledAt: scheduledAt,
        endedAt: endedAt,
        hasTitle: hasTitle,
      );
}

DateTime? _date(dynamic v) {
  if (v == null) return null;
  return DateTime.tryParse(v.toString())?.toLocal();
}

class Product {
  final String id;
  final String name;
  final String weave;
  final double price;
  final double? mrp;
  final int discount;
  final double rating;
  final int reviews;
  final int palette;
  final String? badge;
  final bool isNew;
  final String? image; // real photo URL from the API (null → Silk placeholder)
  final String status; // AVAILABLE / SOLD / etc. (live feed)
  final int qty;
  final String? uuid; // real product UUID — required to place an order
  /// Ecom variant this card stands for — the key the wishlist API works in,
  /// so a heart on a card can hit the server like the detail screen's does.
  final String? variantId;

  /// Set by the host in the live console — the product on camera right now. The
  /// strip used to fake this by styling whichever product happened to sort
  /// first, which was wrong the moment the host talked about anything else.
  final bool isPinned;

  Product({
    required this.id,
    required this.name,
    required this.weave,
    required this.price,
    this.mrp,
    this.discount = 0,
    this.rating = 4.7,
    this.reviews = 0,
    required this.palette,
    this.badge,
    this.isNew = false,
    this.image,
    this.status = '',
    this.qty = 0,
    this.uuid,
    this.variantId,
    this.isPinned = false,
  });

  bool get soldOut => status.isNotEmpty && status.toUpperCase() != 'AVAILABLE';
  bool get orderable => uuid != null && !soldOut;

  factory Product.fromJson(Map<String, dynamic> j) {
    final rawId = (j['id'] ?? '').toString();
    final serial = (j['serialNumber'] ?? j['serial'] ?? rawId).toString();
    // Real inventory carries a UUID in `id`; sample/catalog rows use the serial.
    final isUuid = RegExp(r'^[0-9a-f]{8}-[0-9a-f]{4}-', caseSensitive: false).hasMatch(rawId);
    final price = _num(j['price'] ?? j['sellingPrice']);
    final mrp = _numOrNull(j['mrp'] ?? j['originalPrice']);
    final img = (j['image'] ?? j['photo'] ?? j['imageUrl']) as String?;
    return Product(
      id: serial,
      name: (j['name'] ?? j['tag'] ?? j['title'] ?? serial).toString(),
      weave: (j['weave'] ?? j['category'] ?? j['sareeCode'] ?? 'Pure Jaggery').toString(),
      price: price,
      mrp: mrp,
      discount: mrp != null && mrp > price ? (((mrp - price) / mrp) * 100).round() : _int(j['discount']),
      rating: _num(j['rating'], 4.7),
      reviews: _int(j['reviews']),
      palette: paletteFor(serial),
      badge: j['badge'] as String?,
      isNew: j['isNew'] == true,
      image: (img != null && img.isNotEmpty) ? img : null,
      status: (j['status'] ?? '').toString(),
      qty: _int(j['qty'] ?? j['quantityAvailable']),
      uuid: isUuid ? rawId : null,
      isPinned: j['isPinned'] == true,
    );
  }

  /// A copy with fresh stock, for applying a realtime sold-out event without
  /// refetching the whole strip.
  Product withStock({required int qtyLeft, required String status}) => Product(
        id: id,
        name: name,
        weave: weave,
        price: price,
        mrp: mrp,
        discount: discount,
        rating: rating,
        reviews: reviews,
        palette: palette,
        badge: badge,
        isNew: isNew,
        image: image,
        status: status,
        qty: qtyLeft,
        uuid: uuid,
        variantId: variantId,
        isPinned: isPinned,
      );
}

class ChatMessage {
  final String id;
  final String name;
  final String message;
  final DateTime createdAt;
  final bool mine;

  ChatMessage({required this.id, required this.name, required this.message, required this.createdAt, this.mine = false});

  factory ChatMessage.fromJson(Map<String, dynamic> j, {bool mine = false}) => ChatMessage(
        id: (j['id'] ?? '').toString(),
        name: (j['name'] ?? j['senderName'] ?? 'guest').toString(),
        message: (j['message'] ?? '').toString(),
        createdAt: DateTime.tryParse('${j['createdAt'] ?? ''}')?.toLocal() ?? DateTime.now(),
        mine: mine,
      );
}

class LiveDetail {
  final LiveSession live;
  final List<Product> products;
  LiveDetail({required this.live, required this.products});

  factory LiveDetail.fromJson(Map<String, dynamic> j) {
    final products =
        ((j['products'] ?? []) as List).map((e) => Product.fromJson(e as Map<String, dynamic>)).toList();
    final liveJson = Map<String, dynamic>.from(j['live'] as Map? ?? {});
    liveJson['productCount'] = products.length;
    return LiveDetail(live: LiveSession.fromJson(liveJson), products: products);
  }
}

class OrderStep {
  final String stage;
  final bool done;
  final bool active;
  final String when;
  OrderStep({required this.stage, required this.done, required this.active, required this.when});
}

class OrderAddress {
  final String recipient;
  final String phone;
  final String line1;
  final String line2;
  final String city;
  final String state;
  final String pincode;
  OrderAddress({
    this.recipient = '',
    this.phone = '',
    this.line1 = '',
    this.line2 = '',
    this.city = '',
    this.state = '',
    this.pincode = '',
  });

  factory OrderAddress.fromJson(Map<String, dynamic> j) => OrderAddress(
        recipient: (j['recipient'] ?? '').toString(),
        phone: (j['phone'] ?? '').toString(),
        line1: (j['line1'] ?? '').toString(),
        line2: (j['line2'] ?? '').toString(),
        city: (j['city'] ?? '').toString(),
        state: (j['state'] ?? '').toString(),
        pincode: (j['pincode'] ?? '').toString(),
      );

  String get oneLine {
    final parts = [line1, line2, city, if (pincode.isNotEmpty) '$state $pincode' else state]
        .where((s) => s.trim().isNotEmpty)
        .toList();
    return parts.join(', ');
  }
}

/// The ordered delivery stages the customer sees. `/public` gives a single
/// plain-English `deliveryStatus`; we expand it into a progress timeline.
const _deliveryStages = ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'];

/// Map a backend deliveryStatus → how far along `_deliveryStages` we are.
int _stageIndexFor(String deliveryStatus) {
  switch (deliveryStatus.toLowerCase()) {
    case 'pending':
      return 0;
    case 'confirmed':
    case 'processing':
      return 1;
    case 'packed':
      return 2;
    case 'dispatched':
    case 'shipped':
    case 'out for delivery':
      return 3;
    case 'delivered':
      return 4;
    default:
      return 0;
  }
}

class OrderView {
  final String orderNumber;
  final String type;
  final String status; // raw order status
  final String deliveryStatus; // plain-English stage
  final double total;
  final double paid;
  final double pending;
  final String createdAt;
  final OrderAddress? address;
  final String productName;
  final String productSerial;
  final String? productImage;
  final int palette;
  final String? awb;
  final String? courier;
  final String? trackUrl;
  final List<OrderStep> timeline;

  OrderView({
    required this.orderNumber,
    this.type = '',
    this.status = '',
    this.deliveryStatus = '',
    this.total = 0,
    this.paid = 0,
    this.pending = 0,
    this.createdAt = '',
    this.address,
    this.productName = '',
    this.productSerial = '',
    this.productImage,
    this.palette = 0,
    this.awb,
    this.courier,
    this.trackUrl,
    this.timeline = const [],
  });

  bool get cancelled {
    final s = (deliveryStatus.isNotEmpty ? deliveryStatus : status).toLowerCase();
    return s.contains('cancel') || s.contains('return');
  }

  bool get delivered => deliveryStatus.toLowerCase() == 'delivered';

  factory OrderView.fromJson(Map<String, dynamic> j) {
    final payment = (j['payment'] as Map?)?.cast<String, dynamic>() ?? const {};
    final product = (j['product'] as Map?)?.cast<String, dynamic>();
    final tracking = (j['tracking'] as Map?)?.cast<String, dynamic>();
    final deliveryStatus = (j['deliveryStatus'] ?? j['status'] ?? '').toString();
    final serial = (product?['serialNumber'] ?? '').toString();

    // Synthesize a timeline from the single delivery stage.
    final reached = _stageIndexFor(deliveryStatus);
    final cancelled = deliveryStatus.toLowerCase().contains('cancel') ||
        deliveryStatus.toLowerCase().contains('return');
    final steps = <OrderStep>[
      for (var i = 0; i < _deliveryStages.length; i++)
        OrderStep(
          stage: _deliveryStages[i],
          done: !cancelled && i <= reached,
          active: !cancelled && i == reached && reached < _deliveryStages.length - 1,
          when: '',
        ),
    ];

    return OrderView(
      orderNumber: (j['orderNumber'] ?? j['id'] ?? '').toString(),
      type: (j['typeLabel'] ?? j['type'] ?? '').toString(),
      status: (j['status'] ?? '').toString(),
      deliveryStatus: deliveryStatus,
      total: _num(payment['total'] ?? j['total']),
      paid: _num(payment['paid']),
      pending: _num(payment['pending']),
      createdAt: (j['createdAt'] ?? '').toString(),
      address: j['deliveryAddress'] is Map
          ? OrderAddress.fromJson((j['deliveryAddress'] as Map).cast<String, dynamic>())
          : null,
      productName: (product?['tag'] ?? product?['name'] ?? serial).toString(),
      productSerial: serial,
      productImage: product?['image'] as String?,
      palette: paletteFor(serial),
      awb: tracking?['awb'] as String?,
      courier: tracking?['courier'] as String?,
      trackUrl: tracking?['trackUrl'] as String?,
      timeline: cancelled ? const [] : steps,
    );
  }
}
