import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart';
import '../theme.dart';
import '../widgets.dart';

/// Gallery — a native screen: app header, two-column grid, full-screen
/// viewer with swipe and pinch-zoom. Content comes from Admin → Gallery
/// through GET /v1/gallery.
class GalleryScreen extends StatefulWidget {
  const GalleryScreen({super.key});
  @override
  State<GalleryScreen> createState() => _GalleryScreenState();
}

class _GalleryScreenState extends State<GalleryScreen> {
  List<GalleryItem> _items = const [];
  bool _loading = true;
  Object? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load({bool force = false}) async {
    if (_items.isEmpty && mounted) setState(() => _loading = true);
    try {
      final items = await EcomApi.I.gallery(force: force);
      if (!mounted) return;
      setState(() {
        _items = items;
        _error = null;
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

  void _open(int index) {
    final item = _items[index];
    if (item.isVideo) {
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => _VideoPage(item: item)));
      return;
    }
    Navigator.of(context).push(PageRouteBuilder(
      opaque: false,
      barrierColor: Colors.black,
      transitionDuration: VkMotion.slow,
      reverseTransitionDuration: VkMotion.base,
      pageBuilder: (_, __, ___) => _GalleryViewer(items: _items, initialIndex: index),
      transitionsBuilder: (_, a, __, child) => FadeTransition(opacity: a, child: child),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'Gallery', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
          Expanded(child: _body()),
        ]),
      ),
    );
  }

  Widget _body() {
    if (_loading && _items.isEmpty) return const _GallerySkeleton();
    if (_error != null && _items.isEmpty) return StateView.error(_error, onRetry: () => _load(force: true));
    if (_items.isEmpty) {
      return const StateView(icon: Icons.photo_library_outlined, title: 'No photos yet', body: 'Photos from our unit and cane fields will appear here.');
    }
    return RefreshIndicator(
      color: VkColors.primary,
      onRefresh: () => _load(force: true),
      child: CustomScrollView(slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 6),
          sliver: SliverToBoxAdapter(
            child: Text('Photos from our unit, our cane fields, and the farmers we work with.',
                style: VkText.body(12.5, color: VkColors.muted, height: 1.5)),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 10, 20, 28),
          sliver: SliverGrid(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 2, mainAxisSpacing: 8, crossAxisSpacing: 8),
            delegate: SliverChildBuilderDelegate(
              (context, i) => _Tile(item: _items[i], index: i, onTap: () => _open(i)),
              childCount: _items.length,
            ),
          ),
        ),
      ]),
    );
  }
}

class _Tile extends StatelessWidget {
  final GalleryItem item;
  final int index;
  final VoidCallback onTap;
  const _Tile({required this.item, required this.index, required this.onTap});
  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: item.caption ?? (item.isVideo ? 'Video' : 'Photo'),
        child: PressScale(
          onTap: onTap,
          child: Hero(
            tag: 'gallery-${item.id}',
            child: Stack(fit: StackFit.expand, children: [
              NetImage(url: item.thumbnail, radius: VkRadii.md, seed: index, placeholderIcon: item.isVideo ? Icons.play_circle_outline_rounded : Icons.photo_outlined),
              if (item.isVideo)
                Center(
                  child: Container(
                    width: 42,
                    height: 42,
                    decoration: BoxDecoration(color: VkColors.paper.withValues(alpha: 0.92), shape: BoxShape.circle),
                    child: const Icon(Icons.play_arrow_rounded, size: 26, color: VkColors.primary),
                  ),
                ),
            ]),
          ),
        ),
      );
}

class _GallerySkeleton extends StatelessWidget {
  const _GallerySkeleton();
  @override
  Widget build(BuildContext context) => GridView.count(
        crossAxisCount: 2,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        physics: const NeverScrollableScrollPhysics(),
        children: List.generate(6, (_) => const Skeleton(radius: VkRadii.md)),
      );
}

/// Full-screen photo viewer: swipe between photos, pinch to zoom, tap to
/// toggle the chrome.
class _GalleryViewer extends StatefulWidget {
  final List<GalleryItem> items;
  final int initialIndex;
  const _GalleryViewer({required this.items, required this.initialIndex});
  @override
  State<_GalleryViewer> createState() => _GalleryViewerState();
}

