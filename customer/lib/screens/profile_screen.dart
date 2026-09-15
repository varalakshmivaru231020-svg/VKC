import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../ecom/ecom_api.dart';
import '../ecom/ecom_config.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';
import '../widgets.dart';
import 'content_screens.dart';

/// Profile tab: the account card, the customer's shopping, the store's
/// content pages and help. Deliberately short.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<EcomUser?>(
      valueListenable: EcomAuth.I.user,
      builder: (context, user, _) {
        final loggedIn = user != null && EcomAuth.I.isLoggedIn;
        return Column(children: [
          const TabHeader(title: 'Profile'),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 6, 20, 32),
              children: [
                _AccountCard(user: loggedIn ? user : null),
                const SizedBox(height: 14),
                _QuickTiles(loggedIn: loggedIn),
                _Group(title: 'My shopping', rows: [
                  _RowSpec(Icons.inventory_2_outlined, 'My Orders', 'Track and manage your orders', () => context.push('/orders')),
                  _RowSpec(Icons.favorite_outline_rounded, 'Wishlist', 'Products you saved', () => context.push('/wishlist')),
                  _RowSpec(Icons.shopping_bag_outlined, 'Cart', 'Ready to check out', () => context.go('/cart')),
                  if (loggedIn) _RowSpec(Icons.location_on_outlined, 'Address Book', 'Delivery addresses', () => context.push('/addresses')),
                ]),
                _Group(title: 'Explore VKC Gold Ikshu', rows: [
                  _RowSpec(Icons.photo_library_outlined, 'Gallery', 'Our unit, fields and farmers', () => context.push('/gallery')),
                  _RowSpec(Icons.auto_stories_outlined, 'About Us', 'Our story, on vkcgoldikshu.com', () => openExternal(context, '$kSiteBase/about')),
                  _RowSpec(Icons.groups_outlined, 'Leadership', 'The people behind VKC', () => openExternal(context, '$kSiteBase/leadership')),
                  _RowSpec(Icons.verified_outlined, 'Credentials', 'Registrations and certifications', () => openExternal(context, '$kSiteBase/credentials')),
                  _RowSpec(Icons.menu_book_outlined, 'Blog', 'Stories from the cane fields', () => context.push('/journal')),
                ]),
                _Group(title: 'Help', rows: [
                  _RowSpec(Icons.chat_bubble_outline_rounded, 'Contact Us', 'Call, WhatsApp or email', () => context.push('/contact')),
                  ..._policyRows(context),
                ]),
                _Group(title: 'Account', rows: [
                  if (loggedIn) ...[
                    _RowSpec(Icons.person_outline_rounded, 'Edit Profile', 'Name & email', () => context.push('/account/edit')),
                    _RowSpec(Icons.logout_rounded, 'Logout', '', () => _logout(context), danger: true),
                  ] else
                    _RowSpec(Icons.login_rounded, 'Sign in', 'Orders, wishlist & faster checkout', () => context.push('/login')),
                ]),
                const SizedBox(height: 20),
                Center(child: Text('VKC GOLD IKSHU · v1.2.4', style: VkText.upper(8, color: VkColors.muted2, letter: 0.24))),
              ],
            ),
          ),
        ]);
      },
    );
  }

  /// The policies, each opened on vkcgoldikshu.com in the phone's browser.
  /// Privacy and Terms use the URLs from Admin → Settings → Legal when set,
  /// otherwise the site's own /privacy and /terms pages.
  List<_RowSpec> _policyRows(BuildContext context) {
    final cfg = storeConfig.value;
    return [
      _RowSpec(Icons.local_shipping_outlined, 'Shipping Policy', 'Dispatch times and delivery', () => openExternal(context, '$kSiteBase/shipping')),
      _RowSpec(Icons.assignment_return_outlined, 'Return & Exchange', 'How returns work', () => openExternal(context, '$kSiteBase/returns')),
      _RowSpec(Icons.shield_outlined, 'Privacy Policy', 'How we handle your data', () => openExternal(context, cfg.privacyUrl.isNotEmpty ? cfg.privacyUrl : '$kSiteBase/privacy')),
      _RowSpec(Icons.gavel_outlined, 'Terms & Conditions', 'The terms of buying from us', () => openExternal(context, cfg.termsUrl.isNotEmpty ? cfg.termsUrl : '$kSiteBase/terms')),
    ];
  }

  Future<void> _logout(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Sign out?', style: VkText.display(22)),
        content: Text('Your cart on this phone will be cleared.', style: VkText.body(13, color: VkColors.muted)),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: Text('Cancel', style: VkText.ui(13, color: VkColors.muted))),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Sign out', style: VkText.ui(13, weight: FontWeight.w600, color: VkColors.error))),
        ],
      ),
    );
    if (ok != true) return;
    await EcomApi.I.logout();
    if (context.mounted) toast(context, 'Signed out');
  }
}

