import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/app_image.dart";
import "../../../core/widgets/state_widgets.dart";
import "../data/cart_controller.dart";
import "../data/cart_models.dart";

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final items = ref.watch(cartControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Your bag")),
      body: items.isEmpty ? _Empty() : _Body(items: items),
      bottomNavigationBar: items.isEmpty ? null : const _CheckoutBar(),
    );
  }
}

class _Empty extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return AppEmpty(
      title: "Your bag is empty",
      description: "Browse our sarees and add a few to your bag.",
      icon: Icons.shopping_bag_outlined,
      action: ElevatedButton(
        onPressed: () => context.go(RoutePaths.shop),
        child: const Text("Browse sarees"),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.items});
  final List<CartItem> items;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _CartItemCard(item: items[i]),
    );
  }
}

class _CartItemCard extends ConsumerWidget {
  const _CartItemCard({required this.item});
  final CartItem item;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    final cart = ref.read(cartControllerProvider.notifier);

    return Container(
      height: 130,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: colors.parchment),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 100,
            child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                ? AppImage(
                    url: item.imageUrl,
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(8), bottomLeft: Radius.circular(8),
                    ),
                  )
                : Container(
                    decoration: BoxDecoration(
                      color: colors.cream,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(8), bottomLeft: Radius.circular(8),
                      ),
                    ),
                    child: Icon(Icons.image_outlined, color: colors.textMuted),
                  ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.productName,
                          style: theme.textTheme.titleSmall, maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      Text(item.variantColor,
                          style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
                      const SizedBox(height: 8),
                      Text(formatINR(item.salePrice * item.quantity),
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: theme.colorScheme.primary, fontWeight: FontWeight.w600,
                          )),
                    ],
                  ),
                  Row(
                    children: [
                      _qtyButton(context, Icons.remove, item.quantity > 1
                          ? () => cart.updateQty(item.variantId, item.quantity - 1)
                          : null),
                      Container(
                        width: 36, height: 30,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          border: Border.symmetric(vertical: BorderSide(color: colors.parchment)),
                        ),
                        child: Text("${item.quantity}"),
                      ),
                      _qtyButton(context, Icons.add, item.quantity < item.stockQty
                          ? () => cart.updateQty(item.variantId, item.quantity + 1)
                          : null),
                      const Spacer(),
                      IconButton(
                        tooltip: "Remove",
                        icon: const Icon(Icons.delete_outline),
                        onPressed: () => cart.remove(item.variantId),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _qtyButton(BuildContext context, IconData icon, VoidCallback? onTap) {
    final colors = context.appColors;
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 30, height: 30,
        decoration: BoxDecoration(
          border: Border.all(color: colors.parchment),
          borderRadius: const BorderRadius.horizontal(left: Radius.circular(4)),
        ),
        child: Icon(icon, size: 16, color: onTap == null ? colors.textMuted : null),
      ),
    );
  }
}

class _CheckoutBar extends ConsumerWidget {
  const _CheckoutBar();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final colors = context.appColors;
    final subtotal = ref.watch(cartSubtotalProvider);
    final count    = ref.watch(cartCountProvider);

    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: colors.parchment)),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text("Subtotal ($count item${count == 1 ? "" : "s"})",
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: colors.textMuted)),
                  Text(formatINR(subtotal),
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontStyle: FontStyle.italic, color: Theme.of(context).colorScheme.primary,
                      )),
                ],
              ),
            ),
            ElevatedButton.icon(
              onPressed: () => context.push(RoutePaths.checkout),
              icon: const Icon(Icons.arrow_forward, size: 18),
              label: const Text("Checkout"),
              style: ElevatedButton.styleFrom(minimumSize: const Size(160, 48)),
            ),
          ],
        ),
      ),
    );
  }
}
