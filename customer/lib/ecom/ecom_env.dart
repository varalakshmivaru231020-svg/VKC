/// Where the store lives. Override for staging/local with
/// `--dart-define=ECOM_API_BASE=https://host` (the `/api/v1` path is appended
/// by the client; media paths are resolved against the same host).
const String ecomHost = String.fromEnvironment('ECOM_API_BASE', defaultValue: 'https://vkcgoldikshu.com');

/// Turns whatever the API stores for an image into a URL the phone can load.
///
/// The admin panel saves uploads as site-relative paths (`/uploads/...`);
/// Cloudinary or external images arrive absolute. Loading a relative path
/// with `Image.network` fails silently, which is why every product used to
/// show the placeholder. Returns null for blank input so callers can fall
/// back to a placeholder tile.
String? mediaUrl(dynamic raw) {
  final s = (raw ?? '').toString().trim();
  if (s.isEmpty) return null;
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('data:')) return s;
  if (s.startsWith('//')) return 'https:$s';
  return s.startsWith('/') ? '$ecomHost$s' : '$ecomHost/$s';
}
