import "dart:async";

import "package:flutter/material.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";

import "../../../core/errors/failures.dart";
import "../../../core/theme/theme_extension.dart";
import "../../../core/widgets/state_widgets.dart";
import "../../shop/data/product_models.dart";
import "../../shop/data/product_repository.dart";
import "../../shop/presentation/product_card.dart";

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});
  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final _ctrl = TextEditingController();
  Timer? _debounce;
  String _query = "";
  AsyncValue<List<Product>> _results = const AsyncValue.data([]);

  @override
  void dispose() {
    _ctrl.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  void _onChanged(String v) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () => _runQuery(v.trim()));
  }

  Future<void> _runQuery(String q) async {
    if (!mounted) return;
    setState(() => _query = q);
    if (q.isEmpty) {
      setState(() => _results = const AsyncValue.data([]));
      return;
    }
    setState(() => _results = const AsyncValue.loading());
    try {
      final page = await ref.read(productRepositoryProvider).products(
        filters: ProductFilters(q: q),
        limit: 30,
      );
      if (!mounted) return;
      setState(() => _results = AsyncValue.data(page.products));
    } catch (e, st) {
      if (!mounted) return;
      setState(() => _results = AsyncValue.error(e is Failure ? e : UnknownFailure(e.toString()), st));
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.appColors;
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          controller: _ctrl,
          autofocus: true,
          textInputAction: TextInputAction.search,
          onChanged: _onChanged,
          onSubmitted: _runQuery,
          decoration: InputDecoration(
            hintText: "Search sarees, fabrics, colours…",
            border: InputBorder.none,
            enabledBorder: InputBorder.none,
            focusedBorder: InputBorder.none,
            filled: false,
            prefixIcon: const Icon(Icons.search, size: 20),
            suffixIcon: _ctrl.text.isEmpty
                ? null
                : IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () { _ctrl.clear(); _runQuery(""); },
                  ),
          ),
          style: Theme.of(context).textTheme.bodyLarge,
        ),
      ),
      body: _results.when(
        loading: () => const AppLoading(),
        error: (e, _) => AppErrorView(
          failure: e is Failure ? e : UnknownFailure(e.toString()),
          onRetry: () => _runQuery(_query),
        ),
        data: (list) {
          if (_query.isEmpty) {
            return Padding(
              padding: const EdgeInsets.all(24),
              child: Center(
                child: Text(
                  "Type to search across our catalogue",
                  style: TextStyle(color: colors.textMuted),
                ),
              ),
            );
          }
          if (list.isEmpty) {
            return AppEmpty(
              title: "No matches for \"$_query\"",
              description: "Try different keywords or browse the shop.",
              icon: Icons.search_off_rounded,
            );
          }
          return GridView.builder(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            itemCount: list.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 12,
              childAspectRatio: 0.55,
            ),
            itemBuilder: (_, i) => ProductCard(product: list[i]),
          );
        },
      ),
    );
  }
}
