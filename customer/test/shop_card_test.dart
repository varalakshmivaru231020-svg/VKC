import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vkc_customer/models.dart';
import 'package:vkc_customer/widgets.dart';

/// The marketplace card used by Shop, category and search listings.
Product _p({
  required String id,
  required String name,
  required double price,
  double? mrp,
  int qty = 20,
  double rating = 0,
  int ratingCount = 0,
  List<String> packs = const [],
}) =>
    Product(
      id: id,
      name: name,
      category: 'Jaggery',
      price: price,
      mrp: mrp,
      qty: qty,
      variantId: 'v-$id',
      rating: rating,
      ratingCount: ratingCount,
      packs: packs,
    );

void main() {
  Widget grid(List<Product> items, {double width = 360, double textScale = 1.0}) => MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(size: Size(width, 900), textScaler: TextScaler.linear(textScale)),
          child: Scaffold(
            body: Center(
              child: SizedBox(
                width: width,
                height: 900,
                child: LayoutBuilder(
                  builder: (context, box) => GridView.builder(
                    gridDelegate: shopGridDelegate(context, box.maxWidth),
                    itemCount: items.length,
                    itemBuilder: (_, i) => ShopProductCard(key: ValueKey(items[i].id), p: items[i], onAdd: () {}),
                  ),
                ),
              ),
            ),
          ),
        ),
      );

  group('shop card', () {
    testWidgets('shows saving ribbon, price, MRP, % off, rating and pack sizes', (tester) async {
      await tester.pumpWidget(grid([
        _p(id: 'a', name: 'Jaggery Powder', price: 279, mrp: 999, rating: 3.9, ratingCount: 754, packs: ['500 g', '1 kg', '2 kg']),
      ]));
      await tester.pump();

      expect(find.text('SAVE ₹720'), findsOneWidget);
      expect(find.text('₹279'), findsOneWidget);
      expect(find.text('₹999'), findsOneWidget);
      expect(find.text('72% OFF'), findsOneWidget);
      expect(find.text('3.9'), findsOneWidget);
      expect(find.text('(754)'), findsOneWidget);
      expect(find.text('500 g'), findsOneWidget);
      expect(find.text('+2'), findsOneWidget);
      expect(find.text('ADD'), findsOneWidget);
    });

    testWidgets('an unrated, undiscounted product shows neither rating nor ribbon', (tester) async {
      await tester.pumpWidget(grid([_p(id: 'a', name: 'Jaggery Cubes', price: 450)]));
      await tester.pump();

      expect(find.textContaining('SAVE'), findsNothing);
      expect(find.textContaining('% OFF'), findsNothing);
      expect(find.text('In stock'), findsOneWidget);
    });

    testWidgets('zero stock reads Coming soon and hides quick add; low stock says how many are left', (tester) async {
      await tester.pumpWidget(grid([
        _p(id: 'a', name: 'Gone', price: 450, qty: 0),
        _p(id: 'b', name: 'Nearly gone', price: 450, qty: 3),
      ]));
      await tester.pump();

      expect(find.text('ADD'), findsOneWidget);
      expect(find.text('Only 3 left'), findsOneWidget);
      expect(find.text('COMING SOON'), findsOneWidget);
      expect(find.textContaining('Sold out'), findsNothing);
    });

    testWidgets('prices line up across a row', (tester) async {
      await tester.pumpWidget(grid([
        _p(id: 'a', name: 'Short', price: 279, mrp: 999, rating: 4.2, ratingCount: 12),
        _p(id: 'b', name: 'Premium Mandya Pure Cane Jaggery Blocks — Traditional Slow-Cooked', price: 283),
      ]));
      await tester.pump();

      final left = tester.getCenter(find.text('₹279')).dy;
      final right = tester.getCenter(find.text('₹283')).dy;
      expect((left - right).abs(), lessThan(0.5));
    });

    testWidgets('survives a narrow screen and a large system font', (tester) async {
      await tester.pumpWidget(grid(
        [
          _p(id: 'a', name: 'Premium Mandya Pure Cane Jaggery Blocks', price: 23999, mrp: 29999, qty: 2, rating: 4.5, ratingCount: 1224, packs: ['Family pack 5 kg', '1 kg']),
          _p(id: 'b', name: 'Cubes', price: 23000, mrp: 24999),
        ],
        width: 320,
        textScale: 1.3,
      ));
      await tester.pump();
      expect(tester.takeException(), isNull, reason: 'no overflow on a small screen at 1.3x text');
    });
  });
}
