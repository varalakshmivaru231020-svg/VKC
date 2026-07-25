import "package:flutter/material.dart";
import "package:flutter/services.dart";
import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:hive_flutter/hive_flutter.dart";
import "package:shared_preferences/shared_preferences.dart";

import "app.dart";
import "core/api/api_client.dart";
import "core/storage/local_prefs.dart";
import "features/cart/data/cart_controller.dart";

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock to portrait — retail apps generally don't need landscape.
  await SystemChrome.setPreferredOrientations(const [
    DeviceOrientation.portraitUp,
  ]);

  // Local storage
  await Hive.initFlutter();
  final prefs = await SharedPreferences.getInstance();

  runApp(
    ProviderScope(
      overrides: [
        localPrefsProvider.overrideWithValue(LocalPrefs(prefs)),
        cartControllerProvider.overrideWith((ref) => CartController(prefs, ref.read(apiClientProvider))),
      ],
      child: const VijaylakshmiApp(),
    ),
  );
}