class _AccountCard extends StatelessWidget {
  final EcomUser? user;
  const _AccountCard({required this.user});
  @override
  Widget build(BuildContext context) {
    final u = user;
    if (u == null) {
      return Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [VkColors.primaryInk, VkColors.primaryDeep]),
          borderRadius: BorderRadius.circular(VkRadii.lg),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const BrandLogo(height: 34, wordmark: false),
            const SizedBox(width: 10),
            Expanded(child: Text('Welcome to VKC Gold Ikshu', style: VkText.display(20, color: Colors.white))),
          ]),
          const SizedBox(height: 8),
          Text('Sign in to track orders, save products and check out faster.', style: VkText.body(12.5, color: Colors.white.withValues(alpha: 0.78), height: 1.5)),
          const SizedBox(height: 14),
          PrimaryButton(label: 'Sign in with mobile number', color: VkColors.amber, textColor: VkColors.primaryInk, height: 46, onTap: () => context.push('/login')),
        ]),
      );
    }
    return PressScale(
      onTap: () => context.push('/account/edit'),
      scale: 0.99,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: VkColors.paper, borderRadius: BorderRadius.circular(VkRadii.lg), border: Border.all(color: VkColors.rule)),
        child: Row(children: [
          Container(
            width: 56,
            height: 56,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(colors: [VkColors.amber, VkColors.primary]),
            ),
            alignment: Alignment.center,
            child: Text(u.initials, style: VkText.display(22, color: Colors.white)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(u.hasName ? u.displayName : 'Add your name', maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.display(20)),
              const SizedBox(height: 2),
              if ((u.phone ?? '').isNotEmpty) Text(u.phone!, style: VkText.mono(11.5, color: VkColors.muted)),
              if ((u.email ?? '').isNotEmpty)
                Text(u.email!, maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.mono(11, color: VkColors.muted2)),
            ]),
          ),
          const Icon(Icons.edit_outlined, size: 18, color: VkColors.muted),
        ]),
      ),
    );
  }
}

class _QuickTiles extends StatelessWidget {
  final bool loggedIn;
  const _QuickTiles({required this.loggedIn});
  @override
  Widget build(BuildContext context) {
    final tiles = [
      (Icons.inventory_2_outlined, 'Orders', () => context.push('/orders')),
      (Icons.favorite_outline_rounded, 'Wishlist', () => context.push('/wishlist')),
      (Icons.shopping_bag_outlined, 'Cart', () => context.go('/cart')),
    ];
    return Row(children: [
      for (var i = 0; i < tiles.length; i++) ...[
        Expanded(
          child: PressScale(
            onTap: tiles[i].$3,
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(color: VkColors.paper, border: Border.all(color: VkColors.rule), borderRadius: BorderRadius.circular(VkRadii.md)),
              child: Column(children: [
                Icon(tiles[i].$1, size: 22, color: VkColors.primaryDeep),
                const SizedBox(height: 6),
                Text(tiles[i].$2, style: VkText.ui(11.5, weight: FontWeight.w600)),
              ]),
            ),
          ),
        ),
        if (i < tiles.length - 1) const SizedBox(width: 10),
      ],
    ]);
  }
}

class _RowSpec {
  final IconData icon;
  final String title, subtitle;
  final VoidCallback onTap;
  final bool danger;
  const _RowSpec(this.icon, this.title, this.subtitle, this.onTap, {this.danger = false});
}

class _Group extends StatelessWidget {
  final String title;
  final List<_RowSpec> rows;
  const _Group({required this.title, required this.rows});
  @override
  Widget build(BuildContext context) {
    if (rows.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(top: 22),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, bottom: 8),
          child: Text(title.toUpperCase(), style: VkText.upper(9, letter: 0.18)),
        ),
        Container(
          decoration: BoxDecoration(color: VkColors.paper, borderRadius: BorderRadius.circular(VkRadii.lg), border: Border.all(color: VkColors.rule)),
          clipBehavior: Clip.antiAlias,
          child: Column(children: [
            for (var i = 0; i < rows.length; i++) ...[
              _MenuRow(spec: rows[i]),
              if (i < rows.length - 1) const Divider(height: 1, indent: 62, color: VkColors.rule),
            ],
          ]),
        ),
      ]),
    );
  }
}

class _MenuRow extends StatelessWidget {
  final _RowSpec spec;
  const _MenuRow({required this.spec});
  @override
  Widget build(BuildContext context) {
    final color = spec.danger ? VkColors.error : VkColors.ink;
    return InkWell(
      onTap: spec.onTap,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
        child: Row(children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(color: spec.danger ? VkColors.primaryTint : VkColors.cream, borderRadius: BorderRadius.circular(10)),
            child: Icon(spec.icon, size: 18, color: spec.danger ? VkColors.error : VkColors.primaryDeep),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(spec.title, style: VkText.ui(13.5, weight: FontWeight.w500, color: color)),
              if (spec.subtitle.isNotEmpty) ...[
                const SizedBox(height: 1),
                Text(spec.subtitle, style: VkText.body(11, color: VkColors.muted)),
              ],
            ]),
          ),
          const Icon(Icons.chevron_right_rounded, size: 20, color: VkColors.muted2),
        ]),
      ),
    );
  }
}

