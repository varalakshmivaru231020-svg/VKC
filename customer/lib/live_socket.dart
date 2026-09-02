import 'dart:async';
import 'dart:convert';

import 'package:web_socket_channel/web_socket_channel.dart';

import 'api.dart';
import 'models.dart';

/// Realtime feed for one live show.
///
/// The stream screen used to poll chat every 3 seconds, which meant a message
/// could sit unseen for three seconds, the viewer count could not exist at all,
/// and a product that sold stayed "available" on everyone else's screen until
/// they happened to reload. This subscribes to the server's customer-safe
/// `live:*` channel instead and pushes those three things as they happen.
///
/// Polling is not deleted — it is the fallback. Corporate Wi-Fi and some mobile
/// carriers block WebSocket upgrades, and a customer on such a network should
/// still see chat, just a little later. [onDegraded] fires so the caller can
/// start its timer.
class LiveSocket {
  final String liveId;

  /// New chat message from anyone watching, including this device's echo.
  final void Function(ChatMessage) onChat;

  /// A moderator removed a message.
  final void Function(String messageId) onChatDeleted;

  /// Current number of people watching.
  final void Function(int) onViewers;

  /// A product's stock moved — productId is the server UUID. Carries no buyer
  /// identity: this reaches every stranger in the room.
  final void Function(String productId, String? serial, int qtyLeft, String status) onSold;

  /// The host changed which product is on camera. Null clears the pin.
  final void Function(String? productId) onPinned;

  /// The show finished.
  final void Function() onEnded;

  /// Realtime is unavailable — fall back to polling.
  final void Function() onDegraded;

  LiveSocket({
    required this.liveId,
    required this.onChat,
    required this.onChatDeleted,
    required this.onViewers,
    required this.onSold,
    required this.onPinned,
    required this.onEnded,
    required this.onDegraded,
  });

  WebSocketChannel? _ch;
  StreamSubscription<dynamic>? _sub;
  Timer? _retry;
  bool _closed = false;

  /// Successive reconnect delays. A show can run for an hour; a socket that
  /// retried every second for that long would be a self-inflicted DDoS on our
  /// own API from every phone at once.
  static const _backoff = [2, 5, 10, 20, 30];
  int _attempt = 0;

  static Uri _url(String liveId) {
    final base = Uri.parse(Api.base); // https://host/api
    return base.replace(
      scheme: base.scheme == 'https' ? 'wss' : 'ws',
      path: '${base.path}/public/live/$liveId/ws',
    );
  }

  void connect() {
    if (_closed) return;
    try {
      final ch = WebSocketChannel.connect(_url(liveId));
      _ch = ch;
      _sub = ch.stream.listen(
        _onFrame,
        onError: (_) => _reconnect(),
        onDone: _reconnect,
        cancelOnError: true,
      );
    } catch (_) {
      _reconnect();
    }
  }

  void _onFrame(dynamic raw) {
    _attempt = 0; // a frame arrived, so the connection is genuinely healthy
    Map<String, dynamic> j;
    try {
      final decoded = jsonDecode(raw.toString());
      if (decoded is! Map) return;
      j = decoded.cast<String, dynamic>();
    } catch (_) {
      return;
    }
    switch (j['type']) {
      case 'LIVE_CHAT':
        onChat(ChatMessage.fromJson(j));
        break;
      case 'LIVE_CHAT_DELETED':
        final del = j['id']?.toString();
        if (del != null && del.isNotEmpty) onChatDeleted(del);
        break;
      case 'LIVE_VIEWERS':
        final n = j['viewers'];
        if (n is num) onViewers(n.toInt());
        break;
      case 'LIVE_PRODUCT_SOLD':
        final id = j['productId']?.toString();
        if (id != null && id.isNotEmpty) {
          final left = j['qtyLeft'];
          onSold(
            id,
            j['serialNumber']?.toString(),
            left is num ? left.toInt() : 0,
            (j['status'] ?? '').toString(),
          );
        }
        break;
      case 'LIVE_PRODUCT_PINNED':
        onPinned(j['productId']?.toString());
        break;
      case 'LIVE_ENDED':
        onEnded();
        break;
    }
  }

  void _reconnect() {
    if (_closed) return;
    _sub?.cancel();
    _sub = null;
    _ch = null;
    // Tell the screen to poll from the first failure, not the last — a viewer
    // should never sit in silence while we work through the backoff.
    onDegraded();
    final wait = _backoff[_attempt.clamp(0, _backoff.length - 1)];
    _attempt++;
    _retry?.cancel();
    _retry = Timer(Duration(seconds: wait), connect);
  }

  void dispose() {
    _closed = true;
    _retry?.cancel();
    _sub?.cancel();
    _ch?.sink.close();
  }
}
