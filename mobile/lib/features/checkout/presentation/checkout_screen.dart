import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";
import "package:razorpay_flutter/razorpay_flutter.dart";

import "../../../core/errors/failures.dart";
import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/state_widgets.dart";
import "../../addresses/data/address_model.dart";
import "../../addresses/data/address_repository.dart";
import "../../addresses/presentation/addresses_screen.dart" show showAddressFormSheet;
import "../../cart/data/cart_controller.dart";
import "../../splash/data/app_config_repository.dart";
import "../data/checkout_repository.dart";

class CheckoutScreen extends ConsumerStatefulWidget {
  const CheckoutScreen({super.key});

  @override
  ConsumerState<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends ConsumerState<CheckoutScreen> {
  String? _selectedAddressId;
  String _payment = "cod";
  bool _placing = false;
  String? _error;

  late final Razorpay _razorpay;
  CheckoutResult? _pendingOrder;     // set after server creates order, before payment confirms

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay()
      ..on(Razorpay.EVENT_PAYMENT_SUCCESS, _onPaymentSuccess)
      ..on(Razorpay.EVENT_PAYMENT_ERROR,   _onPaymentError)
      ..on(Razorpay.EVENT_EXTERNAL_WALLET, _onExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  num _shippingFor(num subtotal, int qty) {
    final s = ref.read(appConfigProvider).asData?.value.shipping;
    if (s == null) return 0;
    if (subtotal >= s.freeShippingThreshold) return 0;
    return s.firstSareeRate + (qty - 1).clamp(0, 999) * s.additionalSareeRate;
  }

  Future<void> _placeOrder(Address address) async {
    setState(() { _placing = true; _error = null; });
    try {
      final items = ref.read(cartControllerProvider);
      final qty   = items.fold(0, (a, b) => a + b.quantity);
      final subtotal = items.fold<num>(0, (a, b) => a + b.salePrice * b.quantity);
      final shipping = _shippingFor(subtotal, qty);

      final result = await ref.read(checkoutRepositoryProvider).placeOrder(
        address: address,
        items: items,
        paymentMethod: _payment,
        shippingAmount: shipping,
      );

      if (_payment == "razorpay" && result.razorpay != null) {
        _pendingOrder = result;
        _launchRazorpay(result, address, subtotal + shipping);
      } else {
        await _onOrderConfirmed(result.orderNumber);
      }
    } on Failure catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _placing = false);
    }
  }

  void _launchRazorpay(CheckoutResult result, Address address, num totalRupees) {
    final rz = result.razorpay!;
    final options = <String, dynamic>{
      "key":         rz.keyId,
      "amount":      rz.amount,         // already in paise
      "currency":    rz.currency,
      "order_id":    rz.orderId,
      "name":        ref.read(appConfigProvider).asData?.value.site.name ?? "Vijaylakshmi Sarees",
      "description": "Order ${result.orderNumber}",
      "prefill": {
        "name":    address.fullName,
        "contact": address.phone,
      },
      "theme": {"color": "#7B1E2E"},
    };
    try {
      _razorpay.open(options);
    } catch (e) {
      setState(() => _error = "Could not open payment gateway: $e");
    }
  }

  Future<void> _onPaymentSuccess(PaymentSuccessResponse r) async {
    final pending = _pendingOrder;
    if (pending == null) return;
    try {
      await ref.read(checkoutRepositoryProvider).verifyRazorpayPayment(
        orderId:           pending.orderId,
        razorpayOrderId:   r.orderId   ?? "",
        razorpayPaymentId: r.paymentId ?? "",
        razorpaySignature: r.signature ?? "",
      );
      await _onOrderConfirmed(pending.orderNumber);
    } on Failure catch (e) {
      setState(() => _error = "Payment verification failed: ${e.message}");
    }
  }

  void _onPaymentError(PaymentFailureResponse r) {
    setState(() => _error = "Payment failed: ${r.message ?? 'unknown error'}");
  }

  void _onExternalWallet(ExternalWalletResponse r) {
    setState(() => _error = "Selected wallet: ${r.walletName ?? 'unknown'}");
  }

  Future<void> _onOrderConfirmed(String orderNumber) async {
    await ref.read(cartControllerProvider.notifier).clear();
    if (!mounted) return;
    context.go(RoutePaths.orderSuccess, extra: orderNumber);
  }

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final colors = context.appColors;

    final addresses = ref.watch(addressesProvider);
    final items     = ref.watch(cartControllerProvider);
    final qty       = ref.watch(cartCountProvider);
    final subtotal  = ref.watch(cartSubtotalProvider);
    final shipping  = _shippingFor(subtotal, qty);
    final total     = subtotal + shipping;

    final cfg = ref.watch(appConfigProvider).asData?.value;
    final razorpayEnabled = cfg?.payment.razorpay.enabled == true && (cfg?.payment.razorpay.keyId.isNotEmpty ?? false);
    final codEnabled      = cfg?.payment.codEnabled ?? true;

