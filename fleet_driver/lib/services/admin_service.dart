import 'package:dio/dio.dart';
import '../models/trip.dart';
import 'api_client.dart';

class AdminService {
  /// Fetch pending trips (for super admin)
  static Future<List<Tournee>> getPendingTrips() async {
    final dio = await ApiClient.authed();

    try {
      final response = await dio.get('/api/admin/trips-pending');
      final List<dynamic> data = response.data is List ? response.data : [];

      return data
          .map((json) => Tournee.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      throw Exception('Failed to fetch pending trips: $e');
    }
  }

  /// Create a new trip
  static Future<Map<String, dynamic>> createTrip({
    required String otdcode,     // destination code
    required String sitcode,     // origin depot code
    required String salId,       // chauffeur id
    String? toucode,             // tournée code (auto-generated if null)
    required String voydtd,      // date départ (YYYY-MM-DD)
    String? voyhrd,              // heure départ (HH:MM)
    String? voyhrf,              // heure fin
    String? voydtf,              // date fin
    String? camionCode,
    String? chargement,
  }) async {
    final dio = await ApiClient.authed();

    try {
      final response = await dio.post(
        '/api/admin/trips',
        data: {
          'otdcode': otdcode,
          'sitcode': sitcode,
          'sal_id': salId,
          'toucode': toucode,
          'voydtd': voydtd,
          'voyhrd': voyhrd,
          'voyhrf': voyhrf,
          'voydtf': voydtf,
          'camion_code': camionCode,
          'chargement': chargement,
          'states': 'pending',  // New trips start as pending
        },
      );

      return response.data is Map<String, dynamic>
          ? response.data
          : {'message': 'Trip created successfully'};
    } catch (e) {
      throw Exception('Failed to create trip: $e');
    }
  }

  /// Update trip state (pending → done or vice versa)
  static Future<Map<String, dynamic>> updateTripState({
    required int tripId,
    required String states,
  }) async {
    final dio = await ApiClient.authed();

    if (!['pending', 'done'].contains(states)) {
      throw ArgumentError('Invalid state. Must be "pending" or "done"');
    }

    try {
      final response = await dio.patch(
        '/api/admin/trips/$tripId/state',
        data: {'states': states},
      );

      return response.data is Map<String, dynamic>
          ? response.data
          : {'message': 'Trip state updated'};
    } catch (e) {
      throw Exception('Failed to update trip state: $e');
    }
  }
}
