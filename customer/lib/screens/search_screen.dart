import 'dart:async';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart';
import '../ecom/recent_searches.dart';
import '../theme.dart';
import '../widgets.dart';
import 'shop_screen.dart';

/// Product search: recent searches, live suggestions as you type, and a
/// full results grid on submit.
class SearchScreen extends StatefulWidget {
  final String? initialQuery;
  const SearchScreen({super.key, this.initialQuery});
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  late final TextEditingController _ctrl = TextEditingController(text: widget.initialQuery ?? '');
  final _focus = FocusNode();
  Timer? _debounce;

  /// The query whose results are showing (submitted), if any.
  String? _submitted;
  List<EcomProduct> _suggestions = const [];
  bool _suggesting = false;
  List<EcomCategory> _cats = const [];
  int _request = 0;

  @override
  void initState() {
    super.initState();
    RecentSearches.I.load();
    EcomApi.I.categories().then((c) {
      if (mounted) setState(() => _cats = c);
    }).catchError((_) {});
    final q = (widget.initialQuery ?? '').trim();
    if (q.isNotEmpty) {
      _submitted = q;
    } else {
      WidgetsBinding.instance.addPostFrameCallback((_) => _focus.requestFocus());
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _ctrl.dispose();
    _focus.dispose();
    super.dispose();
  }

  void _onChanged(String v) {
    setState(() => _submitted = null);
    _debounce?.cancel();
    final q = v.trim();
    if (q.length < 2) {
      setState(() {
        _suggestions = const [];
        _suggesting = false;
      });
      return;
    }
    // Re-query 300ms after the customer stops typing, so a search doesn't
    // fire a request per keystroke.
    _debounce = Timer(const Duration(milliseconds: 300), () => _suggest(q));
  }

  Future<void> _suggest(String q) async {
    final req = ++_request;
    setState(() => _suggesting = true);
    try {
      final page = await EcomApi.I.products(q: q, limit: 8);
      if (!mounted || req != _request) return;
      setState(() {
        _suggestions = page.products;
        _suggesting = false;
      });
    } catch (_) {
      if (!mounted || req != _request) return;
      setState(() => _suggesting = false);
    }
  }

  void _submit([String? term]) {
    final q = (term ?? _ctrl.text).trim();
    if (q.isEmpty) return;
    _debounce?.cancel();
    _focus.unfocus();
    if (term != null) _ctrl.text = q;
    RecentSearches.I.add(q);
    setState(() {
      _submitted = q;
      _suggestions = const [];
    });
  }

  void _clear() {
    _debounce?.cancel();
    _ctrl.clear();
    setState(() {
      _submitted = null;
      _suggestions = const [];
    });
    _focus.requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          _field(),
          Expanded(child: _body()),
        ]),
      ),
    );
  }

  Widget _field() => Container(
        padding: const EdgeInsets.fromLTRB(12, 8, 16, 10),
        decoration: const BoxDecoration(color: VkColors.canvas, border: Border(bottom: BorderSide(color: VkColors.rule))),
        child: Row(children: [
          TopBar.action(Icons.arrow_back_rounded, () => context.canPop() ? context.pop() : context.go('/home'), tooltip: 'Back'),
          const SizedBox(width: 4),
          Expanded(
            child: Container(
              height: 46,
              padding: const EdgeInsets.only(left: 14, right: 6),
              decoration: BoxDecoration(
                color: VkColors.paper,
                borderRadius: BorderRadius.circular(VkRadii.md),
                border: Border.all(color: _focus.hasFocus ? VkColors.primary : VkColors.rule),
              ),
              child: Row(children: [
                const Icon(Icons.search_rounded, size: 19, color: VkColors.muted),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    focusNode: _focus,
                    textInputAction: TextInputAction.search,
                    onChanged: _onChanged,
                    onSubmitted: (_) => _submit(),
                    style: VkText.ui(14, weight: FontWeight.w400),
                    decoration: InputDecoration(
                      isCollapsed: true,
                      border: InputBorder.none,
                      hintText: 'Search products…',
                      hintStyle: VkText.ui(14, color: VkColors.muted2, weight: FontWeight.w400),
                    ),
                  ),
                ),
                ValueListenableBuilder<TextEditingValue>(
                  valueListenable: _ctrl,
                  builder: (_, v, __) => v.text.isEmpty
                      ? const SizedBox(width: 8)
                      : IconButton(
                          onPressed: _clear,
                          tooltip: 'Clear',
                          icon: const Icon(Icons.cancel_rounded, size: 18, color: VkColors.muted2),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                        ),
                ),
              ]),
            ),
          ),
        ]),
      );

  Widget _body() {
    final submitted = _submitted;
    if (submitted != null) {
      return ProductListing(key: ValueKey('results:$submitted'), q: submitted, showHeader: false);
    }
    final typed = _ctrl.text.trim();
    if (typed.length >= 2) return _suggestionsView(typed);
    return _idleView();
  }

  Widget _idleView() => ValueListenableBuilder<List<String>>(
        valueListenable: RecentSearches.I.terms,
        builder: (context, recent, _) => ListView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          children: [
            if (recent.isNotEmpty) ...[
              Row(children: [
                Expanded(child: Text('RECENT SEARCHES', style: VkText.upper(9, letter: 0.18))),
                TextButton(
                  onPressed: RecentSearches.I.clear,
                  style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(44, 30)),
                  child: Text('Clear', style: VkText.ui(12, color: VkColors.primary)),
                ),
              ]),
              const SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final t in recent)
                  VkChip(label: t, icon: Icons.history_rounded, onTap: () => _submit(t), onRemove: () => RecentSearches.I.remove(t)),
              ]),
              const SizedBox(height: 26),
            ],
            if (_cats.isNotEmpty) ...[
              Text('BROWSE BY CATEGORY', style: VkText.upper(9, letter: 0.18)),
              const SizedBox(height: 8),
              Wrap(spacing: 8, runSpacing: 8, children: [
                for (final c in _cats)
                  VkChip(label: c.name, onTap: () => context.push('/listing?cat=${c.slug}&title=${Uri.encodeComponent(c.name)}')),
              ]),
              const SizedBox(height: 26),
            ],
            if (recent.isEmpty) ...[
              const SizedBox(height: 40),
              const Icon(Icons.search_rounded, size: 40, color: VkColors.rule2),
              const SizedBox(height: 10),
              Text('Find your jaggery', textAlign: TextAlign.center, style: VkText.display(22)),
              const SizedBox(height: 6),
              Text('Search by product name — cubes, powder, syrup, gift box…',
                  textAlign: TextAlign.center, style: VkText.body(12.5, color: VkColors.muted)),
            ],
          ],
        ),
      );

  Widget _suggestionsView(String typed) => ListView(
        padding: const EdgeInsets.fromLTRB(0, 6, 0, 24),
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        children: [
          ListTile(
            leading: const Icon(Icons.search_rounded, color: VkColors.primary),
            title: Text.rich(TextSpan(style: VkText.ui(14, weight: FontWeight.w400), children: [
              const TextSpan(text: 'Search for '),
              TextSpan(text: '“$typed”', style: VkText.ui(14, weight: FontWeight.w600)),
            ])),
            onTap: () => _submit(),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20),
          ),
          if (_suggesting && _suggestions.isEmpty)
            const ListRowsSkeleton(count: 4, thumb: 48, padding: EdgeInsets.fromLTRB(20, 8, 20, 8)),
          for (final p in _suggestions)
            ListTile(
              onTap: () => context.push('/product/${p.slug}'),
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
              leading: SizedBox(width: 48, height: 48, child: NetImage(url: p.image, radius: VkRadii.sm)),
              title: Text(p.name, maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.ui(13.5, weight: FontWeight.w500)),
              subtitle: Text(
                [if ((p.category?.name ?? '').isNotEmpty) p.category!.name, '₹${inr(p.price)}'].join(' · '),
                style: VkText.body(11.5, color: VkColors.muted),
              ),
              trailing: const Icon(Icons.north_west_rounded, size: 16, color: VkColors.muted2),
            ),
          if (!_suggesting && _suggestions.isEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
              child: Text('No quick matches — tap search to look through everything.',
                  textAlign: TextAlign.center, style: VkText.body(12.5, color: VkColors.muted)),
            ),
        ],
      );
}
