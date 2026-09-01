import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_cart.dart';
import '../ecom/ecom_config.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';
import '../widgets.dart';
import 'address_screens.dart';

String _inr(num v) => v.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');

Widget _thumb(String? url, {double w = 80, double h = 100}) => SizedBox(
      width: w,
      height: h,
      child: NetImage(url: url, radius: VlRadii.sm),
    );

// ── Cart ─────────────────────────────────────────────────────────────────────
class CartScreen extends StatefulWidget {
  const CartScreen({super.key});
  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _couponCtrl = TextEditingController();
  bool _applying = false;
  String? _couponError;

  /// Subtotal the applied coupon was last validated against — changing the
  /// cart has to re-check it.
  num _validatedAt = 0;

  /// The store's running offers, shown inline above the code field.
  List<Map<String, dynamic>> _offers = const [];

  @override
  void initState() {
    super.initState();
    _validatedAt = EcomCart.I.subtotal;
    EcomCart.I.items.addListener(_cartChanged);
    _loadOffers();
  }

  @override
  void dispose() {
    EcomCart.I.items.removeListener(_cartChanged);
    _couponCtrl.dispose();
    super.dispose();
  }

  Future<void> _cartChanged() async {
    final cart = EcomCart.I;
    if (cart.coupon == null || cart.subtotal == _validatedAt) return;
    _validatedAt = cart.subtotal;
    final dropped = await cart.revalidateCoupon();
    if (!mounted) return;
    setState(() => _couponError = dropped);
    if (dropped != null) _toast(dropped);
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  Future<void> _applyCoupon([String? code]) async {
    final entered = (code ?? _couponCtrl.text).trim().toUpperCase();
    if (entered.isEmpty) return;
    FocusScope.of(context).unfocus();
    setState(() {
      _applying = true;
      _couponError = null;
    });
    try {
      final res = await EcomApi.I.validateCoupon(entered, EcomCart.I.subtotal);
      if (!res.valid) throw StateError('invalid');
      EcomCart.I.coupon = res;
      _validatedAt = EcomCart.I.subtotal;
      _couponCtrl.clear();
      if (!mounted) return;
      setState(() => _applying = false);
      _toast(res.freeShipping ? 'Free shipping applied' : 'Saved ₹${_inr(res.discount)}');
    } catch (e) {
      EcomCart.I.coupon = null;
      if (!mounted) return;
      setState(() {
        _applying = false;
        _couponError = e is StateError ? 'Invalid coupon' : ecomError(e, 'Invalid coupon');
      });
    }
  }

  void _removeCoupon() {
    EcomCart.I.coupon = null;
    setState(() => _couponError = null);
    _toast('Coupon removed');
  }

  /// Live offers, fetched once so the cart can show them before checkout
  /// rather than hiding every deal behind a "View offers" link.
  Future<void> _loadOffers() async {
    try {
      final list = await EcomApi.I.coupons();
      if (mounted) setState(() => _offers = list);
    } catch (_) {
      // No offers strip; the code field still works.
    }
  }

  /// The store's live offers (GET /v1/coupons), tap to apply.
  Future<void> _showOffers() async {
    final picked = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: VlColors.canvas,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(VlRadii.xl))),
      builder: (_) => _OffersSheet(seed: _offers),
    );
    if (picked != null && mounted) _applyCoupon(picked);
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: EcomCart.I.items,
      builder: (context, items, _) {
        if (items.isEmpty) {
          return Column(children: [
            TopBar(title: 'Cart', onBack: () => context.go('/home')),
            Expanded(
              child: Center(
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.shopping_bag_outlined, size: 40, color: VlColors.red),
                  const SizedBox(height: 14),
                  Text('Your cart is empty', style: VlText.display(22)),
                  const SizedBox(height: 6),
                  Text('Add a heritage saree to begin.', style: VlText.body(13, color: VlColors.muted)),
                  const SizedBox(height: 16),
                  TextButton(onPressed: () => context.go('/shop'), child: Text('Browse Sarees', style: VlText.ui(13, color: VlColors.red))),
                ]),
              ),
            ),
          ]);
        }
        final cart = EcomCart.I;
        return Column(children: [
          // Count units, not line items — the nav badge uses EcomCart.count, so
          // "Cart · 1" beside a badge of 3 read as a contradiction.
          TopBar(title: 'Cart · ${EcomCart.I.count}', onBack: () => context.go('/home')),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 28),
              children: [
                ...items.map(_cartItem),
                const SizedBox(height: 16),
                _offersStrip(),
                _coupon(),
                const DoubleRule(margin: EdgeInsets.symmetric(vertical: 24)),
                Text('PRICE DETAILS', style: VlText.upper(9, letter: 0.22)),
                const SizedBox(height: 10),
                _priceRow('Subtotal', '₹${_inr(cart.subtotal)}'),
                // Informational only — subtotal is already the discounted sum,
                // so no leading minus: this is not deducted from the total.
                if (cart.savings > 0) _priceRow('You save', '₹${_inr(cart.savings)}', color: VlColors.green),
                if (cart.couponDiscount > 0) _priceRow('Coupon', '−₹${_inr(cart.couponDiscount)}', color: VlColors.green),
                _priceRow('Shipping', cart.shipping == 0 ? 'FREE' : '₹${_inr(cart.shipping)}', color: cart.shipping == 0 ? VlColors.green : null),
                // Same small print as the website: how the rate was built up,
                // or the spend that makes it free.
                Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    cart.freeShipping
                        ? 'Coupon applied — free shipping'
                        : cart.shipping > 0
                            ? '${cart.count} saree${cart.count > 1 ? 's' : ''} · ₹${_inr(storeConfig.value.firstSareeRate)}'
                                '${cart.count > 1 ? ' + ${cart.count - 1}×₹${_inr(storeConfig.value.additionalSareeRate)}' : ''}'
                            : 'Free above ₹${_inr(storeConfig.value.freeShippingThreshold)}',
                    style: VlText.mono(9, color: cart.shipping == 0 ? VlColors.green : VlColors.muted2, letter: 0.1),
                  ),
                ),
                const SizedBox(height: 12),
                Divider(color: VlColors.rule),
                const SizedBox(height: 4),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Total payable', style: VlText.ui(14, weight: FontWeight.w600)),
                  Text('₹${_inr(cart.total)}', style: VlText.ui(22, weight: FontWeight.w600)),
                ]),
              ],
            ),
          ),
          _stickyCheckout(context, cart),
        ]);
      },
    );
  }

  Widget _cartItem(CartItem it) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: VlColors.paper,
          border: Border.all(color: VlColors.rule),
          borderRadius: BorderRadius.circular(VlRadii.md),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          _thumb(it.imageUrl),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(
                  child: Text(it.productName, maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.ui(13, weight: FontWeight.w500)),
                ),
                // Removing a line used to mean tapping "−" until it vanished.
                InkResponse(
                  onTap: () => _removeLine(it),
                  child: Padding(
                    padding: const EdgeInsets.only(left: 6, bottom: 4),
                    child: Icon(Icons.close, size: 15, color: VlColors.muted2),
                  ),
                ),
              ]),
              const SizedBox(height: 2),
              Text([it.variantColor, it.sareeCode].where((s) => (s ?? '').isNotEmpty).join(' · '),
                  style: VlText.mono(10, color: VlColors.muted)),
              const SizedBox(height: 8),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                PriceRow(value: it.salePrice.toDouble(), mrp: it.originalPrice > it.salePrice ? it.originalPrice.toDouble() : null),
                Container(
                  decoration: BoxDecoration(border: Border.all(color: VlColors.rule2), borderRadius: BorderRadius.circular(6)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    // At one, "−" empties the line — route it through the same
                    // undoable removal rather than deleting it silently.
                    _qtyBtn(Icons.remove,
                        () => it.quantity <= 1 ? _removeLine(it) : EcomCart.I.setQty(it.variantId, it.quantity - 1)),
                    SizedBox(width: 24, child: Text('${it.quantity}', textAlign: TextAlign.center, style: VlText.ui(13, weight: FontWeight.w500))),
                    // "+" is capped by stock; say so instead of ignoring the tap.
                    _qtyBtn(Icons.add, () => _increment(it)),
                  ]),
                ),
              ]),
            ]),
          ),
        ]),
      );

  Widget _qtyBtn(IconData ic, VoidCallback onTap) =>
      InkResponse(onTap: onTap, child: SizedBox(width: 26, height: 26, child: Icon(ic, size: 12, color: VlColors.ink)));

  /// Adds one more of a line, telling the customer when the store has no more
  /// of it rather than swallowing the tap.
  void _increment(CartItem it) {
    EcomCart.I.setQty(it.variantId, it.quantity + 1);
    final line = EcomCart.I.items.value.where((x) => x.variantId == it.variantId).firstOrNull;
    if (line != null && line.quantity == it.quantity && mounted) {
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text('Only ${it.quantity} left in stock')));
    }
  }

  /// Removes a line, with an undo — a mis-tap shouldn't cost the customer the
  /// saree they were choosing.
  void _removeLine(CartItem it) {
    EcomCart.I.remove(it.variantId);
    if (!mounted) return;
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(SnackBar(
        content: Text('${it.productName} removed'),
        action: SnackBarAction(
          label: 'UNDO',
          textColor: Colors.white,
          onPressed: () => EcomCart.I.add(it),
        ),
      ));
  }

  /// Horizontally scrolling offer cards, right in the cart — the customer can
  /// see and take a deal without hunting for it behind a link.
  Widget _offersStrip() {
    if (_offers.isEmpty || EcomCart.I.coupon != null) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Gold hairline running off to the edge — the house way of opening a
      // block, rather than a bare label.
      Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Row(children: [
          Icon(Icons.auto_awesome_rounded, size: 13, color: VlColors.gold),
          const SizedBox(width: 8),
          Text('OFFERS FOR YOU', style: VlText.upper(9.5, letter: 0.24)),
          const SizedBox(width: 12),
          Expanded(child: Container(height: 1, color: VlColors.goldSoft)),
        ]),
      ),
      SizedBox(
        height: 188,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          // The cards carry a drop shadow; without this the list clips it.
          clipBehavior: Clip.none,
          padding: EdgeInsets.zero,
          itemCount: _offers.length,
          separatorBuilder: (_, __) => const SizedBox(width: 12),
          itemBuilder: (_, i) => OfferCard(
            coupon: _offers[i],
            compact: true,
            onApply: () => _applyCoupon('${_offers[i]['code'] ?? ''}'),
          ),
        ),
      ),
      const SizedBox(height: 20),
    ]);
  }

  Widget _coupon() {
    final applied = EcomCart.I.coupon;
    if (applied != null) return _appliedCoupon(applied);
    final err = _couponError != null;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
        decoration: BoxDecoration(
          // Cream washing into paper, the same warmth the rest of the store
          // uses — a plain white box read as a form field, not an invitation.
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [VlColors.cream, VlColors.paper],
          ),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: err ? VlColors.red : VlColors.goldSoft),
          boxShadow: [BoxShadow(color: VlColors.ink.withValues(alpha: 0.05), blurRadius: 14, offset: const Offset(0, 6))],
        ),
        child: Row(children: [
          offerIconTile(Icons.local_activity_rounded),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: _couponCtrl,
              textCapitalization: TextCapitalization.characters,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _applyCoupon(),
              onChanged: _couponError == null ? null : (_) => setState(() => _couponError = null),
              style: VlText.ui(12.5, weight: FontWeight.w600, letter: 0.1),
              decoration: InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                hintText: 'Have a coupon code?',
                hintStyle: VlText.ui(12.5, color: VlColors.muted, weight: FontWeight.w400),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: _applying ? null : () => _applyCoupon(),
            child: Container(
              width: 84,
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(vertical: 13),
              decoration: BoxDecoration(
                gradient: LinearGradient(colors: [VlColors.red, VlColors.redDeep]),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [BoxShadow(color: VlColors.red.withValues(alpha: 0.28), blurRadius: 12, offset: const Offset(0, 5))],
              ),
              child: _applying
                  ? const SizedBox(width: 13, height: 13, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text('APPLY', style: VlText.ui(11, weight: FontWeight.w700, color: Colors.white, letter: 0.14)),
            ),
          ),
        ]),
      ),
      if (err)
        Padding(
          padding: const EdgeInsets.only(top: 9, left: 6),
          child: Row(children: [
            Icon(Icons.error_outline_rounded, size: 12, color: VlColors.red),
            const SizedBox(width: 6),
            Expanded(child: Text(_couponError!, style: VlText.mono(9.5, color: VlColors.red, letter: 0.1))),
          ]),
        ),
      const SizedBox(height: 12),
      _browseOffers(),
    ]);
  }

  /// The full-width way into every live offer. This used to be a 9pt "VIEW
  /// OFFERS" link that nobody saw the moment before paying.
  Widget _browseOffers() => Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: _showOffers,
          borderRadius: BorderRadius.circular(18),
          splashColor: VlColors.redSoft.withValues(alpha: 0.5),
          child: Ink(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [VlColors.redTint, VlColors.paper],
              ),
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: VlColors.goldSoft),
              boxShadow: [BoxShadow(color: VlColors.ink.withValues(alpha: 0.05), blurRadius: 14, offset: const Offset(0, 6))],
            ),
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 14, 14, 14),
              child: Row(children: [
                offerIconTile(Icons.redeem_rounded, size: 44),
                const SizedBox(width: 13),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Browse available offers', style: VlText.display(16)),
                    const SizedBox(height: 4),
                    Text(
                      _offers.isEmpty
                          ? 'See every coupon this store is running'
                          : '${_offers.length} offer${_offers.length > 1 ? 's' : ''} you can use right now',
                      style: VlText.body(11.5, color: VlColors.muted),
                    ),
                  ]),
                ),
                const SizedBox(width: 8),
                Container(
                  width: 30,
                  height: 30,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: VlColors.redSoft, shape: BoxShape.circle),
                  child: Icon(Icons.arrow_forward_rounded, size: 15, color: VlColors.red),
                ),
              ]),
            ),
          ),
        ),
      );

  Widget _appliedCoupon(CouponResult c) => Container(
        padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [VlColors.green.withValues(alpha: 0.07), VlColors.paper],
          ),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: VlColors.green.withValues(alpha: 0.45)),
          boxShadow: [BoxShadow(color: VlColors.ink.withValues(alpha: 0.05), blurRadius: 14, offset: const Offset(0, 6))],
        ),
        child: Row(children: [
          Container(
            width: 38,
            height: 38,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: VlColors.green, borderRadius: BorderRadius.circular(13)),
            child: const Icon(Icons.check_rounded, size: 19, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.code.toUpperCase(), style: VlText.ui(12.5, weight: FontWeight.w700, letter: 0.1)),
              const SizedBox(height: 3),
              Text(
                c.freeShipping
                    ? 'Free shipping applied'
                    : '₹${_inr(c.discount)} off${(c.description ?? '').isNotEmpty ? ' · ${c.description}' : ''}',
                style: VlText.body(11, color: VlColors.green),
              ),
            ]),
          ),
          TextButton(
            onPressed: _removeCoupon,
            child: Text('REMOVE', style: VlText.upper(9, color: VlColors.red, letter: 0.18)),
          ),
        ]),
      );

  Widget _priceRow(String k, String v, {Color? color}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(k, style: VlText.body(13, color: VlColors.muted)),
          Text(v, style: VlText.ui(13, weight: FontWeight.w500, color: color ?? VlColors.ink)),
        ]),
      );

  Widget _stickyCheckout(BuildContext context, EcomCart cart) => Container(
        decoration: BoxDecoration(
          color: VlColors.paper,
          border: Border(top: BorderSide(color: VlColors.rule)),
          boxShadow: [BoxShadow(color: VlColors.ink.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Row(children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('₹${_inr(cart.total)}', style: VlText.ui(22, weight: FontWeight.w600)),
                if (cart.savings + cart.couponDiscount > 0)
                  Text('₹${_inr(cart.savings + cart.couponDiscount)} SAVED', style: VlText.upper(8, color: VlColors.green, letter: 0.18)),
              ]),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    if (!EcomAuth.I.isLoggedIn) {
                      context.push('/login');
                      return;
                    }
                    context.push('/checkout');
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Text('CHECKOUT', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
                      const SizedBox(width: 8),
                      const Icon(Icons.arrow_forward, size: 14, color: Colors.white),
                    ]),
                  ),
                ),
              ),
            ]),
          ),
        ),
      );
}

