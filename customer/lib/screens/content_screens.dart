import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_config.dart';
import '../ecom/ecom_models.dart' hide Banner;
import '../ecom/ecom_models.dart' as ecom show Banner;
import '../theme.dart';
import '../widgets.dart';

const kSiteBase = 'https://vkcgoldikshu.com';

/// Routes that live inside the bottom-nav shell — pushing a second copy of the
/// shell collides with its page key, so these are navigated with go().
const _shellRoutes = {'/home', '/shop', '/live', '/cart', '/profile', '/orders', '/notifications', '/wishlist'};

/// Website path → app route, for the links the store attaches to hero slides,
/// banners and popups. Null means the app has no screen for it.
String? _appRoute(String path) {
  final uri = Uri.tryParse(path);
  if (uri == null) return null;
  final p = uri.path;
  final segs = uri.pathSegments;
  if (p == '/' || p == '/shop' || p == '/new-arrivals') return '/listing';
  if (segs.length == 2 && segs.first == 'category') return '/listing?cat=${segs[1]}';
  if (segs.length == 2 && segs.first == 'product') return '/product/${segs[1]}';
  if (p == '/blog') return '/journal';
  if (segs.length == 2 && segs.first == 'blog') return '/journal/${segs[1]}';
  if (p == '/about') return '/about';
  if (p == '/contact') return '/contact';
  if (p == '/track-order') return '/track-order';
  if (p == '/cart' || p == '/wishlist') return p;
  if (p == '/account/orders') return '/orders';
  if (p == '/account/addresses') return '/addresses';
  return null;
}

/// Follows a store link: a page the app has opens in the app, anything else
/// opens in the browser. [fallback] covers links the store left empty.
void openLink(BuildContext context, String? href, {String? fallback}) {
  final raw = (href ?? '').trim();
  if (raw.isEmpty) {
    if (fallback != null) context.push(fallback);
    return;
  }
  var path = raw;
  if (path.startsWith(kSiteBase)) path = path.substring(kSiteBase.length);
  if (!path.startsWith('/')) {
    openExternal(context, raw);
    return;
  }
  final route = _appRoute(path);
  if (route == null) {
    openExternal(context, '$kSiteBase$path');
    return;
  }
  if (_shellRoutes.contains(route)) {
    context.go(route);
  } else {
    context.push(route);
  }
}

// ── Journal (blogs) ──────────────────────────────────────────────────────────
/// The store's journal, from GET /v1/blogs. Tapping a post opens it in the
/// app; the copy is Markdown, rendered with the app's own type roles.
class BlogListScreen extends StatefulWidget {
  const BlogListScreen({super.key});
  @override
  State<BlogListScreen> createState() => _BlogListScreenState();
}

class _BlogListScreenState extends State<BlogListScreen> {
  List<BlogPost> _posts = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final list = await EcomApi.I.blogs(limit: 30);
      if (!mounted) return;
      setState(() {
        _posts = list;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = ecomError(e, 'Could not load the journal.');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      floatingActionButton: const VideoCallFab(),
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'Journal', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
          Expanded(child: _body()),
        ]),
      ),
    );
  }

  Widget _body() {
    // Skeletons only when there is nothing to keep on screen — a pull to
    // refresh keeps the stories in place under the refresh spinner.
    if (_loading && _posts.isEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        itemCount: 3,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (_, __) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
          Skeleton(height: 170, radius: VlRadii.md),
          SizedBox(height: 10),
          Skeleton(width: 80, height: 9),
          SizedBox(height: 8),
          Skeleton(height: 14),
        ]),
      );
    }
    if (_error != null && _posts.isEmpty) {
      return _centered(Icons.wifi_off, _error!, 'Retry', _load);
    }
    if (_posts.isEmpty) {
      return _centered(Icons.menu_book_outlined, 'No stories yet', 'Refresh', _load);
    }
    return RefreshIndicator(
      color: VlColors.red,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        itemCount: _posts.length,
        separatorBuilder: (_, __) => const DoubleRule(margin: EdgeInsets.symmetric(vertical: 18)),
        itemBuilder: (_, i) => _card(_posts[i]),
      ),
    );
  }

  Widget _card(BlogPost p) => GestureDetector(
        onTap: () => context.push('/journal/${p.slug}'),
        behavior: HitTestBehavior.opaque,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if ((p.imageUrl ?? '').isNotEmpty)
            AspectRatio(aspectRatio: 16 / 10, child: NetImage(url: p.imageUrl, radius: VlRadii.md)),
          const SizedBox(height: 12),
          if (p.publishedAt != null)
            Text(DateFormat('d MMMM yyyy').format(p.publishedAt!.toLocal()).toUpperCase(),
                style: VlText.upper(9, color: VlColors.red, letter: 0.2)),
          const SizedBox(height: 6),
          Text(p.title, style: VlText.display(21, height: 1.2)),
          if ((p.excerpt ?? '').isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(p.excerpt!, maxLines: 3, overflow: TextOverflow.ellipsis, style: VlText.body(13, color: VlColors.muted, height: 1.6)),
          ],
          const SizedBox(height: 8),
          Row(children: [
            Text('READ', style: VlText.upper(9, color: VlColors.red, letter: 0.2)),
            const SizedBox(width: 6),
            Icon(Icons.arrow_forward, size: 12, color: VlColors.red),
          ]),
        ]),
      );

  Widget _centered(IconData icon, String title, String cta, VoidCallback onCta) => ListView(
        children: [
          const SizedBox(height: 100),
          Icon(icon, size: 38, color: VlColors.red),
          const SizedBox(height: 14),
          Text(title, textAlign: TextAlign.center, style: VlText.display(21)),
          const SizedBox(height: 12),
          Center(child: TextButton(onPressed: onCta, child: Text(cta, style: VlText.ui(13, color: VlColors.red)))),
        ],
      );
}

