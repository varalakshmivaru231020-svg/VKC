import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_config.dart';
import '../ecom/ecom_env.dart';
import '../ecom/ecom_models.dart' hide Banner;
import '../theme.dart';
import '../widgets.dart';

const kSiteBase = ecomHost;

/// Tab roots live inside the bottom-nav shell and are navigated with go().
const _tabRoutes = {'/home', '/categories', '/shop', '/cart', '/profile'};

/// Website path → app route, for the links the store attaches to hero
/// slides, banners and popups. Null means the app has no screen for it.
String? _appRoute(String path) {
  final uri = Uri.tryParse(path);
  if (uri == null) return null;
  final p = uri.path;
  final segs = uri.pathSegments;
  final query = uri.query.isEmpty ? '' : '?${uri.query}';
  if (p == '/' || p == '') return '/home';
  if (p == '/shop' || p == '/new-arrivals') return '/shop';
  if (p == '/search') return '/search$query';
  if (segs.length == 2 && segs.first == 'category') return '/listing?cat=${segs[1]}';
  if (segs.length == 2 && (segs.first == 'shop' || segs.first == 'product')) return '/product/${segs[1]}';
  if (p == '/blog') return '/journal';
  if (segs.length == 2 && segs.first == 'blog') return '/journal/${segs[1]}';
  // About and Leadership are read on the website itself, so they fall through
  // to the browser below.
  if (p == '/contact' || p == '/track-order' || p == '/gallery') return p;
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
    if (fallback != null) _go(context, fallback);
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
  _go(context, route);
}

void _go(BuildContext context, String route) {
  if (_tabRoutes.contains(route)) {
    context.go(route);
  } else {
    context.push(route);
  }
}

// ── Blog ─────────────────────────────────────────────────────────────────────
/// The store's blog, from GET /v1/blogs. Tapping a post opens it in the app.
class BlogListScreen extends StatefulWidget {
  const BlogListScreen({super.key});
  @override
  State<BlogListScreen> createState() => _BlogListScreenState();
}

class _BlogListScreenState extends State<BlogListScreen> {
  List<BlogPost> _posts = [];
  bool _loading = true;
  Object? _error;

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
        _error = e;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(title: 'Blog', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
          Expanded(child: _body()),
        ]),
      ),
    );
  }

  Widget _body() {
    if (_loading && _posts.isEmpty) {
      return ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        itemCount: 3,
        physics: const NeverScrollableScrollPhysics(),
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (_, __) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: const [
          Skeleton(height: 170, radius: VkRadii.md),
          SizedBox(height: 10),
          Skeleton(width: 80, height: 9),
          SizedBox(height: 8),
          Skeleton(height: 14),
        ]),
      );
    }
    if (_error != null && _posts.isEmpty) return StateView.error(_error, onRetry: _load);
    if (_posts.isEmpty) return const StateView(icon: Icons.menu_book_outlined, title: 'No stories yet', body: 'Notes from the cane fields will appear here.');
    return RefreshIndicator(
      color: VkColors.primary,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
        itemCount: _posts.length,
        separatorBuilder: (_, __) => const DoubleRule(margin: EdgeInsets.symmetric(vertical: 18)),
        itemBuilder: (_, i) => _card(_posts[i]),
      ),
    );
  }

  Widget _card(BlogPost p) => PressScale(
        onTap: () => context.push('/journal/${p.slug}'),
        scale: 0.985,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if ((p.imageUrl ?? '').isNotEmpty) AspectRatio(aspectRatio: 16 / 10, child: NetImage(url: p.imageUrl, radius: VkRadii.md)),
          const SizedBox(height: 12),
          if (p.publishedAt != null)
            Text(DateFormat('d MMMM yyyy').format(p.publishedAt!.toLocal()).toUpperCase(), style: VkText.upper(9, color: VkColors.primary, letter: 0.16)),
          const SizedBox(height: 6),
          Text(p.title, style: VkText.display(22, height: 1.15)),
          if ((p.excerpt ?? '').isNotEmpty) ...[
            const SizedBox(height: 6),
            Text(p.excerpt!, maxLines: 3, overflow: TextOverflow.ellipsis, style: VkText.body(13, color: VkColors.muted, height: 1.6)),
          ],
          const SizedBox(height: 8),
          Row(children: [
            Text('READ', style: VkText.upper(9, color: VkColors.primary, letter: 0.16)),
            const SizedBox(width: 6),
            const Icon(Icons.arrow_forward_rounded, size: 13, color: VkColors.primary),
          ]),
        ]),
      );
}