class _GalleryViewerState extends State<_GalleryViewer> {
  late final PageController _ctrl = PageController(initialPage: widget.initialIndex);
  late int _index = widget.initialIndex;
  bool _chrome = true;
  bool _zoomed = false;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(statusBarIconBrightness: Brightness.light));
  }

  @override
  void dispose() {
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(statusBarIconBrightness: Brightness.dark));
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.items;
    final item = items[_index];
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(children: [
        PageView.builder(
          controller: _ctrl,
          itemCount: items.length,
          physics: _zoomed ? const NeverScrollableScrollPhysics() : const PageScrollPhysics(),
          onPageChanged: (i) => setState(() => _index = i),
          itemBuilder: (_, i) {
            final it = items[i];
            if (it.isVideo) {
              return Center(
                child: PressScale(
                  onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => _VideoPage(item: it))),
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: Stack(fit: StackFit.expand, children: [
                      NetImage(url: it.thumbnail, radius: 0),
                      const Center(child: Icon(Icons.play_circle_fill_rounded, size: 64, color: Colors.white)),
                    ]),
                  ),
                ),
              );
            }
            return GestureDetector(
              onTap: () => setState(() => _chrome = !_chrome),
              child: InteractiveViewer(
                minScale: 1,
                maxScale: 4,
                onInteractionEnd: (d) => setState(() => _zoomed = false),
                onInteractionUpdate: (d) {
                  if (d.scale != 1 && !_zoomed) setState(() => _zoomed = true);
                },
                child: Center(
                  child: Hero(
                    tag: 'gallery-${it.id}',
                    child: NetImage(url: it.url, radius: 0, fit: BoxFit.contain),
                  ),
                ),
              ),
            );
          },
        ),
        AnimatedOpacity(
          opacity: _chrome ? 1 : 0,
          duration: VkMotion.base,
          child: IgnorePointer(
            ignoring: !_chrome,
            child: Column(children: [
              Container(
                padding: EdgeInsets.fromLTRB(8, MediaQuery.paddingOf(context).top + 6, 12, 10),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.black54, Colors.transparent]),
                ),
                child: Row(children: [
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    tooltip: 'Close',
                    icon: const Icon(Icons.close_rounded, color: Colors.white),
                  ),
                  Expanded(
                    child: Text('${_index + 1} / ${items.length}', textAlign: TextAlign.center, style: VkText.ui(13, weight: FontWeight.w600, color: Colors.white)),
                  ),
                  const SizedBox(width: 48),
                ]),
              ),
              const Spacer(),
              if ((item.caption ?? '').trim().isNotEmpty)
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.fromLTRB(20, 24, 20, MediaQuery.paddingOf(context).bottom + 20),
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(begin: Alignment.bottomCenter, end: Alignment.topCenter, colors: [Colors.black87, Colors.transparent]),
                  ),
                  child: Text(item.caption!.trim(), textAlign: TextAlign.center, style: VkText.body(13, color: Colors.white, height: 1.5)),
                ),
            ]),
          ),
        ),
      ]),
    );
  }
}

/// Plays a gallery video inside the app — YouTube / Vimeo / Facebook through
/// their embed pages, direct files through the WebView's own player.
class _VideoPage extends StatefulWidget {
  final GalleryItem item;
  const _VideoPage({required this.item});
  @override
  State<_VideoPage> createState() => _VideoPageState();
}

class _VideoPageState extends State<_VideoPage> {
  late final WebViewController _c;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    final embed = widget.item.embedUrl;
    _c = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..setNavigationDelegate(NavigationDelegate(onPageFinished: (_) {
        if (mounted) setState(() => _loading = false);
      }));
    if (embed != null) {
      _c.loadRequest(Uri.parse(embed));
    } else {
      _c.loadHtmlString('''
<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh">
<video src="${widget.item.url}" controls autoplay playsinline style="width:100%;max-height:100vh"></video>
</body></html>''');
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: Column(children: [
            Row(children: [
              IconButton(onPressed: () => Navigator.of(context).pop(), tooltip: 'Close', icon: const Icon(Icons.close_rounded, color: Colors.white)),
              Expanded(
                child: Text(widget.item.caption?.trim().isNotEmpty == true ? widget.item.caption!.trim() : 'Video',
                    maxLines: 1, overflow: TextOverflow.ellipsis, style: VkText.ui(13, weight: FontWeight.w600, color: Colors.white)),
              ),
              IconButton(
                onPressed: () => openExternal(context, widget.item.url),
                tooltip: 'Open in app',
                icon: const Icon(Icons.open_in_new_rounded, color: Colors.white70, size: 20),
              ),
            ]),
            Expanded(
              child: Stack(children: [
                WebViewWidget(controller: _c),
                if (_loading) const Center(child: CircularProgressIndicator(color: Colors.white)),
              ]),
            ),
          ]),
        ),
      );
}
