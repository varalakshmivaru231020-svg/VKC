import 'package:flutter_test/flutter_test.dart';
import 'package:vkc_customer/site_links.dart';

void main() {
  group('the eight website pages', () {
    test('About, Leadership, Credentials, Contact, Shipping, Returns, Privacy and Terms are all known', () {
      final titles = {
        '/about': 'About Us',
        '/leadership': 'Leadership',
        '/credentials': 'Credentials',
        '/contact': 'Contact Us',
        '/shipping': 'Shipping Policy',
        '/returns': 'Return & Exchange',
        '/privacy': 'Privacy Policy',
        '/terms': 'Terms & Conditions',
      };
      expect(kSitePages.length, 8);
      titles.forEach((path, title) {
        expect(sitePageFor(path)?.title, title, reason: path);
      });
    });

    test('older and alternative spellings resolve to the same page', () {
      expect(sitePageFor('/privacy-policy')?.title, 'Privacy Policy');
      expect(sitePageFor('/terms-and-conditions')?.title, 'Terms & Conditions');
      expect(sitePageFor('/return-policy')?.title, 'Return & Exchange');
      expect(sitePageFor('/shipping-policy')?.title, 'Shipping Policy');
    });

    test('a trailing slash, a query, a fragment or capitals do not hide a page', () {
      expect(sitePageFor('/about/'), isNotNull);
      expect(sitePageFor('/about?ref=app'), isNotNull);
      expect(sitePageFor('/contact#form'), isNotNull);
      expect(sitePageFor('/Privacy'), isNotNull);
    });

    test('shop, product and unknown paths are not website pages', () {
      expect(sitePageFor('/shop'), isNull);
      expect(sitePageFor('/shop/jaggery-powder'), isNull);
      expect(sitePageFor('/about-us-extra'), isNull);
      expect(sitePageFor('/'), isNull);
    });
  });

  group('resolveSiteUrl', () {
    test('a path becomes a live URL on the site', () {
      expect(resolveSiteUrl('/privacy'), 'https://vkcgoldikshu.com/privacy');
      expect(resolveSiteUrl('about'), 'https://vkcgoldikshu.com/about');
    });

    test('a full http(s) URL is kept as it is', () {
      expect(resolveSiteUrl('https://vkcgoldikshu.com/about'), 'https://vkcgoldikshu.com/about');
      expect(resolveSiteUrl('https://example.org/policy'), 'https://example.org/policy');
    });

    test('anything else is refused, so a WebView is never pointed at it', () {
      expect(resolveSiteUrl(''), isNull);
      expect(resolveSiteUrl('   '), isNull);
      expect(resolveSiteUrl('javascript:alert(1)'), isNull);
      expect(resolveSiteUrl('file:///etc/passwd'), isNull);
      expect(resolveSiteUrl('tel:+911234567890'), isNull);
      expect(resolveSiteUrl('https://'), isNull);
    });
  });

  group('isSiteHost', () {
    test('the site and its subdomains count, lookalikes do not', () {
      expect(isSiteHost('vkcgoldikshu.com'), isTrue);
      expect(isSiteHost('www.vkcgoldikshu.com'), isTrue);
      expect(isSiteHost('VKCGOLDIKSHU.COM'), isTrue);
      expect(isSiteHost('evilvkcgoldikshu.com'), isFalse);
      expect(isSiteHost('vkcgoldikshu.com.evil.io'), isFalse);
      expect(isSiteHost('example.org'), isFalse);
    });
  });

  group('webRoute', () {
    test('carries the live path and the page title', () {
      final uri = Uri.parse(webRoute('/privacy'));
      expect(uri.path, '/web');
      expect(uri.queryParameters['url'], '/privacy');
      expect(uri.queryParameters['title'], 'Privacy Policy');
    });

    test('an explicit title wins, and an unknown page gets none', () {
      expect(Uri.parse(webRoute('/x', title: 'Custom')).queryParameters['title'], 'Custom');
      expect(Uri.parse(webRoute('/quality-compliance')).queryParameters.containsKey('title'), isFalse);
    });

    test('a full URL survives the round trip', () {
      final uri = Uri.parse(webRoute('https://example.org/legal?lang=en&v=2', title: 'Terms & Conditions'));
      expect(uri.queryParameters['url'], 'https://example.org/legal?lang=en&v=2');
      expect(uri.queryParameters['title'], 'Terms & Conditions');
    });
  });

  group('appRouteForSitePath', () {
    test('content pages open in the in-app WebView', () {
      for (final page in kSitePages) {
        final route = appRouteForSitePath(page.path)!;
        expect(Uri.parse(route).path, '/web', reason: page.path);
        expect(Uri.parse(route).queryParameters['url'], page.path);
      }
      expect(Uri.parse(appRouteForSitePath('/privacy-policy')!).queryParameters['url'], '/privacy-policy');
    });

    test('shop, product, blog and account paths go to the native screens', () {
      expect(appRouteForSitePath('/'), '/home');
      expect(appRouteForSitePath('/shop'), '/shop');
      expect(appRouteForSitePath('/new-arrivals'), '/shop');
      expect(appRouteForSitePath('/shop/jaggery-powder'), '/product/jaggery-powder');
      expect(appRouteForSitePath('/product/jaggery-powder'), '/product/jaggery-powder');
      expect(appRouteForSitePath('/category/cubes'), '/listing?cat=cubes');
      expect(appRouteForSitePath('/search?q=jaggery'), '/search?q=jaggery');
      expect(appRouteForSitePath('/blog'), '/journal');
      expect(appRouteForSitePath('/blog/why-jaggery'), '/journal/why-jaggery');
      expect(appRouteForSitePath('/cart'), '/cart');
      expect(appRouteForSitePath('/login'), '/login');
      expect(appRouteForSitePath('/track-order'), '/track-order');
      expect(appRouteForSitePath('/gallery'), '/gallery');
      expect(appRouteForSitePath('/account/orders'), '/orders');
      expect(appRouteForSitePath('/account/addresses'), '/addresses');
    });

    test('a path the app has no screen for is null', () {
      expect(appRouteForSitePath('/quality-compliance'), isNull);
      expect(appRouteForSitePath('/admin'), isNull);
    });
  });

  group('appRouteForSiteUrl', () {
    test('the site (with or without www) maps like its paths', () {
      expect(appRouteForSiteUrl('https://vkcgoldikshu.com/shop/jaggery-powder'), '/product/jaggery-powder');
      expect(appRouteForSiteUrl('https://www.vkcgoldikshu.com/search?q=a'), '/search?q=a');
      expect(Uri.parse(appRouteForSiteUrl('https://vkcgoldikshu.com/about')!).path, '/web');
    });

    test('another site, a bare path or an unknown page is null', () {
      expect(appRouteForSiteUrl('https://example.org/shop'), isNull);
      expect(appRouteForSiteUrl('/shop'), isNull);
      expect(appRouteForSiteUrl('https://vkcgoldikshu.com/quality-compliance'), isNull);
    });
  });

  group('decideLink — what a tapped link inside a web page does', () {
    LinkDecision d(String url, {Set<String> hosts = const {}, bool main = true}) =>
        decideLink(url, pageHosts: hosts, isMainFrame: main);

    test('the site\'s own content pages stay in the WebView', () {
      for (final page in kSitePages) {
        expect(d('https://vkcgoldikshu.com${page.path}').action, LinkAction.stay, reason: page.path);
      }
      expect(d('https://vkcgoldikshu.com/privacy-policy').action, LinkAction.stay);
      expect(d('https://vkcgoldikshu.com/about#team').action, LinkAction.stay);
    });

    test('an unlisted page of the site stays in the WebView too', () {
      expect(d('https://vkcgoldikshu.com/quality-compliance').action, LinkAction.stay);
    });

    test('shop and account links go to the native screen', () {
      final product = d('https://vkcgoldikshu.com/shop/jaggery-powder');
      expect(product.action, LinkAction.app);
      expect(product.route, '/product/jaggery-powder');
      expect(d('https://vkcgoldikshu.com/shop').route, '/shop');
      expect(d('https://vkcgoldikshu.com/cart').route, '/cart');
      expect(d('https://vkcgoldikshu.com/').route, '/home');
    });

    test('phone, mail, WhatsApp and map links go to the phone', () {
      expect(d('tel:+919876543210').action, LinkAction.external);
      expect(d('mailto:care@vkcgoldikshu.com').action, LinkAction.external);
      expect(d('sms:+919876543210').action, LinkAction.external);
      expect(d('whatsapp://send?phone=919876543210').action, LinkAction.external);
      expect(d('intent://scan/#Intent;scheme=zxing;end').action, LinkAction.external);
      expect(d('https://wa.me/919876543210').action, LinkAction.external);
      expect(d('https://www.google.com/maps/search/?api=1&query=Udupi').action, LinkAction.external);
      expect(d('https://www.instagram.com/vkc').action, LinkAction.external);
    });

    test('a lookalike host is not the store\'s site', () {
      expect(d('https://vkcgoldikshu.com.evil.io/about').action, LinkAction.external);
      expect(d('https://evilvkcgoldikshu.com/about').action, LinkAction.external);
    });

    test('documents go to the phone, which can open and save them', () {
      expect(d('https://vkcgoldikshu.com/uploads/fssai-certificate.pdf').action, LinkAction.external);
      expect(d('https://vkcgoldikshu.com/uploads/price-list.XLSX').action, LinkAction.external);
      expect(d('https://vkcgoldikshu.com/uploads/photo.jpg').action, LinkAction.stay);
    });

    test('embedded maps and videos (sub-frames) are never intercepted', () {
      expect(d('https://www.google.com/maps/embed?pb=abc', main: false).action, LinkAction.stay);
      expect(d('https://www.youtube.com/embed/xyz', main: false).action, LinkAction.stay);
      expect(d('tel:+919876543210', main: false).action, LinkAction.stay);
    });

    test('internal browser schemes stay', () {
      expect(d('about:blank').action, LinkAction.stay);
      expect(d('data:text/html,hello').action, LinkAction.stay);
    });

    test('a legal page hosted elsewhere stays in the app when it is the page that was opened', () {
      const hosts = {'legal.example.org'};
      expect(d('https://legal.example.org/terms/2', hosts: hosts).action, LinkAction.stay);
      expect(d('https://docs.legal.example.org/terms', hosts: hosts).action, LinkAction.stay);
      expect(d('https://legal.example.org/terms/2').action, LinkAction.external);
      expect(d('https://other.example.org/x', hosts: hosts).action, LinkAction.external);
    });

    test('a page on another host never reaches the store\'s native screens', () {
      const hosts = {'legal.example.org'};
      expect(d('https://legal.example.org/shop/jaggery-powder', hosts: hosts).action, LinkAction.stay);
    });
  });
}
