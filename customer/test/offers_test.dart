import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vl_customer/screens/cart_screens.dart';
import 'package:vl_customer/widgets.dart';

/// The cart's offer cards. These used to be a ticket stub behind a 9pt "VIEW
/// OFFERS" link; the card now has to carry the badge, the code, a line of copy
/// and its own APPLY, whatever subset of fields the store filled in.
void main() {
  _discountTests();
  Widget host(Widget child) => MaterialApp(
        // Same box the cart's horizontal strip gives each card.
        home: Scaffold(body: Center(child: SizedBox(height: 188, width: 268, child: child))),
      );

  group('offer headline', () {
    test('reads percentage, flat and shipping coupons', () {
      expect(offerHeadline({'type': 'PERCENTAGE', 'value': 20}), '20% OFF');
      expect(offerHeadline({'type': 'FIXED', 'value': 500}), '₹500 OFF');
      expect(offerHeadline({'type': 'FREE_SHIPPING'}), 'FREE SHIPPING');
    });

    test('never invents a discount it was not given', () {
      expect(offerHeadline({'type': 'FIXED'}), 'OFFER');
    });
  });

  group('offer icon', () {
    test('matches the kind of deal', () {
      expect(offerIcon({'type': 'PERCENTAGE'}), Icons.percent_rounded);
      expect(offerIcon({'type': 'FREE_SHIPPING'}), Icons.local_shipping_rounded);
      expect(offerIcon({'type': 'FIXED'}), Icons.currency_rupee_rounded);
    });
  });

  group('OfferCard', () {
    testWidgets('shows badge, code, description and its own APPLY', (tester) async {
      await tester.pumpWidget(host(OfferCard(
        coupon: const {
          'code': 'save20',
          'type': 'PERCENTAGE',
          'value': 20,
          'description': 'Festive weekend offer',
          'minOrderValue': 2000,
        },
        compact: true,
        onApply: () {},
      )));

      expect(find.text('20% OFF'), findsOneWidget);
      expect(find.text('SAVE20'), findsOneWidget); // code is the card's title
      expect(find.textContaining('Festive weekend offer'), findsOneWidget);
      expect(find.textContaining('On orders above ₹2,000'), findsOneWidget);
      expect(find.text('APPLY'), findsOneWidget);
    });

    testWidgets('a coupon with no description still fills its middle line', (tester) async {
      await tester.pumpWidget(host(const OfferCard(
        coupon: {'code': 'FLAT500', 'type': 'FIXED', 'value': 500},
        compact: true,
      )));

      expect(find.text('₹500 OFF'), findsOneWidget);
      expect(find.text('Applies to your cart'), findsOneWidget);
    });

    testWidgets('APPLY reports the tap', (tester) async {
      var applied = 0;
      await tester.pumpWidget(host(OfferCard(
        coupon: const {'code': 'SAVE20', 'type': 'PERCENTAGE', 'value': 20},
        compact: true,
        onApply: () => applied++,
      )));

      await tester.tap(find.text('APPLY'));
      expect(applied, 1);
    });

    testWidgets('lays out without overflowing the cart strip', (tester) async {
      await tester.pumpWidget(host(const OfferCard(
        coupon: {
          'code': 'MONSOONWEEKEND',
          'type': 'PERCENTAGE',
          'value': 25,
          'description': 'A deliberately long line of store copy that has to be '
              'clipped rather than push the APPLY button off the bottom of the card',
          'minOrderValue': 4999,
          'maxDiscount': 1500,
        },
        compact: true,
      )));

      expect(tester.takeException(), isNull);
    });
  });
}

/// Discount badges on the product cards are computed from the real MRP and
/// sale price — never stored, never assumed.
void _discountTests() {
  group('discount percent', () {
    test('rounds the real saving off MRP', () {
      expect(discountPercent(8999, 9998), 10);
      expect(discountPercent(6000, 6500), 8);
      expect(discountPercent(23999, 29999), 20);
    });

    test('is absent when there is nothing off', () {
      expect(discountPercent(8999, null), isNull);
      expect(discountPercent(8999, 8999), isNull);
      expect(discountPercent(8999, 8000), isNull, reason: 'MRP below price is not a discount');
      expect(discountPercent(8999, 0), isNull);
    });

    test('a saving too small to round to a percent is not shown', () {
      expect(discountPercent(9997, 9998), isNull);
    });
  });
}