/// One journal post (GET /v1/blogs/:slug).
class BlogDetailScreen extends StatefulWidget {
  final String slug;
  const BlogDetailScreen({super.key, required this.slug});
  @override
  State<BlogDetailScreen> createState() => _BlogDetailScreenState();
}

class _BlogDetailScreenState extends State<BlogDetailScreen> {
  BlogPost? _post;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final p = await EcomApi.I.blogBySlug(widget.slug);
      if (!mounted) return;
      setState(() {
        _post = p;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = ecomError(e, 'Could not load this story.');
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _post;
    return Scaffold(
      backgroundColor: VlColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(
            title: 'Story',
            onBack: () => context.canPop() ? context.pop() : context.go('/journal'),
            actions: [
              if (p != null)
                InkResponse(
                  onTap: () {
                    Clipboard.setData(ClipboardData(text: '$kSiteBase/blog/${p.slug}'));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Link copied')));
                  },
                  child: SizedBox(width: 36, height: 36, child: Icon(Icons.ios_share, size: 16, color: VlColors.muted)),
                ),
            ],
          ),
          Expanded(
            child: _loading
                ? const DetailSkeleton(heroHeight: 220)
                : _error != null || p == null
                    ? Center(
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.wifi_off, size: 34, color: VlColors.red),
                          const SizedBox(height: 12),
                          Text(_error ?? 'Not found', style: VlText.body(13, color: VlColors.muted)),
                          const SizedBox(height: 12),
                          TextButton(onPressed: _load, child: Text('Retry', style: VlText.ui(13, color: VlColors.red))),
                        ]),
                      )
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                        children: [
                          if ((p.imageUrl ?? '').isNotEmpty) ...[
                            AspectRatio(aspectRatio: 16 / 10, child: NetImage(url: p.imageUrl, radius: VlRadii.md)),
                            const SizedBox(height: 16),
                          ],
                          if (p.publishedAt != null)
                            Text(DateFormat('d MMMM yyyy').format(p.publishedAt!.toLocal()).toUpperCase(),
                                style: VlText.upper(9, color: VlColors.red, letter: 0.2)),
                          const SizedBox(height: 8),
                          Text(p.title, style: VlText.display(28, height: 1.15)),
                          if (p.tags.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 6,
                              runSpacing: 6,
                              children: p.tags
                                  .map((t) => Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                        decoration: BoxDecoration(
                                          border: Border.all(color: VlColors.rule2),
                                          borderRadius: BorderRadius.circular(3),
                                        ),
                                        child: Text(t.toUpperCase(), style: VlText.upper(8, color: VlColors.muted, letter: 0.14)),
                                      ))
                                  .toList(),
                            ),
                          ],
                          const DoubleRule(margin: EdgeInsets.symmetric(vertical: 18)),
                          ...markdownToWidgets(p.content ?? p.excerpt ?? ''),
                        ],
                      ),
          ),
        ]),
      ),
    );
  }
}

