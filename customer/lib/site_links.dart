import 'ecom/ecom_env.dart';

/// Pure link rules for the website pages the app shows in an in-app WebView.
/// No Flutter here, so every rule can be unit-tested.
///
/// The website stays the source of truth: the app only knows which pages are
/// "ours" (so they open in the app instead of a browser) and what to call
/// them. Their content is never bundled — it is fetched live on every open.

/// The site, e.g. https://vkcgoldikshu.com.
const kSiteBase = ecomHost;

/// A page of the website that opens inside the app.
class SitePage {
  final String title;

  /// The live route on the website.
  final String path;

  /// Other paths that mean the same page (older links, banners, notifications).
  final List<String> aliases;
  const SitePage(this.title, this.path, {this.aliases = const []});
}

/// Contact Us, Shipping Policy, Return & Exchange, Privacy Policy, Terms &
/// Conditions, Credentials, Leadership and About Us.
const kSitePages = <SitePage>[
  SitePage('About Us', '/about'),
  SitePage('Leadership', '/leadership'),
  SitePage('Credentials', '/credentials'),
  SitePage('Contact Us', '/contact'),
  SitePage('Shipping Policy', '/shipping', aliases: ['/shipping-policy']),
  SitePage(
    'Return & Exchange',
    '/returns',
    aliases: ['/return-policy', '/return-exchange', '/returns-exchange'],
  ),
  SitePage('Privacy Policy', '/privacy', aliases: ['/privacy-policy']),
  SitePage(
    'Terms & Conditions',
    '/terms',
    aliases: ['/terms-and-conditions', '/terms-conditions'],
  ),
];

String _cleanPath(String path) {
  var p = path;
  final cut = p.indexOf(RegExp(r'[?#]'));
  if (cut >= 0) p = p.substring(0, cut);
  if (p.length > 1 && p.endsWith('/')) p = p.substring(0, p.length - 1);
  return p.toLowerCase();
}

/// The in-app page a website path belongs to, or null.
SitePage? sitePageFor(String path) {
  final p = _cleanPath(path);
  for (final page in kSitePages) {
    if (p == page.path || page.aliases.contains(p)) return page;
  }
  return null;
}

/// True when [host] is the store's own site (or one of its subdomains).
bool isSiteHost(String host) {
  final site = Uri.parse(kSiteBase).host;
  final h = host.toLowerCase();
  return h == site || h.endsWith('.$site');
}

/// An absolute http(s) URL for a website path or a full URL; null when the
/// input is something a WebView should never be pointed at (file:, javascript:…).
String? resolveSiteUrl(String input) {
  final raw = input.trim();
  if (raw.isEmpty) return null;
  final uri = Uri.tryParse(raw);
  if (uri == null) return null;
  if (uri.hasScheme) {
    return (uri.scheme == 'http' || uri.scheme == 'https') &&
            uri.host.isNotEmpty
        ? raw
        : null;
  }
  return raw.startsWith('/') ? '$kSiteBase$raw' : '$kSiteBase/$raw';
}

/// The app route that opens one of the website's content pages in the WebView.
String webRoute(String pathOrUrl, {String? title}) {
  final t =
      title ?? sitePageFor(Uri.tryParse(pathOrUrl)?.path ?? pathOrUrl)?.title;
  return Uri(
    path: '/web',
    queryParameters: {'url': pathOrUrl, if (t != null) 'title': t},
  ).toString();
}

/// Website path (with any query) → app route, for the links the store attaches
/// to hero slides, banners, popups and push notifications, and for links
/// tapped inside a web page. Content pages open in the in-app WebView; shop,
/// product, cart and account paths go to their native screens. Null means the
/// app has no screen for it.
String? appRouteForSitePath(String path) {
  final uri = Uri.tryParse(path);
  if (uri == null) return null;
  final p = uri.path;
  final segs = uri.pathSegments;
  final query = uri.query.isEmpty ? '' : '?${uri.query}';
  if (p == '/' || p == '') return '/home';
  if (sitePageFor(p) != null) return webRoute(path);
  if (p == '/shop' || p == '/new-arrivals') return '/shop';
  if (p == '/search') return '/search$query';
  if (segs.length == 2 && segs.first == 'category') {
    return '/listing?cat=${segs[1]}';
  }
  if (segs.length == 2 && (segs.first == 'shop' || segs.first == 'product')) {
    return '/product/${segs[1]}';
  }
  if (p == '/blog') return '/journal';
  if (segs.length == 2 && segs.first == 'blog') return '/journal/${segs[1]}';
  if (p == '/track-order' || p == '/gallery') return p;
  if (p == '/cart' || p == '/wishlist' || p == '/login') return p;
  if (p == '/account/orders') return '/orders';
  if (p == '/account/addresses') return '/addresses';
  return null;
}

/// The app route for a full URL on the store's own site, or null when the URL
/// is somewhere else or the app has no screen for it.
String? appRouteForSiteUrl(String url) {
  final uri = Uri.tryParse(url);
  if (uri == null || !uri.hasScheme || !isSiteHost(uri.host)) return null;
  final path = uri.hasQuery ? '${uri.path}?${uri.query}' : uri.path;
  return appRouteForSitePath(path);
}

enum LinkAction {
  /// Load it in the WebView the customer is already in.
  stay,

  /// Hand it to a native screen of the app ([LinkDecision.route]).
  app,

  /// Hand it to the phone: browser, dialer, mail, WhatsApp, a PDF viewer.
  external,
}

class LinkDecision {
  final LinkAction action;
  final String? route;
  const LinkDecision.stay() : action = LinkAction.stay, route = null;
  const LinkDecision.app(String this.route) : action = LinkAction.app;
  const LinkDecision.external() : action = LinkAction.external, route = null;
}

final _document = RegExp(
  r'\.(pdf|docx?|xlsx?|pptx?|zip|apk)$',
  caseSensitive: false,
);

/// What to do when a page shown in the WebView tries to go to [url].
/// [pageHosts] are the hosts that count as "this page's own site" — the store
/// host plus the host of the page that was opened (a legal page the store
/// hosts elsewhere stays in the app too).
LinkDecision decideLink(
  String url, {
  Set<String> pageHosts = const {},
  bool isMainFrame = true,
}) {
  // Embedded maps, videos and widgets load as sub-frames — never intercept them.
  if (!isMainFrame) return const LinkDecision.stay();
  final uri = Uri.tryParse(url);
  if (uri == null) return const LinkDecision.stay();
  final scheme = uri.scheme.toLowerCase();
  if (scheme == 'about' ||
      scheme == 'blob' ||
      scheme == 'data' ||
      scheme == 'javascript') {
    return const LinkDecision.stay();
  }
  // tel:, mailto:, sms:, whatsapp:, geo:, intent: … a WebView can't open these.
  if (scheme != 'http' && scheme != 'https') {
    return const LinkDecision.external();
  }
  final host = uri.host.toLowerCase();
  final own =
      isSiteHost(host) ||
      pageHosts.any((h) => host == h || host.endsWith('.$h'));
  if (!own) return const LinkDecision.external();
  // A WebView can't render or save these, the phone can.
  if (_document.hasMatch(uri.path)) return const LinkDecision.external();
  // Only the store's own site has native screens; a legal page hosted elsewhere
  // just navigates.
  if (isSiteHost(host)) {
    if (sitePageFor(uri.path) != null) return const LinkDecision.stay();
    final route = appRouteForSiteUrl(url);
    if (route != null) return LinkDecision.app(route);
  }
  return const LinkDecision.stay();
}
