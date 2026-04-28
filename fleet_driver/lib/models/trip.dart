/// Represents one tournée from transport_data,
/// enriched with depot (sitcode → depots) and
/// poi_client (otdcode → poi_clients) details.
class Tournee {
  // ── transport_data core fields ──────────────────
  final int id;
  final String? otdcode;       // destination code → poi_clients.code
  final String? sitcode;       // origin depot code → depots.code
  final int? salId;            // FK → chauffeurs.id
  final String? toucode;       // tournée code
  final String? voydtd;        // date départ (voyage)
  final String? voyhrd;        // heure départ
  final String? voyhrf;        // heure fin
  final String? voydtf;        // date fin
  final double? plakm1;        // km départ
  final double? plakm2;        // km arrivée
  final double? kmTsp;         // km total
  final int? voypal;           // palettes voyage
  final int? entnbpal;         // palettes entrée
  final double? performanceCamion;
  final double? performanceChauffeur;
  final double? tauxRemplissagePal;
  final double? tauxRemplissageTon;
  final String? otsetat;       // état (livré, etc.)
  final String? chargement;    // marchandise
  final String? camionCode;    // FK → base_camion.camion
  final String? sitechauff;    // nom chauffeur (dénormalisé)
  final String? sitecamion;    // nom camion (dénormalisé)

  // ── Trip detail fields (matching web form) ──────
  final String? otskm2;           // OTS km (legacy)
  final String? otdhd;            // OTD HD (legacy)
  final String? arriveeClient;    // Arrivée.Client
  final String? departClient;     // Départ.Client
  final String? kmArvClient;      // Km.Arv.Client
  final String? kmDernierClient;  // Km dernier client

  // ── depot details (from depots via sitcode) ─────
  final String? depotName;
  final double? depotLat;
  final double? depotLng;

  // ── poi_client details (from poi_clients via otdcode) ──
  final String? poiName;
  final double? poiLat;
  final double? poiLng;

  // ── chauffeur details (from chauffeurs via sal_id) ──
  final String? chauffeurNom;
  final String? chauffeurPrenom;
  final String? chauffeurEmployeeId;

  // ── state management ────────────────────────────
  final String? states;  // 'pending' or 'done'

  Tournee({
    required this.id,
    this.otdcode,
    this.sitcode,
    this.salId,
    this.toucode,
    this.voydtd,
    this.voyhrd,
    this.voyhrf,
    this.voydtf,
    this.plakm1,
    this.plakm2,
    this.kmTsp,
    this.voypal,
    this.entnbpal,
    this.performanceCamion,
    this.performanceChauffeur,
    this.tauxRemplissagePal,
    this.tauxRemplissageTon,
    this.otsetat,
    this.chargement,
    this.camionCode,
    this.sitechauff,
    this.sitecamion,
    this.otskm2,
    this.otdhd,
    this.arriveeClient,
    this.departClient,
    this.kmArvClient,
    this.kmDernierClient,
    this.depotName,
    this.depotLat,
    this.depotLng,
    this.poiName,
    this.poiLat,
    this.poiLng,
    this.chauffeurNom,
    this.chauffeurPrenom,
    this.chauffeurEmployeeId,
    this.states,
  });

  // ── Computed helpers ────────────────────────────

  /// Effective destination coords: poi_clients first, null if not available
  double? get destLat => poiLat;
  double? get destLng => poiLng;

  /// Effective origin coords: depot first, null if not available
  double? get originLat => depotLat;
  double? get originLng => depotLng;

  /// Human-readable destination label
  String get destinationLabel => poiName ?? otdcode ?? '—';

  /// Human-readable origin label
  String get originLabel => depotName ?? sitcode ?? '—';

  /// Full chauffeur name
  String get chauffeurFullName {
    if (chauffeurNom != null && chauffeurPrenom != null) {
      return '$chauffeurPrenom $chauffeurNom';
    }
    return sitechauff ?? '—';
  }

