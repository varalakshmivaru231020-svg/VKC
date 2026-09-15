import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../ecom/ecom_adapter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart';
import '../ecom/ecom_wishlist.dart';
import '../theme.dart';
import '../widgets.dart';

/// Saved products (ecom /v1/wishlist, needs auth).
class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});
  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  bool _loading = true;
  Object? _error;

  @override
  void initState() {
    super.initState();
    if (EcomAuth.I.isLoggedIn) {
      _load();
    } else {
      _loading = false;
    }
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await Wishlist.I.load();
      if (!mounted) return;
      setState(() => _loading = false);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // The grid is the shared wishlist itself, so un-hearting a product here
    // (or anywhere else in the app) removes it in place.
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: ValueListenableBuilder<List<WishlistEntry>>(
          valueListenable: Wishlist.I.entries,
          builder: (context, entries, _) => Column(children: [
            TopBar(
              title: entries.isEmpty ? 'Wishlist' : 'Wishlist · ${entries.length}',
              onBack: () => context.canPop() ? context.pop() : context.go('/home'),
            ),
            Expanded(child: _body(entries)),
          ]),
        ),
      ),
    );
  }

  Widget _body(List<WishlistEntry> entries) {
    if (!EcomAuth.I.isLoggedIn) {
      return StateView(
        icon: Icons.favorite_outline_rounded,
        title: 'Sign in to see your wishlist',
        body: 'Save products you love and find them here on any device.',
        cta: 'Sign in',
        onCta: () => context.push('/login'),
      );
    }
    if (_loading && entries.isEmpty) return const ProductGridSkeleton(count: 4, padding: EdgeInsets.all(20));
    if (_error != null && entries.isEmpty) return StateView.error(_error, onRetry: _load);
    if (entries.isEmpty) {
      return StateView(
        icon: Icons.favorite_outline_rounded,
        title: 'Your wishlist is empty',
        body: 'Tap the heart on a product you love to save it for later.',
        cta: 'Browse products',
        onCta: () => context.go('/shop'),
      );
    }
    return RefreshIndicator(
      color: VkColors.primary,
      onRefresh: _load,
      child: LayoutBuilder(
        builder: (context, box) => GridView.builder(
          gridDelegate: productGridDelegate(context, box.maxWidth - 40),
          padding: const EdgeInsets.all(20),
          itemCount: entries.length,
          itemBuilder: (context, i) {
            final e = entries[i];
            final p = productFromEcom(e.product, variantId: e.variantId);
            return ProductCard(
              key: ValueKey(e.variantId),
              p: p,
              fav: true,
              onFav: () => toggleWishlist(context, p),
              onAdd: () => quickAddToCart(context, p),
              onTap: () => context.push('/product/${p.id}'),
            );
          },
        ),
      ),
    );
  }
}