/// One blog post (GET /v1/blogs/:slug).
class BlogDetailScreen extends StatefulWidget {
  final String slug;
  const BlogDetailScreen({super.key, required this.slug});
  @override
  State<BlogDetailScreen> createState() => _BlogDetailScreenState();
}

class _BlogDetailScreenState extends State<BlogDetailScreen> {
  BlogPost? _post;
  bool _loading = true;
  Object? _error;

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
        _error = e;
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = _post;
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(
            title: 'Story',
            onBack: () => context.canPop() ? context.pop() : context.go('/journal'),
            actions: [
              if (p != null)
                TopBar.action(Icons.ios_share_rounded, () {
                  Clipboard.setData(ClipboardData(text: '$kSiteBase/blog/${p.slug}'));
                  toast(context, 'Link copied');
                }, tooltip: 'Copy link'),
            ],
          ),
          Expanded(
            child: _loading
                ? const DetailSkeleton(heroHeight: 220)
                : _error != null || p == null
                    ? StateView.error(_error, onRetry: _load)
                    : ListView(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
                        children: [
                          if ((p.imageUrl ?? '').isNotEmpty) ...[
                            AspectRatio(aspectRatio: 16 / 10, child: NetImage(url: p.imageUrl, radius: VkRadii.md)),
                            const SizedBox(height: 16),
                          ],
                          if (p.publishedAt != null)
                            Text(DateFormat('d MMMM yyyy').format(p.publishedAt!.toLocal()).toUpperCase(), style: VkText.upper(9, color: VkColors.primary, letter: 0.16)),
                          const SizedBox(height: 8),
                          Text(p.title, style: VkText.display(28, height: 1.15)),
                          if (p.tags.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Wrap(spacing: 6, runSpacing: 6, children: [
                              for (final t in p.tags)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(border: Border.all(color: VkColors.rule2), borderRadius: BorderRadius.circular(4)),
                                  child: Text(t.toUpperCase(), style: VkText.upper(8, color: VkColors.muted, letter: 0.1)),
                                ),
                            ]),
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
/// Renders the subset of Markdown the store's blog uses — headings,
/// paragraphs, bold/italic, lists, quotes and rules — in the app's own type.
List<Widget> markdownToWidgets(String md) {
  final out = <Widget>[];
  final source = md.contains('<p') || md.contains('<br') ? stripHtml(md) : md;
  final lines = source.replaceAll('\r\n', '\n').split('\n');
  final paragraph = <String>[];

  void flush() {
    if (paragraph.isEmpty) return;
    final text = paragraph.join(' ').trim();
    paragraph.clear();
    if (text.isEmpty) return;
    out.add(Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: RichText(text: TextSpan(children: _inline(text, VkText.body(14, color: VkColors.ink2, height: 1.75)))),
    ));
  }

  for (final raw in lines) {
    final trimmed = raw.trim();
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
        child: Text(text, style: VkText.display(size, height: 1.25)),
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
        decoration: const BoxDecoration(color: VkColors.cream, border: Border(left: BorderSide(color: VkColors.primary, width: 2))),
        child: RichText(text: TextSpan(children: _inline(trimmed.substring(2), VkText.display(16, height: 1.6, style: FontStyle.italic, weight: FontWeight.w500)))),
      ));
      continue;
    }
    final bullet = RegExp(r'^[-*+•]\s+(.*)$').firstMatch(trimmed);
    final numbered = RegExp(r'^(\d+)[.)]\s+(.*)$').firstMatch(trimmed);
    if (bullet != null || numbered != null) {
      flush();
      final marker = numbered != null ? '${numbered.group(1)}.' : '•';
      final text = numbered != null ? numbered.group(2)! : bullet!.group(1)!;
      out.add(Padding(
        padding: const EdgeInsets.only(bottom: 8, left: 4),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 20, child: Text(marker, style: VkText.body(14, color: VkColors.primary, height: 1.75))),
          Expanded(child: RichText(text: TextSpan(children: _inline(text, VkText.body(14, color: VkColors.ink2, height: 1.75))))),
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
      spans.add(TextSpan(text: m.group(4), style: VkText.mono(12, color: VkColors.ink)));
    } else if (m.group(5) != null) {
      spans.add(TextSpan(text: m.group(5), style: base.copyWith(color: VkColors.primary)));
    }
    index = m.end;
  }
  if (index < text.length) spans.add(TextSpan(text: text.substring(index), style: base));
  return spans.isEmpty ? [TextSpan(text: text, style: base)] : spans;
}

// ── Promotional popups ───────────────────────────────────────────────────────
/// The store's promotional popup (GET /v1/popups). Shown once per app run,
/// over the home screen, and never over a screen the customer is mid-task on.
class PromoPopup {
  PromoPopup._();