// ── Markdown ─────────────────────────────────────────────────────────────────
/// Renders the subset of Markdown the store's journal actually uses —
/// headings, paragraphs, bold/italic, bullet and numbered lists, quotes and
/// rules — in the app's own type roles, so a story reads like the rest of the
/// app rather than a web page.
List<Widget> markdownToWidgets(String md) {
  final out = <Widget>[];
  final lines = md.replaceAll('\r\n', '\n').split('\n');
  final paragraph = <String>[];

  void flush() {
    if (paragraph.isEmpty) return;
    final text = paragraph.join(' ').trim();
    paragraph.clear();
    if (text.isEmpty) return;
    out.add(Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: RichText(text: TextSpan(children: _inline(text, VlText.body(14, color: VlColors.ink2, height: 1.75)))),
    ));
  }

  for (final raw in lines) {
    final line = raw.trimRight();
    final trimmed = line.trim();
    if (trimmed.isEmpty) {
      flush();
      continue;
    }
    if (trimmed.startsWith('#')) {
      flush();
      final level = trimmed.indexOf(RegExp(r'[^#]')).clamp(1, 4);
      final text = trimmed.substring(level).trim();
      final size = [26.0, 22.0, 19.0, 17.0][(level - 1).clamp(0, 3)];
      out.add(Padding(
        padding: EdgeInsets.only(top: out.isEmpty ? 0 : 10, bottom: 8),
        child: Text(text, style: VlText.display(size, height: 1.25)),
      ));
      continue;
    }
    if (trimmed == '---' || trimmed == '***') {
      flush();
      out.add(const DoubleRule(margin: EdgeInsets.symmetric(vertical: 14)));
      continue;
    }
    if (trimmed.startsWith('> ')) {
      flush();
      out.add(Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.fromLTRB(14, 12, 14, 12),
        decoration: BoxDecoration(
          color: VlColors.cream,
          border: Border(left: BorderSide(color: VlColors.red, width: 2)),
        ),
        child: RichText(
          text: TextSpan(children: _inline(trimmed.substring(2), VlText.display(16, height: 1.6, style: FontStyle.italic))),
        ),
      ));
      continue;
    }
    final bullet = RegExp(r'^[-*+]\s+(.*)$').firstMatch(trimmed);
    final numbered = RegExp(r'^(\d+)[.)]\s+(.*)$').firstMatch(trimmed);
    if (bullet != null || numbered != null) {
      flush();
      final marker = numbered != null ? '${numbered.group(1)}.' : '•';
      final text = numbered != null ? numbered.group(2)! : bullet!.group(1)!;
      out.add(Padding(
        padding: const EdgeInsets.only(bottom: 8, left: 4),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 20, child: Text(marker, style: VlText.body(14, color: VlColors.red, height: 1.75))),
          Expanded(
            child: RichText(text: TextSpan(children: _inline(text, VlText.body(14, color: VlColors.ink2, height: 1.75)))),
          ),
        ]),
      ));
      continue;
    }
    paragraph.add(trimmed);
  }
  flush();
  return out;
}

/// Splits **bold**, *italic* and `code` runs out of a line of Markdown.
List<InlineSpan> _inline(String text, TextStyle base) {
  final spans = <InlineSpan>[];
  final pattern = RegExp(r'\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_|`(.+?)`|\[(.+?)\]\((.+?)\)');
  var index = 0;
  for (final m in pattern.allMatches(text)) {
    if (m.start > index) spans.add(TextSpan(text: text.substring(index, m.start), style: base));
    if (m.group(1) != null) {
      spans.add(TextSpan(text: m.group(1), style: base.copyWith(fontWeight: FontWeight.w600)));
    } else if (m.group(2) != null || m.group(3) != null) {
      spans.add(TextSpan(text: m.group(2) ?? m.group(3), style: base.copyWith(fontStyle: FontStyle.italic)));
    } else if (m.group(4) != null) {
      spans.add(TextSpan(text: m.group(4), style: VlText.mono(12, color: VlColors.ink)));
    } else if (m.group(5) != null) {
      // Links keep their label; the URL rides along in the app's own colour.
      spans.add(TextSpan(text: m.group(5), style: base.copyWith(color: VlColors.red)));
    }
    index = m.end;
  }
  if (index < text.length) spans.add(TextSpan(text: text.substring(index), style: base));
  return spans.isEmpty ? [TextSpan(text: text, style: base)] : spans;
}

// ── Promotional popups ───────────────────────────────────────────────────────
/// The store's promotional popup (GET /v1/popups) — the app's counterpart to
/// the one the website raises. Shown once per app run, over the home screen,
/// and never over a screen the customer is mid-task on.
class PromoPopup {
  PromoPopup._();

  static bool _shown = false;

  /// Fetches the live popup and shows it, at most once per launch. Silent on
  /// any failure — a promotion is never worth an error in the customer's face.
  static Future<void> maybeShow(BuildContext context) async {
    if (_shown) return;
    _shown = true;
    try {
      final popups = await EcomApi.I.popups();
      if (popups.isEmpty || !context.mounted) return;
      final p = popups.first;
      await showDialog<void>(
        context: context,
        barrierColor: Colors.black.withValues(alpha: 0.6),
        builder: (ctx) => _PopupDialog(popup: p),
      );
    } catch (_) {
      // No popup, no noise.
    }
  }
}

class _PopupDialog extends StatelessWidget {
  final Popup popup;
  const _PopupDialog({required this.popup});

