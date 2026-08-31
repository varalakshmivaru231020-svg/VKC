import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_cart.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';
import '../widgets.dart';
import 'order_widgets.dart';

String _inr(num v) => orderMoney(v);
String _fmt(DateTime? d) => orderWhen(d);

/// Ecom order detail + tracking, bound to /v1/orders/:id. Also the home of the
/// post-purchase actions: cancel, return, invoice and reorder.
class EcomOrderDetailScreen extends StatefulWidget {
  final String id;
  const EcomOrderDetailScreen({super.key, required this.id});
  @override
  State<EcomOrderDetailScreen> createState() => _EcomOrderDetailScreenState();
}

class _EcomOrderDetailScreenState extends State<EcomOrderDetailScreen> {
  EcomOrder? _o;
  bool _loading = true;
  bool _acting = false;

  /// Label of the action currently running, so only that button shows a
  /// spinner rather than the whole row going ambiguous.
  String? _busy;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final o = await EcomApi.I.orderById(widget.id);
      if (!mounted) return;
      setState(() {
        _o = o;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = ecomError(e, 'Could not load this order.');
        _loading = false;
      });
    }
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(
            title: 'Order',
            onBack: () => context.canPop() ? context.pop() : context.go('/orders'),
            actions: [
              if (_o != null)
                InkResponse(
                  onTap: () => context.push('/orders/${_o!.id}/invoice'),
                  child: SizedBox(width: 36, height: 36, child: Icon(Icons.receipt_long_outlined, size: 18, color: VlColors.muted)),
                ),
            ],
          ),
          Expanded(child: _body()),
        ]),
      ),
    );
  }

  Widget _body() {
    if (_loading && _o == null) return const ListRowsSkeleton(count: 3);
    // Only when nothing is on screen — a failed refresh keeps the order.
    if (_o == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.wifi_off, size: 34, color: VlColors.red),
            const SizedBox(height: 12),
            Text(_error ?? 'Not found', textAlign: TextAlign.center, style: VlText.body(13, color: VlColors.muted)),
            const SizedBox(height: 12),
            TextButton(onPressed: _load, child: Text('Retry', style: VlText.ui(13, color: VlColors.red))),
          ]),
        ),
      );
    }
    final o = _o!;
    final steps = orderTimeline(o);
    return RefreshIndicator(
      color: VlColors.red,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.only(bottom: 28),
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(o.orderNumber, style: VlText.upper(9, color: VlColors.red, letter: 0.22)),
              const SizedBox(height: 6),
              Text(orderStatusLook(o.status).label, style: VlText.display(22)),
              const SizedBox(height: 4),
              Text('Placed ${_fmt(o.createdAt)}', style: VlText.body(12, color: VlColors.muted)),
            ]),
          ),
          _statusBanner(o),
          ...o.items.map(_itemCard),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
            child: steps.isNotEmpty ? OrderTimelineView(steps: steps) : _closedNote(o),
          ),
          if ((o.trackingNumber ?? '').isNotEmpty) _courier(o),
          if (o.shippingAddress != null) _addressBlock(o.shippingAddress!),
          _summary(o),
          _actions(o),
        ],
      ),
    );
  }

  Widget _statusBanner(EcomOrder o) {
    final delivered = o.isDelivered;
    final cancelled = o.status == 'CANCELLED';
    final bg = cancelled ? VlColors.redSoft : (delivered ? const Color(0xFFEAF4EF) : VlColors.cream);
    final fg = cancelled ? VlColors.red : (delivered ? VlColors.green : VlColors.redDeep);
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 16, 20, 4),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(VlRadii.md)),
      child: Row(children: [
        Container(
          width: 38,
          height: 38,
          decoration: BoxDecoration(color: fg, shape: BoxShape.circle),
          child: Icon(cancelled ? Icons.close : (delivered ? Icons.check : Icons.local_shipping_outlined), size: 18, color: Colors.white),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Payment · ${o.paymentStatus}', style: VlText.ui(13, weight: FontWeight.w600, color: VlColors.ink)),
            const SizedBox(height: 2),
            Text(o.paymentMethod == null ? 'We’ll notify you at every step' : 'Method · ${o.paymentMethod!.toUpperCase()}',
                style: VlText.mono(9, color: VlColors.muted)),
          ]),
        ),
      ]),
    );
  }

  Widget _itemCard(OrderItem it) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 2),
        child: GestureDetector(
          onTap: (it.productSlug ?? '').isEmpty ? null : () => context.push('/product/${it.productSlug}'),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: VlColors.paper, border: Border.all(color: VlColors.rule), borderRadius: BorderRadius.circular(VlRadii.md)),
            child: Row(children: [
              SizedBox(width: 56, height: 70, child: NetImage(url: it.imageUrl, radius: VlRadii.sm)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(it.productName, maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.ui(13, weight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text('Qty ${it.quantity} · ${it.variantColor}', style: VlText.mono(10, color: VlColors.muted)),
                ]),
              ),
              Text('₹${_inr(it.totalPrice)}', style: VlText.ui(13, weight: FontWeight.w600)),
            ]),
          ),
        ),
      );

  Widget _closedNote(EcomOrder o) {
    final look = orderStatusLook(o.status);
    final when = o.cancelledAt != null ? ' on ${_fmt(o.cancelledAt)}' : '';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: VlColors.redSoft, borderRadius: BorderRadius.circular(VlRadii.md)),
      child: Text('This order is ${look.label.toLowerCase()}$when.', style: VlText.body(13, color: VlColors.redDeep)),
    );
  }

  Widget _courier(EcomOrder o) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 6, 20, 0),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: VlColors.paper, border: Border.all(color: VlColors.rule), borderRadius: BorderRadius.circular(VlRadii.md)),
          child: Row(children: [
            Icon(Icons.local_shipping_outlined, size: 15, color: VlColors.red),
            const SizedBox(width: 10),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(o.courierPartner ?? 'Courier', style: VlText.ui(12, weight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text('AWB ${o.trackingNumber}', style: VlText.mono(10, color: VlColors.muted)),
              ]),
            ),
            if ((o.trackingUrl ?? '').isNotEmpty)
              GestureDetector(
                onTap: () => launchUrl(Uri.parse(o.trackingUrl!), mode: LaunchMode.externalApplication),
                child: Text('TRACK', style: VlText.upper(9, color: VlColors.red, letter: 0.18)),
              ),
          ]),
        ),
      );

  Widget _addressBlock(Map<String, dynamic> a) {
    String s(String k) => '${a[k] ?? ''}';
    final line2 = s('addressLine2');
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: VlColors.paper, border: Border.all(color: VlColors.rule), borderRadius: BorderRadius.circular(VlRadii.md)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(Icons.location_on_outlined, size: 14, color: VlColors.red),
            const SizedBox(width: 8),
            Text('DELIVERY ADDRESS', style: VlText.upper(9, letter: 0.2)),
          ]),
          const SizedBox(height: 8),
          Text(s('fullName'), style: VlText.ui(12, weight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(
            '${s('addressLine1')}${line2.isNotEmpty ? ', $line2' : ''}, ${s('city')}, ${s('state')} — ${s('pincode')}',
            style: VlText.body(12, color: VlColors.muted, height: 1.5),
          ),
          const SizedBox(height: 2),
          Text(s('phone'), style: VlText.mono(10, color: VlColors.muted)),
        ]),
      ),
    );
  }

  Widget _summary(EcomOrder o) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: VlColors.paper, border: Border.all(color: VlColors.rule), borderRadius: BorderRadius.circular(VlRadii.md)),
          child: Column(children: [
            _row('Subtotal', '₹${_inr(o.subtotal)}'),
            if (o.discountAmount > 0) _row('Discount', '−₹${_inr(o.discountAmount)}'),
            _row('Shipping', o.shippingAmount == 0 ? 'FREE' : '₹${_inr(o.shippingAmount)}'),
            if (o.walletAmountUsed > 0) _row('Wallet', '−₹${_inr(o.walletAmountUsed)}'),
            Divider(color: VlColors.rule),
            _row('Total', '₹${_inr(o.totalAmount)}', bold: true),
          ]),
        ),
      );

  Widget _row(String k, String v, {bool bold = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(k, style: VlText.ui(bold ? 14 : 12, weight: bold ? FontWeight.w600 : FontWeight.w400, color: bold ? VlColors.ink : VlColors.muted)),
          Text(v, style: VlText.ui(bold ? 16 : 12, weight: bold ? FontWeight.w600 : FontWeight.w500)),
        ]),
      );

  // ── Post-purchase actions ──────────────────────────────────────────────────
  Widget _actions(EcomOrder o) {
    final buttons = <Widget>[
      _btn(Icons.receipt_long_outlined, 'INVOICE', () => context.push('/orders/${o.id}/invoice')),
      _btn(Icons.refresh, 'REORDER', () => _reorder(o)),
      if (o.canCancel) _btn(Icons.close, 'CANCEL ORDER', () => _cancelOrReturn(o, isReturn: false), danger: true),
      if (o.canReturn) _btn(Icons.assignment_return_outlined, 'RETURN', () => _cancelOrReturn(o, isReturn: true), danger: true),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('NEED SOMETHING ELSE?', style: VlText.upper(9, letter: 0.22)),
        const SizedBox(height: 10),
        Wrap(spacing: 8, runSpacing: 8, children: buttons),
      ]),
    );
  }

  Widget _btn(IconData ic, String label, VoidCallback onTap, {bool danger = false}) {
    // Reorder walks the order's items one product call at a time, so without
    // this the customer tapped and watched nothing happen.
    final busy = _busy == label;
    return GestureDetector(
      onTap: _acting ? null : onTap,
      child: Opacity(
        opacity: _acting && !busy ? 0.5 : 1,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
          decoration: BoxDecoration(
            color: VlColors.paper,
            borderRadius: BorderRadius.circular(VlRadii.md),
            border: Border.all(color: danger ? VlColors.red : VlColors.rule2),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            SizedBox(
              width: 13,
              height: 13,
              child: busy
                  ? CircularProgressIndicator(strokeWidth: 1.6, color: danger ? VlColors.red : VlColors.ink)
                  : Icon(ic, size: 13, color: danger ? VlColors.red : VlColors.ink),
            ),
            const SizedBox(width: 7),
            Text(busy ? 'ADDING…' : label, style: VlText.upper(9, color: danger ? VlColors.red : VlColors.ink, letter: 0.16)),
          ]),
        ),
      ),
    );
  }

  /// Puts the order's items back in the cart. Prices come from the catalogue,
  /// not the old order, so a reorder is never charged at a stale price.
  Future<void> _reorder(EcomOrder o) async {
    setState(() {
      _acting = true;
      _busy = 'REORDER';
    });
    // "unavailable" and "the network died" are different answers, and telling
    // a customer their sarees are gone when the request never landed is worse
    // than telling them nothing.
    var added = 0, missing = 0, failed = 0;
    for (final it in o.items) {
      final slug = it.productSlug;
      if (slug == null || slug.isEmpty) {
        missing++;
        continue;
      }
      try {
        final (product, _) = await EcomApi.I.productBySlug(slug);
        final variant = product.variants.firstWhere(
          (v) => v.colorName == it.variantColor && v.availableQty > 0,
          orElse: () => product.variants.firstWhere((v) => v.availableQty > 0, orElse: () => product.primaryVariant),
        );
        if (variant.id.isEmpty || variant.availableQty <= 0) {
          missing++;
          continue;
        }
        EcomCart.I.add(CartItem.of(product, variant, quantity: it.quantity));
        added++;
      } catch (e) {
        failed++;
      }
    }
    if (!mounted) return;
    setState(() {
      _acting = false;
      _busy = null;
    });
    if (added == 0) {
      _toast(failed > 0
          ? 'Could not reach the store. Check your connection and try again.'
          : 'These sarees are no longer available');
      return;
    }
    final skipped = missing + failed;
    _toast(skipped == 0 ? 'Added to your cart' : '$added added · $skipped unavailable');
    context.go('/cart');
  }

  Future<void> _cancelOrReturn(EcomOrder o, {required bool isReturn}) async {
    final result = await showModalBottomSheet<({String reason, String remark})>(
      context: context,
      isScrollControlled: true,
      backgroundColor: VlColors.canvas,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(VlRadii.xl))),
      builder: (_) => _ReasonSheet(isReturn: isReturn),
    );
    if (result == null || !mounted) return;
    setState(() => _acting = true);
    try {
      if (isReturn) {
        await EcomApi.I.returnOrder(o.id, result.reason, remark: result.remark);
      } else {
        await EcomApi.I.cancelOrder(o.id, result.reason, remark: result.remark);
      }
      if (!mounted) return;
      _toast(isReturn ? 'Return requested' : 'Order cancelled');
      setState(() => _acting = false);
      _load();
    } catch (e) {
      if (!mounted) return;
      setState(() => _acting = false);
      _toast(ecomError(e, isReturn ? 'Could not request the return' : 'Could not cancel the order'));
    }
  }
}

