import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:vkc_customer/main.dart';

/// The app opens straight on Home — no splash route, no onboarding, no login
/// gate — with the five-tab shop navigation in place.
void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('App boots straight to Home with the five-tab navigation', (tester) async {
    await tester.pumpWidget(const VkcApp());
    await tester.pump();
    // Home fires its catalogue requests on mount; advance the clock so the
    // test HTTP client answers them and nothing is left pending.
    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(seconds: 1));
    }

    expect(find.byType(VkcApp), findsOneWidget);
    expect(find.byType(VkBottomNav), findsOneWidget);
    for (final label in ['Home', 'Categories', 'Shop', 'Cart', 'Profile']) {
      expect(find.text(label), findsWidgets, reason: '$label tab missing from the bottom navigation');
    }
    // Nothing from the removed flows may be on screen.
    expect(find.text('LIVE'), findsNothing);
    expect(find.text('CONTINUE'), findsNothing);
    expect(find.text('TAP TO CONTINUE'), findsNothing);

  });
}
