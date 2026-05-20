import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:go_router/go_router.dart";

import "../../../core/errors/failures.dart";
import "../../../core/routing/route_paths.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/utils/formatters.dart";
import "../../../core/widgets/app_image.dart";
import "../../../core/widgets/state_widgets.dart";
import "../../auth/data/auth_controller.dart";
import "../data/wishlist_models.dart";
import "../data/wishlist_repository.dart";

class WishlistScreen extends ConsumerWidget {
  const WishlistScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authControllerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text("Wishlist")),
      body: !auth.isLoggedIn
          ? _LoggedOut()
          : _List(),
    );
  }
}

class _LoggedOut extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.favorite_border, size: 56, color: Theme.of(context).hintColor),
            const SizedBox(height: 16),
            const Text("Log in to save your favourite sarees", textAlign: TextAlign.center),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.push(RoutePaths.login),
              child: const Text("Log in"),
            ),
          ],
        ),
      ),
    );
  }
}

class _List extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(wishlistProvider);

    return RefreshIndicator(
      onRefresh: () => ref.refresh(wishlistProvider.future),
      child: list.when(
        loading: () => const AppLoading(),
        error: (e, _) {
          final f = e is Failure ? e : UnknownFailure(e.toString());
          return AppErrorView(failure: f, onRetry: () => ref.invalidate(wishlistProvider));
        },
        data: (items) {
          if (items.isEmpty) {
            return const AppEmpty(
              title: "Your wishlist is empty",
              description: "Tap the heart on any saree to save it for later.",
              icon: Icons.favorite_border,
            );
          }
          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (_, i) => _Card(item: items[i]),
          );
        },
      ),
    );
  }
}

class _Card extends ConsumerWidget {
  const _Card({required this.item});
  final WishlistItem item;

  Future<void> _remove(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(wishlistRepositoryProvider).remove(item.variant.id);
      ref.invalidate(wishlistProvider);
    } on Failure catch (e) {
      if (context.mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme  = Theme.of(context);
    final colors = context.appColors;
    final v = item.variant;
    final image = v.images.isNotEmpty ? v.images.first.url : null;

    return InkWell(
      onTap: () => context.push(RoutePaths.productDetail(item.productSlug)),
      borderRadius: BorderRadius.circular(8),
      child: Container(
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
              child: AppImage(
                url: image,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(8), bottomLeft: Radius.circular(8),
                ),
              ),
            ),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
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
                        Text(v.colorName,
                            style: theme.textTheme.bodySmall?.copyWith(color: colors.textMuted)),
                      ],
                    ),
                    Row(
                      children: [
                        Text(formatINR(v.salePrice),
                            style: theme.textTheme.titleMedium?.copyWith(
                              color: theme.colorScheme.primary, fontWeight: FontWeight.w600,
                            )),
                        if (v.hasDiscount) ...[
                          const SizedBox(width: 6),
                          Text(formatINR(v.originalPrice),
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: colors.textMuted, decoration: TextDecoration.lineThrough,
                              )),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
            IconButton(
              tooltip: "Remove",
              onPressed: () => _remove(context, ref),
              icon: Icon(Icons.delete_outline, color: colors.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
