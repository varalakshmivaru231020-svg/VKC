import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../api.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';

/// Order tracking with a delivery timeline — wired to the real
/// GET /public/order/:orderNumber?phone=… endpoint. The single delivery stage
/// the backend returns is expanded into the design's vertical timeline.
class OrderTrackingScreen extends StatefulWidget {
  final String orderNumber;
  final String phone;
  const OrderTrackingScreen({super.key, required this.orderNumber, required this.phone});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  OrderView? _order;
  bool _loading = true;
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
      final o = await Api.I.order(widget.orderNumber, widget.phone);
      if (!mounted) return;
      setState(() {
        _order = o;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not load this order. Check the number and phone.';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(
            title: 'Tracking',
            onBack: () => context.pop(),
            actions: [
              // Was a decorative pill; it now reaches the store.
              GestureDetector(onTap: () => context.push('/contact'), child: _pill('Help')),
            ],
          ),
          Expanded(child: _body()),
        ]),
      ),
    );
  }

  Widget _pill(String t) => Container(
        height: 32,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: VlColors.rule2),
        ),
        child: Text(t, style: VlText.ui(11, color: VlColors.ink)),
      );

  Widget _body() {
    if (_loading) return const ListRowsSkeleton(count: 3);
    if (_error != null || _order == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(30),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.inventory_2_outlined, size: 40, color: VlColors.red),
            const SizedBox(height: 14),
            Text(_error ?? 'Order not found', textAlign: TextAlign.center, style: VlText.body(13, color: VlColors.muted)),
            const SizedBox(height: 16),
            TextButton(onPressed: _load, child: Text('Retry', style: VlText.ui(13, color: VlColors.red))),
          ]),
        ),
      );
    }
    final o = _order!;
    return ListView(
      padding: const EdgeInsets.only(bottom: 24),
      children: [
        // Header
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(o.orderNumber, style: VlText.upper(9, color: VlColors.red, letter: 0.22)),
            const SizedBox(height: 6),
            Text(_headline(o), style: VlText.display(22)),
            const SizedBox(height: 4),
            if (o.address != null)
              Text(o.address!.oneLine, style: VlText.body(12, color: VlColors.muted)),
          ]),
        ),
        _statusBanner(o),
        _itemCard(o),
        _timeline(o),
        // "Download Invoice" is gone: live-show orders carry no invoice
        // document, and the button did nothing when tapped.
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
          child: GestureDetector(
            onTap: () => context.push('/contact'),
            child: _ghostBtn('Need help with this order?'),
          ),
        ),
      ],
    );
  }

  String _headline(OrderView o) {
    if (o.cancelled) return 'Order ${o.deliveryStatus}';
    if (o.delivered) return 'Delivered';
    switch (o.deliveryStatus.toLowerCase()) {
      case 'dispatched':
      case 'shipped':
        return 'On its way to you';
      case 'packed':
        return 'Packed & ready';
      case 'processing':
      case 'confirmed':
        return 'Being prepared';
      default:
        return 'Order placed';
    }
  }

  Widget _statusBanner(OrderView o) {
    final delivered = o.delivered;
    final cancelled = o.cancelled;
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
          child: Icon(
            cancelled ? Icons.close : (delivered ? Icons.check : Icons.local_shipping_outlined),
            size: 18,
            color: Colors.white,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(o.deliveryStatus.isEmpty ? o.status : o.deliveryStatus,
                style: VlText.ui(13, weight: FontWeight.w600, color: VlColors.ink)),
            const SizedBox(height: 2),
            Text(
              o.awb != null && o.awb!.isNotEmpty
                  ? 'AWB ${o.awb}${o.courier != null && o.courier!.isNotEmpty ? ' · ${o.courier}' : ''}'
                  : 'We’ll notify you at every step',
              style: VlText.mono(9, color: VlColors.muted),
            ),
          ]),
        ),
      ]),
    );
  }

  Widget _itemCard(OrderView o) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 14),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: VlColors.paper,
          border: Border.all(color: VlColors.rule),
          borderRadius: BorderRadius.circular(VlRadii.md),
        ),
        child: Row(children: [
          SizedBox(
            width: 64,
            height: 80,
            child: NetImage(url: o.productImage, palette: o.palette, radius: VlRadii.sm),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(o.productName, maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.ui(13, weight: FontWeight.w500)),
              const SizedBox(height: 2),
              Text('Qty 1 · ${o.productSerial}', style: VlText.mono(10, color: VlColors.muted)),
              const SizedBox(height: 6),
              PriceRow(value: o.total, size: 14),
              if (o.pending > 0.01) ...[
                const SizedBox(height: 2),
                Text('₹${o.pending.toStringAsFixed(0)} due on delivery',
                    style: VlText.mono(9, color: VlColors.amber)),
              ],
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _timeline(OrderView o) {
    if (o.timeline.isEmpty) {
      return Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: VlColors.redSoft, borderRadius: BorderRadius.circular(VlRadii.md)),
          child: Text('This order was ${o.deliveryStatus.toLowerCase()}.',
              style: VlText.body(13, color: VlColors.redDeep)),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('DELIVERY TIMELINE', style: VlText.upper(9, letter: 0.22)),
        const SizedBox(height: 14),
        ...List.generate(o.timeline.length, (i) {
          final t = o.timeline[i];
          final last = i == o.timeline.length - 1;
          final dotColor = t.done ? (t.active ? VlColors.red : VlColors.green) : VlColors.paper;
          final borderColor = t.done ? (t.active ? VlColors.red : VlColors.green) : VlColors.rule2;
          return IntrinsicHeight(
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Column(children: [
                Container(
                  width: 16,
                  height: 16,
                  margin: const EdgeInsets.only(top: 3),
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: borderColor, width: 2),
                    boxShadow: t.active
                        ? [BoxShadow(color: VlColors.red.withValues(alpha: 0.2), blurRadius: 0, spreadRadius: 4)]
                        : null,
                  ),
                ),
                if (!last)
                  Expanded(child: Container(width: 2, color: VlColors.rule)),
              ]),
              const SizedBox(width: 14),
              Padding(
                padding: EdgeInsets.only(bottom: last ? 0 : 18),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(t.stage,
                      style: VlText.ui(13,
                          weight: t.active ? FontWeight.w600 : FontWeight.w500,
                          color: t.done ? VlColors.ink : VlColors.muted)),
                  if (t.active) ...[
                    const SizedBox(height: 2),
                    Text('In progress', style: VlText.mono(10, color: VlColors.red)),
                  ],
                ]),
              ),
            ]),
          );
        }),
      ]),
    );
  }

  Widget _ghostBtn(String t) => Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(VlRadii.md),
          border: Border.all(color: VlColors.rule2),
        ),
        child: Text(t, style: VlText.ui(12, color: VlColors.ink)),
      );
}
