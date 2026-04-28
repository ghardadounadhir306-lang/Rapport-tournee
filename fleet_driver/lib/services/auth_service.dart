import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/driver.dart';
import 'api_client.dart';

class AuthService {
  Future<Map<String, dynamic>> login(String employeeId, String password) async {
    if (employeeId.isEmpty || password.isEmpty) {
      throw Exception('Please fill in all fields');
    }

    final dio = ApiClient.plain();

    try {
      final response = await dio.post(
        '/api/auth/login',
        data: {
          'employeeId': employeeId,
          'password': password,
        },
      );

      final data = _toStringKeyedMap(response.data);
      final token = data['token']?.toString();
      final driverJson = _toNullableStringKeyedMap(data['driver']);

      if (token == null || token.isEmpty) {
        throw Exception('Unexpected response from server');
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', token);

      Driver? driver;
      if (driverJson != null) {
        try {
          driver = Driver.fromJson(driverJson);
          await prefs.setInt('driver_id', driver.id);
        } catch (_) {
          final driverId = _toNullableInt(driverJson['id']);
          if (driverId != null) {
            await prefs.setInt('driver_id', driverId);
          }
        }
      }

      return {
        'token': token,
        if (driver != null) 'driver': driver,
      };
    } on DioException catch (e) {
      throw Exception(_extractMessage(e));
    }
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('driver_id');
  }

  Future<bool> isLoggedIn() async {
    final token = await getToken();
    return token != null;
  }

  String _extractMessage(DioException e) {
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

  Map<String, dynamic> _toStringKeyedMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return value.map((key, val) => MapEntry(key.toString(), val));
    }

    return const <String, dynamic>{};
  }

  Map<String, dynamic>? _toNullableStringKeyedMap(dynamic value) {
    if (value == null) {
      return null;
    }

    if (value is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return value.map((key, val) => MapEntry(key.toString(), val));
    }

    return null;
  }

  int? _toNullableInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value);
    return null;
  }
}