  /// Calculated distance in km (plakm2 - plakm1), or kmTsp if available
  double? get distanceKm {
    if (kmTsp != null && kmTsp! > 0) return kmTsp;
    if (plakm1 != null && plakm2 != null && plakm2! > plakm1!) {
      return plakm2! - plakm1!;
    }
    return null;
  }

  /// Check if trip is pending
  bool get isPending => states == 'pending';

  /// Check if trip is done
  bool get isDone => states == 'done';

  factory Tournee.fromJson(Map<String, dynamic> json) {
    // Nested objects optionally embedded by the API
    final depotJson   = _toNullableMap(json['depot']);
    final poiJson     = _toNullableMap(json['poi_client']);
    final chauffJson  = _toNullableMap(json['chauffeur']);

    return Tournee(
      id: _toInt(json['id']),
      otdcode:  json['otdcode']?.toString(),
      sitcode:  json['sitcode']?.toString(),
      salId:    _toNullableInt(json['sal_id']),
      toucode:  json['toucode']?.toString(),
      voydtd:   json['voydtd']?.toString(),
      voyhrd:   json['voyhrd']?.toString(),
      voyhrf:   json['voyhrf']?.toString(),
      voydtf:   json['voydtf']?.toString(),
      plakm1:   _toDouble(json['plakm1']),
      plakm2:   _toDouble(json['plakm2']),
      kmTsp:    _toDouble(json['km_tsp']),
      voypal:   _toNullableInt(json['voypal']),
      entnbpal: _toNullableInt(json['entnbpal']),
      performanceCamion:      _toDouble(json['performance_camion']),
      performanceChauffeur:   _toDouble(json['performance_chauffeur']),
      tauxRemplissagePal:     _toDouble(json['taux_remplissage_pal']),
      tauxRemplissageTon:     _toDouble(json['taux_remplissage_ton']),
      otsetat:    json['otsetat']?.toString(),
      chargement: json['chargement']?.toString(),
      camionCode: json['camion_code']?.toString(),
      sitechauff: json['sitechauff']?.toString(),
      sitecamion: json['sitecamion']?.toString(),
      otskm2:    json['otskm2']?.toString(),
      otdhd:     json['otdhd']?.toString(),
      arriveeClient:    json['arrivee_client']?.toString(),
      departClient:     json['depart_client']?.toString(),
      kmArvClient:      json['km_arv_client']?.toString(),
      kmDernierClient:  json['km_dernier_client']?.toString(),

      // depot — nested object OR flat prefixed fields
      depotName: depotJson?['name']?.toString() ?? json['depot_name']?.toString(),
      depotLat:  depotJson != null ? _toDouble(depotJson['latitude'])  : _toDouble(json['depot_lat']),
      depotLng:  depotJson != null ? _toDouble(depotJson['longitude']) : _toDouble(json['depot_lng']),

      // poi_client — nested object OR flat prefixed fields
      poiName: poiJson?['name']?.toString() ?? json['poi_name']?.toString(),
      poiLat:  poiJson != null ? _toDouble(poiJson['latitude'])  : _toDouble(json['poi_lat']),
      poiLng:  poiJson != null ? _toDouble(poiJson['longitude']) : _toDouble(json['poi_lng']),

      // chauffeur — nested object OR flat prefixed fields
      chauffeurNom:        chauffJson?['nom']?.toString()         ?? json['chauffeur_nom']?.toString(),
      chauffeurPrenom:     chauffJson?['prenom']?.toString()      ?? json['chauffeur_prenom']?.toString(),
      chauffeurEmployeeId: chauffJson?['employee_id']?.toString() ?? json['chauffeur_employee_id']?.toString(),

      // states
      states: json['states']?.toString(),
    );
  }

  // ── Private helpers ─────────────────────────────

  static int _toInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }

  static int? _toNullableInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v);
    return null;
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }

  static Map<String, dynamic>? _toNullableMap(dynamic v) {
    if (v == null) return null;
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return v.map((k, val) => MapEntry(k.toString(), val));
    return null;
  }
}

