import 'dart:async';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../api.dart';
import '../ecom/ecom_api.dart';
import '../live_socket.dart';
import '../models.dart';
import '../order_flow.dart';
import '../theme.dart';
import '../widgets.dart';

/// Full-screen live view — real stream embed (YouTube/Instagram/Facebook),
/// real product feed, and real public chat (poll + post). Ports LiveStreamScreen.
class LiveStreamScreen extends StatefulWidget {
  final String liveId;
  const LiveStreamScreen({super.key, required this.liveId});
  @override
  State<LiveStreamScreen> createState() => _LiveStreamScreenState();
}

class _LiveStreamScreenState extends State<LiveStreamScreen> {
  LiveDetail? _detail;
  final List<ChatMessage> _chat = [];
  DateTime? _lastChatAt;
  Timer? _poll;
  WebViewController? _web;
  final _input = TextEditingController();
  bool _sending = false;

  /// Realtime feed. Chat, viewers and sold-out arrive as they happen; polling
  /// only starts if the socket can't be established.
  LiveSocket? _socket;
  int _viewers = 0;

  /// Ids this device posted, so the echo from the server doesn't duplicate the
  /// message the sender already sees.
  final Set<String> _mine = {};

  /// Serial of the saree that just sold, shown briefly over the stream.
  String? _justSold;
  Timer? _soldClear;

