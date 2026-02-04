import 'api_client.dart';

class FilesApi {
  final ApiClient client;

  FilesApi(this.client);

  Future<Map<String, dynamic>> listFiles({
    int? patientId,
    int? consultaId,
    int? dependentId,
  }) {
    final query = <String, dynamic>{};
    if (patientId != null) query['patientId'] = patientId;
    if (consultaId != null) query['consultaId'] = consultaId;
    if (dependentId != null) query['dependentId'] = dependentId;
    return client.getJson('/files', query: query);
  }

  Future<ApiBinaryResponse> downloadFile(int idFile) {
    return client.getBytes('/files/$idFile/download');
  }
}