// ── Offers ───────────────────────────────────────────────────────────────────
/// "20% OFF" / "₹500 OFF" / "FREE SHIPPING", from whichever fields the coupon
/// record carries.
String offerHeadline(Map<String, dynamic> c) {
  final type = '${c['type'] ?? ''}'.toUpperCase();
  final value = (c['value'] ?? c['discountValue'] ?? c['discount']) as num?;
  if (type.contains('SHIPPING')) return 'FREE SHIPPING';
  if (type.contains('PERCENT') && value != null) return '${value.toStringAsFixed(0)}% OFF';
  if (value != null) return '₹${_inr(value)} OFF';
  return 'OFFER';
}

/// The qualifying conditions, when the store set any.
String? offerTerms(Map<String, dynamic> c) {
  final min = (c['minOrderValue'] ?? c['minOrderAmount']) as num?;
  final max = (c['maxDiscount'] ?? c['maxDiscountAmount']) as num?;
  final parts = [
    if (min != null && min > 0) 'On orders above ₹${_inr(min)}',
    if (max != null && max > 0) 'Up to ₹${_inr(max)}',
  ];
  return parts.isEmpty ? null : parts.join(' · ');
}

/// The rounded tile every icon in the offers block sits on, so the coupon
/// field, the browse card and the offer cards read as one family instead of
/// three unrelated boxes.
Widget offerIconTile(IconData icon, {double size = 38}) => Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [VlColors.red, VlColors.redDeep],
        ),
        borderRadius: BorderRadius.circular(size / 3),
        boxShadow: [
          BoxShadow(
            color: VlColors.red.withValues(alpha: 0.22),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Icon(icon, size: size * 0.46, color: Colors.white),
    );

/// Icon matching the kind of deal, so a card is scannable before it is read.
IconData offerIcon(Map<String, dynamic> c) {
  final type = '${c['type'] ?? ''}'.toUpperCase();
  if (type.contains('SHIPPING')) return Icons.local_shipping_rounded;
  if (type.contains('PERCENT')) return Icons.percent_rounded;
  return Icons.currency_rupee_rounded;
}

/// A coupon presented as a proper offer card — icon, discount badge, the code
/// as its title, one line of the store's own copy, and a full-width APPLY.
class OfferCard extends StatelessWidget {
  final Map<String, dynamic> coupon;
  final VoidCallback? onApply;
  /// Narrow variant for the horizontal strip in the cart.
  final bool compact;
  const OfferCard({super.key, required this.coupon, this.onApply, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final code = '${coupon['code'] ?? ''}'.toUpperCase();
    final desc = '${coupon['description'] ?? ''}'.trim();
    final terms = offerTerms(coupon);
    // One line of prose: the store's own copy when it wrote any, else the
    // qualifying terms, so a card is never left with an empty middle.
    final line = desc.isNotEmpty
        ? (terms == null ? desc : '$desc · $terms')
        : (terms ?? 'Applies to your cart');

    return GestureDetector(
      onTap: code.isEmpty ? null : onApply,
      child: Container(
        width: compact ? 268 : null,
        padding: const EdgeInsets.fromLTRB(14, 13, 14, 13),
        decoration: BoxDecoration(
          // Soft tint that fades into paper, so the card reads as a deal
          // without shouting over the cart lines above it.
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [VlColors.redTint, VlColors.paper],
          ),
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: VlColors.goldSoft),
          boxShadow: [BoxShadow(color: VlColors.ink.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, 6))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: compact ? MainAxisSize.max : MainAxisSize.min,
          children: [
            Row(children: [
              offerIconTile(offerIcon(coupon), size: 34),
              const SizedBox(width: 10),
              Flexible(
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [VlColors.red, VlColors.redDeep]),
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [BoxShadow(color: VlColors.red.withValues(alpha: 0.24), blurRadius: 9, offset: const Offset(0, 3))],
                  ),
                  child: Text(
                    offerHeadline(coupon),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: VlText.ui(10.5, weight: FontWeight.w700, color: Colors.white, letter: 0.1),
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            // The code on its own stub, the way a paper coupon carries it.
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: VlColors.paper,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: VlColors.goldSoft),
              ),
              child: Text(code, maxLines: 1, overflow: TextOverflow.ellipsis, style: VlText.mono(11, color: VlColors.redInk, letter: 0.2)),
            ),
            const SizedBox(height: 7),
            Text(line, maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.body(11.5, color: VlColors.muted, height: 1.35)),
            // In the strip every card is the same height, so pin APPLY to the
            // bottom; in the sheet the card sizes to its content instead.
            if (compact) const Spacer() else const SizedBox(height: 12),
            GestureDetector(
              onTap: code.isEmpty ? null : onApply,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 11),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: VlColors.paper,
                  borderRadius: BorderRadius.circular(11),
                  border: Border.all(color: VlColors.red, width: 1.2),
                ),
                child: Text('APPLY', style: VlText.ui(11, weight: FontWeight.w700, color: VlColors.red, letter: 0.14)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// The store's live offers (GET /v1/coupons). Returns the tapped code.
class _OffersSheet extends StatefulWidget {
  /// Offers the cart already fetched, so opening the sheet draws instantly
  /// instead of re-requesting a list that is sitting one widget away.
  final List<Map<String, dynamic>>? seed;
  const _OffersSheet({this.seed});
  @override
  State<_OffersSheet> createState() => _OffersSheetState();
}

class _OffersSheetState extends State<_OffersSheet> {
  List<Map<String, dynamic>>? _coupons;

  @override
  void initState() {
    super.initState();
    final seed = widget.seed;
    if (seed != null && seed.isNotEmpty) {
      _coupons = seed;
      return;
    }
    EcomApi.I.coupons().then((list) {
      if (mounted) setState(() => _coupons = list);
    });
  }

  @override
  Widget build(BuildContext context) {
    final list = _coupons;
    return SizedBox(
      height: MediaQuery.of(context).size.height * 0.6,
      child: Column(children: [
        const SizedBox(height: 12),
        Container(width: 36, height: 4, decoration: BoxDecoration(color: VlColors.rule2, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(children: [
            Text('Offers for you', style: VlText.display(22)),
            const Spacer(),
            Icon(Icons.sell_outlined, size: 16, color: VlColors.red),
          ]),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: list == null
              ? Center(child: CircularProgressIndicator(color: VlColors.red))
              : list.isEmpty
                  ? Center(
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.sell_outlined, size: 34, color: VlColors.rule2),
                        const SizedBox(height: 12),
                        Text('No offers running right now', style: VlText.display(19)),
                        const SizedBox(height: 6),
                        Text('Have a code? Type it in the cart.', style: VlText.body(12, color: VlColors.muted)),
                      ]),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
                      itemCount: list.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 14),
                      itemBuilder: (_, i) => OfferCard(
                        coupon: list[i],
                        onApply: () => Navigator.pop(context, '${list[i]['code'] ?? ''}'.toUpperCase()),
                      ),
                    ),
        ),
      ]),
    );
  }
}

// ── Checkout ─────────────────────────────────────────────────────────────────
class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  int _step = 1;
  List<Address> _addresses = [];
  String? _addrId;

  /// Chosen method id, matching the strings /v1/checkout branches on:
  /// "cod" | "razorpay" | "icici". Empty until the store's config arrives —
  /// the app must never assume a method the admin may have switched off.
  String _pay = '';
  bool _loading = true;
  bool _placing = false;
  String? _addrError;

  /// What Admin → Settings → Payments has enabled, from the same endpoint the
  /// website checkout reads. Null while it is still loading.
  PaymentMethods? _methods;

  /// Store credit, and whether the customer is spending it on this order.
  num _walletBalance = 0;
  bool _useWallet = false;

  /// Native Razorpay checkout, created lazily so the plugin is only touched
  /// when the store actually offers it.
  Razorpay? _razorpay;

  /// The order the current Razorpay attempt belongs to, so the success handler
  /// can confirm it server-side.
  String? _rzpOrderId;
  String? _rzpOrderNumber;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
    _loadWallet();
    _loadPaymentMethods();
  }

  @override
  void dispose() {
    _razorpay?.clear();
    super.dispose();
  }

  /// The store's enabled methods. Read every time checkout opens (and never
  /// cached) so switching a method off in admin takes effect immediately, the
  /// same `no-store` contract the website checkout uses.
  Future<void> _loadPaymentMethods() async {
    // Draw immediately from what launch already fetched, then revalidate.
    if (paymentMethods.value != null) _methods = paymentMethods.value;
    try {
      final m = await EcomApi.I.paymentMethods();
      paymentMethods.value = m;
      if (!mounted) return;
      setState(() {
        _methods = m;
        // Pre-select the first method the store offers, in the website's own
        // order of preference.
        final first = _enabledMethods.isEmpty ? '' : _enabledMethods.first.id;
        if (_pay.isEmpty || _enabledMethods.every((o) => o.id != _pay)) _pay = first;
      });
    } catch (_) {
      // Unreachable config is not "no methods" — keep whatever launch fetched
      // rather than silently hiding a gateway the store has switched on.
      if (mounted) setState(() {});
    }
  }

  Future<void> _loadWallet() async {
    try {
      final b = await EcomApi.I.walletBalance();
      if (mounted) setState(() => _walletBalance = b);
    } catch (_) {
      // A wallet that can't be read is simply not offered.
    }
  }

  /// Order value before store credit — the website's `subtotal + shipping −
  /// discount`, floored at zero.
  num get _payable => EcomCart.I.total;

  /// Credit actually spent: never more than the order is worth.
  num get _walletApplied => _useWallet ? (_walletBalance < _payable ? _walletBalance : _payable) : 0;

  /// What the customer still owes after store credit.
  num get _toPay => (_payable - _walletApplied).clamp(0, double.infinity);

  Future<void> _loadAddresses() async {
    setState(() {
      _loading = true;
      _addrError = null;
    });
    try {
      final list = sortedAddresses(await EcomApi.I.addresses());
      if (!mounted) return;
      setState(() {
        _addresses = list;
        // Preselect the default address, exactly as the website does; fall
        // back to the first saved one.
        _addrId = list.isEmpty ? null : list.firstWhere((a) => a.isDefault, orElse: () => list.first).id;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _addrError = ecomError(e, 'Could not load your addresses.');
        _loading = false;
      });
    }
  }

  Address? get _selectedAddress {
    for (final a in _addresses) {
      if (a.id == _addrId) return a;
    }
    return _addresses.isNotEmpty ? _addresses.first : null;
  }

  Future<void> _placeOrder() async {
    final cartItems = EcomCart.I.items.value;
    if (cartItems.isEmpty) {
      _toast('Your cart is empty');
      context.go('/cart');
      return;
    }
    final addr = _selectedAddress;
    if (addr == null) {
      _toast('Add a delivery address first');
      setState(() => _step = 1);
      return;
    }
    setState(() => _placing = true);
    final cart = EcomCart.I;
    try {
      final res = await EcomApi.I.checkout(
        address: addr,
        paymentMethod: _pay,
        items: cart.items.value,
        shippingAmount: cart.shipping,
        discountAmount: cart.couponDiscount,
        couponCode: cart.coupon?.code,
        walletAmount: _walletApplied,
      );
      final order = (res['order'] as Map?)?.cast<String, dynamic>();
      final orderNumber = order?['orderNumber']?.toString() ?? '';
      final orderId = order?['id']?.toString() ?? '';

      // The gateway hand-off the server prepared for this method. The order
      // already exists as PENDING; only a completed payment confirms it, so
      // the cart is not cleared until the customer is through.
      if (_pay == 'razorpay') {
        final rzp = (res['razorpay'] as Map?)?.cast<String, dynamic>();
        if (rzp == null) {
          setState(() => _placing = false);
          _toast(res['warning']?.toString() ?? 'Online payment is unavailable right now');
          return;
        }
        _openRazorpay(rzp, orderId: orderId, orderNumber: orderNumber);
        return;
      }
      if (_pay == 'icici') {
        final icici = (res['icici'] as Map?)?.cast<String, dynamic>();
        if (icici == null) {
          setState(() => _placing = false);
          _toast(res['warning']?.toString() ?? 'Online payment is unavailable right now');
          return;
        }
        await _openIcici(icici, orderNumber: orderNumber);
        return;
      }

      // Cash on delivery (and anything fully covered by wallet) is done.
      cart.clear();
      if (!mounted) return;
      context.go('/order-success?order=$orderNumber');
    } catch (e) {
      if (!mounted) return;
      setState(() => _placing = false);
      _toast(ecomError(e, 'Could not place the order'));
    }
  }

  /// Hands off to the native Razorpay sheet with the order the server created.
  void _openRazorpay(Map<String, dynamic> rzp, {required String orderId, required String orderNumber}) {
    _rzpOrderId = orderId;
    _rzpOrderNumber = orderNumber;
    final r = _razorpay ??= Razorpay();
    r.clear();
    r.on(Razorpay.EVENT_PAYMENT_SUCCESS, _onRazorpaySuccess);
    r.on(Razorpay.EVENT_PAYMENT_ERROR, _onRazorpayError);
    r.on(Razorpay.EVENT_EXTERNAL_WALLET, (_) {});
    final user = EcomAuth.I.user.value;
    try {
      r.open({
        'key': rzp['keyId'],
        'order_id': rzp['orderId'],
        'amount': rzp['amount'],
        'currency': rzp['currency'] ?? 'INR',
        'name': 'VKC Gold',
        'description': 'Order $orderNumber',
        'prefill': {
          if ((user?.phone ?? '').isNotEmpty) 'contact': user!.phone,
          if ((user?.email ?? '').isNotEmpty) 'email': user!.email,
        },
      });
    } catch (e) {
      setState(() => _placing = false);
      _toast('Could not open the payment screen');
    }
  }

  /// Razorpay reports success on the device; the server still has to verify
  /// the signature before the order counts as paid.
  Future<void> _onRazorpaySuccess(PaymentSuccessResponse r) async {
    final orderId = _rzpOrderId;
    final orderNumber = _rzpOrderNumber ?? '';
    if (orderId == null) return;
    try {
      await EcomApi.I.verifyRazorpay(
        orderId: orderId,
        razorpayOrderId: r.orderId ?? '',
        razorpayPaymentId: r.paymentId ?? '',
        razorpaySignature: r.signature ?? '',
      );
      EcomCart.I.clear();
      if (!mounted) return;
      context.go('/order-success?order=$orderNumber');
    } catch (e) {
      if (!mounted) return;
      setState(() => _placing = false);
      // The money may well have left the customer's account, so send them to
      // the order rather than implying nothing happened.
      _toast(ecomError(e, 'Payment could not be confirmed. Check My Orders.'));
    }
  }

  void _onRazorpayError(PaymentFailureResponse r) {
    if (!mounted) return;
    setState(() => _placing = false);
    // The order stays PENDING and unpaid; the customer can retry from here.
    _toast(r.message?.isNotEmpty == true ? r.message! : 'Payment was not completed');
  }

  /// ICICI Eazypay is a hosted page: the server hands back the encrypted form
  /// and posts back to its own verify endpoint, so the app just shows it.
  Future<void> _openIcici(Map<String, dynamic> icici, {required String orderNumber}) async {
    final url = icici['paymentUrl']?.toString() ?? '';
    if (url.isEmpty) {
      setState(() => _placing = false);
      _toast('Online payment is unavailable right now');
      return;
    }
    final paid = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => GatewayWebView(url: url, fields: icici, title: 'Secure payment')),
    );
    if (!mounted) return;
    if (paid == true) {
      EcomCart.I.clear();
      context.go('/order-success?order=$orderNumber');
    } else {
      setState(() => _placing = false);
      _toast('Payment was not completed');
    }
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  @override
  Widget build(BuildContext context) {
    final cart = EcomCart.I;
    return Scaffold(
      backgroundColor: VlColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'Checkout', onBack: () => _step == 1 ? context.pop() : setState(() => _step--)),
          _stepper(),
          Expanded(
            child: _step == 1 && _loading
                ? const AddressListSkeleton(count: 2)
                : ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      if (_step == 1) ..._addressStep(),
                      if (_step == 2) ..._paymentStep(),
                      if (_step == 3) ..._reviewStep(cart),
                    ],
                  ),
          ),
          _stickyCta(context, cart),
        ]),
      ),
    );
  }

  Widget _stepper() => Padding(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
        child: Row(children: [
          for (var i = 0; i < 3; i++) ...[
            _stepDot(i + 1, ['Address', 'Payment', 'Review'][i]),
            if (i < 2)
              Expanded(child: Container(height: 1, margin: const EdgeInsets.only(bottom: 14), color: _step > i + 1 ? VlColors.green : VlColors.rule)),
          ],
        ]),
      );

  Widget _stepDot(int n, String label) {
    final done = _step > n, active = _step == n;
    final bg = done ? VlColors.green : (active ? VlColors.red : VlColors.paper);
    return Column(children: [
      Container(
        width: 26,
        height: 26,
        decoration: BoxDecoration(color: bg, shape: BoxShape.circle, border: Border.all(color: done ? VlColors.green : (active ? VlColors.red : VlColors.rule2))),
        alignment: Alignment.center,
        child: done ? const Icon(Icons.check, size: 12, color: Colors.white) : Text('$n', style: VlText.ui(12, weight: FontWeight.w600, color: active ? Colors.white : VlColors.muted)),
      ),
      const SizedBox(height: 4),
      Text(label.toUpperCase(), style: VlText.upper(8, letter: 0.18, color: active ? VlColors.ink : VlColors.muted)),
    ]);
  }

  List<Widget> _addressStep() => [
        Text('Where to deliver?', style: VlText.display(22)),
        const SizedBox(height: 12),
        if (_addrError != null) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: VlColors.redTint,
              border: Border.all(color: VlColors.red),
              borderRadius: BorderRadius.circular(VlRadii.md),
            ),
            child: Row(children: [
              Icon(Icons.wifi_off, size: 15, color: VlColors.red),
              const SizedBox(width: 10),
              Expanded(child: Text(_addrError!, style: VlText.body(12, color: VlColors.red))),
              GestureDetector(
                onTap: _loadAddresses,
                child: Text('RETRY', style: VlText.upper(9, color: VlColors.red, letter: 0.18, weight: FontWeight.w600)),
              ),
            ]),
          ),
          const SizedBox(height: 12),
        ] else if (_addresses.isEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text('No saved addresses yet — add the one your saree should travel to.',
                style: VlText.body(13, color: VlColors.muted, height: 1.5)),
          ),
        ..._addresses.map((a) => Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: AddressCard(
                address: a,
                selectable: true,
                selected: _addrId == a.id,
                onSelect: () => setState(() => _addrId = a.id),
                onEdit: () => _editAddress(a),
              ),
            )),
        GestureDetector(
          onTap: _addAddress,
          child: Container(
            padding: const EdgeInsets.symmetric(vertical: 14),
            alignment: Alignment.center,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(VlRadii.md), border: Border.all(color: VlColors.rule2)),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.add, size: 14, color: VlColors.ink),
              const SizedBox(width: 6),
              Text('ADD NEW ADDRESS', style: VlText.ui(12, weight: FontWeight.w500, letter: 0.1)),
            ]),
          ),
        ),
        if (_addresses.isNotEmpty) ...[
          const SizedBox(height: 10),
          Center(
            child: TextButton(
              // Deletes / new defaults made in the book must be reflected in
              // the step the customer comes back to.
              onPressed: () async {
                await context.push('/addresses');
                if (mounted) _loadAddresses();
              },
              child: Text('Manage address book', style: VlText.ui(12, color: VlColors.red)),
            ),
          ),
        ],
      ];

  /// The store's live payment methods, in the order the website lists them.
  ///
  /// Nothing is hardcoded: [_methods] is whatever Admin → Settings → Payments
  /// has switched on, read through the website's own /api/payment-config.
  List<({String id, String title, String note})> get _enabledMethods {
    final m = _methods;
    if (m == null) return const [];
    final owed = _toPay == 0 && _walletApplied > 0
        ? 'Nothing to pay — covered by your wallet'
        : 'Pay ₹${_inr(_toPay)}';
    return [
      if (m.razorpay)
        (id: 'razorpay', title: 'UPI, Cards & Net Banking', note: '$owed securely via Razorpay'),
      if (m.icici) (id: 'icici', title: 'ICICI Payment Gateway', note: '$owed by card or net banking'),
      if (m.cod)
        (
          id: 'cod',
          title: 'Cash on Delivery',
          note: _toPay == 0 && _walletApplied > 0
              ? 'Nothing to pay — covered by your wallet'
              : 'Pay ₹${_inr(_toPay)} when you receive'
        ),
    ];
  }

  /// The selected method's own title, so the review step never has to know
  /// what the ids mean.
  String get _payLabel {
    for (final o in _enabledMethods) {
      if (o.id == _pay) return o.title;
    }
    return 'Not selected';
  }

  List<Widget> _paymentStep() {
    if (_methods == null) {
      return [
        Text('How would you like to pay?', style: VlText.display(22)),
        const SizedBox(height: 18),
        const Skeleton(height: 74, radius: VlRadii.md),
        const SizedBox(height: 10),
        const Skeleton(height: 74, radius: VlRadii.md),
      ];
    }
    final options = _enabledMethods;
    return [
      Text('How would you like to pay?', style: VlText.display(22)),
      const SizedBox(height: 4),
      Text(options.isEmpty ? 'NO PAYMENT METHOD AVAILABLE' : 'CHOOSE A PAYMENT METHOD',
          style: VlText.upper(9, color: VlColors.muted, letter: 0.18)),
      const SizedBox(height: 14),
      // Mirrors the website's "No payment methods are currently available."
      if (options.isEmpty)
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: VlColors.cream,
            borderRadius: BorderRadius.circular(VlRadii.md),
            border: Border.all(color: VlColors.rule2),
          ),
          child: Text('No payment methods are switched on for the store right now. Please try again later.',
              style: VlText.body(12, color: VlColors.muted, height: 1.5)),
        ),
      for (final o in options)
        GestureDetector(
          onTap: () => setState(() => _pay = o.id),
          child: Container(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: VlColors.paper,
              borderRadius: BorderRadius.circular(VlRadii.md),
              border: Border.all(color: _pay == o.id ? VlColors.red : VlColors.rule, width: 1.5),
            ),
            child: Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(o.title, style: VlText.ui(13, weight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(o.note, style: VlText.body(11, color: VlColors.muted)),
                ]),
              ),
              Icon(_pay == o.id ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                  size: 18, color: _pay == o.id ? VlColors.red : VlColors.rule2),
            ]),
          ),
        ),
      if (_walletBalance > 0) ...[
        const SizedBox(height: 4),
        _walletToggle(),
      ],
    ];
  }

  /// Store credit switch — mirrors the website's wallet toggle in its order
  /// summary, including the "fully paid from wallet" case.
  Widget _walletToggle() => GestureDetector(
        onTap: () => setState(() => _useWallet = !_useWallet),
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: _useWallet ? VlColors.redTint : VlColors.paper,
            borderRadius: BorderRadius.circular(VlRadii.md),
            border: Border.all(color: _useWallet ? VlColors.red : VlColors.rule),
          ),
          child: Row(children: [
            Icon(Icons.account_balance_wallet_outlined, size: 16, color: _useWallet ? VlColors.red : VlColors.muted),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Store Wallet', style: VlText.ui(13, weight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(_useWallet ? '₹${_inr(_walletApplied)} applied to this order' : '₹${_inr(_walletBalance)} available',
                    style: VlText.body(11, color: _useWallet ? VlColors.green : VlColors.muted)),
              ]),
            ),
            Container(
              width: 38,
              height: 22,
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: _useWallet ? VlColors.red : VlColors.rule2,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Align(
                alignment: _useWallet ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(width: 18, height: 18, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle)),
              ),
            ),
          ]),
        ),
      );

  List<Widget> _reviewStep(EcomCart cart) => [
        Text('Review your order', style: VlText.display(22)),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: VlColors.paper, border: Border.all(color: VlColors.rule), borderRadius: BorderRadius.circular(VlRadii.md)),
          child: Column(
            children: cart.items.value
                .map((it) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(children: [
                        _thumb(it.imageUrl, w: 50, h: 60),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(it.productName, maxLines: 1, overflow: TextOverflow.ellipsis, style: VlText.ui(12, weight: FontWeight.w500)),
                            Text('Qty ${it.quantity} · ${it.variantColor}', style: VlText.mono(10, color: VlColors.muted)),
                          ]),
                        ),
                        Text('₹${_inr(it.salePrice * it.quantity)}', style: VlText.ui(13, weight: FontWeight.w600)),
                      ]),
                    ))
                .toList(),
          ),
        ),
        const SizedBox(height: 12),
        if (_selectedAddress != null)
          _reviewLine(Icons.location_on_outlined, 'Deliver to · ${_selectedAddress!.fullName}',
              '${_selectedAddress!.oneLine}\n${_selectedAddress!.phone}'),
        const SizedBox(height: 10),
        _reviewLine(Icons.local_shipping_outlined, storeConfig.value.deliveryTitle, storeConfig.value.deliveryNotes),
        const SizedBox(height: 10),
        _reviewLine(Icons.account_balance_wallet_outlined,
            'Payment · ${_toPay == 0 && _walletApplied > 0 ? 'Paid from wallet' : _payLabel}', null),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: VlColors.paper, border: Border.all(color: VlColors.rule), borderRadius: BorderRadius.circular(VlRadii.md)),
          child: Column(children: [
            _sumRow('Subtotal', '₹${_inr(cart.subtotal)}'),
            if (cart.couponDiscount > 0) _sumRow('Coupon (${cart.coupon?.code ?? ''})', '−₹${_inr(cart.couponDiscount)}'),
            _sumRow('Shipping', cart.shipping == 0 ? 'FREE' : '₹${_inr(cart.shipping)}'),
            _shippingNote(cart),
            if (_walletApplied > 0) _sumRow('Wallet', '−₹${_inr(_walletApplied)}'),
            Divider(color: VlColors.rule),
            _sumRow(_walletApplied > 0 ? 'Amount to pay' : 'Total', '₹${_inr(_toPay)}', bold: true),
          ]),
        ),
      ];

  /// The website's small print under the shipping line — either how the rate
  /// was built up, or the threshold that would make it free.
  Widget _shippingNote(EcomCart cart) {
    final cfg = storeConfig.value;
    final n = cart.count;
    if (n == 0) return const SizedBox.shrink();
    final String note;
    if (cart.freeShipping) {
      note = 'Coupon applied — free shipping';
    } else if (cart.shipping > 0) {
      note = '$n saree${n > 1 ? 's' : ''} · ₹${_inr(cfg.firstSareeRate)}'
          '${n > 1 ? ' + ${n - 1}×₹${_inr(cfg.additionalSareeRate)}' : ''}';
    } else {
      note = 'Free above ₹${_inr(cfg.freeShippingThreshold)}';
    }
    return Align(
      alignment: Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Text(note, style: VlText.mono(9, color: cart.shipping == 0 ? VlColors.green : VlColors.muted2, letter: 0.1)),
      ),
    );
  }

  Widget _sumRow(String k, String v, {bool bold = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(k, style: VlText.ui(bold ? 14 : 12, weight: bold ? FontWeight.w600 : FontWeight.w400, color: bold ? VlColors.ink : VlColors.muted)),
          Text(v, style: VlText.ui(bold ? 16 : 12, weight: bold ? FontWeight.w600 : FontWeight.w500)),
        ]),
      );

  Widget _reviewLine(IconData ic, String t, String? s) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: VlColors.paper, border: Border.all(color: VlColors.rule), borderRadius: BorderRadius.circular(VlRadii.md)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Icon(ic, size: 14, color: VlColors.red), const SizedBox(width: 8), Expanded(child: Text(t, style: VlText.ui(12, weight: FontWeight.w600)))]),
          if (s != null) ...[const SizedBox(height: 4), Text(s, style: VlText.body(11, color: VlColors.muted))],
        ]),
      );

  Widget _stickyCta(BuildContext context, EcomCart cart) => Container(
        decoration: BoxDecoration(color: VlColors.paper, border: Border(top: BorderSide(color: VlColors.rule))),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Row(children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_walletApplied > 0 ? 'AMOUNT TO PAY' : 'TOTAL PAYABLE',
                    style: VlText.upper(8, color: VlColors.muted, letter: 0.18)),
                Text('₹${_inr(_toPay)}', style: VlText.ui(20, weight: FontWeight.w600)),
              ]),
              const SizedBox(width: 12),
              Expanded(
                child: GestureDetector(
                  onTap: _placing
                      ? null
                      : () {
                          if (_step == 1 && _selectedAddress == null) {
                            _toast('Add a delivery address');
                            return;
                          }
                          if (_step == 2 && _pay.isEmpty) {
                            _toast(_methods == null
                                ? 'Still loading payment methods'
                                : 'No payment method is available right now');
                            return;
                          }
                          if (_step < 3) {
                            setState(() => _step++);
                          } else {
                            _placeOrder();
                          }
                        },
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                    child: Text(
                      _placing
                          ? 'PLACING…'
                          : (_step == 1
                              ? 'CONTINUE TO PAYMENT'
                              : (_step == 2
                                  ? 'REVIEW ORDER'
                                  : (_toPay == 0 && _walletApplied > 0 ? 'PLACE ORDER · PAY FROM WALLET' : 'PLACE ORDER'))),
                      textAlign: TextAlign.center,
                      style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1),
                    ),
                  ),
                ),
              ),
            ]),
          ),
        ),
      );

  Future<void> _addAddress() async {
    // The customer's first address is saved as their default, matching the
    // website's checkout.
    final added = await showAddressSheet(context, defaultOnSave: _addresses.isEmpty);
    if (added == null || !mounted) return;
    setState(() {
      _addresses = sortedAddresses(
          [..._addresses.map((a) => a.copyWith(isDefault: a.isDefault && !added.isDefault)), added]);
      _addrId = added.id;
    });
  }

  Future<void> _editAddress(Address a) async {
    final saved = await showAddressSheet(context, existing: a);
    if (saved == null || !mounted) return;
    setState(() {
      _addresses = sortedAddresses([
        for (final x in _addresses)
          if (x.id == saved.id) saved else x.copyWith(isDefault: x.isDefault && !saved.isDefault),
      ]);
      _addrId = saved.id;
    });
  }
}