  static bool _shown = false;

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
              width: 36,
              height: 36,
              margin: const EdgeInsets.only(bottom: 10),
              decoration: const BoxDecoration(color: VkColors.paper, shape: BoxShape.circle),
              child: const Icon(Icons.close_rounded, size: 18, color: VkColors.ink),
            ),
          ),
        ),
        Flexible(
          child: GestureDetector(
            onTap: () => _follow(context),
            child: AspectRatio(
              aspectRatio: 4 / 5,
              child: NetImage(url: popup.imageUrl, radius: VkRadii.lg, fit: BoxFit.contain),
            ),
          ),
        ),
        if ((popup.linkUrl ?? '').isNotEmpty) ...[
          const SizedBox(height: 14),
          PrimaryButton(label: 'Shop the offer', expanded: false, height: 46, onTap: () => _follow(context)),
        ],
      ]),
    );
  }
}

// ── Website pages in-app (about, leadership, policies) ───────────────────────
/// A page of vkcgoldikshu.com shown inside the app, with the site's own
/// header, footer and floating buttons hidden so it reads as part of the app.
/// Used for About Us and Leadership, whose content is edited once on the site.
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
  bool _loaded = false;

  String get _url => '$kSiteBase${widget.path}';

  static const _hideChrome = r"""
(function(){
  var s = document.createElement('style');
  s.innerHTML = 'header, footer, nav.fixed, a[href*="wa.me"].fixed, [class*="WhatsAppFloat"] { display:none !important } main { padding-top:0 !important }';
  document.head.appendChild(s);
})();""";

  @override
  void initState() {
    super.initState();
    final host = Uri.parse(kSiteBase).host;
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(VkColors.canvas)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: (req) {
          final uri = Uri.tryParse(req.url);
          // Keep the site's own pages in the app; hand anything else
          // (maps, socials, WhatsApp, mail) to the phone.
          if (uri != null && uri.host.isNotEmpty && uri.host != host && !uri.host.endsWith('.$host')) {
            openExternal(context, req.url);
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
        onPageStarted: (_) => _controller.runJavaScript(_hideChrome).catchError((_) {}),
        onPageFinished: (_) {
          _controller.runJavaScript(_hideChrome).catchError((_) {});
          if (mounted) {
            setState(() {
              _loading = false;
              _loaded = true;
            });
          }
        },
        onWebResourceError: (error) {
          // Only a main-frame failure before the page has finished is a real
          // failure; a blocked tracker or font is not.
          if (!mounted || _loaded || error.isForMainFrame == false) return;
          setState(() {
            _loading = false;
            _failed = true;
          });
        },
      ))
      ..loadRequest(Uri.parse(_url));
  }

  void _retry() {
    setState(() {
      _failed = false;
      _loading = true;
      _loaded = false;
    });
    _controller.loadRequest(Uri.parse(_url));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: Column(children: [
          TopBar(
            title: widget.title,
            onBack: () => context.canPop() ? context.pop() : context.go('/profile'),
            actions: [TopBar.action(Icons.open_in_browser_rounded, () => openExternal(context, _url), tooltip: 'Open in browser')],
          ),
          Expanded(
            child: _failed
                ? StateView(
                    icon: Icons.wifi_off_rounded,
                    title: "Couldn't load ${widget.title.toLowerCase()}",
                    body: 'Check your connection, or open it in your browser.',
                    cta: 'Try again',
                    onCta: _retry,
                    secondary: 'Open in browser',
                    onSecondary: () => openExternal(context, _url),
                  )
                : Stack(children: [
                    WebViewWidget(controller: _controller),
                    if (_loading) const Positioned.fill(child: ColoredBox(color: VkColors.canvas, child: DetailSkeleton(heroHeight: 200))),
                  ]),
          ),
        ]),
      ),
    );
  }
}