  void _follow(BuildContext context) {
    final link = popup.linkUrl ?? '';
    Navigator.pop(context);
    if (link.isEmpty) return;
    openLink(context, link);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Align(
          alignment: Alignment.centerRight,
          child: GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              width: 34,
              height: 34,
              margin: const EdgeInsets.only(bottom: 10),
              decoration: BoxDecoration(color: VlColors.paper, shape: BoxShape.circle),
              child: Icon(Icons.close, size: 17, color: VlColors.ink),
            ),
          ),
        ),
        Flexible(
          child: GestureDetector(
            onTap: () => _follow(context),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(VlRadii.lg),
              child: Image.network(
                popup.imageUrl!,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
                loadingBuilder: (context, child, progress) =>
                    progress == null ? child : const SizedBox(height: 220, child: Skeleton(radius: VlRadii.lg)),
              ),
            ),
          ),
        ),
        if ((popup.linkUrl ?? '').isNotEmpty) ...[
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () => _follow(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 13),
              decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
              child: Text('SHOP THE OFFER', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
            ),
          ),
        ],
      ]),
    );
  }
}

// ── Website pages in-app (gallery, policies) ─────────────────────────────────
/// A page of vkcgoldikshu.com shown inside the app. Used for the
/// content the mobile API doesn't serve — the gallery and the policy pages —
/// so the customer reads the store's real words, not a copy that can drift.
class WebPageScreen extends StatefulWidget {
  final String title;
  final String path;
  const WebPageScreen({super.key, required this.title, required this.path});
  @override
  State<WebPageScreen> createState() => _WebPageScreenState();
}

class _WebPageScreenState extends State<WebPageScreen> {
  late final WebViewController _controller;
  bool _loading = true;
  bool _failed = false;
  /// The main document finished — later resource errors are cosmetic.
  bool _loaded = false;

  String get _url => '$kSiteBase${widget.path}';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(VlColors.canvas)
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) {
          if (mounted) {
            setState(() {
              _loading = false;
              _loaded = true;
            });
          }
        },
        onWebResourceError: (error) {
          // Android reports EVERY failed sub-resource here — one blocked
          // tracker, font or image was enough to throw up "Couldn't load
          // gallery" over a page that had rendered perfectly well, which is
          // why Retry then "worked". Only a main-frame failure, before the
          // page has finished, is a real failure.
          if (!mounted || _loaded || error.isForMainFrame == false) return;
          setState(() {
            _loading = false;
            _failed = true;
          });
        },
      ))
      ..loadRequest(Uri.parse(_url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      floatingActionButton: const VideoCallFab(),
      body: SafeArea(
        child: Column(children: [
          TopBar(
            title: widget.title,
            onBack: () => context.canPop() ? context.pop() : context.go('/profile'),
            actions: [
              InkResponse(
                onTap: () => openExternal(context, _url),
                child: SizedBox(width: 36, height: 36, child: Icon(Icons.open_in_new, size: 16, color: VlColors.muted)),
              ),
            ],
          ),
          Expanded(
            child: _failed
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.wifi_off, size: 36, color: VlColors.red),
                        const SizedBox(height: 14),
                        Text('Couldn’t load ${widget.title.toLowerCase()}', textAlign: TextAlign.center, style: VlText.display(20)),
                        const SizedBox(height: 8),
                        Text('Check your connection, or open it in your browser.',
                            textAlign: TextAlign.center, style: VlText.body(12, color: VlColors.muted)),
                        const SizedBox(height: 16),
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _failed = false;
                              _loading = true;
                              _loaded = false;
                            });
                            _controller.loadRequest(Uri.parse(_url));
                          },
                          child: Text('Retry', style: VlText.ui(13, color: VlColors.red)),
                        ),
                      ]),
                    ),
                  )
                : Stack(children: [
                    WebViewWidget(controller: _controller),
                    if (_loading) const Positioned.fill(child: ColoredBox(color: Color(0xFFFFFFFF), child: DetailSkeleton(heroHeight: 200))),
                  ]),
          ),
        ]),
      ),
    );
  }
}

