import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../ecom/ecom_api.dart';
import '../ecom/ecom_models.dart' hide Banner;
import '../site_links.dart';
import '../theme.dart';
import '../widgets.dart';

/// Tab roots live inside the bottom-nav shell and are navigated with go().
const _tabRoutes = {'/home', '/categories', '/shop', '/cart', '/profile'};

/// Follows a store link: a page the app has opens in the app (the website's
/// content pages in the in-app WebView), anything else opens in the browser.
/// [fallback] covers links the store left empty.
void openLink(BuildContext context, String? href, {String? fallback}) {
  final raw = (href ?? '').trim();
  if (raw.isEmpty) {
    if (fallback != null) _go(context, fallback);
    return;
  }
  final isPath = raw.startsWith('/');
  final route = isPath ? appRouteForSitePath(raw) : appRouteForSiteUrl(raw);
  if (route == null) {
    openExternal(context, isPath ? '$kSiteBase$raw' : raw);
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

// ── Website pages in-app (about, contact, policies…) ─────────────────────────
/// Opens one of the website's pages — About Us, Leadership, Credentials,
/// Contact Us, Shipping, Returns, Privacy, Terms — inside the app, in a
/// WebView on the LIVE page. [pathOrUrl] is a website path ('/privacy') or a
/// full https URL (a legal page the store hosts elsewhere).
void openSitePage(BuildContext context, String pathOrUrl, {String? title}) {
  context.push(webRoute(pathOrUrl, title: title));
}

/// A page of vkcgoldikshu.com shown inside the app, with the site's own
/// header, footer and floating buttons hidden so it reads as part of the app.
///
/// Nothing is bundled: every open loads the live URL, so a change made in the
/// website or its admin shows up here without a new APK. Back walks the page's
/// own history first; Refresh drops the WebView cache and reloads. Links stay
/// in the app when they are the site's own pages, go to the native screen when
/// the app has one (products, cart…), and go to the phone for everything else
/// (tel:, mailto:, WhatsApp, maps, other sites, PDFs).
class WebPageScreen extends StatefulWidget {
  final String title;

  /// A website path ('/about') or a full https URL.
  final String url;
  const WebPageScreen({super.key, required this.title, required this.url});
  @override
  State<WebPageScreen> createState() => _WebPageScreenState();
}

/// Why the page couldn't be shown; drives the message and the retry.
class _PageProblem {
  final IconData icon;
  final String title;
  final String body;
  final String url;
  const _PageProblem(this.icon, this.title, this.body, this.url);
}

class _WebPageScreenState extends State<WebPageScreen> {
  late final WebViewController _controller;
  late final String _startUrl;
  late final Set<String> _pageHosts;
  String _current = '';
  late String _title = widget.title;
  int _progress = 0;
  bool _shown = false; // the first page has finished loading
  bool _canGoBack = false;
  _PageProblem? _problem;

  /// Hides the site's own chrome (the app has its own bar) once per document.
  static const _hideChrome = r"""
(function(){
  if (!document.head || document.getElementById('vkc-app-chrome')) return;
  var s = document.createElement('style');
  s.id = 'vkc-app-chrome';
  s.innerHTML = 'header, footer, nav.fixed, a[href*="wa.me"].fixed, [class*="WhatsAppFloat"] { display:none !important } main { padding-top:0 !important }';
  document.head.appendChild(s);
})();""";

  @override
  void initState() {
    super.initState();
    _startUrl = resolveSiteUrl(widget.url) ?? kSiteBase;
    _current = _startUrl;
    _pageHosts = {Uri.parse(_startUrl).host.toLowerCase()};
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(VkColors.canvas)
      ..setNavigationDelegate(NavigationDelegate(
        onNavigationRequest: _onNavigation,
        onPageStarted: _onPageStarted,
        onProgress: _onProgress,
        onPageFinished: _onPageFinished,
        onUrlChange: (change) {
          if (change.url != null) {
            _current = change.url!;
            _syncTitle(_current);
          }
          _syncBack();
        },
        onHttpError: _onHttpError,
        onWebResourceError: _onResourceError,
      ))
      ..loadRequest(Uri.parse(_startUrl));
  }

  bool get _ownSite => isSiteHost(Uri.tryParse(_current)?.host ?? '');

  void _inject() {
    if (_ownSite) _controller.runJavaScript(_hideChrome).catchError((_) {});
  }

  NavigationDecision _onNavigation(NavigationRequest req) {
    final decision = decideLink(req.url, pageHosts: _pageHosts, isMainFrame: req.isMainFrame);
    switch (decision.action) {
      case LinkAction.stay:
        return NavigationDecision.navigate;
      case LinkAction.app:
        if (mounted) _go(context, decision.route!);
        return NavigationDecision.prevent;
      case LinkAction.external:
        if (mounted) openExternal(context, req.url);
        return NavigationDecision.prevent;
    }
  }

  void _onPageStarted(String url) {
    // The WebView's own error page reports itself as a page; keep our message.
    if (url.startsWith('chrome-error:')) return;
    _current = url;
    _syncTitle(url);
    _inject();
    if (!mounted) return;
    setState(() {
      _problem = null;
      _progress = 0;
    });
    _syncBack();
  }

  /// The bar names the page on screen: following a link from Credentials to
  /// Leadership retitles it, and going back retitles it again.
  void _syncTitle(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null || !isSiteHost(uri.host)) return;
    final page = sitePageFor(uri.path);
    if (page != null && page.title != _title && mounted) setState(() => _title = page.title);
  }

  void _onProgress(int p) {
    if (p > 20) _inject();
    if (mounted) setState(() => _progress = p);
  }

  void _onPageFinished(String url) {
    if (!url.startsWith('chrome-error:')) _current = url;
    _inject();
    if (mounted) {
      setState(() {
        _shown = true;
        _progress = 100;
      });
    }
    _syncBack();
    _checkStatus(url);
  }

  /// The site's own 404 and 500 pages load as ordinary pages, so ask the
  /// browser what status the page came back with. A policy the store hasn't
  /// published yet is a 404 — say so instead of showing the site's error page.
  Future<void> _checkStatus(String url) async {
    if (url.startsWith('chrome-error:') || !url.startsWith('http')) return;
    try {
      final result = await _controller.runJavaScriptReturningResult(
        "(performance.getEntriesByType('navigation')[0] || {}).responseStatus || 0",
      );
      final status = int.tryParse(result.toString().replaceAll('"', '').trim()) ?? 0;
      // Ignore a result that arrives after the customer has moved on.
      if (status >= 400 && mounted && url == _current) _showHttpProblem(status, url);
    } catch (_) {
      // An older WebView without responseStatus: the HTTP error callback covers it.
    }
  }

  void _onHttpError(HttpResponseError e) {
    final status = e.response?.statusCode ?? 0;
    final uri = e.request?.uri ?? e.response?.uri;
    if (status < 400 || uri == null || !mounted) return;
    // Only the page itself: a missing font, image or a prefetch is not a failure.
    if (uri.queryParameters.containsKey('_rsc') || !_isCurrentPage(uri)) return;
    _showHttpProblem(status, uri.toString());
  }

  void _showHttpProblem(int status, String url) {
    final missing = status == 404 || status == 410;
    setState(() {
      _shown = true;
      _problem = _PageProblem(
        missing ? Icons.hourglass_empty_rounded : Icons.cloud_off_rounded,
        missing ? 'This page isn’t available yet' : 'The website is having trouble',
        missing ? '$_title isn’t published on the website right now. Please check back soon.' : 'Please try again in a moment.',
        url,
      );
    });
  }

  void _onResourceError(WebResourceError error) {
    // A blocked tracker or font is not a failure, and iOS reports its own
    // cancelled navigations (-999) too. Only the page itself counts.
    if (!mounted || error.isForMainFrame == false || error.errorCode == -999) return;
    setState(() {
      _shown = true;
      _problem = _PageProblem(
        Icons.wifi_off_rounded,
        'Couldn’t open this page',
        'Check your internet connection and try again.',
        error.url ?? _current,
      );
    });
  }

  bool _isCurrentPage(Uri u) {
    String key(Uri x) => '${x.host.toLowerCase()}${x.path.length > 1 && x.path.endsWith('/') ? x.path.substring(0, x.path.length - 1) : x.path}';
    final now = Uri.tryParse(_current);
    return (now != null && key(now) == key(u)) || key(Uri.parse(_startUrl)) == key(u);
  }

  Future<void> _syncBack() async {
    final can = await _controller.canGoBack();
    if (mounted && can != _canGoBack) setState(() => _canGoBack = can);
  }

  /// Back walks the page's own history first, then leaves the screen.
  Future<void> _back() async {
    if (await _controller.canGoBack()) {
      await _controller.goBack();
    } else if (mounted) {
      context.canPop() ? context.pop() : context.go('/home');
    }
  }

  /// Refresh: drop the WebView's cache so the newest content is fetched.
  Future<void> _refresh() async {
    final retry = _problem?.url;
    if (mounted) {
      setState(() {
        _problem = null;
        _progress = 0;
      });
    }
    try {
      await _controller.clearCache();
    } catch (_) {}
    if (retry != null && retry.isNotEmpty) {
      await _controller.loadRequest(Uri.parse(retry));
    } else {
      await _controller.reload();
    }
  }

  @override
  Widget build(BuildContext context) {
    final problem = _problem;
    return PopScope(
      canPop: !_canGoBack,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _controller.goBack();
      },
      child: Scaffold(
        backgroundColor: VkColors.canvas,
        body: SafeArea(
          child: Column(children: [
            TopBar(
              title: _title,
              onBack: _back,
              actions: [TopBar.action(Icons.refresh_rounded, _refresh, tooltip: 'Refresh')],
            ),
            Expanded(
              child: Stack(children: [
                WebViewWidget(controller: _controller),
                if (!_shown && problem == null) const Positioned.fill(child: ColoredBox(color: VkColors.canvas, child: DetailSkeleton(heroHeight: 200))),
                if (_shown && _progress < 100 && problem == null)
                  Positioned(
                    top: 0,
                    left: 0,
                    right: 0,
                    child: LinearProgressIndicator(value: _progress / 100, minHeight: 2, color: VkColors.primary, backgroundColor: Colors.transparent),
                  ),
                if (problem != null)
                  Positioned.fill(
                    child: ColoredBox(
                      color: VkColors.canvas,
                      child: StateView(icon: problem.icon, title: problem.title, body: problem.body, cta: 'Try again', onCta: _refresh),
                    ),
                  ),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}
