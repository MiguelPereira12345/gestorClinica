class ApiUser {
  final int id;
  final String nome;
  final String email;
  final String tipo;

  const ApiUser({
    required this.id,
    required this.nome,
    required this.email,
    required this.tipo,
  });

  factory ApiUser.fromJson(Map<String, dynamic> json) {
    return ApiUser(
      id: (json['id'] as num).toInt(),
      nome: (json['nome'] ?? '').toString(),
      email: (json['email'] ?? '').toString(),
      tipo: (json['tipo'] ?? '').toString(),
    );
  }
}

class LoginResult {
  final String token;
  final String? refreshToken;
  final ApiUser user;

  const LoginResult({required this.token, required this.user, this.refreshToken});

  factory LoginResult.fromJson(Map<String, dynamic> json) {
    return LoginResult(
      token: (json['token'] ?? '').toString(),
      refreshToken: json['refreshToken'] == null ? null : json['refreshToken'].toString(),
      user: ApiUser.fromJson((json['user'] as Map).cast<String, dynamic>()),
    );
  }
}
