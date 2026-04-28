class Vehicle {
  final int id;
  final String plate;
  final String type;
  final String model;

  Vehicle({
    required this.id,
    required this.plate,
    required this.type,
    required this.model,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) => Vehicle(
        id: _toInt(json['id']),
        plate: (json['plate'] ?? '').toString(),
        type: (json['type'] ?? '').toString(),
        model: (json['model'] ?? '').toString(),
      );

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }
}

class Driver {
  final int id;
  final String name;
  final String employeeId;
  final Vehicle vehicle;
  final String role;  // 'driver' or 'super_admin'

  Driver({
    required this.id,
    required this.name,
    required this.employeeId,
    required this.vehicle,
    this.role = 'driver',
  });

  /// Check if user is super_admin
  bool get isSuperAdmin => role == 'super_admin';

  factory Driver.fromJson(Map<String, dynamic> json) => Driver(
        id: _toInt(json['id']),
        name: (json['name'] ?? '').toString(),
        employeeId: (json['employee_id'] ?? '').toString(),
        vehicle: Vehicle.fromJson(
          (json['vehicle'] as Map<String, dynamic>?) ?? const <String, dynamic>{},
        ),
        role: (json['role'] ?? 'driver').toString(),
      );

  static int _toInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }
}