// ── Order success ────────────────────────────────────────────────────────────
class OrderSuccessScreen extends StatelessWidget {
  final String orderNumber;
  const OrderSuccessScreen({super.key, this.orderNumber = ''});
  @override
  Widget build(BuildContext context) {
    // Checkout replaces the stack with this screen, so the system back button
    // had nothing to pop and closed the app on the customer mid-celebration.
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) context.go('/home');
      },
      child: Scaffold(
      backgroundColor: VlColors.canvas,
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Stack(alignment: Alignment.center, children: [
              Container(width: 160, height: 160, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: VlColors.rule2))),
              Container(width: 128, height: 128, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: VlColors.rule2))),
              Container(width: 96, height: 96, decoration: BoxDecoration(color: VlColors.green, shape: BoxShape.circle), child: const Icon(Icons.check, size: 48, color: Colors.white)),
            ]),
            const SizedBox(height: 24),
            if (orderNumber.isNotEmpty) Text('ORDER $orderNumber', style: VlText.upper(10, color: VlColors.red, letter: 0.22)),
            const SizedBox(height: 10),
            Text('Thank you\nfor your order', textAlign: TextAlign.center, style: VlText.display(30, height: 1.15)),
            const SizedBox(height: 8),
            Text('Your saree is being lovingly packed. We’ll send tracking updates to your phone.',
                textAlign: TextAlign.center, style: VlText.body(13, color: VlColors.muted, height: 1.6)),
            const SizedBox(height: 28),
            Row(children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => context.go('/orders'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(VlRadii.md), border: Border.all(color: VlColors.rule2)),
                    child: Text('MY ORDERS', style: VlText.ui(12, weight: FontWeight.w600, letter: 0.1)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GestureDetector(
                  onTap: () => context.go('/home'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                    child: Text('CONTINUE', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
                  ),
                ),
              ),
            ]),
          ]),
        ),
      ),
      ),
    );
  }
}