// ── Contact ──────────────────────────────────────────────────────────────────
/// Every way to reach the store — call, WhatsApp, mail, maps, socials — all
/// from /v1/app-config.
class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: VkColors.canvas,
      body: SafeArea(
        child: ValueListenableBuilder<StoreConfig>(
          valueListenable: storeConfig,
          builder: (context, cfg, _) {
            final phoneDigits = cfg.phone.replaceAll(RegExp(r'\D'), '');
            // WhatsApp falls back to the store phone when no separate number is set.
            var waDigits = cfg.whatsapp.replaceAll(RegExp(r'\D'), '');
            if (waDigits.isEmpty) waDigits = phoneDigits;
            if (waDigits.length == 10) waDigits = '91$waDigits';
            final email = cfg.email.trim();
            return Column(children: [
              TopBar(title: 'Contact Us', onBack: () => context.canPop() ? context.pop() : context.go('/profile')),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.fromLTRB(20, 18, 20, 28),
                  children: [
                    Text('We’d love to hear from you', style: VkText.display(26, height: 1.2)),
                    const SizedBox(height: 6),
                    Text('Questions about an order, our jaggery, or bulk and gift enquiries — we’re here for you.',
                        style: VkText.body(13, color: VkColors.muted, height: 1.6)),
                    const SizedBox(height: 20),
                    if (waDigits.isNotEmpty)
                      _tile(context, Icons.chat_rounded, 'Chat on WhatsApp', 'Fastest way to reach us', 'https://wa.me/$waDigits', primary: true),
                    if (phoneDigits.isNotEmpty) _tile(context, Icons.call_outlined, 'Call the store', cfg.phone, 'tel:$phoneDigits'),
                    if (email.isNotEmpty) _tile(context, Icons.mail_outline_rounded, 'Email', email, 'mailto:$email'),
                    if (cfg.storeAddress.isNotEmpty)
                      _tile(context, Icons.location_on_outlined, 'Visit us', cfg.storeAddress,
                          'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(cfg.storeAddress)}'),
                    _tile(context, Icons.language_rounded, 'vkcgoldikshu.com', 'Our website', kSiteBase),
                    if (cfg.instagram.isNotEmpty || cfg.facebook.isNotEmpty || cfg.youtube.isNotEmpty) ...[
                      const DoubleRule(margin: EdgeInsets.symmetric(vertical: 20)),
                      Text('FOLLOW US', style: VkText.upper(9, letter: 0.18)),
                      const SizedBox(height: 12),
                      Wrap(spacing: 10, runSpacing: 10, children: [
                        if (cfg.instagram.isNotEmpty) VkChip(label: 'Instagram', icon: Icons.camera_alt_outlined, onTap: () => openExternal(context, cfg.instagram)),
                        if (cfg.facebook.isNotEmpty) VkChip(label: 'Facebook', icon: Icons.facebook, onTap: () => openExternal(context, cfg.facebook)),
                        if (cfg.youtube.isNotEmpty) VkChip(label: 'YouTube', icon: Icons.play_circle_outline, onTap: () => openExternal(context, cfg.youtube)),
                      ]),
                    ],
                    const SizedBox(height: 22),
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(color: VkColors.cream, borderRadius: BorderRadius.circular(VkRadii.md)),
                      child: Row(children: [
                        const Icon(Icons.pin_drop_outlined, size: 18, color: VkColors.primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text('Where is my order?', style: VkText.ui(13, weight: FontWeight.w600)),
                            const SizedBox(height: 2),
                            Text('Track it with your order number.', style: VkText.body(11, color: VkColors.muted)),
                          ]),
                        ),
                        TextButton(onPressed: () => context.push('/track-order'), child: Text('Track', style: VkText.ui(12.5, weight: FontWeight.w600, color: VkColors.primary))),
                      ]),
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
        child: PressScale(
          onTap: () => openExternal(context, url),
          scale: 0.985,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: primary ? VkColors.leafSoft : VkColors.paper,
              borderRadius: BorderRadius.circular(VkRadii.md),
              border: Border.all(color: primary ? VkColors.leaf : VkColors.rule),
            ),
            child: Row(children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: primary ? VkColors.leaf : VkColors.cream, shape: BoxShape.circle),
                child: Icon(ic, size: 19, color: primary ? Colors.white : VkColors.primaryDeep),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(label, style: VkText.ui(13, weight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  Text(value, style: VkText.body(11.5, color: VkColors.muted, height: 1.45)),
                ]),
              ),
              const Icon(Icons.arrow_outward_rounded, size: 16, color: VkColors.muted2),
            ]),
          ),
        ),
      );
}