// ── About ────────────────────────────────────────────────────────────────────
/// The house, from the store's own /v1/app-config record and its about banner.
class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});
  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  ecom.Banner? _banner;

  @override
  void initState() {
    super.initState();
    // A missing banner just means the page falls back to the silk header.
    EcomApi.I.banners(position: 'about_banner').then((list) {
      if (mounted && list.isNotEmpty) setState(() => _banner = list.first);
    }).ignore();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      floatingActionButton: const VideoCallFab(),
      body: SafeArea(
        child: ValueListenableBuilder<StoreConfig>(
          valueListenable: storeConfig,
          builder: (context, cfg, _) => Column(children: [
            TopBar(title: 'About', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.only(bottom: 30),
                children: [
                  if ((_banner?.image ?? '').isNotEmpty)
                    AspectRatio(aspectRatio: 16 / 9, child: NetImage(url: _banner!.image, radius: 0))
                  else
                    const AspectRatio(aspectRatio: 16 / 9, child: Silk(palette: 0, radius: 0)),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      // Every line here is the store's own, from its About
                      // page — kept in step with ABOUT_DEFAULTS in
                      // lib/settings/about.ts on the web side.
                      Text("MANDYA'S PRIDE SINCE 1988", style: VlText.upper(9, color: VlColors.red, letter: 0.22)),
                      const SizedBox(height: 8),
                      Text('Sweetness of Nature,\nStrength of Tradition.', style: VlText.display(30, height: 1.15)),
                      if (cfg.tagline.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        Text(cfg.tagline, style: VlText.display(17, color: VlColors.muted, style: FontStyle.italic)),
                      ],
                      const DoubleRule(margin: EdgeInsets.symmetric(vertical: 20)),
                      Text(
                        'VKC Gold delivers the purest form of natural sweetness, straight from the sugarcane '
                        'fields of Mandya, Karnataka. Established in 1988, we are a natural food processing '
                        'enterprise dedicated to chemical-free, healthy jaggery products.',
                        style: VlText.body(14, color: VlColors.ink2, height: 1.75),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'We work directly with local farmers on fair pricing, then combine traditional know-how '
                        'with modern, eco-friendly machinery — sugarcane crushing, juice extraction, filtration, '
                        'boiling and packaging — so that nothing is lost between the field and the finished product.',
                        style: VlText.body(14, color: VlColors.ink2, height: 1.75),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Every product carries the same promise: no artificial colours, no artificial flavours, '
                        'and no chemicals added. From pure jaggery cubes and natural powder to syrups, bars and '
                        'festive gift hampers, we make natural sweetness part of everyday life.',
                        style: VlText.body(14, color: VlColors.ink2, height: 1.75),
                      ),
                      const SizedBox(height: 22),
                      Text('WHAT WE STAND FOR', style: VlText.upper(9, letter: 0.22)),
                      const SizedBox(height: 12),
                      _value('Support to Local Farmers',
                          'We empower rural communities around Mandya with fair pricing, buying cane directly from the farmers who grow it.'),
                      _value('Purity and Quality First',
                          '100% natural production with no preservatives, no artificial colours or flavours, and no chemicals added at any stage.'),
                      _value('Innovation with Tradition',
                          'Time-honoured jaggery-making combined with modern machinery and hygienic processing, for consistent quality in every batch.'),
                      _value('Sustainable Growth',
                          'Eco-friendly manufacturing that reduces waste, as we grow towards becoming a trusted global brand for Mandya’s sweetness.'),
                      const DoubleRule(margin: EdgeInsets.symmetric(vertical: 20)),
                      _fact(Icons.storefront_outlined, 'Karnataka store', cfg.storeAddress),
                      _fact(Icons.business_outlined, 'Registered office',
                          'VKC Cane Gold Foods Pvt. Ltd., Ballenahalli Village, Srirangapatna Taluk, Mandya District, Karnataka – 571807'),
                      if (cfg.phone.isNotEmpty) _fact(Icons.call_outlined, 'Call us', cfg.phone),
                      if (cfg.email.isNotEmpty) _fact(Icons.mail_outline, 'Write to us', cfg.email),
                      // The GST line is gone until the new entity's number is
                      // confirmed — the one here belonged to the old business.
                      const SizedBox(height: 12),
                      // "Our Story" pointed at /saree-stories, a page the site no
                      // longer has, so Contact stands on its own.
                      _linkBtn('CONTACT', () => context.push('/contact')),
                      // The website closes its About page with this block —
                      // its words, its two calls to action.
                      const DoubleRule(margin: EdgeInsets.symmetric(vertical: 22)),
                      Text('TASTE THE DIFFERENCE', style: VlText.upper(9, color: VlColors.red, letter: 0.22)),
                      const SizedBox(height: 8),
                      Text(
                        'Browse our range of chemical-free jaggery products — made with care, from cane '
                        'grown by farmers we know by name.',
                        style: VlText.body(14, color: VlColors.ink2, height: 1.75),
                      ),
                      const SizedBox(height: 16),
                      Row(children: [
                        Expanded(child: _linkBtn('SHOP ALL', () => context.push('/listing'))),
                        const SizedBox(width: 10),
                        Expanded(child: _linkBtn('GET IN TOUCH', () => context.push('/contact'))),
                      ]),
                      const SizedBox(height: 22),
                      Center(
                        child: Column(children: [
                          Lozenge(color: VlColors.rule2),
                          const SizedBox(height: 8),
                          Text('VKC GOLD', style: VlText.upper(8, color: VlColors.muted2, letter: 0.3)),
                        ]),
                      ),
                    ]),
                  ),
                ],
              ),
            ),
          ]),
        ),
      ),
    );
  }

  /// One of the store's stated values, in its own words.
  Widget _value(String title, String body) => Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Lozenge(color: VlColors.red, size: 5),
            const SizedBox(width: 8),
            Text(title, style: VlText.ui(13, weight: FontWeight.w600)),
          ]),
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.only(left: 13),
            child: Text(body, style: VlText.body(12, color: VlColors.muted, height: 1.6)),
          ),
        ]),
      );

  Widget _fact(IconData ic, String label, String value) {
    if (value.trim().isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(color: VlColors.cream, borderRadius: BorderRadius.circular(8)),
          child: Icon(ic, size: 15, color: VlColors.redDeep),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label.toUpperCase(), style: VlText.upper(8, color: VlColors.muted, letter: 0.2)),
            const SizedBox(height: 3),
            Text(value, style: VlText.body(12, color: VlColors.ink2, height: 1.5)),
          ]),
        ),
      ]),
    );
  }

  Widget _linkBtn(String label, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 13),
          alignment: Alignment.center,
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(VlRadii.md), border: Border.all(color: VlColors.rule2)),
          child: Text(label, style: VlText.ui(11, weight: FontWeight.w600, letter: 0.12)),
        ),
      );
}