// ── Notifications ────────────────────────────────────────────────────────────
class _Notif {
  final String kind; // order | offer
  final String title;
  final String body;
  final String when;
  final String? route;
  final String? code;
  const _Notif(this.kind, this.title, this.body, this.when, {this.route, this.code});
}

String _ago(DateTime? d) {
  if (d == null) return '';
  final diff = DateTime.now().difference(d.toLocal());
  if (diff.inMinutes < 1) return 'now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m';
  if (diff.inHours < 24) return '${diff.inHours}h';
  if (diff.inDays < 7) return '${diff.inDays}d';
  return '${(diff.inDays / 7).floor()}w';
}

/// Notifications composed from the customer's recent orders and the store's
/// active coupons (there is no dedicated notifications API).
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _filters = const ['All', 'Orders', 'Offers'];
  String _filter = 'All';
  List<_Notif> _all = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final items = <_Notif>[];
    try {
      final results = await Future.wait([
        EcomAuth.I.isLoggedIn ? EcomApi.I.orders(limit: 10) : Future.value(<EcomOrder>[]),
        EcomApi.I.coupons(),
      ]);
      final orders = results[0] as List<EcomOrder>;
      final coupons = results[1] as List<Map<String, dynamic>>;
      for (final o in orders) {
        items.add(_Notif('order', _orderTitle(o.status), 'Order ${o.orderNumber} · ₹${inr(o.totalAmount)}', _ago(o.createdAt), route: '/orders/${o.id}'));
      }
      for (final c in coupons.take(6)) {
        final code = (c['code'] ?? '').toString();
        final desc = (c['description'] ?? '').toString();
        items.add(_Notif('offer', code.isEmpty ? 'Offer' : code, desc.isNotEmpty ? desc : 'Tap to copy code', '', code: code));
      }
    } catch (_) {}
    if (!mounted) return;
    setState(() {
      _all = items;
      _loading = false;
    });
  }

  String _orderTitle(String status) {
    switch (status) {
      case 'DELIVERED':
        return 'Order delivered';
      case 'SHIPPED':
      case 'OUT_FOR_DELIVERY':
        return 'Out for delivery';
      case 'PROCESSING':
        return 'Order packed';
      case 'CONFIRMED':
        return 'Order confirmed';
      case 'CANCELLED':
        return 'Order cancelled';
      default:
        return 'Order placed';
    }
  }

  List<_Notif> get _items => _all.where((n) => _filter == 'All' || _filter.toLowerCase().startsWith(n.kind)).toList();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'Notifications', onBack: () => context.canPop() ? context.pop() : context.go('/home')),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
            child: Row(children: [
              for (final f in _filters) ...[
                VkChip(label: f, selected: _filter == f, onTap: () => setState(() => _filter = f)),
                const SizedBox(width: 8),
              ],
            ]),
          ),
          Expanded(child: _content()),
        ]),
      ),
    );
  }

  Widget _content() {
    if (_loading && _all.isEmpty) return const ListRowsSkeleton(count: 6, thumb: 38);
    final items = _items;
    if (items.isEmpty) {
      return StateView(
        icon: Icons.notifications_none_rounded,
        title: 'Nothing here yet',
        body: EcomAuth.I.isLoggedIn ? 'Order updates and offers will show up here.' : 'Sign in to see updates on your orders.',
        cta: EcomAuth.I.isLoggedIn ? null : 'Sign in',
        onCta: () => context.push('/login'),
      );
    }
    return RefreshIndicator(
      color: VkColors.primary,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        children: items.map((n) => _NotifRow(n)).toList(),
      ),
    );
  }
}

class _NotifRow extends StatelessWidget {
  final _Notif n;
  const _NotifRow(this.n);

  @override
  Widget build(BuildContext context) {
    final isOrder = n.kind == 'order';
    return InkWell(
      onTap: () {
        final route = n.route;
        if (route != null) {
          context.push(route);
        } else if (n.code != null && n.code!.isNotEmpty) {
          Clipboard.setData(ClipboardData(text: n.code!));
          toast(context, 'Copied ${n.code}');
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: VkColors.rule))),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: isOrder ? VkColors.cream : VkColors.amberSoft, borderRadius: BorderRadius.circular(10)),
            child: Icon(isOrder ? Icons.local_shipping_outlined : Icons.sell_outlined, size: 17, color: VkColors.primaryDeep),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(n.title, style: VkText.ui(13, weight: FontWeight.w600))),
                if (n.when.isNotEmpty) Text(n.when, style: VkText.mono(10, color: VkColors.muted2)),
              ]),
              const SizedBox(height: 2),
              Text(n.body, style: VkText.body(12, color: VkColors.muted)),
            ]),
          ),
        ]),
      ),
    );
  }
}
