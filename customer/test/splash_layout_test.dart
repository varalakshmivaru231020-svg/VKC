import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vkc_customer/screens/auth_screens.dart';

/// The splash Stack sizes itself to its largest non-positioned child, so
/// without tight constraints it shrank to the wordmark's box and Scaffold
/// pinned that box to the top-left — branding, crest, progress bar and the
/// tap hint all bunched into the corner. These assertions fail if that
/// regresses.
void main() {
  testWidgets('splash branding is centred on the screen', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SplashScreen()));
    await tester.pump();

    final screen = tester.getSize(find.byType(MaterialApp));
    final brand = tester.getCenter(find.byType(BrandStack));

    expect(brand.dx, moreOrLessEquals(screen.width / 2, epsilon: 1),
        reason: 'wordmark should sit on the horizontal centre line');
    expect(brand.dy, moreOrLessEquals(screen.height / 2, epsilon: 1),
        reason: 'wordmark should sit on the vertical centre line');

    // Dispose before the 2.4s navigation timer fires (there is no router here).
    await tester.pumpWidget(const SizedBox.shrink());
  });

  testWidgets('splash fills the screen so bottom items anchor to it', (tester) async {
    await tester.pumpWidget(const MaterialApp(home: SplashScreen()));
    await tester.pump();

    final screen = tester.getSize(find.byType(MaterialApp));
    final hint = tester.getRect(find.text('TAP TO CONTINUE'));

    // 24dp from the bottom of the screen, not 24dp from the bottom of a
    // shrink-wrapped box floating near the top.
    expect(screen.height - hint.bottom, moreOrLessEquals(24, epsilon: 1));
    expect(hint.center.dx, moreOrLessEquals(screen.width / 2, epsilon: 1));

    await tester.pumpWidget(const SizedBox.shrink());
  });
}