    if (items.isEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) context.go(RoutePaths.cart);
      });
    }

    return Scaffold(
      appBar: AppBar(title: const Text("Checkout")),
      body: addresses.when(
        loading: () => const AppLoading(),
        error: (e, _) => AppErrorView(
          failure: e is Failure ? e : UnknownFailure(e.toString()),
          onRetry: () => ref.invalidate(addressesProvider),
        ),
        data: (list) {
          if (list.isEmpty) {
            return _NoAddress();
          }
          _selectedAddressId ??= (list.firstWhere((a) => a.isDefault, orElse: () => list.first)).id;
          final selected = list.firstWhere((a) => a.id == _selectedAddressId, orElse: () => list.first);

          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            children: [
              _SectionLabel(text: "Delivery address"),
              ...list.map((a) => _AddressTile(
                address: a,
                selected: a.id == _selectedAddressId,
                onTap: () => setState(() => _selectedAddressId = a.id),
              )),
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: () async {
                  await showAddressFormSheet(context);
                  ref.invalidate(addressesProvider);
                },
                icon: const Icon(Icons.add, size: 18),
                label: const Text("Add new address"),
              ),

              const SizedBox(height: 20),
              _SectionLabel(text: "Payment method"),
              if (codEnabled)
                _PaymentTile(
                  value: "cod", group: _payment, label: "Cash on Delivery",
                  subtitle: "Pay in cash when your order arrives",
                  onChanged: (v) => setState(() => _payment = v!),
                ),
              if (razorpayEnabled)
                _PaymentTile(
                  value: "razorpay", group: _payment, label: "Online Payment (Razorpay)",
                  subtitle: "UPI · Cards · NetBanking · Wallets",
                  onChanged: (v) => setState(() => _payment = v!),
                ),

              const SizedBox(height: 20),
              _SectionLabel(text: "Order summary"),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: colors.parchment),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  children: [
                    _row(theme, colors, "Subtotal ($qty item${qty == 1 ? '' : 's'})", formatINR(subtotal)),
                    _row(theme, colors, "Shipping", shipping == 0 ? "Free" : formatINR(shipping)),
                    Divider(color: colors.parchment, height: 20),
                    _row(theme, colors, "Total payable", formatINR(total), strong: true),
                  ],
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(children: [
                    Icon(Icons.error_outline, color: theme.colorScheme.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(_error!, style: TextStyle(color: theme.colorScheme.onErrorContainer))),
                  ]),
                ),
              ],
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _placing ? null : () => _placeOrder(selected),
                child: _placing
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white))
                    : Text("Place order · ${formatINR(total)}"),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _row(ThemeData theme, AppColorsExtension colors, String label, String value, {bool strong = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Expanded(child: Text(label, style: theme.textTheme.bodyMedium?.copyWith(color: strong ? null : colors.textMuted))),
          Text(value, style: strong
              ? theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w600)
              : theme.textTheme.bodyMedium),
        ],
      ),
    );
  }
}

class _NoAddress extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AppEmpty(
      title: "Add a delivery address",
      description: "We need an address before you can place an order.",
      icon: Icons.home_outlined,
      action: ElevatedButton(
        onPressed: () => context.push(RoutePaths.addresses),
        child: const Text("Add address"),
      ),
    );
  }
}

class _AddressTile extends StatelessWidget {
  const _AddressTile({required this.address, required this.selected, required this.onTap});
  final Address address;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: selected ? theme.colorScheme.primary : colors.parchment, width: selected ? 2 : 1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 1),
              child: Icon(selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                  color: selected ? theme.colorScheme.primary : colors.textMuted, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(address.fullName, style: theme.textTheme.titleSmall),
                    if (address.label != null) ...[
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(color: colors.cream, borderRadius: BorderRadius.circular(4)),
                        child: Text(address.label!, style: theme.textTheme.labelSmall?.copyWith(color: colors.textMuted)),
                      ),
                    ],
                  ]),
                  const SizedBox(height: 2),
                  Text(address.oneLine, style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
                  const SizedBox(height: 2),
                  Text(address.phone, style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PaymentTile extends StatelessWidget {
  const _PaymentTile({required this.value, required this.group, required this.label, required this.subtitle, required this.onChanged});
  final String value, group, label, subtitle;
  final ValueChanged<String?> onChanged;

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    final selected = value == group;
    return InkWell(
      onTap: () => onChanged(value),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: selected ? Theme.of(context).colorScheme.primary : colors.parchment, width: selected ? 2 : 1),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Radio<String>(
              value: value, groupValue: group, onChanged: onChanged,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: Theme.of(context).textTheme.titleSmall),
                  Text(subtitle, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: colors.textMuted)),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({required this.text});
  final String text;
  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Text(text.toUpperCase(),
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.2, color: colors.textMuted)),
    );
  }
}