/// Reason picker for cancel / return — the store needs a reason on both, and
/// an optional note in the customer's own words.
class _ReasonSheet extends StatefulWidget {
  final bool isReturn;
  const _ReasonSheet({required this.isReturn});
  @override
  State<_ReasonSheet> createState() => _ReasonSheetState();
}

class _ReasonSheetState extends State<_ReasonSheet> {
  static const _cancelReasons = [
    'Ordered by mistake',
    'Found a better price',
    'Delivery is taking too long',
    'Want to change the address',
    'Other',
  ];
  static const _returnReasons = [
    'Damaged or defective',
    'Wrong item delivered',
    'Colour differs from the photos',
    'Quality not as expected',
    'Other',
  ];

  String? _reason;
  final _remark = TextEditingController();
  bool _showError = false;

  @override
  void dispose() {
    _remark.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reasons = widget.isReturn ? _returnReasons : _cancelReasons;
    return Padding(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: VlColors.rule2, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),
          Text(widget.isReturn ? 'Request a return' : 'Cancel this order', style: VlText.display(22)),
          const SizedBox(height: 4),
          Text(
            widget.isReturn
                ? 'Tell us what went wrong and we’ll arrange the pickup.'
                : 'Let us know why — it helps us do better.',
            style: VlText.body(12, color: VlColors.muted, height: 1.5),
          ),
          const SizedBox(height: 16),
          ...reasons.map((r) => GestureDetector(
                onTap: () => setState(() {
                  _reason = r;
                  _showError = false;
                }),
                behavior: HitTestBehavior.opaque,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 9),
                  child: Row(children: [
                    Icon(_reason == r ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                        size: 17, color: _reason == r ? VlColors.red : VlColors.rule2),
                    const SizedBox(width: 10),
                    Expanded(child: Text(r, style: VlText.ui(13, weight: _reason == r ? FontWeight.w600 : FontWeight.w400))),
                  ]),
                ),
              )),
          if (_showError)
            Padding(
              padding: const EdgeInsets.only(top: 4),
              child: Text('Choose a reason', style: VlText.body(11, color: VlColors.red)),
            ),
          const SizedBox(height: 10),
          TextField(
            controller: _remark,
            maxLines: 3,
            style: VlText.ui(13),
            decoration: InputDecoration(
              hintText: 'Anything else we should know? (optional)',
              hintStyle: VlText.body(12, color: VlColors.muted2),
              filled: true,
              fillColor: VlColors.paper,
              contentPadding: const EdgeInsets.all(14),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.rule)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.red)),
            ),
          ),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () {
              if (_reason == null) {
                setState(() => _showError = true);
                return;
              }
              Navigator.pop(context, (reason: _reason!, remark: _remark.text.trim()));
            },
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 15),
              alignment: Alignment.center,
              decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
              child: Text(widget.isReturn ? 'REQUEST RETURN' : 'CANCEL ORDER',
                  style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
            ),
          ),
          const SizedBox(height: 6),
          Center(
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(widget.isReturn ? 'Not now' : 'Keep my order', style: VlText.ui(12, color: VlColors.muted)),
            ),
          ),
        ]),
      ),
    );
  }
}