// ── Contact ──────────────────────────────────────────────────────────────────
/// Every way to reach the store, wired to the phone: call, WhatsApp, mail,
/// maps and the socials — all from /v1/app-config.
class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      floatingActionButton: const VideoCallFab(),
      body: SafeArea(
        child: ValueListenableBuilder<StoreConfig>(
          valueListenable: storeConfig,
          builder: (context, cfg, _) {
            final digits = cfg.whatsapp.replaceAll(RegExp(r'\D'), '');
            final phoneDigits = cfg.phone.replaceAll(RegExp(r'\D'), '');
            return Column(children: [
              TopBar(title: 'Contact', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
                  children: [
                    // Same promise the website's contact page makes.
                    Text('We’d love to hear from you', style: VlText.display(26, height: 1.2)),
                    const SizedBox(height: 6),
                    Text('Questions about an order, styling advice, or just a hello — we’re here for you.',
                        style: VlText.body(13, color: VlColors.muted, height: 1.6)),
                    const SizedBox(height: 20),
                    if (digits.isNotEmpty)
                      _tile(context, Icons.chat_bubble_outline, 'WhatsApp', cfg.whatsapp, 'https://wa.me/$digits', primary: true),
                    if (phoneDigits.isNotEmpty)
                      _tile(context, Icons.call_outlined, 'Call the store', '${cfg.phone}\nMon–Sat, 9 AM – 7 PM IST', 'tel:$phoneDigits'),
                    if (cfg.email.isNotEmpty)
                      _tile(context, Icons.mail_outline, 'Email', '${cfg.email}\nWe reply within 24 hours', 'mailto:${cfg.email}'),
                    if (cfg.storeAddress.isNotEmpty)
                      _tile(context, Icons.location_on_outlined, 'Visit us', '${cfg.storeAddress}\nMon–Sat: 10 AM – 7 PM · Sun: Closed',
                          'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(cfg.storeAddress)}'),
                    // Every channel here comes from /v1/app-config; if that
                    // call hasn't landed, still give the customer a way out.
                    if (digits.isEmpty && phoneDigits.isEmpty && cfg.email.isEmpty && cfg.storeAddress.isEmpty)
                      _tile(context, Icons.language, 'vkcgoldikshu.com', 'Our contact details are on the website', kSiteBase),
                    const DoubleRule(margin: EdgeInsets.symmetric(vertical: 20)),
                    Text('FOLLOW THE WEAVE', style: VlText.upper(9, letter: 0.22)),
                    const SizedBox(height: 12),
                    // Wrap, not Row: the three chips together are wider than a
                    // 360dp screen and overflowed its right edge.
                    Wrap(spacing: 10, runSpacing: 10, children: [
                      if (cfg.instagram.isNotEmpty) _social(context, Icons.camera_alt_outlined, 'Instagram', cfg.instagram),
                      if (cfg.facebook.isNotEmpty) _social(context, Icons.facebook, 'Facebook', cfg.facebook),
                      if (cfg.youtube.isNotEmpty) _social(context, Icons.play_circle_outline, 'YouTube', cfg.youtube),
                    ]),
                    const SizedBox(height: 22),
                    GestureDetector(
                      onTap: () => context.push('/video-booking'),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: VlColors.cream,
                          borderRadius: BorderRadius.circular(VlRadii.md),
                          border: Border.all(color: VlColors.gold),
                        ),
                        child: Row(children: [
                          Icon(Icons.videocam_outlined, size: 18, color: VlColors.red),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('Shop over a video call', style: VlText.ui(13, weight: FontWeight.w600)),
                              const SizedBox(height: 2),
                              Text('We’ll drape the sarees for you, live.', style: VlText.body(11, color: VlColors.muted)),
                            ]),
                          ),
                          Icon(Icons.chevron_right, size: 16, color: VlColors.muted),
                        ]),
                      ),
                    ),
                  ],
                ),
              ),
            ]);
          },
        ),
      ),
    );
  }

  Widget _tile(BuildContext context, IconData ic, String label, String value, String url, {bool primary = false}) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: GestureDetector(
          onTap: () => openExternal(context, url),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: primary ? VlColors.redTint : VlColors.paper,
              borderRadius: BorderRadius.circular(VlRadii.md),
              border: Border.all(color: primary ? VlColors.red : VlColors.rule),
            ),
            child: Row(children: [
              Icon(ic, size: 17, color: primary ? VlColors.red : VlColors.redDeep),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(label, style: VlText.ui(12, weight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(value, style: VlText.body(11, color: VlColors.muted, height: 1.5)),
                ]),
              ),
              Icon(Icons.arrow_outward, size: 14, color: VlColors.muted2),
            ]),
          ),
        ),
      );

  Widget _social(BuildContext context, IconData ic, String label, String url) => GestureDetector(
        onTap: () => openExternal(context, url),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(999), border: Border.all(color: VlColors.rule2)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(ic, size: 14, color: VlColors.ink),
            const SizedBox(width: 6),
            Text(label, style: VlText.ui(11)),
          ]),
        ),
      );
}

