import 'package:dio/dio.dart';
import '../models/trip.dart';
import '../models/driver.dart';
import 'api_client.dart';

class TripService {
  // ── Driver profile ───────────────────────────────────────────────────────

  Future<Driver> getMe() async {
    final dio = await ApiClient.authed();
    try {
      final response = await dio.get('/api/auth/me');
      final data = _toMap(response.data);
      final driverJson = _toNullableMap(data['driver']);
      if (driverJson == null) throw Exception('Driver data not found');
      return Driver.fromJson(driverJson);
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  // ── Live trip (driver_trips) ─────────────────────────────────────────────

  /// Returns the active driver_trip for this chauffeur.
  /// The API should JOIN depots (via sitcode) and poi_clients (via otdcode)
  /// and embed them as { depot: {...}, poi_client: {...} }.
  Future<Trip?> getActiveTrip() async {
    final dio = await ApiClient.authed();
    try {
      final response = await dio.get('/api/trips/active');
      final data = _toMap(response.data);
      final tripJson = _toNullableMap(data['trip']);
      if (tripJson == null) return null;
      return Trip.fromJson(tripJson);
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  Future<void> startTrip(
    int tripId, {
    double? lat,
    double? lng,
    double? speed,
  }) async {
    final dio = await ApiClient.authed();
    try {
      final payload = <String, dynamic>{};
      if (lat != null && lng != null) {
        payload['lat'] = lat;
        payload['lng'] = lng;
      }
      if (speed != null) {
        payload['speed'] = speed;
      }
      await dio.post(
        '/api/trips/$tripId/start',
        data: payload.isEmpty ? null : payload,
      );
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  Future<void> endTrip(
    int tripId, {
    double? lat,
    double? lng,
    double? speed,
  }) async {
    final dio = await ApiClient.authed();
    try {
      final payload = <String, dynamic>{};
      if (lat != null && lng != null) {
        payload['lat'] = lat;
        payload['lng'] = lng;
      }
      if (speed != null) {
        payload['speed'] = speed;
      }
      await dio.post(
        '/api/trips/$tripId/end',
        data: payload.isEmpty ? null : payload,
      );
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  Future<void> sendLocation(
      int tripId, double lat, double lng, double speed) async {
    final dio = await ApiClient.authed();
    try {
      await dio.post('/api/trips/$tripId/locations', data: {
        'lat': lat,
        'lng': lng,
        'speed': speed,
      });
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  // ── Tournée history (transport_data) ────────────────────────────────────

  /// Returns the tournée history for the logged-in chauffeur.
  ///
  /// Backend query (Node/Express example):
  /// ```sql
  /// SELECT
  ///   td.*,
  ///   d.name  AS depot_name,
  ///   d.latitude  AS depot_lat,
  ///   d.longitude AS depot_lng,
  ///   pc.name  AS poi_name,
  ///   pc.latitude  AS poi_lat,
  ///   pc.longitude AS poi_lng,
  ///   c.nom    AS chauffeur_nom,
  ///   c.prenom AS chauffeur_prenom,
  ///   c.employee_id AS chauffeur_employee_id
  /// FROM transport_data td
  /// LEFT JOIN depots    d  ON d.code  = td.sitcode
  /// LEFT JOIN poi_clients pc ON pc.code = td.otdcode
  /// LEFT JOIN chauffeurs  c  ON c.id   = td.sal_id
  /// WHERE td.sal_id = :chauffeurId
  /// ORDER BY td.voydtd DESC, td.voyhrd DESC
  /// ```
  Future<List<Tournee>> getTourneeHistory(
      {bool includeAllDrivers = false}) async {
    final dio = await ApiClient.authed();
    try {
      final response = await dio.get(
        '/api/tournees/history',
        queryParameters:
            includeAllDrivers ? const {'include_all_drivers': '1'} : null,
      );
      final data = _toMap(response.data);
      final list = (data['tournees'] as List<dynamic>? ?? const []);
      return list
          .map(_toNullableMap)
          .whereType<Map<String, dynamic>>()
          .map(Tournee.fromJson)
          .toList();
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  /// Returns a single tournée with full depot + poi + chauffeur details.
  Future<Tournee> getTournee(int id) async {
    final dio = await ApiClient.authed();
    try {
      final response = await dio.get('/api/tournees/$id');
      final data = _toMap(response.data);
      final tourneeJson = _toNullableMap(data['tournee']);
      if (tourneeJson == null) throw Exception('Tournée not found');
      return Tournee.fromJson(tourneeJson);
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  /// Returns tournées for a specific depot (sitcode filter).
  Future<List<Tournee>> getTourneesByDepot(String sitcode) async {
    final dio = await ApiClient.authed();
    try {
      final response = await dio.get('/api/tournees/history', queryParameters: {
        'sitcode': sitcode,
      });
      final data = _toMap(response.data);
      final list = (data['tournees'] as List<dynamic>? ?? const []);
      return list
          .map(_toNullableMap)
          .whereType<Map<String, dynamic>>()
          .map(Tournee.fromJson)
          .toList();
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  /// Returns tournées for a specific poi/client (otdcode filter).
  Future<List<Tournee>> getTourneesByPoi(String otdcode) async {
    final dio = await ApiClient.authed();
    try {
      final response = await dio.get('/api/tournees/history', queryParameters: {
        'otdcode': otdcode,
      });
      final data = _toMap(response.data);
      final list = (data['tournees'] as List<dynamic>? ?? const []);
      return list
          .map(_toNullableMap)
          .whereType<Map<String, dynamic>>()
          .map(Tournee.fromJson)
          .toList();
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  /// Updates trip detail fields on transport_data.
  /// Supported fields: chargement, voyhrd, voyhrf, plakm1, plakm2,
  /// km_dernier_client, arrivee_client, depart_client, km_arv_client,
  /// voypal, otsetat.
  Future<void> updateTourneeDetails(
    int id,
    Map<String, dynamic> fields,
  ) async {
    final dio = await ApiClient.authed();
    try {
      await dio.patch(
        '/api/tournees/$id/details',
        data: fields,
      );
    } on DioException catch (e) {
      throw Exception(_msg(e));
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────

  String _msg(DioException e) {
    final data = e.response?.data;
    if (data is Map<String, dynamic> && data['message'] is String) {
      return data['message'] as String;
    }
    if (e.type == DioExceptionType.connectionError ||
        e.type == DioExceptionType.connectionTimeout) {
      return 'Cannot connect to backend server';
    }
    return 'Request failed';
  }

  Map<String, dynamic> _toMap(dynamic v) {
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return v.map((k, val) => MapEntry(k.toString(), val));
    return const {};
  }

  Map<String, dynamic>? _toNullableMap(dynamic v) {
    if (v == null) return null;
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return v.map((k, val) => MapEntry(k.toString(), val));
    return null;
  }
}
