import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_cart.dart';
import '../ecom/ecom_config.dart';
import '../ecom/ecom_models.dart';
import '../ecom/ecom_wishlist.dart';
import '../theme.dart';
import '../widgets.dart';
import 'address_screens.dart';

String _inr(num v) => inr(v);

Widget _thumb(String? url, {double w = 76, double h = 76}) => SizedBox(width: w, height: h, child: NetImage(url: url, radius: VkRadii.sm));

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
    if (dropped != null) toast(context, dropped);
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
      toast(context, res.freeShipping ? 'Free shipping applied' : 'Saved ₹${_inr(res.discount)}');
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
    toast(context, 'Coupon removed');
  }

  Future<void> _loadOffers() async {
    try {
      final list = await EcomApi.I.coupons();
      if (mounted) setState(() => _offers = list);
    } catch (_) {
      // No offers strip; the code field still works.
    }
  }

  Future<void> _showOffers() async {
    final picked = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      builder: (_) => _OffersSheet(seed: _offers),
    );
    if (picked != null && mounted) _applyCoupon(picked);
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: EcomCart.I.items,
      builder: (context, items, _) {
        final cart = EcomCart.I;
        return Column(children: [
          TabHeader(
            title: 'Cart',
            subtitle: items.isEmpty ? 'Nothing in your basket yet' : '${cart.count} item${cart.count == 1 ? '' : 's'}',
            actions: [TopBar.action(Icons.favorite_outline_rounded, () => context.push('/wishlist'), tooltip: 'Wishlist')],
          ),
          if (items.isEmpty)
            Expanded(
              child: StateView(
                icon: Icons.shopping_bag_outlined,
                title: 'Your cart is empty',
                body: 'Add some pure jaggery to begin.',
                cta: 'Browse products',
                onCta: () => context.go('/shop'),
                secondary: EcomAuth.I.isLoggedIn ? 'View wishlist' : null,
                onSecondary: () => context.push('/wishlist'),
              ),
            )
          else ...[
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
                children: [
                  ...items.map(_cartItem),
                  const SizedBox(height: 16),
                  _offersStrip(),
                  _coupon(),
                  const DoubleRule(margin: EdgeInsets.symmetric(vertical: 24)),
                  Text('PRICE DETAILS', style: VkText.upper(9, letter: 0.18)),
                  const SizedBox(height: 10),
                  _priceRow('Subtotal', '₹${_inr(cart.subtotal)}'),
                  if (cart.savings > 0) _priceRow('You save', '₹${_inr(cart.savings)}', color: VkColors.leaf),
                  if (cart.couponDiscount > 0) _priceRow('Coupon', '−₹${_inr(cart.couponDiscount)}', color: VkColors.leaf),
                  _priceRow('Shipping', cart.shipping == 0 ? 'FREE' : '₹${_inr(cart.shipping)}', color: cart.shipping == 0 ? VkColors.leaf : null),
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      cart.freeShipping
                          ? 'Coupon applied — free shipping'
                          : cart.shipping > 0
                              ? 'Add ₹${_inr(storeConfig.value.freeShippingThreshold - cart.subtotal)} more for free shipping'
                              : 'Free above ₹${_inr(storeConfig.value.freeShippingThreshold)}',
                      style: VkText.mono(10.5, color: cart.shipping == 0 ? VkColors.leaf : VkColors.muted),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Divider(color: VkColors.rule),
                  const SizedBox(height: 4),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('Total payable', style: VkText.ui(14, weight: FontWeight.w600)),
                    Text('₹${_inr(cart.total)}', style: VkText.ui(22, weight: FontWeight.w600)),
                  ]),
                  const SizedBox(height: 6),
                  Text('Inclusive of all taxes', style: VkText.body(11, color: VkColors.muted2)),
                ],
              ),
            ),
            _stickyCheckout(context, cart),
          ],
        ]);
      },
    );
  }

  Widget _cartItem(CartItem it) => Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: VkColors.paper,
          border: Border.all(color: VkColors.rule),
          borderRadius: BorderRadius.circular(VkRadii.md),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          GestureDetector(
            onTap: it.productSlug == null ? null : () => context.push('/product/${it.productSlug}'),
            child: _thumb(it.imageUrl),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Expanded(
                  child: GestureDetector(
                    onTap: it.productSlug == null ? null : () => context.push('/product/${it.productSlug}'),
                    child: Text(it.productName, maxLines: 2, overflow: TextOverflow.ellipsis, style: VkText.ui(13, weight: FontWeight.w500, height: 1.3)),
                  ),
                ),
                InkResponse(
                  onTap: () => _removeLine(it),
                  radius: 18,
                  child: const Padding(
                    padding: EdgeInsets.only(left: 6),
                    child: Icon(Icons.close_rounded, size: 18, color: VkColors.muted2),
                  ),
                ),
              ]),
              if (it.meta.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(it.meta, style: VkText.mono(10.5, color: VkColors.muted)),
              ],
              const SizedBox(height: 10),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                PriceRow(value: it.salePrice.toDouble(), mrp: it.originalPrice > it.salePrice ? it.originalPrice.toDouble() : null),
                QtyStepper(
                  value: it.quantity,
                  min: 1,
                  max: it.stockQty > 0 ? it.stockQty : 99,
                  compact: true,
                  onChanged: (n) {
                    if (n < it.quantity && it.quantity <= 1) return;
                    EcomCart.I.setQty(it.variantId, n);
                  },
                ),
              ]),
              const SizedBox(height: 8),
              Row(children: [
                InkWell(
                  onTap: () => _moveToWishlist(it),
                  borderRadius: BorderRadius.circular(6),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.favorite_outline_rounded, size: 14, color: VkColors.muted),
                      const SizedBox(width: 5),
                      Text('Save for later', style: VkText.ui(11, color: VkColors.muted)),
                    ]),
                  ),
                ),
                const Spacer(),
                if (it.stockQty > 0 && it.quantity >= it.stockQty)
                  Text('Max ${it.stockQty} in stock', style: VkText.mono(10, color: VkColors.warning)),
              ]),
            ]),
          ),
        ]),
      );

  /// Saves the line to the wishlist and takes it out of the basket.
  Future<void> _moveToWishlist(CartItem it) async {
    if (!EcomAuth.I.isLoggedIn) {
      context.push('/login');
      return;
    }
    try {
      if (!Wishlist.I.contains(it.variantId)) await Wishlist.I.toggle(it.variantId);
      EcomCart.I.remove(it.variantId);
      if (mounted) {
        final router = GoRouter.of(context);
        toast(context, 'Saved for later', action: 'VIEW', onAction: () => router.push('/wishlist'));
      }
    } catch (e) {
      if (mounted) toast(context, ecomError(e, 'Could not save this item'));
    }
  }

  /// Removes a line, with an undo — a mis-tap shouldn't cost the customer the
  /// product they were choosing.
  void _removeLine(CartItem it) {
    EcomCart.I.remove(it.variantId);
    if (!mounted) return;
    toast(context, 'Removed from cart', action: 'UNDO', onAction: () => EcomCart.I.add(it));
  }

  Widget _offersStrip() {
    if (_offers.isEmpty || EcomCart.I.coupon != null) return const SizedBox.shrink();
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Row(children: [
          const Icon(Icons.auto_awesome_rounded, size: 13, color: VkColors.gold),
          const SizedBox(width: 8),
          Text('OFFERS FOR YOU', style: VkText.upper(9.5, letter: 0.2)),
          const SizedBox(width: 12),
          const Expanded(child: SizedBox(height: 1, child: ColoredBox(color: VkColors.goldSoft))),
        ]),
      ),
      SizedBox(
        height: 188,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
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
          color: VkColors.paper,
          borderRadius: BorderRadius.circular(VkRadii.md),
          border: Border.all(color: err ? VkColors.error : VkColors.rule2),
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
              style: VkText.ui(12.5, weight: FontWeight.w600, letter: 0.1),
              decoration: InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                hintText: 'Have a coupon code?',
                hintStyle: VkText.ui(12.5, color: VkColors.muted, weight: FontWeight.w400),
              ),
            ),
          ),
          const SizedBox(width: 8),
          PrimaryButton(label: 'Apply', expanded: false, height: 40, loading: _applying, onTap: _applying ? null : () => _applyCoupon()),
        ]),
      ),
      if (err)
        Padding(
          padding: const EdgeInsets.only(top: 9, left: 6),
          child: Row(children: [
            const Icon(Icons.error_outline_rounded, size: 12, color: VkColors.error),
            const SizedBox(width: 6),
            Expanded(child: Text(_couponError!, style: VkText.mono(10.5, color: VkColors.error))),
          ]),
        ),
      const SizedBox(height: 12),
      _browseOffers(),
    ]);
  }

  Widget _browseOffers() => Material(
        color: VkColors.primaryTint,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(VkRadii.md), side: const BorderSide(color: VkColors.goldSoft)),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: _showOffers,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              offerIconTile(Icons.redeem_rounded, size: 40),
              const SizedBox(width: 13),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Browse available offers', style: VkText.ui(13, weight: FontWeight.w600)),
                  const SizedBox(height: 3),
                  Text(
                    _offers.isEmpty ? 'See every coupon this store is running' : '${_offers.length} offer${_offers.length > 1 ? 's' : ''} you can use right now',
                    style: VkText.body(11.5, color: VkColors.muted),
                  ),
                ]),
              ),
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right_rounded, size: 20, color: VkColors.primary),
            ]),
          ),
        ),
      );

  Widget _appliedCoupon(CouponResult c) => Container(
        padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
        decoration: BoxDecoration(
          color: VkColors.leafSoft,
          borderRadius: BorderRadius.circular(VkRadii.md),
          border: Border.all(color: VkColors.leaf.withValues(alpha: 0.4)),
        ),
        child: Row(children: [
          Container(
            width: 38,
            height: 38,
            alignment: Alignment.center,
            decoration: BoxDecoration(color: VkColors.leaf, borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.check_rounded, size: 19, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(c.code.toUpperCase(), style: VkText.ui(12.5, weight: FontWeight.w700, letter: 0.1)),
              const SizedBox(height: 3),
              Text(
                c.freeShipping ? 'Free shipping applied' : '₹${_inr(c.discount)} off${(c.description ?? '').isNotEmpty ? ' · ${c.description}' : ''}',
                style: VkText.body(11, color: VkColors.leaf),
              ),
            ]),
          ),
          TextButton(onPressed: _removeCoupon, child: Text('REMOVE', style: VkText.upper(9, color: VkColors.error, letter: 0.14))),
        ]),
      );

  Widget _priceRow(String k, String v, {Color? color}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 7),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(k, style: VkText.body(13, color: VkColors.muted)),
          Text(v, style: VkText.ui(13, weight: FontWeight.w500, color: color ?? VkColors.ink)),
        ]),
      );

  Widget _stickyCheckout(BuildContext context, EcomCart cart) => Container(
        decoration: BoxDecoration(
          color: VkColors.paper,
          border: const Border(top: BorderSide(color: VkColors.rule)),
          boxShadow: [BoxShadow(color: VkColors.ink.withValues(alpha: 0.06), blurRadius: 16, offset: const Offset(0, -4))],
        ),
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        child: Row(children: [
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('TOTAL', style: VkText.upper(8, color: VkColors.muted, letter: 0.18)),
            Text('₹${_inr(cart.total)}', style: VkText.ui(21, weight: FontWeight.w600)),
            if (cart.savings + cart.couponDiscount > 0)
              Text('₹${_inr(cart.savings + cart.couponDiscount)} saved', style: VkText.mono(10, color: VkColors.leaf)),
          ]),
          const SizedBox(width: 14),
          Expanded(
            child: PrimaryButton(
              label: 'Checkout',
              icon: Icons.lock_outline_rounded,
              onTap: () {
                if (!EcomAuth.I.isLoggedIn) {
                  context.push('/login');
                  return;
                }
                context.push('/checkout');
              },
            ),
          ),
        ]),
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

