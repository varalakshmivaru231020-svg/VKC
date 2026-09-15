import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import 'ecom/ecom_api.dart';

/// Push notifications through Firebase Cloud Messaging.
///
/// Stays quiet until the app ships with `android/app/google-services.json`:
/// without it Firebase cannot initialise, the failure is logged, and nothing
/// else changes. With it, the phone's token is registered with the store
/// (again whenever it refreshes or the customer signs in or out), messages
/// arriving while the app is open are shown as a normal notification, and
/// tapping one opens the route the store attached to it.
class Push {
  Push._();
  static final Push I = Push._();

  static const _channel = AndroidNotificationChannel(
    'vkc_default',
    'VKC Gold Ikshu',
    description: 'Order updates and offers',
    importance: Importance.high,
  );

  final _local = FlutterLocalNotificationsPlugin();
  void Function(String route)? _open;
  String? _token;
  bool _listening = false;

  Future<void> init({required void Function(String route) onOpen}) async {
    _open = onOpen;
    try {
      await Firebase.initializeApp();
    } catch (e) {
      debugPrint('push: Firebase not configured on this build ($e)');
      return;
    }
    try {
      FirebaseMessaging.onBackgroundMessage(_onBackgroundMessage);
      final fm = FirebaseMessaging.instance;
      await fm.requestPermission(alert: true, badge: true, sound: true);

      await _local.initialize(
        const InitializationSettings(android: AndroidInitializationSettings('@mipmap/ic_launcher')),
        onDidReceiveNotificationResponse: (r) {
          final route = r.payload ?? '';
          if (route.isNotEmpty) _open?.call(route);
        },
      );
      await _local.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()?.createNotificationChannel(_channel);

      FirebaseMessaging.onMessage.listen(_showWhileOpen);
      FirebaseMessaging.onMessageOpenedApp.listen(_openFrom);
      final initial = await fm.getInitialMessage();
      if (initial != null) _openFrom(initial);

      _token = await fm.getToken();
      await _register();
      fm.onTokenRefresh.listen((t) {
        _token = t;
        _register();
      });
      if (!_listening) {
        EcomAuth.I.user.addListener(_register);
        _listening = true;
      }
    } catch (e) {
      debugPrint('push: setup failed ($e)');
    }
  }

  Future<void> _register() async {
    final t = _token;
    if (t == null || t.isEmpty) return;
    try {
      await EcomApi.I.registerDevice(t);
    } catch (e) {
      debugPrint('push: could not register device ($e)');
    }
  }

  void _openFrom(RemoteMessage m) {
    final route = (m.data['route'] ?? '').toString();
    if (route.isNotEmpty) _open?.call(route);
  }

  Future<void> _showWhileOpen(RemoteMessage m) async {
    final n = m.notification;
    if (n == null) return;
    await _local.show(
      m.messageId.hashCode,
      n.title,
      n.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.high,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
      ),
      payload: (m.data['route'] ?? '').toString(),
    );
  }
}

/// Runs in its own isolate when a message arrives with the app closed. The
/// system already shows notification messages; nothing more is needed.
@pragma('vm:entry-point')
Future<void> _onBackgroundMessage(RemoteMessage message) async {}
