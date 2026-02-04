import 'api_client.dart';

class DeclarationsApi {
  final ApiClient client;

  DeclarationsApi(this.client);

  /// Lists declarations. For patients, backend automatically returns only their own.
  /// For admin usage, you may pass [patientId] to filter.
  Future<Map<String, dynamic>> listDeclarations({int? patientId}) {
    final query = <String, dynamic>{};
    if (patientId != null) query['patientId'] = patientId;
    return client.getJson('/declarations', query: query);
  }

  Future<ApiBinaryResponse> downloadDeclaration(int idDeclaration) {
    return client.getBytes('/declarations/$idDeclaration/download');
  }

  /// Downloads (and creates if needed) a presence declaration for a consulta.
  /// Backend rules:
  /// - patient only allowed for their own consulta
  /// - only available after consulta date+time
  Future<ApiBinaryResponse> downloadPresenceByConsulta(int consultaId) {
    return client.getBytes('/declarations/presence/by-consulta/$consultaId/download');
  }
}