/// The rounded tile every icon in the offers block sits on.
Widget offerIconTile(IconData icon, {double size = 38}) => Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [VkColors.primary, VkColors.primaryDeep]),
        borderRadius: BorderRadius.circular(size / 3),
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
    final line = desc.isNotEmpty ? (terms == null ? desc : '$desc · $terms') : (terms ?? 'Applies to your cart');

    return GestureDetector(
      onTap: code.isEmpty ? null : onApply,
      child: Container(
        width: compact ? 268 : null,
        padding: const EdgeInsets.fromLTRB(14, 13, 14, 13),
        decoration: BoxDecoration(
          color: VkColors.paper,
          borderRadius: BorderRadius.circular(VkRadii.md),
          border: Border.all(color: VkColors.goldSoft),
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
                  decoration: BoxDecoration(color: VkColors.amberSoft, borderRadius: BorderRadius.circular(8)),
                  child: Text(
                    offerHeadline(coupon),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: VkText.ui(10.5, weight: FontWeight.w700, color: VkColors.primaryDeep, letter: 0.1),
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
              decoration: BoxDecoration(
                color: VkColors.cream,
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: VkColors.goldSoft),
              ),
              child: Text(code, maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.mono(11, color: VkColors.primaryInk, letter: 0.1, weight: FontWeight.w700)),
            ),
            const SizedBox(height: 7),
            Text(line, maxLines: 2, overflow: TextOverflow.ellipsis, style: VkText.body(11.5, color: VkColors.muted, height: 1.35)),
            if (compact) const Spacer() else const SizedBox(height: 12),
            GestureDetector(
              onTap: code.isEmpty ? null : onApply,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 11),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: VkColors.paper,
                  borderRadius: BorderRadius.circular(VkRadii.sm),
                  border: Border.all(color: VkColors.primary, width: 1.2),
                ),
                child: Text('APPLY', style: VkText.ui(11, weight: FontWeight.w700, color: VkColors.primary, letter: 0.14)),
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
      height: MediaQuery.sizeOf(context).height * 0.6,
      child: Column(children: [
        const SizedBox(height: 12),
        Container(width: 36, height: 4, decoration: BoxDecoration(color: VkColors.rule2, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 16),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(children: [
            Text('Offers for you', style: VkText.display(22)),
            const Spacer(),
            const Icon(Icons.sell_outlined, size: 16, color: VkColors.primary),
          ]),
        ),
        const SizedBox(height: 12),
        Expanded(
          child: list == null
              ? const Center(child: CircularProgressIndicator())
              : list.isEmpty
                  ? const StateView(icon: Icons.sell_outlined, title: 'No offers running right now', body: 'Have a code? Type it in the cart.')
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
  /// "cod" | "razorpay" | "icici". Empty until the store's config arrives.
  String _pay = '';
  bool _loading = true;
  bool _placing = false;
  String? _addrError;

  /// What Admin → Settings → Payments has enabled. Null while loading.
  PaymentMethods? _methods;

  Razorpay? _razorpay;
  String? _rzpOrderId;
  String? _rzpOrderNumber;

  @override
  void initState() {
    super.initState();
    _loadAddresses();
    _loadPaymentMethods();
  }

  @override
  void dispose() {
    _razorpay?.clear();
    super.dispose();
  }

  /// Read every time checkout opens so switching a method off in admin takes
  /// effect immediately.
  Future<void> _loadPaymentMethods() async {
    if (paymentMethods.value != null) _methods = paymentMethods.value;
    try {
      final m = await EcomApi.I.paymentMethods();
      paymentMethods.value = m;
      if (!mounted) return;
      setState(() {
        _methods = m;
        final first = _enabledMethods.isEmpty ? '' : _enabledMethods.first.id;
        if (_pay.isEmpty || _enabledMethods.every((o) => o.id != _pay)) _pay = first;
      });
    } catch (_) {
      if (mounted) setState(() {});
    }
  }

  num get _payable => EcomCart.I.total;

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
      );
      final order = (res['order'] as Map?)?.cast<String, dynamic>();
      final orderNumber = order?['orderNumber']?.toString() ?? '';
      final orderId = order?['id']?.toString() ?? '';

      // The order already exists as PENDING; only a completed payment
      // confirms it, so the cart is not cleared until the customer is through.
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

      // Cash on delivery is done.
      cart.clear();
      if (!mounted) return;
      context.go('/order-success?order=$orderNumber');
    } catch (e) {
      if (!mounted) return;
      setState(() => _placing = false);
      _toast(ecomError(e, 'Could not place the order'));
    }
  }

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
        'name': 'VKC Gold Ikshu',
        'description': 'Order $orderNumber',
        'theme': {'color': '#B4561A'},
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
      _toast(ecomError(e, 'Payment could not be confirmed. Check My Orders.'));
    }
  }

  void _onRazorpayError(PaymentFailureResponse r) {
    if (!mounted) return;
    setState(() => _placing = false);
    _toast(r.message?.isNotEmpty == true ? r.message! : 'Payment was not completed');
  }

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

  void _toast(String m) => toast(context, m);

  @override
  Widget build(BuildContext context) {
    final cart = EcomCart.I;
    return Scaffold(
      backgroundColor: VkColors.canvas,
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
              Expanded(
                child: AnimatedContainer(
                  duration: VkMotion.base,
                  height: 2,
                  margin: const EdgeInsets.only(bottom: 14),
                  color: _step > i + 1 ? VkColors.leaf : VkColors.rule,
                ),
              ),
          ],
        ]),
      );

  Widget _stepDot(int n, String label) {
    final done = _step > n, active = _step == n;
    final bg = done ? VkColors.leaf : (active ? VkColors.primary : VkColors.paper);
    return Column(children: [
      AnimatedContainer(
        duration: VkMotion.base,
        width: 28,
        height: 28,
        decoration: BoxDecoration(color: bg, shape: BoxShape.circle, border: Border.all(color: done ? VkColors.leaf : (active ? VkColors.primary : VkColors.rule2))),
        alignment: Alignment.center,
        child: done
            ? const Icon(Icons.check_rounded, size: 14, color: Colors.white)
            : Text('$n', style: VkText.ui(12, weight: FontWeight.w600, color: active ? Colors.white : VkColors.muted)),
      ),
      const SizedBox(height: 4),
      Text(label.toUpperCase(), style: VkText.upper(8, letter: 0.14, color: active ? VkColors.ink : VkColors.muted)),
    ]);
  }

  List<Widget> _addressStep() => [
        Text('Where should we deliver?', style: VkText.display(22)),
        const SizedBox(height: 12),
        if (_addrError != null) ...[
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: VkColors.primaryTint,
              border: Border.all(color: VkColors.error),
              borderRadius: BorderRadius.circular(VkRadii.md),
            ),
            child: Row(children: [
              const Icon(Icons.wifi_off_rounded, size: 15, color: VkColors.error),
              const SizedBox(width: 10),
              Expanded(child: Text(_addrError!, style: VkText.body(12, color: VkColors.error))),
              TextButton(onPressed: _loadAddresses, child: Text('RETRY', style: VkText.upper(9, color: VkColors.error, letter: 0.14))),
            ]),
          ),
          const SizedBox(height: 12),
        ] else if (_addresses.isEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text('No saved addresses yet — add the one your order should travel to.', style: VkText.body(13, color: VkColors.muted, height: 1.5)),
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
        OutlineButton(label: 'Add new address', icon: Icons.add_rounded, onTap: _addAddress),
        if (_addresses.isNotEmpty) ...[
          const SizedBox(height: 10),
          Center(
            child: TextButton(
              onPressed: () async {
                await context.push('/addresses');
                if (mounted) _loadAddresses();
              },
              child: Text('Manage address book', style: VkText.ui(12, color: VkColors.primary)),
            ),
          ),
        ],
      ];

  /// The store's live payment methods, in the order the website lists them.
  List<({String id, String title, String note})> get _enabledMethods {
    final m = _methods;
    if (m == null) return const [];
    return [
      if (m.razorpay) (id: 'razorpay', title: 'UPI, Cards & Net Banking', note: 'Pay ₹${_inr(_payable)} securely via Razorpay'),
      if (m.icici) (id: 'icici', title: 'ICICI Payment Gateway', note: 'Pay ₹${_inr(_payable)} by card or net banking'),
      if (m.cod) (id: 'cod', title: 'Cash on Delivery', note: 'Pay ₹${_inr(_payable)} when you receive'),
    ];
  }

  String get _payLabel {
    for (final o in _enabledMethods) {
      if (o.id == _pay) return o.title;
    }
    return 'Not selected';
  }

  List<Widget> _paymentStep() {
    if (_methods == null) {
      return [
        Text('How would you like to pay?', style: VkText.display(22)),
        const SizedBox(height: 18),
        const Skeleton(height: 74, radius: VkRadii.md),
        const SizedBox(height: 10),
        const Skeleton(height: 74, radius: VkRadii.md),
      ];
    }
    final options = _enabledMethods;
    return [
      Text('How would you like to pay?', style: VkText.display(22)),
      const SizedBox(height: 4),
      Text(options.isEmpty ? 'NO PAYMENT METHOD AVAILABLE' : 'CHOOSE A PAYMENT METHOD', style: VkText.upper(9, color: VkColors.muted, letter: 0.16)),
      const SizedBox(height: 14),
      if (options.isEmpty)
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: VkColors.cream, borderRadius: BorderRadius.circular(VkRadii.md), border: Border.all(color: VkColors.rule2)),
          child: Text('No payment methods are switched on for the store right now. Please try again later.', style: VkText.body(12, color: VkColors.muted, height: 1.5)),
        ),
      for (final o in options)
        GestureDetector(
          onTap: () => setState(() => _pay = o.id),
          child: AnimatedContainer(
            duration: VkMotion.base,
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _pay == o.id ? VkColors.primaryTint : VkColors.paper,
              borderRadius: BorderRadius.circular(VkRadii.md),
              border: Border.all(color: _pay == o.id ? VkColors.primary : VkColors.rule, width: 1.5),
            ),
            child: Row(children: [
              Icon(o.id == 'cod' ? Icons.payments_outlined : Icons.credit_card_rounded, size: 20, color: _pay == o.id ? VkColors.primary : VkColors.muted),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(o.title, style: VkText.ui(13, weight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(o.note, style: VkText.body(11, color: VkColors.muted)),
                ]),
              ),
              Icon(_pay == o.id ? Icons.radio_button_checked_rounded : Icons.radio_button_unchecked_rounded, size: 20, color: _pay == o.id ? VkColors.primary : VkColors.rule2),
            ]),
          ),
        ),
    ];
  }

  List<Widget> _reviewStep(EcomCart cart) => [
        Text('Review your order', style: VkText.display(22)),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: VkColors.paper, border: Border.all(color: VkColors.rule), borderRadius: BorderRadius.circular(VkRadii.md)),
          child: Column(
            children: cart.items.value
                .map((it) => Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Row(children: [
                        _thumb(it.imageUrl, w: 52, h: 52),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(it.productName, maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.ui(12, weight: FontWeight.w500)),
                            Text('Qty ${it.quantity}${it.meta.isNotEmpty ? ' · ${it.meta}' : ''}', style: VkText.mono(10, color: VkColors.muted)),
                          ]),
                        ),
                        Text('₹${_inr(it.salePrice * it.quantity)}', style: VkText.ui(13, weight: FontWeight.w600)),
                      ]),
                    ))
                .toList(),
          ),
        ),
        const SizedBox(height: 12),
        if (_selectedAddress != null)
          _reviewLine(Icons.location_on_outlined, 'Deliver to · ${_selectedAddress!.fullName}', '${_selectedAddress!.oneLine}\n${_selectedAddress!.phone}'),
        const SizedBox(height: 10),
        _reviewLine(Icons.local_shipping_outlined, storeConfig.value.deliveryTitle, storeConfig.value.deliveryNotes),
        const SizedBox(height: 10),
        _reviewLine(Icons.payments_outlined, 'Payment · $_payLabel', null),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: VkColors.paper, border: Border.all(color: VkColors.rule), borderRadius: BorderRadius.circular(VkRadii.md)),
          child: Column(children: [
            _sumRow('Subtotal', '₹${_inr(cart.subtotal)}'),
            if (cart.couponDiscount > 0) _sumRow('Coupon (${cart.coupon?.code ?? ''})', '−₹${_inr(cart.couponDiscount)}'),
            _sumRow('Shipping', cart.shipping == 0 ? 'FREE' : '₹${_inr(cart.shipping)}'),
            const Divider(color: VkColors.rule),
            _sumRow('Total', '₹${_inr(_payable)}', bold: true),
          ]),
        ),
      ];

  Widget _sumRow(String k, String v, {bool bold = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(k, style: VkText.ui(bold ? 14 : 12, weight: bold ? FontWeight.w600 : FontWeight.w400, color: bold ? VkColors.ink : VkColors.muted)),
          Text(v, style: VkText.ui(bold ? 16 : 12, weight: bold ? FontWeight.w600 : FontWeight.w500)),
        ]),
      );

  Widget _reviewLine(IconData ic, String t, String? s) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: VkColors.paper, border: Border.all(color: VkColors.rule), borderRadius: BorderRadius.circular(VkRadii.md)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Icon(ic, size: 15, color: VkColors.primary), const SizedBox(width: 8), Expanded(child: Text(t, style: VkText.ui(12, weight: FontWeight.w600)))]),
          if (s != null) ...[const SizedBox(height: 4), Text(s, style: VkText.body(11, color: VkColors.muted, height: 1.5))],
        ]),
      );

  Widget _stickyCta(BuildContext context, EcomCart cart) => Container(
        decoration: const BoxDecoration(color: VkColors.paper, border: Border(top: BorderSide(color: VkColors.rule))),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Row(children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('TOTAL', style: VkText.upper(8, color: VkColors.muted, letter: 0.18)),
                Text('₹${_inr(_payable)}', style: VkText.ui(20, weight: FontWeight.w600)),
              ]),
              const SizedBox(width: 12),
              Expanded(
                child: PrimaryButton(
                  loading: _placing,
                  label: _step == 1 ? 'Continue to payment' : (_step == 2 ? 'Review order' : 'Place order'),
                  onTap: _placing
                      ? null
                      : () {
                          if (_step == 1 && _selectedAddress == null) {
                            _toast('Add a delivery address');
                            return;
                          }
                          if (_step == 2 && _pay.isEmpty) {
                            _toast(_methods == null ? 'Still loading payment methods' : 'No payment method is available right now');
                            return;
                          }
                          if (_step < 3) {
                            setState(() => _step++);
                          } else {
                            _placeOrder();
                          }
                        },
                ),
              ),
            ]),
          ),
        ),
      );

  Future<void> _addAddress() async {
    final added = await showAddressSheet(context, defaultOnSave: _addresses.isEmpty);
    if (added == null || !mounted) return;
    setState(() {
      _addresses = sortedAddresses([..._addresses.map((a) => a.copyWith(isDefault: a.isDefault && !added.isDefault)), added]);
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
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) context.go('/home');
      },
      child: Scaffold(
        backgroundColor: VkColors.canvas,
        body: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              TweenAnimationBuilder<double>(
                tween: Tween(begin: 0.6, end: 1),
                duration: const Duration(milliseconds: 600),
                curve: Curves.elasticOut,
                builder: (_, s, child) => Transform.scale(scale: s, child: child),
                child: Stack(alignment: Alignment.center, children: [
                  Container(width: 160, height: 160, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: VkColors.rule2))),
                  Container(width: 128, height: 128, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: VkColors.rule2))),
                  Container(width: 96, height: 96, decoration: const BoxDecoration(color: VkColors.leaf, shape: BoxShape.circle), child: const Icon(Icons.check_rounded, size: 48, color: Colors.white)),
                ]),
              ),
              const SizedBox(height: 24),
              if (orderNumber.isNotEmpty) Text('ORDER $orderNumber', style: VkText.upper(10, color: VkColors.primary, letter: 0.2)),
              const SizedBox(height: 10),
              Text('Thank you\nfor your order', textAlign: TextAlign.center, style: VkText.display(30, height: 1.15)),
              const SizedBox(height: 8),
              Text('Your jaggery is being carefully packed. We’ll send tracking updates to your phone.',
                  textAlign: TextAlign.center, style: VkText.body(13, color: VkColors.muted, height: 1.6)),
              const SizedBox(height: 28),
              Row(children: [
                Expanded(child: OutlineButton(label: 'My orders', onTap: () => context.go('/orders'))),
                const SizedBox(width: 10),
                Expanded(child: PrimaryButton(label: 'Continue', onTap: () => context.go('/home'))),
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
/// offer a native sheet (ICICI Eazypay). The server hands back the encrypted
/// request it built; this posts that form exactly as the website does, then
/// watches for the verify endpoint's own redirect to decide the outcome.
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
        onWebResourceError: (_) {},
      ))
      ..loadHtmlString(_autoPostForm());
  }

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
        backgroundColor: VkColors.paper,
        body: SafeArea(
          child: Column(children: [
            TopBar(title: widget.title, onBack: () => Navigator.of(context).pop(false)),
            if (_loading) const LinearProgressIndicator(minHeight: 2, backgroundColor: VkColors.rule),
            Expanded(child: WebViewWidget(controller: _c)),
          ]),
        ),
      ),
    );
  }
}