  /// This session has finished. Drives the wording across the whole screen —
  /// the badge, the viewer line and the title all read differently once a show
  /// is over, and claiming "LIVE · live now" on a finished session is simply
  /// untrue.
  bool get _ended => _detail?.live.endedAt != null;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final d = await Api.I.liveDetail(widget.liveId);
      if (!mounted) return;
      setState(() {
        _detail = d;
        _viewers = d.live.viewers;
      });
      _initStream(d.live);
      await _pollChat();
      _connect();
    } catch (_) {
      if (mounted) setState(() {});
    }
  }

  void _connect() {
    _socket?.dispose();
    _socket = LiveSocket(
      liveId: widget.liveId,
      onChat: _onRemoteChat,
      onChatDeleted: (id) {
        if (mounted) setState(() => _chat.removeWhere((m) => m.id == id));
      },
      onViewers: (n) {
        if (mounted) setState(() => _viewers = n);
      },
      onSold: _onSold,
      onPinned: _onPinned,
      onEnded: () {
        if (mounted) _load();
      },
      onDegraded: _startPolling,
    )..connect();
  }

  /// The socket is the primary path; this is only armed when it drops, and it
  /// is stopped again as soon as a frame arrives.
  void _startPolling() {
    if (!mounted || _poll != null) return;
    _poll = Timer.periodic(const Duration(seconds: 3), (_) => _pollChat());
  }

  void _stopPolling() {
    _poll?.cancel();
    _poll = null;
  }

  void _onRemoteChat(ChatMessage m) {
    _stopPolling(); // realtime is working; stop the duplicate work
    if (!mounted) return;
    if (_mine.contains(m.id) || _chat.any((e) => e.id == m.id)) return;
    setState(() {
      _chat.add(m);
      if (_chat.length > 40) _chat.removeRange(0, _chat.length - 40);
      _lastChatAt = m.createdAt;
    });
  }

  /// Someone else bought a saree — mark it sold without a round trip, so every
  /// viewer's strip agrees with the stock.
  void _onSold(String productId, String? serial, int qtyLeft, String status) {
    final d = _detail;
    if (d == null || !mounted) return;
    var changed = false;
    var label = serial;
    final next = d.products.map((p) {
      if (p.uuid != productId) return p;
      changed = true;
      label ??= p.id;
      return p.withStock(qtyLeft: qtyLeft, status: status);
    }).toList();
    if (!changed) return;
    setState(() => _detail = LiveDetail(live: d.live, products: next));
    if (label != null) _flashSold(label!);
  }

  /// A short "just sold" line over the stream — the urgency a live show runs
  /// on. No buyer is named: this event reaches every stranger watching, so the
  /// message says what went, never who took it.
  void _flashSold(String serial) {
    if (!mounted) return;
    setState(() => _justSold = serial);
    _soldClear?.cancel();
    _soldClear = Timer(const Duration(seconds: 5), () {
      if (mounted) setState(() => _justSold = null);
    });
  }

  /// The host moved the camera to a different saree.
  void _onPinned(String? productId) {
    if (mounted) _load();
  }

  void _initStream(LiveSession l) {
    final embed = _embedUrl(l.streamType, l.streamUrl);
    if (embed == null) return;
    _web = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.black)
      ..loadRequest(Uri.parse(embed));
    setState(() {});
  }

  /// Build an embeddable URL for the chosen source.
  String? _embedUrl(String? type, String? url) {
    if (url == null || url.isEmpty) return null;
    switch (type) {
      case 'youtube':
        final id = _youtubeId(url);
        if (id != null) return 'https://www.youtube.com/embed/$id?autoplay=1&mute=1&playsinline=1&rel=0';
        return 'https://www.youtube.com/embed/live_stream?channel=$url&autoplay=1&mute=1';
      case 'facebook':
        return 'https://www.facebook.com/plugins/video.php?href=${Uri.encodeComponent(url)}&autoplay=true&mute=1';
      case 'instagram':
        final u = url.endsWith('/') ? url : '$url/';
        return '${u}embed';
      default:
        return url;
    }
  }

  String? _youtubeId(String url) {
    final m = RegExp(r'(?:v=|youtu\.be/|/live/|/embed/)([A-Za-z0-9_-]{11})').firstMatch(url);
    return m?.group(1);
  }

  Future<void> _pollChat() async {
    try {
      final msgs = await Api.I.liveChat(widget.liveId, after: _lastChatAt);
      if (msgs.isEmpty || !mounted) return;
      setState(() {
        _chat.addAll(msgs.where((m) => !_chat.any((e) => e.id == m.id)));
        if (_chat.length > 40) _chat.removeRange(0, _chat.length - 40);
        _lastChatAt = _chat.last.createdAt;
      });
    } catch (_) {}
  }

  /// What the room sees against this message.
  ///
  /// Every message used to be posted as the literal string "You", so the whole
  /// chat read as one person talking to themselves — and the host had no way to
  /// tell who was asking. A signed-in customer chats under their own name; a
  /// guest gets the last four digits of nothing, so they stay "Guest".
  String get _chatName {
    final u = EcomAuth.I.user.value;
    if (u == null) return 'Guest';
    final parts = [u.firstName, u.lastName].whereType<String>().where((s) => s.trim().isNotEmpty);
    if (parts.isNotEmpty) return parts.join(' ');
    final phone = (u.phone ?? '').replaceAll(RegExp(r'\D'), '');
    return phone.length >= 4 ? 'Guest ${phone.substring(phone.length - 4)}' : 'Guest';
  }

  Future<void> _send() async {
    final text = _input.text.trim();
    if (text.isEmpty || _sending) return;
    setState(() => _sending = true);
    try {
      final name = _chatName;
      final m = await Api.I.sendChat(widget.liveId, name, text);
      if (mounted) {
        setState(() {
          // Remember the id so the socket echo of our own message is ignored.
          _mine.add(m.id);
          _chat.add(ChatMessage(id: m.id, name: name, message: m.message, createdAt: m.createdAt, mine: true));
          if (_chat.length > 40) _chat.removeRange(0, _chat.length - 40);
          _lastChatAt = m.createdAt;
          _input.clear();
        });
      }
    } catch (_) {
      if (mounted) _toast('Message not sent. Check your connection.');
    }
    if (mounted) setState(() => _sending = false);
  }

  void _toast(String m) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
  }

  // ── In-app live buy — places a REAL order, then refreshes the strip ───────
  Future<void> _buy(Product p) async {
    final placed = await buyProduct(context, p);
    if (placed && mounted) _load();
  }

  @override
  void dispose() {
    _poll?.cancel();
    _soldClear?.cancel();
    _socket?.dispose();
    _input.dispose();
    super.dispose();
  }

  /// The video area. Three honest states: the real embed, "still loading", and
  /// "there is no video" — the last worded differently for a show that has
  /// finished versus one that hasn't started, because those are different
  /// disappointments and only one of them is worth waiting through.
  Widget _streamArea(LiveSession? l) {
    if (_web != null) return WebViewWidget(controller: _web!);
    return Stack(fit: StackFit.expand, children: [
      Silk(palette: l?.palette ?? 0, radius: 0),
      // Darkened so the message reads cleanly over the fabric texture.
      DecoratedBox(decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.5))),
      Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 40),
          child: _streamMessage(l),
        ),
      ),
    ]);
  }

  Widget _streamMessage(LiveSession? l) {
    // Nothing has come back yet — say so rather than showing an empty frame.
    if (l == null) {
      return Column(mainAxisSize: MainAxisSize.min, children: [
        const SizedBox(
          width: 22,
          height: 22,
          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white70),
        ),
        const SizedBox(height: 16),
        Text('Connecting to the show…',
            textAlign: TextAlign.center, style: VlText.mono(10, color: Colors.white70, letter: 0.18)),
      ]);
    }
    final ended = l.endedAt != null;
    return Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(ended ? Icons.videocam_off_rounded : Icons.schedule_rounded, size: 32, color: VlColors.goldSoft),
      const SizedBox(height: 14),
      Text(ended ? 'This show has ended' : 'The stream isn’t on air yet',
          textAlign: TextAlign.center, style: VlText.display(20, color: Colors.white)),
      const SizedBox(height: 8),
      Text(
        ended
            ? 'Everything shown in this session is still below — scroll to browse it.'
            : 'The video appears here the moment the host goes live. The sarees below are ready now.',
        textAlign: TextAlign.center,
        style: VlText.body(12, color: Colors.white70, height: 1.6),
      ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final d = _detail;
    final l = d?.live;
    final products = d?.products ?? const <Product>[];
    return Scaffold(
      backgroundColor: Colors.black,
      // SizedBox.expand is load-bearing, exactly as on the splash: a Stack
      // sizes itself to its largest NON-positioned child, and every child here
      // is Positioned except the top bar. Without tight constraints the whole
      // screen collapsed to the height of that bar — the stream, the chat and
      // the product strip stacked on top of one another in a 250px band with
      // black below, which is the "empty video area" this screen was reported
      // for.
      body: SizedBox.expand(
        child: Stack(children: [
        // Stream, or an honest account of why there isn't one. Never a fake
        // player: an empty black rectangle reads as a broken app, and a
        // decorative gradient alone reads as a stream that failed to load.
        Positioned.fill(child: _streamArea(l)),
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [
                Colors.black.withValues(alpha: 0.55),
                Colors.transparent,
                Colors.transparent,
                Colors.black.withValues(alpha: 0.75),
              ], stops: const [0, 0.25, 0.55, 1]),
            ),
          ),
        ),

        // Top overlay
        SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(14, 8, 14, 0),
            child: Row(children: [
              _avatar(l?.host ?? 'V'),
              const SizedBox(width: 10),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
                  Text(l?.host ?? 'Vijaylakshmi Studio',
                      maxLines: 1, overflow: TextOverflow.ellipsis, style: VlText.ui(13, weight: FontWeight.w600, color: Colors.white)),
                  // Only a real viewer count is shown — this used to fall back
                  // to the number of chat messages and label it "watching".
                  Text(
                    [
                      // Nobody is "watching" a show that finished, and the
                      // count is a live figure — both are meaningless here.
                      if (!_ended && _viewers > 0) '$_viewers watching',
                      _ended ? 'show ended' : (l?.startedAgo ?? 'live'),
                    ].join(' · '),
                    style: VlText.mono(9, color: Colors.white70, letter: 0.02),
                  ),
                ]),
              ),
              InkResponse(
                onTap: () => Navigator.of(context).maybePop(),
                child: Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.4), shape: BoxShape.circle),
                  child: const Icon(Icons.close, size: 18, color: Colors.white),
                ),
              ),
            ]),
          ),
        ),

        // LIVE + discount
        Positioned(
          top: MediaQuery.of(context).padding.top + 56,
          left: 14,
          right: 14,
          child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            // A finished show is not live; the badge was claiming otherwise.
            if (!_ended) const LiveBadge() else const SizedBox.shrink(),
            if ((l?.discount ?? '').isNotEmpty)
              GlassChip(child: Text(l!.discount, style: VlText.mono(9, color: VlColors.goldSoft, letter: 0.2))),
          ]),
        ),

        // Title. Only the host's own title on a finished show — the generic
        // "Live now — heritage sarees" fallback is for a show that is actually
        // on air.
        if (l != null && (l.hasTitle || !_ended))
          Positioned(
            top: MediaQuery.of(context).padding.top + 96,
            left: 14,
            right: 90,
            child: Text(l.hasTitle ? l.title : 'Live now — heritage sarees',
                maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.display(18, color: Colors.white)),
          ),

        // Chat overlay (bottom-left)
        Positioned(
          left: 14,
          right: 76,
          bottom: 250,
          child: ShaderMask(
            shaderCallback: (r) => const LinearGradient(
                    begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black], stops: [0, 0.3])
                .createShader(r),
            blendMode: BlendMode.dstIn,
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              for (final c in _chat.length > 6 ? _chat.sublist(_chat.length - 6) : _chat)
                Padding(padding: const EdgeInsets.only(top: 8), child: _chatRow(c)),
            ]),
          ),
        ),

        // Right action rail
        Positioned(
          right: 12,
          bottom: 250,
          // Counters only, and only ones the session actually reports. The
          // likes button showed a fabricated "2.4k" on every stream, and
          // neither it nor Share did anything when tapped.
          child: Column(children: [
            _railBtn(Icons.chat_bubble_outline, '${_chat.length}'),
            _railBtn(Icons.shopping_bag_outlined, '${products.length}'),
          ]),
        ),

        // "Just sold" — real stock movement from the room, not a fabricated
        // urgency ticker. It only ever appears because someone actually bought.
        if (_justSold != null)
          Positioned(
            left: 16,
            bottom: 236,
            child: AnimatedOpacity(
              opacity: 1,
              duration: const Duration(milliseconds: 200),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: VlColors.redInk.withValues(alpha: 0.85),
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: VlColors.goldSoft.withValues(alpha: 0.5)),
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.local_fire_department, size: 13, color: VlColors.goldSoft),
                  const SizedBox(width: 7),
                  Text('$_justSold just sold',
                      style: VlText.ui(11, weight: FontWeight.w600, color: Colors.white, letter: 0.04)),
                ]),
              ),
            ),
          ),

        // Product strip (real products) — scroll to buy
        Positioned(
          left: 0,
          right: 0,
          bottom: 70,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Row(children: [
                Icon(Icons.local_fire_department, size: 13, color: VlColors.goldSoft),
                const SizedBox(width: 8),
                Text('ON THE LOOM · SCROLL TO BUY', style: VlText.mono(9, color: Colors.white70, letter: 0.2)),
                const SizedBox(width: 8),
                Expanded(child: Container(height: 1, color: Colors.white24)),
                const SizedBox(width: 8),
                Text('${products.length} PCS', style: VlText.mono(9, color: Colors.white70)),
              ]),
              const SizedBox(height: 8),
              SizedBox(
                height: 154,
                child: products.isEmpty
                    ? Text('No products pinned yet', style: VlText.body(12, color: Colors.white60))
                    : ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: products.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (_, i) => GestureDetector(
                          onTap: () => _buy(products[i]),
                          child: _stripCard(products[i], products[i].isPinned),
                        ),
                      ),
              ),
            ]),
          ),
        ),

        // Comment input
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
              child: Row(children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: Colors.white24)),
                    child: TextField(
                      controller: _input,
                      onSubmitted: (_) => _send(),
                      style: VlText.body(12, color: Colors.white),
                      cursorColor: Colors.white,
                      decoration: InputDecoration(
                          border: InputBorder.none,
                          hintText: 'Say something nice…',
                          hintStyle: VlText.body(12, color: Colors.white60),
                          isDense: true),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                InkResponse(
                  onTap: _send,
                  child: Container(
                    width: 38,
                    height: 38,
                    decoration: BoxDecoration(color: VlColors.red, shape: BoxShape.circle),
                    child: _sending
                        ? const Padding(padding: EdgeInsets.all(10), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.send, size: 16, color: Colors.white),
                  ),
                ),
              ]),
            ),
          ),
        ),
        ]),
      ),
    );
  }

  Widget _avatar(String name) => Container(
        width: 36,
        height: 36,
        alignment: Alignment.center,
        decoration: BoxDecoration(
            color: Colors.white24, shape: BoxShape.circle, border: Border.all(color: Colors.white60, width: 2)),
        child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'V', style: VlText.ui(14, weight: FontWeight.w600, color: Colors.white)),
      );

  Widget _chatRow(ChatMessage c) => Row(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.center, children: [
        Container(
          width: 22,
          height: 22,
          alignment: Alignment.center,
          decoration: BoxDecoration(color: c.mine ? VlColors.red : VlColors.gold, shape: BoxShape.circle),
          child: Text(c.name.isNotEmpty ? c.name[0].toUpperCase() : '?', style: VlText.ui(10, weight: FontWeight.w600, color: Colors.white)),
        ),
        const SizedBox(width: 8),
        Flexible(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.55), borderRadius: BorderRadius.circular(12)),
            child: RichText(
              text: TextSpan(children: [
                TextSpan(text: '@${c.name}  ', style: VlText.mono(9, color: VlColors.goldSoft)),
                TextSpan(text: c.message, style: VlText.body(12, color: Colors.white)),
              ]),
            ),
          ),
        ),
      ]);

  Widget _railBtn(IconData ic, String label) => Padding(
        padding: const EdgeInsets.only(bottom: 14),
        child: Column(children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.45), shape: BoxShape.circle, border: Border.all(color: Colors.white24)),
            child: Icon(ic, size: 18, color: Colors.white),
          ),
          const SizedBox(height: 3),
          Text(label, style: VlText.ui(10, color: Colors.white)),
        ]),
      );

  Widget _stripCard(Product p, bool pinned) => Container(
        width: 96,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.95),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: pinned ? VlColors.red : Colors.white24, width: pinned ? 2 : 1),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Stack(children: [
            SizedBox(height: 110, width: double.infinity, child: ProductImage(p: p, radius: 0, showSku: false)),
            if (p.soldOut)
              Positioned.fill(
                child: Container(
                  color: Colors.black.withValues(alpha: 0.45),
                  alignment: Alignment.center,
                  child: Text('SOLD', style: VlText.ui(10, weight: FontWeight.w700, color: Colors.white, letter: 0.16)),
                ),
              ),
            if (pinned)
              Positioned(
                top: 4,
                left: 4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                  color: VlColors.red,
                  child: Text('PINNED', style: VlText.mono(7, color: Colors.white, letter: 0.12)),
                ),
              ),
          ]),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('₹${(p.price / 1000).toStringAsFixed(1)}k', style: VlText.ui(11, weight: FontWeight.w600, color: VlColors.redDeep)),
              Text(p.id, style: VlText.mono(7, color: VlColors.muted, letter: 0.12)),
            ]),
          ),
        ]),
      );
}
