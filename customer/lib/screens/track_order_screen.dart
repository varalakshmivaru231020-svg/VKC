import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';
import '../widgets.dart';
import 'order_widgets.dart';

/// Public order tracking (GET /v1/track/:orderNumber) — the app's counterpart
/// to the website's /track-order page. No sign-in: the order number is the key.
class TrackOrderScreen extends StatefulWidget {
  final String? orderNumber;
  const TrackOrderScreen({super.key, this.orderNumber});
  @override
  State<TrackOrderScreen> createState() => _TrackOrderScreenState();
}

class _TrackOrderScreenState extends State<TrackOrderScreen> {
  late final TextEditingController _ctrl = TextEditingController(text: widget.orderNumber ?? '');
  EcomOrder? _order;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    if ((widget.orderNumber ?? '').isNotEmpty) _track();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _track() async {
    final number = _ctrl.text.trim().toUpperCase();
    if (number.isEmpty) {
      setState(() => _error = 'Enter your order number');
      return;
    }
    FocusScope.of(context).unfocus();
    setState(() {
      _loading = true;
      _error = null;
      _order = null;
    });
    try {
      final o = await EcomApi.I.track(number);
      if (!mounted) return;
      setState(() {
        _order = o;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = ecomError(e, 'We couldn’t find an order with that number.');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'Track Order', onBack: () => context.canPop() ? context.pop() : context.go('/orders')),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
              children: [
                Text('Where is my order?', style: VkText.display(24)),
                const SizedBox(height: 6),
                Text('Enter the order number from your confirmation message.',
                    style: VkText.body(13, color: VkColors.muted, height: 1.6)),
                const SizedBox(height: 16),
                _input(),
                if (_error != null) ...[
                  const SizedBox(height: 10),
                  Row(children: [
                    Icon(Icons.error_outline, size: 14, color: VkColors.primary),
                    const SizedBox(width: 6),
                    Expanded(child: Text(_error!, style: VkText.body(12, color: VkColors.primary))),
                  ]),
                ],
                const SizedBox(height: 18),
                if (_loading) Center(child: CircularProgressIndicator(color: VkColors.primary)),
                if (_order != null) ..._result(_order!),
              ],
            ),
          ),
        ]),
      ),
    );
  }

  Widget _input() => Row(children: [
        Expanded(
          child: TextField(
            controller: _ctrl,
            textCapitalization: TextCapitalization.characters,
            textInputAction: TextInputAction.search,
            onSubmitted: (_) => _track(),
            inputFormatters: [LengthLimitingTextInputFormatter(40)],
            style: VkText.ui(14),
            decoration: InputDecoration(
              hintText: 'Your order number',
              hintStyle: VkText.body(13, color: VkColors.muted2),
              filled: true,
              fillColor: VkColors.paper,
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 15),
              enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(VkRadii.md),
                  borderSide: BorderSide(color: _error != null ? VkColors.primary : VkColors.rule)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VkRadii.md), borderSide: BorderSide(color: VkColors.primary)),
            ),
          ),
        ),
        const SizedBox(width: 10),
        GestureDetector(
          onTap: _loading ? null : _track,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
            decoration: BoxDecoration(color: VkColors.primary, borderRadius: BorderRadius.circular(VkRadii.md)),
            child: Text('TRACK', style: VkText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
          ),
        ),
      ]);

  List<Widget> _result(EcomOrder o) {
    final look = orderStatusLook(o.status);
    final steps = orderTimeline(o);
    return [
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: VkColors.paper,
          border: Border.all(color: VkColors.rule),
          borderRadius: BorderRadius.circular(VkRadii.md),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 38,
              height: 38,
              decoration: BoxDecoration(color: look.color, shape: BoxShape.circle),
              child: Icon(look.icon, size: 18, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(look.label, style: VkText.ui(14, weight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text('${o.orderNumber} · placed ${orderWhen(o.createdAt)}', style: VkText.mono(9, color: VkColors.muted, letter: 0.1)),
              ]),
            ),
          ]),
          if ((o.trackingNumber ?? '').isNotEmpty) ...[
            const SizedBox(height: 12),
            Divider(color: VkColors.rule, height: 1),
            const SizedBox(height: 12),
            Row(children: [
              Expanded(
                child: Text('${o.courierPartner ?? 'Courier'} · AWB ${o.trackingNumber}',
                    style: VkText.mono(10, color: VkColors.muted)),
              ),
              if ((o.trackingUrl ?? '').isNotEmpty)
                GestureDetector(
                  onTap: () => launchUrl(Uri.parse(o.trackingUrl!), mode: LaunchMode.externalApplication),
                  child: Text('COURIER SITE', style: VkText.upper(9, color: VkColors.primary, letter: 0.18)),
                ),
            ]),
          ],
        ]),
      ),
      const SizedBox(height: 18),
      if (steps.isNotEmpty)
        OrderTimelineView(steps: steps)
      else
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: VkColors.primarySoft, borderRadius: BorderRadius.circular(VkRadii.md)),
          child: Text('This order is ${look.label.toLowerCase()}.', style: VkText.body(13, color: VkColors.primaryDeep)),
        ),
      const SizedBox(height: 18),
      Text('ITEMS', style: VkText.upper(9, letter: 0.22)),
      const SizedBox(height: 10),
      ...o.items.map((it) => Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(children: [
              SizedBox(width: 50, height: 62, child: NetImage(url: it.imageUrl, radius: VkRadii.sm)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(it.productName, maxLines: 2, overflow: TextOverflow.ellipsis, style: VkText.ui(12, weight: FontWeight.w500)),
                  const SizedBox(height: 2),
                  Text('Qty ${it.quantity} · ${it.variantColor}', style: VkText.mono(9, color: VkColors.muted)),
                ]),
              ),
              Text('₹${orderMoney(it.totalPrice)}', style: VkText.ui(12, weight: FontWeight.w600)),
            ]),
          )),
      const SizedBox(height: 8),
      if (EcomAuth.I.isLoggedIn)
        Center(
          child: TextButton(
            onPressed: () => context.go('/orders'),
            child: Text('See all my orders', style: VkText.ui(12, color: VkColors.primary)),
          ),
        ),
    ];
  }
}
