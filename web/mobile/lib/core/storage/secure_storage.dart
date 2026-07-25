import "package:flutter_riverpod/flutter_riverpod.dart";
import "package:flutter_secure_storage/flutter_secure_storage.dart";

class TokenKeys {
  static const accessToken  = "access_token";
  static const refreshToken = "refresh_token";
  static const userId       = "user_id";
}

class SecureStorage {
  SecureStorage(this._storage);
  final FlutterSecureStorage _storage;

  static const _aOptions = AndroidOptions(encryptedSharedPreferences: true);
  static const _iOptions = IOSOptions(accessibility: KeychainAccessibility.first_unlock);

  Future<void> writeAccessToken(String value)  => _storage.write(key: TokenKeys.accessToken,  value: value, aOptions: _aOptions, iOptions: _iOptions);
  Future<void> writeRefreshToken(String value) => _storage.write(key: TokenKeys.refreshToken, value: value, aOptions: _aOptions, iOptions: _iOptions);
  Future<void> writeUserId(String value)       => _storage.write(key: TokenKeys.userId,       value: value, aOptions: _aOptions, iOptions: _iOptions);

  Future<String?> readAccessToken()  => _storage.read(key: TokenKeys.accessToken,  aOptions: _aOptions, iOptions: _iOptions);
  Future<String?> readRefreshToken() => _storage.read(key: TokenKeys.refreshToken, aOptions: _aOptions, iOptions: _iOptions);
  Future<String?> readUserId()       => _storage.read(key: TokenKeys.userId,       aOptions: _aOptions, iOptions: _iOptions);

  Future<void> clear() => _storage.deleteAll(aOptions: _aOptions, iOptions: _iOptions);
}

final secureStorageProvider = Provider<SecureStorage>((ref) {
  return SecureStorage(const FlutterSecureStorage());
});
