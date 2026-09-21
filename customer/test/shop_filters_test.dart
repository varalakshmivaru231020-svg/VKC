import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vkc_customer/screens/shop_screen.dart';

/// The Shop toolbar and its sheets. The test HTTP client fails every request,
/// so the grid shows its error state — the toolbar above it works regardless.
void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  Future<void> open(WidgetTester tester, {double width = 360, double textScale = 1.0}) async {
    tester.view.physicalSize = Size(width, 760);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(MaterialApp(
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: TextScaler.linear(textScale)),
        child: child!,
      ),
      home: const Scaffold(body: SafeArea(child: ProductListing(asTab: true))),
    ));
    for (var i = 0; i < 3; i++) {
      await tester.pump(const Duration(seconds: 1));
    }
  }

  testWidgets('toolbar has Sort, Category, Price and Filter', (tester) async {
    await open(tester);
    for (final label in ['Sort', 'Category', 'Price', 'Filter']) {
      expect(find.text(label), findsOneWidget, reason: '$label missing from the toolbar');
    }
  });

  testWidgets('sort sheet lists the options and closes on a choice', (tester) async {
    await open(tester);
    await tester.tap(find.text('Sort'));
    await tester.pumpAndSettle();

    expect(find.text('Sort by'), findsOneWidget);
    expect(find.text('Discount: high to low'), findsOneWidget);
    await tester.tap(find.text('Price: low to high'));
    await tester.pumpAndSettle();
    expect(find.text('Sort by'), findsNothing);
  });

  testWidgets('filter sheet: rail switches sections, Apply counts what was chosen', (tester) async {
    await open(tester);
    await tester.tap(find.text('Filter'));
    await tester.pumpAndSettle();

    expect(find.text('Clear All'), findsOneWidget);
    expect(find.text('Apply'), findsOneWidget);

    await tester.tap(find.text('Discount'));
    await tester.pumpAndSettle();
    expect(find.text('Select Discount'), findsOneWidget);
    await tester.tap(find.text('20% and above'));

    await tester.tap(find.text('Availability'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('In stock only'));

    await tester.tap(find.text('Apply'));
    await tester.pumpAndSettle();
    expect(find.text('Filter (2)'), findsOneWidget);
  });

  testWidgets('Clear All empties the sheet', (tester) async {
    await open(tester);
    await tester.tap(find.text('Price'));
    await tester.pumpAndSettle();
    expect(find.text('Select Price'), findsOneWidget);
    await tester.tap(find.text('Under ₹200'));
    await tester.tap(find.text('Clear All'));
    await tester.tap(find.text('Apply'));
    await tester.pumpAndSettle();
    expect(find.text('Filter'), findsOneWidget);
  });

  testWidgets('no overflow on a narrow screen with a large system font', (tester) async {
    await open(tester, width: 320, textScale: 1.3);
    expect(tester.takeException(), isNull);
    await tester.tap(find.textContaining('Filter'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await tester.tap(find.text('Rating'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
  });
}
