import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_config.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';
import '../widgets.dart';

String _inr(num v) => v.toStringAsFixed(0).replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (m) => ',');

// ── Profile ──────────────────────────────────────────────────────────────────
// Heritage hero + avatar + loyalty card + quick stats + menu. Identity comes
// from the ecom auth session; Logout clears it.
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  num? _wallet;

  @override
  void initState() {
    super.initState();
    _loadWallet();
    EcomAuth.I.user.addListener(_loadWallet);
  }

  @override
  void dispose() {
    EcomAuth.I.user.removeListener(_loadWallet);
    super.dispose();
  }

  Future<void> _loadWallet() async {
    if (!EcomAuth.I.isLoggedIn) {
      if (mounted) setState(() => _wallet = null);
      return;
    }
    try {
      final b = await EcomApi.I.walletBalance();
      if (mounted) setState(() => _wallet = b);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder(
      valueListenable: EcomAuth.I.user,
      builder: (context, user, _) {
        final name = user?.displayName ?? 'Guest';
        final phone = user?.phone ?? '+91 ••••• •••••';
        return ListView(
          padding: EdgeInsets.zero,
          children: [
            _hero(context, name, phone),
            _loyaltyCard(context, user != null),
            _quickStats(context),
            const DoubleRule(margin: EdgeInsets.fromLTRB(20, 20, 20, 6)),
            _menu(context, loggedIn: user != null),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 24),
              child: Column(children: [
                Lozenge(color: VlColors.rule2),
                const SizedBox(height: 8),
                Text('VKC GOLD · v1.0 · SINCE 1988', style: VlText.upper(8, color: VlColors.muted2, letter: 0.3)),
              ]),
            ),
          ],
        );
      },
    );
  }

  Widget _hero(BuildContext context, String name, String phone) {
    return Stack(clipBehavior: Clip.none, children: [
      SizedBox(
        height: 130,
        width: double.infinity,
        child: Stack(fit: StackFit.expand, children: [
          const Silk(palette: 0, radius: 0),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [VlColors.redInk.withValues(alpha: 0.5), VlColors.redInk.withValues(alpha: 0.85)],
              ),
            ),
          ),
          Positioned(
            top: 14,
            right: 16,
            child: GestureDetector(
              onTap: () => EcomAuth.I.isLoggedIn ? context.push('/profile/edit') : context.push('/login'),
              child: _glassBtn(Icons.settings_outlined),
            ),
          ),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.only(top: 80),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: VlColors.paper,
              borderRadius: BorderRadius.circular(VlRadii.lg),
              border: Border.all(color: VlColors.rule),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.06), blurRadius: 20, offset: const Offset(0, 8))],
            ),
            child: Row(children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(colors: [VlColors.gold, Color(0xFF6B4E1E)]),
                  border: Border.all(color: Colors.white, width: 3),
                ),
                alignment: Alignment.center,
                child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'G',
                    style: VlText.display(26, color: Colors.white, style: FontStyle.italic)),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(name, style: VlText.display(18)),
                  const SizedBox(height: 2),
                  // displayName falls back to the phone number when the
                  // customer has not given a name — printing it twice, once in
                  // serif and once in mono, read as a rendering fault.
                  if (name != phone)
                    Text(phone, style: VlText.mono(10, color: VlColors.muted))
                  else
                    Text('Add your name in Edit Profile', style: VlText.mono(10, color: VlColors.muted2)),
                  // Was "HERITAGE CLUB MEMBER" — the store runs no membership
                  // tier, so it showed a status nobody actually holds.
                  if ((EcomAuth.I.user.value?.email ?? '').isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(EcomAuth.I.user.value!.email!,
                        maxLines: 1, overflow: TextOverflow.ellipsis, style: VlText.mono(10, color: VlColors.muted2)),
                  ],
                ]),
              ),
            ]),
          ),
        ),
      ),
    ]);
  }

  Widget _glassBtn(IconData ic) => Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white.withValues(alpha: 0.18),
          border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
        ),
        child: Icon(ic, size: 16, color: Colors.white),
      );

  Widget _loyaltyCard(BuildContext context, bool loggedIn) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: GestureDetector(
        onTap: loggedIn ? () => context.push('/wallet') : null,
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [VlColors.ink, VlColors.redInk],
            ),
            borderRadius: BorderRadius.circular(VlRadii.md),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text('STORE WALLET', style: VlText.upper(9, color: VlColors.goldSoft, letter: 0.22)),
              const Spacer(),
              if (loggedIn) Icon(Icons.chevron_right, size: 15, color: VlColors.goldSoft),
            ]),
            const SizedBox(height: 6),
            Row(crossAxisAlignment: CrossAxisAlignment.baseline, textBaseline: TextBaseline.alphabetic, children: [
              Text(
                !loggedIn ? '—' : (_wallet == null ? '…' : '₹${_wallet!.toStringAsFixed(0)}'),
                style: VlText.display(32, color: Colors.white),
              ),
              const SizedBox(width: 8),
              Text('BALANCE', style: VlText.upper(10, color: VlColors.goldSoft, letter: 0.18)),
            ]),
            const SizedBox(height: 12),
            const Divider(color: Color(0x33E8D5A8), height: 1),
            const SizedBox(height: 10),
            Text(
              !loggedIn ? 'Sign in to view your store credit.' : 'Switch it on at checkout to spend it.',
              style: VlText.mono(10, color: Colors.white70),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _quickStats(BuildContext context) {
    final stats = [
      (Icons.inventory_2_outlined, 'ORDERS', '/orders'),
      (Icons.favorite_border, 'WISHLIST', '/wishlist'),
      (Icons.shopping_bag_outlined, 'CART', '/cart'),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Row(
        children: [
          for (final s in stats) ...[
            Expanded(
              child: GestureDetector(
                onTap: () => context.go(s.$3),
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: VlColors.paper,
                    border: Border.all(color: VlColors.rule),
                    borderRadius: BorderRadius.circular(VlRadii.md),
                  ),
                  child: Column(children: [
                    Icon(s.$1, size: 22, color: VlColors.redDeep),
                    const SizedBox(height: 8),
                    Text(s.$2, style: VlText.upper(8, color: VlColors.muted, letter: 0.2)),
                  ]),
                ),
              ),
            ),
            if (s != stats.last) const SizedBox(width: 8),
          ],
        ],
      ),
    );
  }

  Widget _menu(BuildContext context, {required bool loggedIn}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _section('My Shopping'),
        // Tracking lives on the order itself (My Orders → order → Track), so a
        // separate "Track an Order" row only asked for a number the customer
        // would have had to go and look up. The /track-order route stays.
        _row(context, Icons.inventory_2_outlined, 'My Orders', 'Track your orders', to: '/orders'),
        _row(context, Icons.favorite_border, 'Wishlist', 'Saved products', to: '/wishlist'),
        if (loggedIn) ...[
          _row(context, Icons.location_on_outlined, 'Address Book', 'Delivery addresses',
              onTap: () => context.push('/addresses')),
          _row(context, Icons.account_balance_wallet_outlined, 'Store Wallet', 'Balance & activity',
              onTap: () => context.push('/wallet')),
          _row(context, Icons.rate_review_outlined, 'My Reviews', 'Rate what you’ve received',
              onTap: () => context.push('/reviews')),
        ],
        // Live Shopping is reachable from the bottom nav's centre button; the
        // duplicate menu row is gone and the section closes up behind it.
        _section('Discover'),
        _row(context, Icons.videocam_outlined, 'Book a Video Call', 'Shop with us, live',
            onTap: () => context.push('/video-booking')),
        _row(context, Icons.menu_book_outlined, 'Journal', 'Notes from the farm', onTap: () => context.push('/journal')),
        // A "Stories" row linked to a page the site no longer has — the row
        // is gone rather than opening a dead page.
        _row(context, Icons.photo_library_outlined, 'Gallery', 'Photos & videos from our unit',
            onTap: () => context.push('/pages/gallery?title=Gallery')),
        _section('The House'),
        _row(context, Icons.storefront_outlined, 'About Us', 'Natural since 1988', onTap: () => context.push('/about')),
        _row(context, Icons.chat_bubble_outline, 'Contact Us', 'Call, WhatsApp or visit', onTap: () => context.push('/contact')),
        // Policy rows appear only for the documents the store has actually
        // published (via /v1/app-config → legal). The website's /shipping,
        // /returns, /privacy and /terms pages are 404 today, so linking to
        // them would have opened a broken page inside the app.
        ..._policyRows(context),
        if (loggedIn) ...[
          _section('Account'),
          _row(context, Icons.person_outline, 'Edit Profile', 'Name & email', onTap: () => context.push('/profile/edit')),
          _row(context, Icons.logout, 'Logout', '', red: true, onTap: () async {
            await EcomApi.I.logout();
            if (context.mounted) context.go('/login');
          }),
        ] else
          _row(context, Icons.login, 'Sign in', 'Access orders & wishlist', onTap: () => context.push('/login')),
      ]),
    );
  }

  List<Widget> _policyRows(BuildContext context) {
    final cfg = storeConfig.value;
    final docs = <(IconData, String, String)>[
      (Icons.local_shipping_outlined, 'Shipping Policy', cfg.shippingPolicyUrl),
      (Icons.assignment_return_outlined, 'Return & Exchange', cfg.returnsPolicyUrl),
      (Icons.shield_outlined, 'Privacy Policy', cfg.privacyUrl),
      (Icons.gavel_outlined, 'Terms', cfg.termsUrl),
    ].where((d) => d.$3.isNotEmpty).toList();
    if (docs.isEmpty) return const [];
    return [
      _section('Policies'),
      for (final d in docs) _row(context, d.$1, d.$2, '', onTap: () => openExternal(context, d.$3)),
    ];
  }

  Widget _section(String t) => Padding(
        padding: const EdgeInsets.fromLTRB(0, 18, 0, 6),
        child: Text(t.toUpperCase(), style: VlText.upper(9, letter: 0.22)),
      );

  Widget _row(BuildContext context, IconData ic, String t, String s, {String? to, bool red = false, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap ?? (to != null ? () => context.go(to) : null),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: VlColors.rule))),
        child: Row(children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: red ? VlColors.redSoft : VlColors.cream,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(ic, size: 16, color: red ? VlColors.red : VlColors.redDeep),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(t, style: VlText.ui(13, weight: FontWeight.w500, color: red ? VlColors.red : VlColors.ink)),
              if (s.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(s, style: VlText.mono(10, color: VlColors.muted)),
              ],
            ]),
          ),
          Icon(Icons.chevron_right, size: 14, color: VlColors.muted2),
        ]),
      ),
    );
  }
}

