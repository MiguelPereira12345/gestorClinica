import 'api_client.dart';
import 'models.dart';
import 'token_store.dart';

class AuthApi {
  final ApiClient client;

  AuthApi(this.client);

  Future<LoginResult> loginPaciente({required String email, required String senha}) async {
    final json = await client.postJson(
      '/auth/paciente/login',
      auth: false,
      body: {'email': email, 'senha': senha},
    );

    final result = LoginResult.fromJson(json);
    await client.tokenStore.write(
      AuthTokens(accessToken: result.token, refreshToken: result.refreshToken),
    );
    return result;
  }

  Future<ApiUser> me() async {
    final json = await client.getJson('/auth/me');
    if (json['user'] is Map) {
      return ApiUser.fromJson((json['user'] as Map).cast<String, dynamic>());
    }
    return ApiUser.fromJson(json);
  }

  Future<void> logout() async {
    final tokens = await client.tokenStore.read();
    final refresh = tokens?.refreshToken;
    if (refresh != null && refresh.isNotEmpty) {
      await client.postJson('/auth/logout', auth: false, body: {'refreshToken': refresh});
    }
    await client.tokenStore.clear();
  }
}