// ── Keep Trip as a thin wrapper for driver_trips (live tracking) ──────────
/// Used only for the live tracking flow (driver_trips table).
class Trip {
  final int id;
  final int? transportDataId;
  final String origin;
  final String destination;
  final double? originLat;
  final double? originLng;
  final double? destLat;
  final double? destLng;
  final String status; // pending | active | done
  final double? distanceKm;
  final int? durationMinutes;
  final String? startTime;
  final String? endTime;

  // Links to transport_data / depots / poi_clients
  final String? otdcode;
  final String? sitcode;
  final String? depotName;
  final double? depotLat;
  final double? depotLng;
  final String? poiName;
  final double? poiLat;
  final double? poiLng;

  Trip({
    required this.id,
    this.transportDataId,
    required this.origin,
    required this.destination,
    this.originLat,
    this.originLng,
    this.destLat,
    this.destLng,
    required this.status,
    this.distanceKm,
    this.durationMinutes,
    this.startTime,
    this.endTime,
    this.otdcode,
    this.sitcode,
    this.depotName,
    this.depotLat,
    this.depotLng,
    this.poiName,
    this.poiLat,
    this.poiLng,
  });

  double? get effectiveDestLat => poiLat ?? destLat;
  double? get effectiveDestLng => poiLng ?? destLng;
  double? get effectiveOriginLat => depotLat ?? originLat;
  double? get effectiveOriginLng => depotLng ?? originLng;
  String get destinationLabel => poiName ?? destination;
  String get originLabel => depotName ?? origin;

  factory Trip.fromJson(Map<String, dynamic> json) {
    final depotJson = _toNullableMap(json['depot']);
    final poiJson   = _toNullableMap(json['poi_client']);
    return Trip(
      id: _toInt(json['id']),
      transportDataId: _toNullableInt(json['transport_data_id']),
      origin:      (json['origin'] ?? '').toString(),
      destination: (json['destination'] ?? '').toString(),
      originLat:   _toDouble(json['origin_lat']),
      originLng:   _toDouble(json['origin_lng']),
      destLat:     _toDouble(json['dest_lat']),
      destLng:     _toDouble(json['dest_lng']),
      status:      (json['status'] ?? '').toString(),
      distanceKm:      _toDouble(json['distance_km']),
      durationMinutes: _toNullableInt(json['duration_minutes']),
      startTime: json['start_time']?.toString(),
      endTime:   json['end_time']?.toString(),
      otdcode: json['otdcode']?.toString(),
      sitcode: json['sitcode']?.toString(),
      depotName: depotJson?['name']?.toString() ?? json['depot_name']?.toString(),
      depotLat:  depotJson != null ? _toDouble(depotJson['latitude'])  : _toDouble(json['depot_lat']),
      depotLng:  depotJson != null ? _toDouble(depotJson['longitude']) : _toDouble(json['depot_lng']),
      poiName: poiJson?['name']?.toString() ?? json['poi_name']?.toString(),
      poiLat:  poiJson != null ? _toDouble(poiJson['latitude'])  : _toDouble(json['poi_lat']),
      poiLng:  poiJson != null ? _toDouble(poiJson['longitude']) : _toDouble(json['poi_lng']),
    );
  }

  get depotCode => null;

  get poiCode => null;

  static int _toInt(dynamic v) {
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v) ?? 0;
    return 0;
  }
  static int? _toNullableInt(dynamic v) {
    if (v == null) return null;
    if (v is int) return v;
    if (v is num) return v.toInt();
    if (v is String) return int.tryParse(v);
    return null;
  }
  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    if (v is double) return v;
    if (v is num) return v.toDouble();
    if (v is String) return double.tryParse(v);
    return null;
  }
  static Map<String, dynamic>? _toNullableMap(dynamic v) {
    if (v == null) return null;
    if (v is Map<String, dynamic>) return v;
    if (v is Map) return v.map((k, val) => MapEntry(k.toString(), val));
    return null;
  }
}