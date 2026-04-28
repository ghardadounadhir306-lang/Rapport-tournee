import 'dart:async';

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../models/trip.dart';
import '../services/trip_service.dart';
import '../theme.dart';

class TripScreen extends StatefulWidget {
  final Trip trip;

  const TripScreen({super.key, required this.trip});

  @override
  State<TripScreen> createState() => _TripScreenState();
}

class _TripScreenState extends State<TripScreen>
    with SingleTickerProviderStateMixin {
  final _tripService = TripService();

  GoogleMapController? _mapController;
  Position? _currentPosition;
  StreamSubscription<Position>? _positionStream;
  Timer? _uploadTimer;
  Timer? _elapsedTimer;

  bool _tripStarted = false;
  bool _starting = false;
  bool _ending = false;
  bool _followingVehicle = true;
  bool _programmaticCameraMove = false;

  double _speedKmh = 0;
  double _distanceKm = 0;
  double _mapZoom = 15;
  double? _initialDistanceKm;

  String _eta = '--';
  DateTime? _tripStartedAt;
  Duration _elapsed = Duration.zero;

  final List<LatLng> _trackPoints = <LatLng>[];

  late AnimationController _panelCtrl;
  late Animation<Offset> _panelSlide;

  @override
  void initState() {
    super.initState();

    _tripStarted = widget.trip.status == 'active';
    _tripStartedAt = _parseTripDate(widget.trip.startTime);

    _panelCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _panelSlide = Tween<Offset>(
      begin: const Offset(0, 1),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _panelCtrl, curve: Curves.easeOutCubic),
    );

    if (_tripStarted) {
      _tripStartedAt ??= DateTime.now();
      _startElapsedTimer();
      _startUploadTimer();
    }

    _initLocation();
    Future.delayed(
      const Duration(milliseconds: 300),
      () => _panelCtrl.forward(),
    );
  }

  @override
  void dispose() {
    _positionStream?.cancel();
    _uploadTimer?.cancel();
    _elapsedTimer?.cancel();
    _mapController?.dispose();
    _panelCtrl.dispose();
    super.dispose();
  }

  DateTime? _parseTripDate(String? raw) {
    if (raw == null || raw.isEmpty) return null;
    final parsed = DateTime.tryParse(raw);
    return parsed?.toLocal();
  }

  double _normalizedHeading(double? heading) {
    if (heading == null || !heading.isFinite || heading < 0) {
      return 0;
    }
    return heading % 360;
  }

  Future<void> _moveCameraTo(
    LatLng target, {
    double? zoom,
    double? bearing,
    bool animated = true,
  }) async {
    final controller = _mapController;
    if (controller == null) return;

    _programmaticCameraMove = true;

    final camera = CameraPosition(
      target: target,
      zoom: zoom ?? _mapZoom,
      bearing: bearing ?? 0,
      tilt: 0,
    );

    try {
      if (animated) {
        await controller.animateCamera(CameraUpdate.newCameraPosition(camera));
      } else {
        await controller.moveCamera(CameraUpdate.newCameraPosition(camera));
      }
    } catch (_) {
      // Ignore camera update failures during lifecycle transitions.
    } finally {
      Future.delayed(const Duration(milliseconds: 250), () {
        _programmaticCameraMove = false;
      });
    }
  }

  Future<void> _initLocation() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }
    if (permission == LocationPermission.deniedForever) return;

    final position = await Geolocator.getCurrentPosition();
    final firstPoint = LatLng(position.latitude, position.longitude);

    if (!mounted) return;
    setState(() {
      _currentPosition = position;
      _trackPoints
        ..clear()
        ..add(firstPoint);
    });

    _calculateEta(position);

    if (_followingVehicle) {
      _moveCameraTo(
        firstPoint,
        zoom: _mapZoom,
        bearing: _normalizedHeading(position.heading),
        animated: false,
      );
    }

    _positionStream = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10,
      ),
    ).listen((pos) {
      if (!mounted) return;
      setState(() {
        _currentPosition = pos;
        _speedKmh = pos.speed * 3.6;
        _appendTrackPoint(pos);
      });

      _calculateEta(pos);

      if (_followingVehicle) {
        _moveCameraTo(
          LatLng(pos.latitude, pos.longitude),
          zoom: _mapZoom,
          bearing: _normalizedHeading(pos.heading),
        );
      }
    });
  }

  void _startElapsedTimer() {
    _elapsedTimer?.cancel();

    void tick() {
      if (!mounted || _tripStartedAt == null) return;
      final diff = DateTime.now().difference(_tripStartedAt!);
      setState(() {
        _elapsed = diff.isNegative ? Duration.zero : diff;
      });
    }

    tick();
    _elapsedTimer = Timer.periodic(const Duration(seconds: 1), (_) => tick());
  }

  void _startUploadTimer() {
    _uploadTimer?.cancel();
    _uploadTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _uploadCurrentLocation();
    });
  }

  String _formatDuration(Duration duration) {
    final h = duration.inHours;
    final m = duration.inMinutes.remainder(60);
    final s = duration.inSeconds.remainder(60);
    if (h > 0) {
      return '${h}h ${m.toString().padLeft(2, '0')}m';
    }
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  Future<Position?> _ensureCurrentPosition() async {
    if (_currentPosition != null) return _currentPosition;

    try {
      final position = await Geolocator.getCurrentPosition();
      if (!mounted) return position;

      setState(() {
        _currentPosition = position;
        _speedKmh = position.speed * 3.6;
        _appendTrackPoint(position);
      });
      _calculateEta(position);
      return position;
    } catch (_) {
      return null;
    }
  }

  Future<void> _uploadCurrentLocation() async {
    if (!_tripStarted) return;

    final position = _currentPosition ?? await _ensureCurrentPosition();
    if (position == null) return;

    final speedKmh = position.speed > 0 ? position.speed * 3.6 : _speedKmh;

    try {
      await _tripService.sendLocation(
        widget.trip.id,
        position.latitude,
        position.longitude,
        speedKmh,
      );
    } catch (_) {
      // Keep UI responsive if location sync fails intermittently.
    }
  }

  void _appendTrackPoint(Position pos) {
    final point = LatLng(pos.latitude, pos.longitude);
    if (_trackPoints.isEmpty) {
      _trackPoints.add(point);
      return;
    }

    final last = _trackPoints.last;
    final movedMeters = Geolocator.distanceBetween(
      last.latitude,
      last.longitude,
      point.latitude,
      point.longitude,
    );

    if (movedMeters >= 3) {
      _trackPoints.add(point);
    }
  }

  void _calculateEta(Position pos) {
    final destLat = widget.trip.effectiveDestLat;
    final destLng = widget.trip.effectiveDestLng;
    if (destLat == null || destLng == null) return;

    final distM = Geolocator.distanceBetween(
      pos.latitude,
      pos.longitude,
      destLat,
      destLng,
    );

    _distanceKm = distM / 1000;

    if (_tripStarted && _initialDistanceKm == null && _distanceKm > 0) {
      _initialDistanceKm = _distanceKm;
    }

    if (_speedKmh > 2) {
      final totalMin = (_distanceKm / _speedKmh * 60).round();
      final h = totalMin ~/ 60;
      final m = totalMin % 60;
      setState(() {
        _eta = h > 0 ? '${h}h ${m}m' : '${m}m';
      });
    }
  }

  Future<void> _startTrip() async {
    setState(() => _starting = true);

    try {
      final position = await _ensureCurrentPosition();
      await _tripService.startTrip(
        widget.trip.id,
        lat: position?.latitude,
        lng: position?.longitude,
        speed: _speedKmh > 0 ? _speedKmh : null,
      );

      if (!mounted) return;
      setState(() {
        _tripStarted = true;
        _starting = false;
        _tripStartedAt = DateTime.now();
        _initialDistanceKm = _distanceKm > 0 ? _distanceKm : null;
      });

      _startElapsedTimer();
      _startUploadTimer();
      await _uploadCurrentLocation();
    } catch (e) {
      if (!mounted) return;
      setState(() => _starting = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    }
  }

  Future<void> _endTrip() async {
    setState(() => _ending = true);
    _uploadTimer?.cancel();

    try {
      final position = await _ensureCurrentPosition();
      await _tripService.endTrip(
        widget.trip.id,
        lat: position?.latitude,
        lng: position?.longitude,
        speed: _speedKmh > 0 ? _speedKmh : null,
      );

      _elapsedTimer?.cancel();

      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() => _ending = false);
      _startUploadTimer();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
      );
    }
  }

  void _recenterOnTruck() {
    final target = _currentPosition != null
        ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
        : const LatLng(36.8065, 10.1815);

    setState(() {
      _followingVehicle = true;
    });

    _moveCameraTo(
      target,
      zoom: _mapZoom,
      bearing: _normalizedHeading(_currentPosition?.heading),
    );
  }

  void _changeZoom(double delta) {
    final nextZoom = (_mapZoom + delta).clamp(5.0, 19.0).toDouble();
    final target = _currentPosition != null
        ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
        : const LatLng(36.8065, 10.1815);

    setState(() {
      _mapZoom = nextZoom;
      _followingVehicle = true;
    });

    _moveCameraTo(
      target,
      zoom: nextZoom,
      bearing: _normalizedHeading(_currentPosition?.heading),
    );
  }

  String _navigationHint() {
    if (!_tripStarted) {
      return 'Tap Start to begin GPS navigation';
    }
    if (_distanceKm <= 0) {
      return 'Getting live route updates...';
    }
    if (_distanceKm < 0.3) {
      return 'Approaching destination';
    }
    if (_distanceKm < 1) {
      return 'Continue for ${(_distanceKm * 1000).round()} m';
    }
    return 'Continue for ${_distanceKm.toStringAsFixed(1)} km';
  }

  double _routeProgress() {
    if (!_tripStarted ||
        _initialDistanceKm == null ||
        _initialDistanceKm! <= 0) {
      return 0;
    }

    final completed =
        (_initialDistanceKm! - _distanceKm).clamp(0.0, _initialDistanceKm!);
    return completed.toDouble() / _initialDistanceKm!;
  }

  Set<Polyline> _buildPolylines(LatLng current, LatLng? destination) {
    final lines = <Polyline>{};

    if (_trackPoints.length > 1) {
      lines.add(
        Polyline(
          polylineId: const PolylineId('track'),
          points: List<LatLng>.from(_trackPoints),
          color: const Color(0xFF1A73E8).withOpacity(0.72),
          width: 6,
          startCap: Cap.roundCap,
          endCap: Cap.roundCap,
        ),
      );
    }

    if (destination != null) {
      lines.add(
        Polyline(
          polylineId: const PolylineId('guide'),
          points: [current, destination],
          color: const Color(0xFF34A853).withOpacity(0.88),
          width: 5,
          patterns: [PatternItem.dash(24), PatternItem.gap(12)],
          startCap: Cap.roundCap,
          endCap: Cap.roundCap,
        ),
      );
    }

    return lines;
  }

  Set<Marker> _buildMarkers(LatLng current, LatLng? destination) {
    final markers = <Marker>{
      Marker(
        markerId: const MarkerId('truck'),
        position: current,
        rotation: _normalizedHeading(_currentPosition?.heading),
        flat: true,
        anchor: const Offset(0.5, 0.5),
        zIndexInt: 2,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
      ),
    };

    if (destination != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('destination'),
          position: destination,
          zIndexInt: 1,
          icon:
              BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        ),
      );
    }

    return markers;
  }

  @override
  Widget build(BuildContext context) {
    final currentLatLng = _currentPosition != null
        ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
        : const LatLng(36.8065, 10.1815);

    final destLat = widget.trip.effectiveDestLat;
    final destLng = widget.trip.effectiveDestLng;
    final destLatLng =
        destLat != null && destLng != null ? LatLng(destLat, destLng) : null;

    return Scaffold(
      body: Stack(
        children: [
          GoogleMap(
            initialCameraPosition: CameraPosition(
              target: currentLatLng,
              zoom: _mapZoom,
            ),
            mapType: MapType.normal,
            trafficEnabled: true,
            buildingsEnabled: true,
            myLocationEnabled: false,
            myLocationButtonEnabled: false,
            zoomControlsEnabled: false,
            mapToolbarEnabled: false,
            compassEnabled: false,
            polylines: _buildPolylines(currentLatLng, destLatLng),
            markers: _buildMarkers(currentLatLng, destLatLng),
            onMapCreated: (controller) {
              _mapController = controller;
              if (_currentPosition != null) {
                _moveCameraTo(
                  currentLatLng,
                  zoom: _mapZoom,
                  bearing: _normalizedHeading(_currentPosition?.heading),
                  animated: false,
                );
              }
            },
            onCameraMoveStarted: () {
              if (!_programmaticCameraMove && _followingVehicle && mounted) {
                setState(() => _followingVehicle = false);
              }
            },
            onCameraMove: (position) {
              _mapZoom = position.zoom;
            },
          ),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.black.withOpacity(0.22),
                  Colors.transparent,
                  Colors.black.withOpacity(0.18),
                ],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(12, 10, 12, 0),
              child: Row(
                children: [
                  Material(
                    color: AppTheme.surface,
                    shape: const CircleBorder(),
                    elevation: 3,
                    child: InkWell(
                      onTap: () => Navigator.pop(context),
                      customBorder: const CircleBorder(),
                      child: const SizedBox(
                        width: 42,
                        height: 42,
                        child: Icon(
                          Icons.arrow_back_rounded,
                          color: AppTheme.textPrimary,
                          size: 22,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.fromLTRB(14, 10, 14, 10),
                      decoration: BoxDecoration(
                        gradient: AppTheme.cardGradient,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppTheme.border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.24),
                            blurRadius: 16,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.place_rounded,
                            color: AppTheme.danger,
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.trip.destinationLabel,
                                  style: const TextStyle(
                                    color: AppTheme.textPrimary,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w700,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  _navigationHint(),
                                  style: const TextStyle(
                                    color: AppTheme.textMuted,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          if (_tripStarted)
                            Container(
                              width: 9,
                              height: 9,
                              decoration: const BoxDecoration(
                                color: AppTheme.accent,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            right: 12,
            top: 110,
            child: Column(
              children: [
                Container(
                  width: 62,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    gradient: AppTheme.cardGradient,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: AppTheme.border),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.24),
                        blurRadius: 14,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        _speedKmh.toStringAsFixed(0),
                        style: const TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const Text(
                        'km/h',
                        style: TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),
                _controlButton(
                  icon: Icons.my_location_rounded,
                  onTap: _recenterOnTruck,
                  active: _followingVehicle,
                ),
                const SizedBox(height: 8),
                _controlButton(
                  icon: Icons.add_rounded,
                  onTap: () => _changeZoom(1),
                ),
                const SizedBox(height: 8),
                _controlButton(
                  icon: Icons.remove_rounded,
                  onTap: () => _changeZoom(-1),
                ),
              ],
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: SlideTransition(
              position: _panelSlide,
              child: _buildNavigationPanel(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _controlButton({
    required IconData icon,
    required VoidCallback onTap,
    bool active = false,
  }) {
    return Material(
      color: active ? AppTheme.primary.withOpacity(0.18) : AppTheme.surface,
      borderRadius: BorderRadius.circular(14),
      elevation: 3,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: SizedBox(
          width: 50,
          height: 50,
          child: Icon(
            icon,
            color: active ? AppTheme.primary : AppTheme.textSecondary,
            size: 22,
          ),
        ),
      ),
    );
  }

  Widget _buildNavigationPanel() {
    final progress = _routeProgress();
    final isBusy = _starting || _ending;

    return Container(
      decoration: BoxDecoration(
        gradient: AppTheme.cardGradient,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(26)),
        border:
            Border(top: BorderSide(color: AppTheme.border.withOpacity(0.85))),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.28),
            blurRadius: 22,
            offset: const Offset(0, -8),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 14, 18, 14),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 42,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppTheme.borderLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    Icons.turn_slight_right_rounded,
                    color: AppTheme.primary,
                    size: 24,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _navigationHint(),
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                  Text(
                    '${_distanceKm.toStringAsFixed(1)} km',
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: _tripStarted ? progress : 0,
                  minHeight: 6,
                  backgroundColor: AppTheme.surfaceLight,
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(AppTheme.accent),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _infoTile(
                      icon: Icons.schedule_rounded,
                      label: _tripStarted ? 'Elapsed' : 'ETA',
                      value: _tripStarted ? _formatDuration(_elapsed) : _eta,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _infoTile(
                      icon: Icons.speed_rounded,
                      label: 'Speed',
                      value: '${_speedKmh.toStringAsFixed(0)} km/h',
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _infoTile(
                      icon: Icons.flag_rounded,
                      label: 'Destination',
                      value: widget.trip.destinationLabel,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: isBusy
                      ? null
                      : _tripStarted
                          ? _endTrip
                          : _startTrip,
                  style: ElevatedButton.styleFrom(
                    backgroundColor:
                        _tripStarted ? AppTheme.danger : AppTheme.primary,
                    foregroundColor:
                        _tripStarted ? Colors.white : const Color(0xFF082F49),
                    disabledBackgroundColor: AppTheme.borderLight,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  icon: isBusy
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : Icon(
                          _tripStarted
                              ? Icons.stop_rounded
                              : Icons.play_arrow_rounded,
                          size: 22,
                        ),
                  label: Text(
                    isBusy
                        ? 'Syncing...'
                        : _tripStarted
                            ? 'End Trip'
                            : 'Start Trip',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _infoTile({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppTheme.textMuted, size: 16),
          const SizedBox(height: 6),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: const TextStyle(
              color: AppTheme.textMuted,
              fontSize: 10,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
