import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../api.dart';
import '../ecom/ecom_config.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';

// All three tabs are real: /public/sessions/live, /upcoming and /past. These
// tabs once listed invented shows (named hosts, times, "PRE-BOOK 10% OFF",
// view counts), so a customer could plan an evening around a show that was
// never happening; then they were emptied out entirely. Now they show what the
// host actually scheduled and actually broadcast.

class LiveListScreen extends StatefulWidget {
  const LiveListScreen({super.key});
  @override
  State<LiveListScreen> createState() => _LiveListScreenState();
}

class _LiveListScreenState extends State<LiveListScreen> {
  int _tab = 0;
  List<LiveSession>? _live;
  List<LiveSession>? _upcoming;
  List<LiveSession>? _past;
  Object? _err;

  @override
  void initState() {
    super.initState();
    _load();
  }

  /// Each tab stands on its own: one endpoint failing must not blank the
  /// others, the same rule Home follows.
  Future<T?> _soft<T>(Future<T> Function() call) async {
    try {
      return await call();
    } catch (_) {
      return null;
    }
  }

  Future<void> _load() async {
    final liveF = _soft(() => Api.I.liveSessions());
    final upF = _soft(() => Api.I.upcomingSessions());
    final pastF = _soft(() => Api.I.pastSessions());
    final live = await liveF;
    final up = await upF;
    final past = await pastF;
    if (!mounted) return;
    setState(() {
      // Keep what is already on screen when a refresh comes back empty-handed.
      if (live != null) _live = live;
      if (up != null) _upcoming = up;
      if (past != null) _past = past;
      _err = live == null && _live == null ? 'failed' : null;
    });
  }