// ── Video booking ────────────────────────────────────────────────────────────
/// Book a live video shopping call (POST /v1/video-booking).
class VideoBookingScreen extends StatefulWidget {
  const VideoBookingScreen({super.key});
  @override
  State<VideoBookingScreen> createState() => _VideoBookingScreenState();
}

class _VideoBookingScreenState extends State<VideoBookingScreen> {
  final _name = TextEditingController();
  final _phone = TextEditingController();
  final _notes = TextEditingController();
  DateTime? _date;
  String? _slot;
  Map<String, String> _errors = {};
  String? _formError;
  bool _saving = false;
  bool _done = false;

  static const _slots = ['10:00 AM', '11:30 AM', '1:00 PM', '3:00 PM', '4:30 PM', '6:00 PM'];

  @override
  void initState() {
    super.initState();
    final u = EcomAuth.I.user.value;
    if (u != null) {
      _name.text = u.displayName == 'Guest' ? '' : u.displayName;
      _phone.text = (u.phone ?? '').replaceAll(RegExp(r'\D'), '');
      if (_phone.text.length > 10) _phone.text = _phone.text.substring(_phone.text.length - 10);
    }
  }

  @override
  void dispose() {
    for (final c in [_name, _phone, _notes]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date ?? now.add(const Duration(days: 1)),
      firstDate: now,
      lastDate: now.add(const Duration(days: 60)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(colorScheme: ColorScheme.light(primary: VlColors.red, onPrimary: Colors.white)),
        child: child!,
      ),
    );
    if (picked != null && mounted) {
      setState(() {
        _date = picked;
        _errors = {..._errors}..remove('date');
      });
    }
  }

