import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'api.dart';
import 'ecom/ecom_api.dart';
import 'models.dart';
import 'session.dart';
import 'theme.dart';
import 'widgets.dart';

/// Places a REAL order for one product (live or still-buyable closed session).
///
/// Identity comes from the signed-in account — the shopper is never asked to
/// retype a mobile number. Ensures the sales backend has a customer record for
/// them, calls POST /public/orders, surfaces backend errors, and offers order
/// tracking.
///
/// Returns true if an order was placed (callers can refresh their feed).
Future<bool> buyProduct(BuildContext context, Product p) async {
  final messenger = ScaffoldMessenger.of(context);
  void toast(String m) => messenger.showSnackBar(SnackBar(content: Text(m)));

  // A sold piece never starts a checkout, whatever else is true.
  if (!p.orderable) {
    toast(p.soldOut ? 'This piece is already sold' : 'Not available to buy in-app');
    return false;
  }

  // Signed in? Then we already know who this is — asking for the mobile again
  // was both a second identity for the same person and the source of the
  // mismatch: whatever they typed had to happen to equal the number on file.
  final user = EcomAuth.I.user.value;
  var phone = user?.phone ?? Session.I.phone.value;

  if (user == null) {
    // Not signed in. Send them through the real OTP flow rather than taking a
    // bare number on trust — an order has to belong to a verified account.
    final signedIn = await _promptSignIn(context);
    if (!signedIn || !context.mounted) return false;
    phone = EcomAuth.I.user.value?.phone;
  }

  if (phone == null || phone.replaceAll(RegExp(r'\D'), '').length < 10) {
    toast('Add a mobile number to your profile before ordering.');
    return false;
  }

  final confirmed = await showModalBottomSheet<bool>(
    context: context,
    backgroundColor: VlColors.canvas,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(VlRadii.xl))),
    builder: (ctx) => Padding(
      padding: EdgeInsets.fromLTRB(20, 16, 20, 20 + MediaQuery.of(ctx).padding.bottom),
      child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: VlColors.rule2, borderRadius: BorderRadius.circular(2)))),
        const SizedBox(height: 16),
        Row(children: [
          SizedBox(width: 64, height: 80, child: ProductImage(p: p)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(p.name, maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.ui(14, weight: FontWeight.w500)),
              const SizedBox(height: 2),
              Text(p.id, style: VlText.mono(10, color: VlColors.muted)),
              const SizedBox(height: 6),
              PriceRow(value: p.price, size: 18),
            ]),
          ),
        ]),
        const SizedBox(height: 8),
        Text('Ordering to ${_prettyPhone(phone!)}  ·  paid on confirmation',
            style: VlText.mono(9, color: VlColors.muted)),
        const SizedBox(height: 16),
        GestureDetector(
          onTap: () => Navigator.pop(ctx, true),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 15),
            alignment: Alignment.center,
            decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
            child: Text('PLACE ORDER · ₹${p.price.toStringAsFixed(0)}',
                style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
          ),
        ),
      ]),
    ),
  );
  if (confirmed != true || !context.mounted) return false;

  // Placing the order takes two round trips, so say something rather than
  // leaving the sheet dismissed and the screen apparently inert.
  _showPlacing(context);
  try {
    // Live is served by the sales backend, which keeps its own customer book.
    // Make sure this (already authenticated) shopper is in it before ordering —
    // this is the step whose absence produced "Customer not found". It is
    // find-or-create and matches on the last ten digits, so it neither invents
    // anyone nor duplicates a shopper already on file under +91.
    await Api.I.ensureCustomer(
      phone: phone,
      name: EcomAuth.I.user.value?.displayName ?? 'App customer',
    );
    final res = await Api.I.placeOrder(productId: p.uuid!, customerPhone: phone);
    Session.I.setIdentity(phone: phone);
    if (!context.mounted) return true;
    Navigator.of(context, rootNavigator: true).pop(); // dismiss the spinner
    _orderPlaced(context, (res['orderNumber'] ?? '').toString(), phone);
    return true;
  } on DioException catch (e) {
    if (context.mounted) Navigator.of(context, rootNavigator: true).pop();
    final msg = (e.response?.data is Map ? e.response?.data['error'] : null) as String?;
    toast(msg ?? 'Could not place the order. Please try again.');
    return false;
  } catch (_) {
    if (context.mounted) Navigator.of(context, rootNavigator: true).pop();
    toast('Could not place the order. Please try again.');
    return false;
  }
}

/// "+91 9696342161", whatever shape the stored number is in.
///
/// The signed-in account holds the number as +919696342161, and the sheet used
/// to prepend a hardcoded "+91" to all of its digits — so the customer was
/// asked to confirm an order to "+91 919696342161".
String _prettyPhone(String raw) {
  final digits = raw.replaceAll(RegExp(r'\D'), '');
  final local = digits.length > 10 ? digits.substring(digits.length - 10) : digits;
  return '+91 $local';
}

/// Blocking spinner while the order is created.
void _showPlacing(BuildContext context) {
  showDialog<void>(
    context: context,
    barrierDismissible: false,
    useRootNavigator: true,
    builder: (_) => Center(
      child: Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(color: VlColors.paper, borderRadius: BorderRadius.circular(VlRadii.md)),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: VlColors.red)),
          const SizedBox(height: 14),
          Text('Placing your order…', style: VlText.body(12, color: VlColors.muted)),
        ]),
      ),
    ),
  );
}

/// Sends an unauthenticated shopper through the store's own OTP sign-in and
/// reports whether they came back signed in.
Future<bool> _promptSignIn(BuildContext context) async {
  final go = await showDialog<bool>(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: VlColors.canvas,
      title: Text('Sign in to order', style: VlText.display(20)),
      content: Text(
        'Live orders are placed against your account, so we can track and deliver them. '
        'Signing in takes one OTP.',
        style: VlText.body(13, color: VlColors.muted, height: 1.5),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Not now', style: VlText.ui(13, color: VlColors.muted))),
        TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Sign in', style: VlText.ui(13, color: VlColors.red))),
      ],
    ),
  );
  if (go != true || !context.mounted) return false;
  await context.push('/login');
  return EcomAuth.I.isLoggedIn;
}


void _orderPlaced(BuildContext context, String orderNumber, String phone) {
  showDialog(
    context: context,
    builder: (ctx) => AlertDialog(
      backgroundColor: VlColors.canvas,
      title: Row(children: [
        Icon(Icons.check_circle, color: VlColors.green, size: 22),
        const SizedBox(width: 8),
        Expanded(child: Text('Order placed', style: VlText.display(20))),
      ]),
      content: Text(
        orderNumber.isEmpty
            ? 'Your order is confirmed. Track it from My Orders.'
            : 'Order $orderNumber is confirmed. Our team will reach out to finish delivery details.',
        style: VlText.body(13, color: VlColors.muted, height: 1.5),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Done', style: VlText.ui(13, color: VlColors.muted))),
        if (orderNumber.isNotEmpty)
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              context.push('/live-order/$orderNumber?phone=${phone.replaceAll(RegExp(r'\D'), '')}');
            },
            child: Text('Track order', style: VlText.ui(13, color: VlColors.red)),
          ),
      ],
    ),
  );
}
