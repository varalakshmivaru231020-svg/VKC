/// Authenticated user, mirrors `/api/v1/auth/me`'s `user` payload.
class User {
  final String id;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? phone;
  final String role;

  const User({
    required this.id,
    required this.role,
    this.firstName,
    this.lastName,
    this.email,
    this.phone,
  });

  String get displayName {
    final parts = [firstName, lastName].whereType<String>().where((p) => p.isNotEmpty).toList();
    if (parts.isNotEmpty) return parts.join(" ");
    final p = phone;
    if (p != null && p.isNotEmpty) return p;
    final e = email;
    if (e != null && e.isNotEmpty) return e;
    return "Guest";
  }

  String get initials {
    final parts = [firstName, lastName].whereType<String>().where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return "U";
    return parts.map((p) => p[0].toUpperCase()).take(2).join();
  }

  factory User.fromJson(Map<String, dynamic> j) => User(
        id:         j["id"]        as String,
        firstName:  j["firstName"] as String?,
        lastName:   j["lastName"]  as String?,
        email:      j["email"]     as String?,
        phone:      j["phone"]     as String?,
        role:       (j["role"] as String?) ?? "CUSTOMER",
      );

  User copyWith({String? firstName, String? lastName, String? email, String? phone}) => User(
        id:        id,
        role:      role,
        firstName: firstName ?? this.firstName,
        lastName:  lastName  ?? this.lastName,
        email:     email     ?? this.email,
        phone:     phone     ?? this.phone,
      );
}

/// Result of a successful OTP verify call. Includes tokens so the controller
/// can persist them and the user object so the UI can update immediately.
class AuthSession {
  final User user;
  final String accessToken;
  final String refreshToken;
  final bool isNew;

  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
    required this.isNew,
  });

  factory AuthSession.fromJson(Map<String, dynamic> j) => AuthSession(
        user: User.fromJson((j["user"] as Map).cast<String, dynamic>()),
        accessToken:  j["accessToken"]  as String,
        refreshToken: j["refreshToken"] as String,
        isNew:        j["isNew"] == true,
      );
}