  Future<void> _submit() async {
    final errors = <String, String>{};
    if (_name.text.trim().isEmpty) errors['name'] = 'Required';
    if (_phone.text.trim().length < 10) errors['phone'] = 'Valid 10-digit number required';
    if (_date == null) errors['date'] = 'Pick a date';
    if (_slot == null) errors['slot'] = 'Pick a time';
    setState(() {
      _errors = errors;
      _formError = null;
    });
    if (errors.isNotEmpty) return;

    setState(() => _saving = true);
    try {
      await EcomApi.I.bookVideoCall(
        name: _name.text.trim(),
        phone: _phone.text.trim(),
        preferredDate: DateFormat('yyyy-MM-dd').format(_date!),
        preferredTime: _slot!,
        notes: _notes.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        _saving = false;
        _done = true;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _formError = ecomError(e, 'Could not book the call. Please try again.');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VlColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'Video Shopping', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
          Expanded(child: _done ? _confirmation() : _form()),
        ]),
      ),
    );
  }

  Widget _confirmation() => Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(
              width: 84,
              height: 84,
              decoration: BoxDecoration(color: VlColors.green, shape: BoxShape.circle),
              child: const Icon(Icons.videocam, size: 38, color: Colors.white),
            ),
            const SizedBox(height: 22),
            Text('REQUEST RECEIVED', style: VlText.upper(9, color: VlColors.red, letter: 0.22)),
            const SizedBox(height: 8),
            Text('We’ll call you back', textAlign: TextAlign.center, style: VlText.display(26)),
            const SizedBox(height: 8),
            Text(
              'Our store team will confirm your slot on ${_date == null ? '' : DateFormat('d MMMM').format(_date!)}'
              '${_slot == null ? '' : ' at $_slot'} over WhatsApp.',
              textAlign: TextAlign.center,
              style: VlText.body(13, color: VlColors.muted, height: 1.6),
            ),
            const SizedBox(height: 24),
            GestureDetector(
              onTap: () => context.canPop() ? context.pop() : context.go('/home'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
                child: Text('DONE', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
              ),
            ),
          ]),
        ),
      );

  Widget _form() => ListView(
        padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
        children: [
          Text('Shop with us, live', style: VlText.display(26, height: 1.2)),
          const SizedBox(height: 6),
          Text('Pick a time and we’ll ring you on WhatsApp — sarees draped, borders held to the light, questions answered.',
              style: VlText.body(13, color: VlColors.muted, height: 1.7)),
          const SizedBox(height: 20),
          if (_formError != null) ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: VlColors.redTint,
                border: Border.all(color: VlColors.red),
                borderRadius: BorderRadius.circular(VlRadii.sm),
              ),
              child: Text(_formError!, style: VlText.body(12, color: VlColors.red)),
            ),
            const SizedBox(height: 14),
          ],
          _field(_name, 'Your name *', 'Priya Sharma', 'name', TextInputType.name),
          _field(_phone, 'WhatsApp number *', '10-digit number', 'phone', TextInputType.phone,
              formatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)]),
          _dateField(),
          _slotPicker(),
          _field(_notes, 'What are you looking for?', 'Kanjivaram for a wedding, under ₹25,000…', 'notes', TextInputType.multiline,
              maxLines: 3),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: _saving ? null : _submit,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 15),
              alignment: Alignment.center,
              decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(VlRadii.md)),
              child: _saving
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Text('REQUEST A CALL', style: VlText.ui(12, weight: FontWeight.w600, color: Colors.white, letter: 0.1)),
            ),
          ),
          const SizedBox(height: 10),
          Center(child: Text('Free · about 20 minutes', style: VlText.mono(9, color: VlColors.muted2, letter: 0.14))),
        ],
      );

  Widget _dateField() {
    final err = _errors['date'];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Preferred date *', style: VlText.ui(11, weight: FontWeight.w500, color: VlColors.muted)),
        const SizedBox(height: 6),
        GestureDetector(
          onTap: _pickDate,
          child: Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 14),
            decoration: BoxDecoration(
              color: VlColors.paper,
              borderRadius: BorderRadius.circular(VlRadii.md),
              border: Border.all(color: err != null ? VlColors.red : VlColors.rule),
            ),
            child: Row(children: [
              Expanded(
                child: Text(
                  _date == null ? 'Choose a day' : DateFormat('EEEE, d MMMM yyyy').format(_date!),
                  style: _date == null ? VlText.body(13, color: VlColors.muted2) : VlText.ui(14),
                ),
              ),
              Icon(Icons.calendar_today_outlined, size: 15, color: VlColors.muted),
            ]),
          ),
        ),
        if (err != null) ...[const SizedBox(height: 4), Text(err, style: VlText.body(11, color: VlColors.red))],
      ]),
    );
  }

  Widget _slotPicker() {
    final err = _errors['slot'];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Preferred time *', style: VlText.ui(11, weight: FontWeight.w500, color: VlColors.muted)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _slots.map((s) {
            final on = _slot == s;
            return GestureDetector(
              onTap: () => setState(() {
                _slot = s;
                _errors = {..._errors}..remove('slot');
              }),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(
                  color: on ? VlColors.red : VlColors.paper,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: on ? VlColors.red : VlColors.rule2),
                ),
                child: Text(s, style: VlText.ui(12, color: on ? Colors.white : VlColors.ink)),
              ),
            );
          }).toList(),
        ),
        if (err != null) ...[const SizedBox(height: 6), Text(err, style: VlText.body(11, color: VlColors.red))],
      ]),
    );
  }

  Widget _field(
    TextEditingController c,
    String label,
    String hint,
    String key,
    TextInputType type, {
    List<TextInputFormatter>? formatters,
    int maxLines = 1,
  }) {
    final err = _errors[key];
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: VlText.ui(11, weight: FontWeight.w500, color: VlColors.muted)),
        const SizedBox(height: 6),
        TextField(
          controller: c,
          keyboardType: type,
          maxLines: maxLines,
          inputFormatters: formatters,
          textCapitalization: type == TextInputType.name ? TextCapitalization.words : TextCapitalization.sentences,
          style: VlText.ui(14),
          onChanged: err == null ? null : (_) => setState(() => _errors = {..._errors}..remove(key)),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: VlText.body(13, color: VlColors.muted2),
            filled: true,
            fillColor: VlColors.paper,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
            enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(VlRadii.md),
                borderSide: BorderSide(color: err != null ? VlColors.red : VlColors.rule)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(VlRadii.md), borderSide: BorderSide(color: VlColors.red)),
          ),
        ),
        if (err != null) ...[const SizedBox(height: 4), Text(err, style: VlText.body(11, color: VlColors.red))],
      ]),
    );
  }
}
