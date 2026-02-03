import 'dart:convert';
import 'dart:io';

import 'token_store.dart';

class ApiException implements Exception {
  final int? status;
  final String message;
  final dynamic details;

  ApiException(this.message, {this.status, this.details});

  @override
  String toString() => 'ApiException(status: $status, message: $message)';
}

class ApiClient {
  final String baseUrl;
  final TokenStore tokenStore;
  final HttpClient _http;

  ApiClient({required this.baseUrl, required this.tokenStore, HttpClient? http})
      : _http = http ?? HttpClient();

  Uri _uri(String path, [Map<String, dynamic>? query]) {
    final normalized = path.startsWith('/') ? path : '/$path';
    return Uri.parse(baseUrl).replace(path: normalized, queryParameters: query);
  }

  Future<Map<String, dynamic>> getJson(String path,
      {Map<String, dynamic>? query, bool auth = true}) async {
    final req = await _http.getUrl(_uri(path, query));
    await _addHeaders(req, auth: auth);
    final res = await req.close();
    return _readJson(res);
  }

  Future<Map<String, dynamic>> postJson(String path,
      {Object? body, bool auth = true}) async {
    final req = await _http.postUrl(_uri(path));
    await _addHeaders(req, auth: auth);
    if (body != null) {
      req.write(jsonEncode(body));
    }
    final res = await req.close();
    return _readJson(res);
  }

  Future<Map<String, dynamic>> putJson(String path,
      {Object? body, bool auth = true}) async {
    final req = await _http.putUrl(_uri(path));
    await _addHeaders(req, auth: auth);
    if (body != null) {
      req.write(jsonEncode(body));
    }
    final res = await req.close();
    return _readJson(res);
  }

  Future<Map<String, dynamic>> patchJson(String path,
      {Object? body, bool auth = true}) async {
    final req = await _http.openUrl('PATCH', _uri(path));
    await _addHeaders(req, auth: auth);
    if (body != null) {
      req.write(jsonEncode(body));
    }
    final res = await req.close();
    return _readJson(res);
  }

  Future<void> _addHeaders(HttpClientRequest req, {required bool auth}) async {
    req.headers.set(HttpHeaders.acceptHeader, 'application/json');
    req.headers.set(HttpHeaders.contentTypeHeader, 'application/json');

    if (!auth) return;
    final tokens = await tokenStore.read();
    if (tokens?.accessToken != null && tokens!.accessToken.isNotEmpty) {
      req.headers.set(HttpHeaders.authorizationHeader, 'Bearer ${tokens.accessToken}');
    }
  }

  Future<Map<String, dynamic>> _readJson(HttpClientResponse res) async {
    final raw = await res.transform(utf8.decoder).join();
    final dynamic decoded = raw.isEmpty ? null : jsonDecode(raw);

    if (res.statusCode < 200 || res.statusCode >= 300) {
      final message = (decoded is Map && decoded['message'] is String)
          ? decoded['message'] as String
          : 'HTTP ${res.statusCode}';
      throw ApiException(message, status: res.statusCode, details: decoded);
    }

    if (decoded is Map<String, dynamic>) return decoded;
    if (decoded is Map) return decoded.cast<String, dynamic>();
    return <String, dynamic>{'data': decoded};
  }
}
