import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vl_customer/models.dart';
import 'package:vl_customer/widgets.dart';

/// Two sarees side by side, one with a short name and one that wraps.
///
/// This pairing is the whole point: the card used to give its image whatever
/// height was left after the text, so a one-line name produced a taller image
/// than a two-line name and the two tiles' prices sat at different heights.
/// That misalignment is what made neighbouring cards read as one block.
Product _p({
  required String id,
  required String name,
  required double price,
  double? mrp,
  String weave = 'HANDLOOM',
}) =>
    Product(
      id: id,
      name: name,
      weave: weave,
      price: price,
      mrp: mrp,
      palette: 0,
      variantId: 'v-$id',
    );

void main() {
  // The surface is constrained to a real phone width, not just the MediaQuery,
  // so the grid lays out against the same width the delegate is handed.
  Widget grid(List<Product> items, {double width = 360, double textScale = 1.0}) => MaterialApp(
        home: MediaQuery(
          data: MediaQueryData(size: Size(width, 800), textScaler: TextScaler.linear(textScale)),
          child: Scaffold(
            body: Center(
              child: SizedBox(
                width: width,
                height: 800,
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: LayoutBuilder(
                    builder: (context, box) => GridView.builder(
                      gridDelegate: productGridDelegate(context, box.maxWidth),
                      itemCount: items.length,
                      itemBuilder: (_, i) => ProductCard(key: ValueKey(items[i].id), p: items[i]),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      );

  group('product card', () {
    testWidgets('neighbouring cards get identical image heights', (tester) async {
      await tester.pumpWidget(grid([
        _p(id: 'a', name: 'KANCHI SILK COTTON', price: 23000, mrp: 24999),
        _p(id: 'b', name: 'Royal Kanchipuram Pure Silk Saree — Elegant Traditional', price: 23999, mrp: 29999),
      ]));
      await tester.pump();

      final images = tester.widgetList<AspectRatio>(find.byType(AspectRatio)).toList();
      expect(images.length, 2);
      final sizes = find.byType(AspectRatio).evaluate().map((e) => e.size!.height).toSet();
      expect(sizes.length, 1, reason: 'a short name must not give its card a taller image');
    });

    testWidgets('prices line up across a row whatever the name length', (tester) async {
      await tester.pumpWidget(grid([
        _p(id: 'a', name: 'KANCHI SILK COTTON', price: 23000, mrp: 24999),
        _p(id: 'b', name: 'Royal Kanchipuram Pure Silk Saree — Elegant Traditional', price: 23999, mrp: 29999),
      ]));
      await tester.pump();

      final left = tester.getTopLeft(find.text('₹23,000')).dy;
      final right = tester.getTopLeft(find.text('₹23,999')).dy;
      expect((left - right).abs(), lessThan(0.5), reason: 'prices must sit on the same baseline');
    });

    testWidgets('discount rides on the image as a badge, once', (tester) async {
      await tester.pumpWidget(grid([_p(id: 'a', name: 'Kota Saree', price: 8999, mrp: 9998)]));
      await tester.pump();

      // 9998 → 8999 is 10% off.
      expect(find.text('10% OFF'), findsOneWidget);
      expect(find.text('₹8,999'), findsOneWidget);
      expect(find.text('₹9,998'), findsOneWidget);
    });

    testWidgets('no badge when the saree is not discounted', (tester) async {
      await tester.pumpWidget(grid([_p(id: 'a', name: 'Kota Saree', price: 8999)]));
      await tester.pump();
      expect(find.textContaining('% OFF'), findsNothing);
    });

    testWidgets('each card keeps its own name, price and discount', (tester) async {
      await tester.pumpWidget(grid([
        _p(id: 'a', name: 'Alpha Saree', price: 6000, mrp: 6500, weave: 'SUB CAT 1'),
        _p(id: 'b', name: 'Beta Saree', price: 8999, mrp: 9998, weave: 'HANDLOOM'),
      ]));
      await tester.pump();

      // 6500 → 6000 is 8%; 9998 → 8999 is 10%. Both must be present exactly
      // once, against their own card.
      expect(find.text('8% OFF'), findsOneWidget);
      expect(find.text('10% OFF'), findsOneWidget);
      expect(find.text('SUB CAT 1'), findsOneWidget);
      expect(find.text('HANDLOOM'), findsOneWidget);
    });

    testWidgets('survives a narrow screen and a large system font', (tester) async {
      await tester.pumpWidget(grid(
        [
          _p(id: 'a', name: 'Royal Kanchipuram Pure Silk Saree — Elegant Traditional', price: 23999, mrp: 29999),
          _p(id: 'b', name: 'KANCHI SILK COTTON', price: 23000, mrp: 24999),
        ],
        width: 320,
        textScale: 1.3,
      ));
      await tester.pump();
      expect(tester.takeException(), isNull, reason: 'no overflow on a small screen at 1.3x text');
    });
  });
}
