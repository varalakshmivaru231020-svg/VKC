import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';
import '../widgets.dart';
import 'order_widgets.dart';

String _inr(num v) => orderMoney(v);

/// My Orders — real ecom /v1/orders (auth). Live purchases live under VL Group
/// and are tracked from the live-buy success dialog, not here.
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
  String? _error;

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
        _error = ecomError(e, 'Could not load your orders.');
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
        // The API paginates over every status, so de-dupe rather than trust
        // the page boundary.
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
    return Column(children: [
      // Reached from Profile via go(), so there's nothing to pop — send the
      // customer back there explicitly, like Notifications does.
      TopBar(
        title: 'My Orders',
        onBack: () => context.go('/profile'),
        actions: [
          InkResponse(
            onTap: () => context.push('/track-order'),
            child: SizedBox(width: 36, height: 36, child: Icon(Icons.pin_drop_outlined, size: 18, color: VlColors.muted)),
          ),
        ],
      ),
      Expanded(child: EcomAuth.I.isLoggedIn ? _list() : _signInPrompt()),
    ]);
  }

  Widget _signInPrompt() => Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.inventory_2_outlined, size: 40, color: VlColors.red),
          const SizedBox(height: 14),
          Text('Sign in to see your orders', style: VlText.display(22)),
          const SizedBox(height: 6),
          Text('Or track an order with its number.', style: VlText.body(13, color: VlColors.muted)),
          const SizedBox(height: 16),
          TextButton(onPressed: () => context.push('/login'), child: Text('Sign in', style: VlText.ui(13, color: VlColors.red))),
          TextButton(onPressed: () => context.push('/track-order'), child: Text('Track an order', style: VlText.ui(13, color: VlColors.muted))),
        ]),
      );

  Widget _list() {
    return Column(children: [
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: VlColors.rule))),
        child: Row(children: [
          Expanded(
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(children: [for (var i = 0; i < _tabs.length; i++) _tabBtn(i)]),
            ),
          ),
          IconButton(onPressed: _loading ? null : _load, icon: Icon(Icons.refresh, size: 18, color: VlColors.muted)),
        ]),
      ),
      Expanded(child: _content()),
    ]);
  }

  Widget _tabBtn(int i) {
    final active = _tab == i;
    return GestureDetector(
      onTap: () => setState(() => _tab = i),
      child: Container(
        margin: const EdgeInsets.only(right: 22),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(border: Border(bottom: BorderSide(color: active ? VlColors.red : Colors.transparent, width: 2))),
        child: Text(_tabs[i], style: VlText.ui(13, weight: active ? FontWeight.w600 : FontWeight.w400, color: active ? VlColors.ink : VlColors.muted)),
      ),
    );
  }

  Widget _content() {
    if (_loading && _orders.isEmpty) return const _OrdersSkeleton();
    if (_error != null && _orders.isEmpty) return _empty(Icons.wifi_off, _error!, 'Retry', _load);
    final list = _filtered;
    if (list.isEmpty) {
      return _empty(
        Icons.inventory_2_outlined,
        _tab == 0 ? 'No orders yet' : 'No ${_tabs[_tab].toLowerCase()} orders',
        _tab == 0 ? 'Browse Products' : 'Refresh',
        _tab == 0 ? () => context.go('/shop') : _load,
      );
    }
    return RefreshIndicator(
      color: VlColors.red,
      onRefresh: _load,
      child: ListView.separated(
        controller: _scroll,
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        itemCount: list.length + (_loadingMore ? 1 : 0),
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, i) => i >= list.length
            ? Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: VlColors.red))),
              )
            : _orderCard(list[i]),
      ),
    );
  }

  Widget _orderCard(EcomOrder o) {
    final look = orderStatusLook(o.status);
    final item = o.items.isNotEmpty ? o.items.first : null;
    return GestureDetector(
      // Reload on the way back: cancelling (or returning) an order happens on
      // the detail screen, and without this the list still read "Order placed"
      // for an order the customer had just cancelled.
      onTap: () async {
        await context.push('/orders/${o.id}');
        if (mounted) _load();
      },
      child: Container(
        decoration: BoxDecoration(color: VlColors.paper, border: Border.all(color: VlColors.rule), borderRadius: BorderRadius.circular(VlRadii.md)),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: o.isDelivered ? const Color(0xFFF5F5F5) : VlColors.cream,
              border: Border(bottom: BorderSide(color: VlColors.rule)),
            ),
            child: Row(children: [
              Icon(look.icon, size: 15, color: look.color),
              const SizedBox(width: 8),
              Text(look.label, style: VlText.ui(12, weight: FontWeight.w600)),
              const Spacer(),
              Text(DateFormat('d MMM yyyy').format(o.createdAt.toLocal()), style: VlText.mono(9, color: VlColors.muted, letter: 0.1)),
              const SizedBox(width: 8),
              Icon(Icons.chevron_right, size: 16, color: VlColors.muted),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              SizedBox(width: 72, height: 92, child: NetImage(url: item?.imageUrl, radius: VlRadii.sm)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(o.orderNumber, style: VlText.upper(9, letter: 0.18)),
                  const SizedBox(height: 4),
                  Text(item?.productName ?? '${o.items.length} item(s)',
                      maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.ui(13, weight: FontWeight.w500)),
                  const SizedBox(height: 4),
                  Text('₹${_inr(o.totalAmount)}${o.items.length > 1 ? ' · ${o.items.length} items' : ''}',
                      style: VlText.body(11, color: VlColors.muted)),
                  if ((o.trackingNumber ?? '').isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text('AWB ${o.trackingNumber}', style: VlText.mono(9, color: VlColors.muted2, letter: 0.1)),
                  ],
                ]),
              ),
            ]),
          ),
        ]),
      ),
    );
  }

  Widget _empty(IconData icon, String title, String cta, VoidCallback onCta) => ListView(
        children: [
          const SizedBox(height: 80),
          Icon(icon, size: 40, color: VlColors.red),
          const SizedBox(height: 14),
          Text(title, textAlign: TextAlign.center, style: VlText.display(22)),
          const SizedBox(height: 16),
          Center(child: TextButton(onPressed: onCta, child: Text(cta, style: VlText.ui(13, color: VlColors.red)))),
        ],
      );
}

/// Order-card shaped shimmer, so the list doesn't reflow when data lands.
class _OrdersSkeleton extends StatelessWidget {
  const _OrdersSkeleton();
  @override
  Widget build(BuildContext context) => ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 14, 20, 24),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => Container(
          height: 140,
          decoration: BoxDecoration(color: VlColors.paper, border: Border.all(color: VlColors.rule), borderRadius: BorderRadius.circular(VlRadii.md)),
          clipBehavior: Clip.antiAlias,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Skeleton(height: 36, radius: 0),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: const [
                Skeleton(width: 72, height: 80),
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