  @override
  Widget build(BuildContext context) {
    final live = _live ?? const [];
    return SafeArea(
      bottom: false,
      child: ListView(padding: const EdgeInsets.only(bottom: 24), children: [
        // Editorial header
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 8),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Lozenge(size: 5),
                  const SizedBox(width: 8),
                  Text('LIVE SHOPPING', style: VlText.mono(9, color: VlColors.red, letter: 0.22)),
                ]),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(children: [
                    TextSpan(text: 'Front row', style: VlText.display(28)),
                    TextSpan(text: ', ', style: VlText.display(28, color: VlColors.red, style: FontStyle.italic)),
                    TextSpan(text: 'every loom', style: VlText.display(28)),
                  ]),
                ),
              ]),
            ),
            // Was a decorative circle that did nothing when tapped.
            GestureDetector(
              onTap: () => context.push('/notifications'),
              child: Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(color: VlColors.paper, shape: BoxShape.circle, border: Border.all(color: VlColors.rule)),
                child: Icon(Icons.notifications_none, size: 16, color: VlColors.ink),
              ),
            ),
          ]),
        ),

        // Tabs
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
          child: Row(children: [
            _tabBtn('Live', 0, live.length, isLive: true),
            const SizedBox(width: 4),
            _tabBtn('Upcoming', 1, (_upcoming ?? const []).length),
            const SizedBox(width: 4),
            _tabBtn('Completed', 2, (_past ?? const []).length),
          ]),
        ),

        const SizedBox(height: 18),

        if (_tab == 0) ..._liveTab(live),
        if (_tab == 1) ..._scheduleTab(),
        if (_tab == 2) ..._pastTab(),
      ]),
    );
  }

  List<Widget> _scheduleTab() {
    if (_upcoming == null) return [const ListRowsSkeleton(count: 2, thumb: 90)];
    if (_upcoming!.isEmpty) {
      return [
        _announceState(
          Icons.event_outlined,
          'No shows scheduled yet',
          'We announce every drop on Instagram and WhatsApp first — follow along so you don’t miss one.',
        ),
      ];
    }
    return [
      for (final l in _upcoming!)
        Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: _scheduledCard(l)),
    ];
  }

  List<Widget> _pastTab() {
    if (_past == null) return [const ListRowsSkeleton(count: 2, thumb: 90)];
    if (_past!.isEmpty) {
      return [
        _announceState(
          Icons.history,
          'No past shows yet',
          'Once a show wraps, it lands here so you can still browse what was on the loom.',
        ),
      ];
    }
    return [
      for (final l in _past!)
        Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: _pastCard(l)),
    ];
  }

  /// A scheduled show. No JOIN button — there is nothing to join yet, and a
  /// dead button is worse than none.
  Widget _scheduledCard(LiveSession l) => Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: VlColors.paper,
          borderRadius: BorderRadius.circular(VlRadii.lg),
          border: Border.all(color: VlColors.rule),
        ),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          SizedBox(width: 66, height: 84, child: Silk(palette: l.palette, radius: VlRadii.sm)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(_whenLabel(l.scheduledAt), style: VlText.mono(9, color: VlColors.red, letter: 0.2)),
              const SizedBox(height: 6),
              Text(l.hasTitle ? l.title : 'Live shopping show',
                  maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.display(17)),
              const SizedBox(height: 5),
              Text(l.host, style: VlText.body(11.5, color: VlColors.muted)),
              if (l.discount.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: VlColors.redSoft, borderRadius: BorderRadius.circular(4)),
                  child: Text(l.discount, style: VlText.mono(9, color: VlColors.red, letter: 0.14)),
                ),
              ],
            ]),
          ),
        ]),
      );

  /// A finished show. The products stay browsable, which is the reason to keep it.
  Widget _pastCard(LiveSession l) => GestureDetector(
        onTap: () => context.push('/live/${Uri.encodeComponent(l.liveId)}'),
        child: Container(
          margin: const EdgeInsets.only(bottom: 14),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: VlColors.paper,
            borderRadius: BorderRadius.circular(VlRadii.lg),
            border: Border.all(color: VlColors.rule),
          ),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            SizedBox(
              width: 66,
              height: 84,
              child: Stack(children: [
                Positioned.fill(child: Silk(palette: l.palette, radius: VlRadii.sm)),
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(VlRadii.sm),
                    ),
                  ),
                ),
                const Center(child: Icon(Icons.history, size: 18, color: Colors.white)),
              ]),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(_endedLabel(l.endedAt), style: VlText.mono(9, color: VlColors.muted, letter: 0.2)),
                const SizedBox(height: 6),
                // "Live now — pure cane jaggery" is the Live tab's fallback and
                // reads as nonsense on a show that finished last week.
                Text(l.hasTitle ? l.title : 'Pure cane jaggery',
                    maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.display(17)),
                const SizedBox(height: 6),
                Text(_sareeCount(l.productCount), style: VlText.mono(9, color: VlColors.muted, letter: 0.16)),
              ]),
            ),
            Icon(Icons.chevron_right, size: 18, color: VlColors.rule2),
          ]),
        ),
      );

  /// "1 PRODUCT FROM THIS SHOW", not "1 PRODUCTS FROM THIS SHOW".
  String _sareeCount(int n) => n == 1 ? '1 PRODUCT FROM THIS SHOW' : '$n PRODUCTS FROM THIS SHOW';

  String _whenLabel(DateTime? at) {
    if (at == null) return 'SCHEDULED';
    final now = DateTime.now();
    final d = at.difference(now);
    if (d.isNegative) return 'STARTING NOW';
    if (d.inHours < 1) return 'IN ${d.inMinutes} MIN';
    if (d.inHours < 24) return 'IN ${d.inHours} HR';
    final days = d.inDays;
    return days == 1 ? 'TOMORROW' : 'IN $days DAYS';
  }

  String _endedLabel(DateTime? at) {
    if (at == null) return 'ENDED';
    final d = DateTime.now().difference(at);
    if (d.inMinutes < 60) return '${d.inMinutes} MIN AGO';
    if (d.inHours < 24) return '${d.inHours} HR AGO';
    final days = d.inDays;
    return days == 1 ? 'YESTERDAY' : '$days DAYS AGO';
  }

  List<Widget> _liveTab(List<LiveSession> live) {
    if (_live == null && _err == null) {
      return [const ListRowsSkeleton(count: 2, thumb: 90)];
    }
    if (live.isEmpty) {
      return [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 40, 20, 20),
          child: Column(children: [
            Icon(Icons.videocam_off_outlined, size: 40, color: VlColors.rule2),
            const SizedBox(height: 12),
            Text('No live sessions right now', style: VlText.display(18)),
            const SizedBox(height: 4),
            Text('We announce every show on Instagram and WhatsApp.',
                textAlign: TextAlign.center, style: VlText.body(13, color: VlColors.muted)),
          ]),
        ),
      ];
    }
    return [for (final l in live) Padding(padding: const EdgeInsets.symmetric(horizontal: 20), child: _liveCard(l))];
  }

  Widget _tabBtn(String label, int i, int count, {bool isLive = false}) {
    final active = _tab == i;
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _tab = i),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: active ? VlColors.ink : VlColors.paper,
            borderRadius: BorderRadius.circular(VlRadii.md),
            border: Border.all(color: active ? VlColors.ink : VlColors.rule),
          ),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            if (isLive) ...[
              Container(width: 6, height: 6, decoration: BoxDecoration(color: VlColors.red, shape: BoxShape.circle)),
              const SizedBox(width: 6),
            ],
            Text(label, style: VlText.ui(12, weight: active ? FontWeight.w600 : FontWeight.w500, color: active ? Colors.white : VlColors.muted)),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
              decoration: BoxDecoration(color: active ? Colors.white24 : VlColors.cream, borderRadius: BorderRadius.circular(3)),
              child: Text('$count', style: VlText.mono(10, color: active ? Colors.white : VlColors.muted)),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _liveCard(LiveSession l) => GestureDetector(
        onTap: () => context.push('/live/${Uri.encodeComponent(l.liveId)}'),
        child: Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: VlColors.paper,
            borderRadius: BorderRadius.circular(VlRadii.lg),
            border: Border.all(color: VlColors.rule),
            boxShadow: [BoxShadow(color: VlColors.redInk.withValues(alpha: 0.06), blurRadius: 18, offset: const Offset(0, 6))],
          ),
          clipBehavior: Clip.antiAlias,
          child: Column(children: [
            AspectRatio(
              aspectRatio: 16 / 11,
              child: Stack(children: [
                Positioned.fill(child: Silk(palette: l.palette, radius: 0)),
                Positioned.fill(
                  child: DecoratedBox(
                      decoration: BoxDecoration(
                          gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [
                    Colors.black.withValues(alpha: 0.15),
                    Colors.transparent,
                    VlColors.redInk.withValues(alpha: 0.6),
                  ], stops: const [0, 0.4, 1]))),
                ),
                Positioned(top: 12, left: 12, child: Row(children: [
                  const LiveBadge(),
                  if (l.viewers > 0) ...[
                    const SizedBox(width: 8),
                    GlassChip(child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.visibility, size: 11, color: Colors.white),
                      const SizedBox(width: 5),
                      Text('${l.viewers}', style: VlText.mono(10, color: Colors.white)),
                    ])),
                  ],
                ])),
                if (l.discount.isNotEmpty)
                  Positioned(top: 12, right: 12, child: GlassChip(child: Text(l.discount, style: VlText.mono(9, color: Colors.white, letter: 0.18)))),
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(
                        color: Colors.white24, shape: BoxShape.circle, border: Border.all(color: Colors.white70, width: 2)),
                    child: const Icon(Icons.play_arrow, size: 30, color: Colors.white),
                  ),
                ),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.all(14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(l.title, maxLines: 2, overflow: TextOverflow.ellipsis, style: VlText.display(17)),
                const SizedBox(height: 6),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('${l.productCount} PRODUCTS ON STREAM'.toUpperCase(),
                      style: VlText.mono(9, color: VlColors.muted, letter: 0.18)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(color: VlColors.red, borderRadius: BorderRadius.circular(4)),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Text('JOIN LIVE', style: VlText.ui(10, weight: FontWeight.w600, color: Colors.white, letter: 0.16)),
                      const SizedBox(width: 6),
                      const Icon(Icons.arrow_forward, size: 11, color: Colors.white),
                    ]),
                  ),
                ]),
              ]),
            ),
          ]),
        ),
      );

  /// What the Upcoming / Completed tabs say now that they don't invent shows:
  /// where the store actually announces them.
  Widget _announceState(IconData icon, String title, String body) => Padding(
        padding: const EdgeInsets.fromLTRB(32, 30, 32, 20),
        child: Column(children: [
          Icon(icon, size: 38, color: VlColors.rule2),
          const SizedBox(height: 14),
          Text(title, textAlign: TextAlign.center, style: VlText.display(20)),
          const SizedBox(height: 8),
          Text(body, textAlign: TextAlign.center, style: VlText.body(13, color: VlColors.muted, height: 1.6)),
          const SizedBox(height: 18),
          ValueListenableBuilder<StoreConfig>(
            valueListenable: storeConfig,
            builder: (context, cfg, _) {
              final whatsapp = cfg.whatsapp.replaceAll(RegExp(r'\D'), '');
              return Wrap(spacing: 10, runSpacing: 10, alignment: WrapAlignment.center, children: [
                if (cfg.instagram.isNotEmpty)
                  _followBtn(context, Icons.camera_alt_outlined, 'INSTAGRAM', cfg.instagram),
                if (whatsapp.isNotEmpty)
                  _followBtn(context, Icons.chat_bubble_outline, 'WHATSAPP', 'https://wa.me/$whatsapp'),
              ]);
            },
          ),
        ]),
      );

  Widget _followBtn(BuildContext context, IconData ic, String label, String url) => GestureDetector(
        onTap: () => openExternal(context, url),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(999), border: Border.all(color: VlColors.rule2)),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(ic, size: 13, color: VlColors.ink),
            const SizedBox(width: 7),
            Text(label, style: VlText.upper(9, letter: 0.16)),
          ]),
        ),
      );
}
