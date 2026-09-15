import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_config.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';
import '../widgets.dart';
import 'order_widgets.dart';

/// Invoice for a placed order, composed in the app from /v1/orders/:id and the
/// store details in /v1/app-config — the mobile API serves no invoice
/// document, so this is the record the customer can read, copy or send on.
class InvoiceScreen extends StatefulWidget {
  final String orderId;
  const InvoiceScreen({super.key, required this.orderId});
  @override
  State<InvoiceScreen> createState() => _InvoiceScreenState();
}

class _InvoiceScreenState extends State<InvoiceScreen> {
  EcomOrder? _o;
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
      final o = await EcomApi.I.orderById(widget.orderId);
      if (!mounted) return;
      setState(() {
        _o = o;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = ecomError(e, 'Could not load this invoice.');
        _loading = false;
      });
    }
  }

  String _plainText(EcomOrder o) {
    final cfg = storeConfig.value;
    final b = StringBuffer()
      ..writeln(cfg.storeName)
      ..writeln('Invoice for order ${o.orderNumber}')
      ..writeln(DateFormat('d MMM yyyy, h:mm a').format(o.createdAt.toLocal()))
      ..writeln('');
    for (final it in o.items) {
      b.writeln('${it.productName} (${it.variantColor}) × ${it.quantity} — ₹${orderMoney(it.totalPrice)}');
    }
    b
      ..writeln('')
      ..writeln('Subtotal: ₹${orderMoney(o.subtotal)}');
    if (o.discountAmount > 0) b.writeln('Discount: −₹${orderMoney(o.discountAmount)}');
    b.writeln('Shipping: ${o.shippingAmount == 0 ? 'FREE' : '₹${orderMoney(o.shippingAmount)}'}');
    if (o.walletAmountUsed > 0) b.writeln('Wallet: −₹${orderMoney(o.walletAmountUsed)}');
    b.writeln('Total: ₹${orderMoney(o.totalAmount)}');
    return b.toString();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(
            title: 'Invoice',
            onBack: () => context.canPop() ? context.pop() : context.go('/orders'),
            actions: [
              if (_o != null)
                InkResponse(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: _plainText(_o!)));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invoice copied')));
                  },
                  child: SizedBox(width: 36, height: 36, child: Icon(Icons.copy_all_outlined, size: 17, color: VkColors.muted)),
                ),
            ],
          ),
          Expanded(child: _body()),
        ]),
      ),
    );
  }

  Widget _body() {
    if (_loading) return const DetailSkeleton(heroHeight: 180);
    if (_error != null || _o == null) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.receipt_long_outlined, size: 34, color: VkColors.primary),
          const SizedBox(height: 12),
          Text(_error ?? 'Not found', style: VkText.body(13, color: VkColors.muted)),
          const SizedBox(height: 12),
          TextButton(onPressed: _load, child: Text('Retry', style: VkText.ui(13, color: VkColors.primary))),
        ]),
      );
    }
    final o = _o!;
    final cfg = storeConfig.value;
    final addr = o.shippingAddress;
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
      children: [
        Container(
          decoration: BoxDecoration(
            color: VkColors.paper,
            border: Border.all(color: VkColors.rule),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [BoxShadow(color: VkColors.ink.withValues(alpha: 0.06), blurRadius: 18, offset: const Offset(0, 8))],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(children: [
            // Letterhead — the store's own crimson, so the document reads as
            // theirs before a word of it is read.
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 18),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [VkColors.primaryInk, VkColors.primaryDeep],
                ),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Container(width: 18, height: 1, color: VkColors.goldSoft),
                  const SizedBox(width: 8),
                  Text('TAX INVOICE', style: VkText.upper(9, color: VkColors.goldSoft, letter: 0.3)),
                ]),
                const SizedBox(height: 10),
                Text(cfg.storeName, style: VkText.display(23, color: Colors.white)),
                if (cfg.storeAddress.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(cfg.storeAddress, style: VkText.body(10.5, color: Colors.white70, height: 1.55)),
                ],
                if (cfg.phone.isNotEmpty || cfg.email.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text([cfg.phone, cfg.email].where((s) => s.isNotEmpty).join('  ·  '),
                      style: VkText.mono(9, color: VkColors.goldSoft, letter: 0.06)),
                ],
              ]),
            ),
            // Order / date / payment, on cream so it reads as the document's
            // reference block rather than more body copy.
            Container(
              width: double.infinity,
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
              decoration: BoxDecoration(
                color: VkColors.cream,
                border: Border(bottom: BorderSide(color: VkColors.rule)),
              ),
              child: Column(children: [
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(child: _kv('INVOICE FOR', o.orderNumber, mono: true)),
                  Expanded(child: _kv('DATE', DateFormat('d MMM yyyy').format(o.createdAt.toLocal()))),
                ]),
                const SizedBox(height: 14),
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Expanded(child: _kv('PAYMENT', (o.paymentMethod ?? '—').toUpperCase())),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('STATUS', style: VkText.upper(8, color: VkColors.muted, letter: 0.2)),
                      const SizedBox(height: 5),
                      _statusPill(o.paymentStatus),
                    ]),
                  ),
                ]),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (addr != null) ...[
                  Text('BILL TO', style: VkText.upper(8, color: VkColors.muted, letter: 0.2)),
                  const SizedBox(height: 8),
                  // Gold rule down the side, the way a letterhead sets an
                  // address block apart without boxing it in.
                  Container(
                    padding: const EdgeInsets.only(left: 12),
                    decoration: BoxDecoration(border: Border(left: BorderSide(color: VkColors.goldSoft, width: 2))),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('${addr['fullName'] ?? ''}', style: VkText.ui(12.5, weight: FontWeight.w600)),
                      const SizedBox(height: 3),
                      Text(
                        [
                          '${addr['addressLine1'] ?? ''}',
                          if ('${addr['addressLine2'] ?? ''}'.isNotEmpty) '${addr['addressLine2']}',
                          '${addr['city'] ?? ''}, ${addr['state'] ?? ''} — ${addr['pincode'] ?? ''}',
                          '${addr['phone'] ?? ''}',
                        ].where((s) => s.trim().isNotEmpty).join('\n'),
                        style: VkText.body(11, color: VkColors.muted, height: 1.6),
                      ),
                    ]),
                  ),
                  const SizedBox(height: 20),
                ],
                // Items
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                  decoration: BoxDecoration(color: VkColors.cream, borderRadius: BorderRadius.circular(6)),
                  child: Row(children: [
                    Expanded(flex: 5, child: Text('ITEM', style: VkText.upper(8, color: VkColors.muted, letter: 0.2))),
                    Expanded(flex: 1, child: Text('QTY', textAlign: TextAlign.center, style: VkText.upper(8, color: VkColors.muted, letter: 0.2))),
                    Expanded(flex: 2, child: Text('AMOUNT', textAlign: TextAlign.right, style: VkText.upper(8, color: VkColors.muted, letter: 0.2))),
                  ]),
                ),
                ...o.items.map((it) => Container(
                      padding: const EdgeInsets.fromLTRB(10, 12, 10, 12),
                      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: VkColors.rule))),
                      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Expanded(
                          flex: 5,
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(it.productName, style: VkText.ui(12, weight: FontWeight.w500)),
                            const SizedBox(height: 3),
                            Text([it.variantColor, it.sareeCode].where((s) => (s ?? '').isNotEmpty).join(' · '),
                                style: VkText.mono(9, color: VkColors.muted)),
                            Text('₹${orderMoney(it.unitPrice)} each', style: VkText.mono(9, color: VkColors.muted2)),
                          ]),
                        ),
                        Expanded(flex: 1, child: Text('${it.quantity}', textAlign: TextAlign.center, style: VkText.ui(12, weight: FontWeight.w500))),
                        Expanded(flex: 2, child: Text('₹${orderMoney(it.totalPrice)}', textAlign: TextAlign.right, style: VkText.ui(12, weight: FontWeight.w600))),
                      ]),
                    )),
                const SizedBox(height: 14),
                // Totals, right-aligned in their own column so the figures line
                // up rather than sprawling the full width of the sheet.
                Align(
                  alignment: Alignment.centerRight,
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 260),
                    child: Column(children: [
                      _total('Subtotal', '₹${orderMoney(o.subtotal)}'),
                      if (o.discountAmount > 0) _total('Discount', '−₹${orderMoney(o.discountAmount)}', good: true),
                      _total('Shipping', o.shippingAmount == 0 ? 'FREE' : '₹${orderMoney(o.shippingAmount)}',
                          good: o.shippingAmount == 0),
                      if (o.walletAmountUsed > 0) _total('Paid from wallet', '−₹${orderMoney(o.walletAmountUsed)}', good: true),
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: VkColors.cream,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: VkColors.goldSoft),
                        ),
                        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text('TOTAL', style: VkText.upper(9.5, letter: 0.22)),
                          Text('₹${orderMoney(o.totalAmount)}', style: VkText.ui(19, weight: FontWeight.w700)),
                        ]),
                      ),
                    ]),
                  ),
                ),
                const SizedBox(height: 20),
                Center(
                  child: Column(children: [
                    Container(width: 6, height: 6, decoration: const BoxDecoration(color: VkColors.goldSoft, shape: BoxShape.circle)),
                    const SizedBox(height: 10),
                    Text('Prices are inclusive of GST.', style: VkText.mono(9, color: VkColors.muted2, letter: 0.1)),
                    const SizedBox(height: 4),
                    Text('Thank you for shopping with ${cfg.storeName}.',
                        textAlign: TextAlign.center, style: VkText.body(11, color: VkColors.muted)),
                  ]),
                ),
              ]),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        Row(children: [
          Expanded(
            child: GestureDetector(
              onTap: () {
                Clipboard.setData(ClipboardData(text: _plainText(o)));
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invoice copied')));
              },
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                alignment: Alignment.center,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(VkRadii.md), border: Border.all(color: VkColors.rule2)),
                child: Text('COPY', style: VkText.ui(12, weight: FontWeight.w600, letter: 0.1)),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: GestureDetector(
              onTap: () => _whatsapp(o),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 14),
                alignment: Alignment.center,
                decoration: BoxDecoration(color: VkColors.primary, borderRadius: BorderRadius.circular(VkRadii.md)),
                child: Text('SEND ON WHATSAPP', style: VkText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
              ),
            ),
          ),
        ]),
      ],
    );
  }

  Future<void> _whatsapp(EcomOrder o) async {
    final uri = Uri.parse('https://wa.me/?text=${Uri.encodeComponent(_plainText(o))}');
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication) && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('WhatsApp is not available on this phone')));
    }
  }

  Widget _kv(String k, String v, {bool mono = false}) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(k, style: VkText.upper(8, color: VkColors.muted, letter: 0.2)),
        const SizedBox(height: 5),
        Text(v,
            style: mono
                ? VkText.mono(12, color: VkColors.ink, letter: 0.08)
                : VkText.ui(12.5, weight: FontWeight.w600)),
      ]);

  /// Payment status as a tinted pill — the one place on the sheet where colour
  /// carries meaning, so it stays the only coloured element.
  Widget _statusPill(String status) {
    final s = status.toUpperCase();
    final color = s == 'PAID'
        ? VkColors.green
        : s == 'FAILED'
            ? VkColors.primary
            : s.contains('REFUND')
                ? VkColors.gold
                : VkColors.warning;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(5),
        border: Border.all(color: color.withValues(alpha: 0.45)),
      ),
      child: Text(s.replaceAll('_', ' '), style: VkText.upper(9, color: color, letter: 0.14)),
    );
  }

  Widget _total(String k, String v, {bool good = false}) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 5),
        child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(k, style: VkText.body(12, color: VkColors.muted)),
          Text(v, style: VkText.ui(12, weight: FontWeight.w600, color: good ? VkColors.green : VkColors.ink)),
        ]),
      );
}
