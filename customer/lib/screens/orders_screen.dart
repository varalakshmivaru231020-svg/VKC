import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';
import '../widgets.dart';
import 'order_widgets.dart';

String _inr(num v) => orderMoney(v);

/// My Orders — ecom /v1/orders (auth), paginated.
class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});
  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  static const _pageSize = 20;
  final _tabs = const ['All', 'Active', 'Delivered', 'Cancelled'];
  final _scroll = ScrollController();

  int _tab = 0;
  List<EcomOrder> _orders = [];
  bool _loading = true;
  bool _loadingMore = false;
  bool _hasMore = true;
  int _page = 1;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    if (EcomAuth.I.isLoggedIn) {
      _load();
    } else {
      _loading = false;
    }
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scroll.position.pixels > _scroll.position.maxScrollExtent - 400) _loadMore();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await EcomApi.I.orders(page: 1, limit: _pageSize);
      if (!mounted) return;
      setState(() {
        _orders = list;
        _page = 1;
        _hasMore = list.length >= _pageSize;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e;
        _loading = false;
      });
    }
  }

  Future<void> _loadMore() async {
    if (_loadingMore || !_hasMore || _loading || _error != null) return;
    setState(() => _loadingMore = true);
    try {
      final next = await EcomApi.I.orders(page: _page + 1, limit: _pageSize);
      if (!mounted) return;
      setState(() {
        final seen = _orders.map((o) => o.id).toSet();
        _orders = [..._orders, ...next.where((o) => !seen.contains(o.id))];
        _page += 1;
        _hasMore = next.length >= _pageSize;
        _loadingMore = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loadingMore = false;
        _hasMore = false;
      });
    }
  }

  static const _closed = {'CANCELLED', 'RETURNED', 'REFUNDED'};

  List<EcomOrder> get _filtered {
    switch (_tab) {
      case 1:
        return _orders.where((o) => !o.isDelivered && !_closed.contains(o.status)).toList();
      case 2:
        return _orders.where((o) => o.isDelivered).toList();
      case 3:
        return _orders.where((o) => _closed.contains(o.status)).toList();
      default:
        return _orders;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(
            title: 'My Orders',
            onBack: () => context.canPop() ? context.pop() : context.go('/profile'),
            actions: [TopBar.action(Icons.pin_drop_outlined, () => context.push('/track-order'), tooltip: 'Track an order')],
          ),
          Expanded(child: EcomAuth.I.isLoggedIn ? _list() : _signInPrompt()),
        ]),
      ),
    );
  }

  Widget _signInPrompt() => StateView(
        icon: Icons.inventory_2_outlined,
        title: 'Sign in to see your orders',
        body: 'Or track an order with its number.',
        cta: 'Sign in',
        onCta: () async {
          await context.push('/login');
          if (mounted && EcomAuth.I.isLoggedIn) _load();
        },
        secondary: 'Track an order',
        onSecondary: () => context.push('/track-order'),
      );

  Widget _list() {
    return Column(children: [
      Container(
        padding: const EdgeInsets.fromLTRB(20, 10, 12, 10),
        decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: VkColors.rule))),
        child: Row(children: [
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: [
                for (var i = 0; i < _tabs.length; i++) ...[
                  VkChip(label: _tabs[i], selected: _tab == i, onTap: () => setState(() => _tab = i)),
                  const SizedBox(width: 8),
                ],
              ]),
            ),
          ),
          IconButton(onPressed: _loading ? null : _load, tooltip: 'Refresh', icon: const Icon(Icons.refresh_rounded, size: 20, color: VkColors.muted)),
        ]),
      ),
      Expanded(child: _content()),
    ]);
  }

  Widget _content() {
    if (_loading && _orders.isEmpty) return const _OrdersSkeleton();
    if (_error != null && _orders.isEmpty) return StateView.error(_error, onRetry: _load);
    final list = _filtered;
    if (list.isEmpty) {
      return StateView(
        icon: Icons.inventory_2_outlined,
        title: _tab == 0 ? 'No orders yet' : 'No ${_tabs[_tab].toLowerCase()} orders',
        body: _tab == 0 ? 'Your orders will appear here once you check out.' : null,
        cta: _tab == 0 ? 'Browse products' : 'Refresh',
        onCta: _tab == 0 ? () => context.go('/shop') : _load,
      );
    }
    return RefreshIndicator(
      color: VkColors.primary,
      onRefresh: _load,
      child: ListView.separated(
        controller: _scroll,
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        itemCount: list.length + (_loadingMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) => i >= list.length
            ? const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))),
              )
            : _orderCard(list[i]),
      ),
    );
  }

  Widget _orderCard(EcomOrder o) {
    final look = orderStatusLook(o.status);
    final item = o.items.isNotEmpty ? o.items.first : null;
    return PressScale(
      scale: 0.985,
      // Reload on the way back: cancelling happens on the detail screen.
      onTap: () async {
        await context.push('/orders/${o.id}');
        if (mounted) _load();
      },
      child: Container(
        decoration: BoxDecoration(color: VkColors.paper, border: Border.all(color: VkColors.rule), borderRadius: BorderRadius.circular(VkRadii.md)),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: o.isDelivered ? VkColors.leafSoft : VkColors.cream,
              border: const Border(bottom: BorderSide(color: VkColors.rule)),
            ),
            child: Row(children: [
              Icon(look.icon, size: 15, color: look.color),
              const SizedBox(width: 8),
              Text(look.label, style: VkText.ui(12, weight: FontWeight.w600)),
              const Spacer(),
              Text(DateFormat('d MMM yyyy').format(o.createdAt.toLocal()), style: VkText.mono(10, color: VkColors.muted)),
              const SizedBox(width: 6),
              const Icon(Icons.chevron_right_rounded, size: 18, color: VkColors.muted),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              SizedBox(width: 72, height: 72, child: NetImage(url: item?.imageUrl, radius: VkRadii.sm)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(o.orderNumber, style: VkText.upper(9, letter: 0.14)),
                  const SizedBox(height: 4),
                  Text(item?.productName ?? '${o.items.length} item(s)', maxLines: 2, overflow: TextOverflow.ellipsis, style: VkText.ui(13, weight: FontWeight.w500)),
                  const SizedBox(height: 4),
                  Text('₹${_inr(o.totalAmount)}${o.items.length > 1 ? ' · ${o.items.length} items' : ''}', style: VkText.body(11.5, color: VkColors.muted)),
                  if ((o.trackingNumber ?? '').isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text('AWB ${o.trackingNumber}', style: VkText.mono(10, color: VkColors.muted2)),
                  ],
                ]),
              ),
            ]),
          ),
        ]),
      ),
    );
  }
}

/// Order-card shaped shimmer, so the list doesn't reflow when data lands.
class _OrdersSkeleton extends StatelessWidget {
  const _OrdersSkeleton();
  @override
  Widget build(BuildContext context) => ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        itemCount: 4,
        physics: const NeverScrollableScrollPhysics(),
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => Container(
          height: 140,
          decoration: BoxDecoration(color: VkColors.paper, border: Border.all(color: VkColors.rule), borderRadius: BorderRadius.circular(VkRadii.md)),
          clipBehavior: Clip.antiAlias,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Skeleton(height: 36, radius: 0),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Skeleton(width: 72, height: 72),
                SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Skeleton(width: 90, height: 9),
                    SizedBox(height: 8),
                    Skeleton(height: 12),
                    SizedBox(height: 6),
                    Skeleton(width: 120, height: 11),
                  ]),
                ),
              ]),
            ),
          ]),
        ),
      );
}