// ── Hosted gateway ───────────────────────────────────────────────────────────
/// Shows a bank-hosted payment page for the gateways that redirect rather than
/// offer a native sheet (ICICI Eazypay).
///
/// The server hands back the encrypted request it built; this posts that form
/// exactly as the website does, then watches for the verify endpoint's own
/// redirect to /payment/success or /payment/failed to decide the outcome.
/// Nothing here interprets the payment result itself — the server has already
/// decrypted, checked and recorded it by the time we see the URL.
class GatewayWebView extends StatefulWidget {
  final String url;
  final Map<String, dynamic> fields;
  final String title;
  const GatewayWebView({super.key, required this.url, required this.fields, required this.title});

  @override
  State<GatewayWebView> createState() => _GatewayWebViewState();
}

class _GatewayWebViewState extends State<GatewayWebView> {
  late final WebViewController _c;
  bool _loading = true;
  bool _done = false;

  @override
  void initState() {
    super.initState();
    _c = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (url) => _check(url),
        onPageFinished: (url) {
          if (mounted) setState(() => _loading = false);
          _check(url);
        },
        // Sub-resources on a bank page fail routinely; only a failed main
        // frame is worth acting on, and even then the server is the authority.
        onWebResourceError: (_) {},
      ))
      ..loadHtmlString(_autoPostForm());
  }

  /// The same POST the website's checkout submits, wrapped so the WebView can
  /// fire it on load.
  String _autoPostForm() {
    final enc = '${widget.fields['encRequest'] ?? ''}';
    final code = '${widget.fields['accessCode'] ?? ''}';
    return '''
<!doctype html><html><body onload="document.forms[0].submit()">
<form method="post" action="${widget.url}">
<input type="hidden" name="encRequest" value="$enc"/>
<input type="hidden" name="access_code" value="$code"/>
</form></body></html>''';
  }

  void _check(String url) {
    if (_done) return;
    final u = url.toLowerCase();
    if (u.contains('/payment/success')) {
      _done = true;
      Navigator.of(context).pop(true);
    } else if (u.contains('/payment/failed') || u.contains('/payment/cancel')) {
      _done = true;
      Navigator.of(context).pop(false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && !_done) Navigator.of(context).pop(false);
      },
      child: Scaffold(
        backgroundColor: VlColors.paper,
        body: SafeArea(
          child: Column(children: [
            TopBar(title: widget.title, onBack: () => Navigator.of(context).pop(false)),
            if (_loading) LinearProgressIndicator(minHeight: 2, color: VlColors.red, backgroundColor: VlColors.rule),
            Expanded(child: WebViewWidget(controller: _c)),
          ]),
        ),
      ),
    );
  }
}