// ── Notifications ────────────────────────────────────────────────────────────
class _Notif {
  final String kind; // live | order | offer
  final String title;
  final String body;
  final String when;
  final String? route; // tap target
  final String? code; // coupon code to copy
  const _Notif(this.kind, this.title, this.body, this.when, {this.route, this.code});
}

/// Routes that render inside the bottom-nav ShellRoute (see main.dart).
const _shellBranches = {'/home', '/shop', '/live', '/cart', '/profile', '/orders', '/notifications', '/wishlist'};

String _ago(DateTime? d) {
  if (d == null) return '';
  final diff = DateTime.now().difference(d.toLocal());
  if (diff.inMinutes < 1) return 'now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m';
  if (diff.inHours < 24) return '${diff.inHours}h';
  if (diff.inDays < 7) return '${diff.inDays}d';
  return '${(diff.inDays / 7).floor()}w';
}

/// Real notifications composed from the customer's recent orders + the store's
/// active coupons + a live-shopping CTA. (No dedicated notifications API.)
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
    final items = <_Notif>[
      const _Notif('live', 'Live Shopping', 'Watch our products live and buy in real time.', '', route: '/live'),
    ];
    try {
      final results = await Future.wait([
        EcomAuth.I.isLoggedIn ? EcomApi.I.orders(limit: 10) : Future.value(<EcomOrder>[]),
        EcomApi.I.coupons(),
      ]);
      final orders = results[0] as List<EcomOrder>;
      final coupons = results[1] as List<Map<String, dynamic>>;
      for (final o in orders) {
        // Grouped like every other rupee figure in the app — this line alone
        // read "₹17998" next to "₹17,998" on the order it referred to.
        items.add(_Notif('order', _orderTitle(o.status), 'Order ${o.orderNumber} · ₹${_inr(o.totalAmount)}',
            _ago(o.createdAt), route: '/orders/${o.id}'));
      }
      for (final c in coupons.take(6)) {
        final code = (c['code'] ?? '').toString();
        final desc = (c['description'] ?? '').toString();
        items.add(_Notif('offer', code.isEmpty ? 'Offer' : code,
            desc.isNotEmpty ? desc : 'Tap to copy code', '', code: code));
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

  List<_Notif> get _items =>
      _all.where((n) => _filter == 'All' || _filter.toLowerCase().startsWith(n.kind)).toList();

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      // Reached from the Home and Live bells, so back belongs to Home.
      TopBar(title: 'Notifications', onBack: () => context.canPop() ? context.pop() : context.go('/home')),
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
        child: Row(children: [
          for (final f in _filters) ...[
            GestureDetector(
              onTap: () => setState(() => _filter = f),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: _filter == f ? VlColors.ink : VlColors.paper,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: _filter == f ? VlColors.ink : VlColors.rule2),
                ),
                child: Text(f, style: VlText.ui(11, color: _filter == f ? Colors.white : VlColors.ink)),
              ),
            ),
            const SizedBox(width: 8),
          ],
        ]),
      ),
      Expanded(child: _content()),
    ]);
  }

  Widget _content() {
    // A pull to refresh keeps the list on screen under the spinner; the
    // skeleton is only for the very first load.
    if (_loading && _all.isEmpty) return const ListRowsSkeleton(count: 6, thumb: 38);
    final items = _items;
    if (items.isEmpty) {
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.notifications_none, size: 40, color: VlColors.rule2),
          const SizedBox(height: 12),
          Text('Nothing here yet', style: VlText.display(20)),
        ]),
      );
    }
    return RefreshIndicator(
      color: VlColors.red,
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
    final tint = n.kind == 'live' ? VlColors.redSoft : (n.kind == 'order' ? VlColors.cream : VlColors.cream2);
    final ic = n.kind == 'live'
        ? Icons.play_arrow
        : (n.kind == 'order' ? Icons.local_shipping_outlined : Icons.sell_outlined);
    final icColor = n.kind == 'live' ? VlColors.red : VlColors.redDeep;
    return GestureDetector(
      onTap: () {
        final route = n.route;
        if (route != null) {
          // Bottom-nav destinations must use go: they live inside the
          // ShellRoute, and pushing a second copy of that shell collides
          // with its existing page key and trips Navigator's assertion.
          if (_shellBranches.contains(route)) {
            context.go(route);
          } else {
            context.push(route);
          }
        } else if (n.code != null && n.code!.isNotEmpty) {
          Clipboard.setData(ClipboardData(text: n.code!));
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Copied ${n.code}')));
        }
      },
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: VlColors.rule))),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: tint, borderRadius: BorderRadius.circular(8)),
            child: Icon(ic, size: 15, color: icColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(n.title, style: VlText.ui(13, weight: FontWeight.w600))),
                if (n.when.isNotEmpty) Text(n.when, style: VlText.mono(9, color: VlColors.muted2, letter: 0.12)),
              ]),
              const SizedBox(height: 2),
              Text(n.body, style: VlText.body(12, color: VlColors.muted)),
              if (n.kind == 'live') ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(4)),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.play_arrow, size: 10, color: Colors.white),
                    const SizedBox(width: 5),
                    Text('WATCH LIVE', style: VlText.upper(9, color: Colors.white, letter: 0.14)),
                  ]),
                ),
              ],
            ]),
          ),
        ]),
      ),
    );
  }
}
