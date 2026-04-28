import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/driver.dart';
import '../models/trip.dart';
import '../services/auth_service.dart';
import '../services/trip_service.dart';
import 'history_screen.dart';
import 'login_screen.dart';
import 'samaha_screen.dart';
import 'trip_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _tripService = TripService();
  final _authService = AuthService();

  Driver? _driver;
  Trip? _trip;
  List<Tournee> _tournees = <Tournee>[];

  bool _loading = true;
  String? _error;
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    if (!mounted) return;

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final driver = await _tripService.getMe();
      final trip = await _tripService.getActiveTrip();
      final tournees = await _tripService.getTourneeHistory();

      if (!mounted) return;
      setState(() {
        _driver = driver;
        _trip = trip;
        _tournees = tournees;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _logout() async {
    await _authService.logout();
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  String _greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }

  String _tripCode(Trip trip) {
    final padded = trip.id.toString().padLeft(4, '0');
    return 'Trip #TF-$padded';
  }

  String _etaText(Trip? trip) {
    final mins = trip?.durationMinutes;
    if (mins == null || mins <= 0) return '--';
    final h = mins ~/ 60;
    final m = mins % 60;
    if (h > 0) return '${h}h ${m}m';
    return '${m}m';
  }

  int _mockFuelLevel() {
    final value = 82 - (_tournees.length % 9) * 3;
    return value.clamp(45, 90);
  }

  String _driveDurationText() {
    final minutes = _trip?.durationMinutes ?? math.max(20, _tournees.length * 8);
    final h = minutes ~/ 60;
    final m = minutes % 60;
    if (h > 0) return '${h}h ${m}m';
    return '${m}m';
  }

  Future<void> _openTrip() async {
    final trip = _trip;
    if (trip == null) return;

    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => TripScreen(trip: trip)),
    );

    if (changed == true) {
      _load();
    }
  }

  Future<void> _onTabTapped(int index) async {
    if (index == 0) {
      setState(() => _selectedTab = 0);
      return;
    }

    if (index == 1) {
      setState(() => _selectedTab = 1);
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const HistoryScreen()),
      );
      if (!mounted) return;
      setState(() => _selectedTab = 0);
      return;
    }

    setState(() => _selectedTab = 2);

    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      backgroundColor: const Color(0xFF121826),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _buildProfileSheet(),
    );

    if (!mounted) return;
    setState(() => _selectedTab = 0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0B1220),
      body: SafeArea(
        child: _loading
            ? _buildLoading()
            : RefreshIndicator(
                onRefresh: _load,
                color: const Color(0xFF7DD3FC),
                backgroundColor: const Color(0xFF0F172A),
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 20),
                  children: [
                    _buildTopHeader(),
                    const SizedBox(height: 12),
                    _buildProfileCard(),
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      _buildErrorBanner(_error!),
                    ],
                    const SizedBox(height: 14),
                    _buildAssignmentCard(),
                    const SizedBox(height: 16),
                    _buildMetricsSection(),
                    const SizedBox(height: 14),
                    _buildTrafficAlertCard(),
                  ],
                ),
              ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: CircularProgressIndicator(color: Color(0xFF7DD3FC)),
    );
  }

  Widget _buildTopHeader() {
    return Row(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            color: const Color(0xFF1E293B),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: const Color(0xFF334155)),
          ),
          child: const Icon(
            Icons.flash_on_rounded,
            color: Color(0xFFBDE9FF),
            size: 17,
          ),
        ),
        const Spacer(),
        GestureDetector(
          onTap: _logout,
          child: Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF1E293B),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: const Icon(
              Icons.settings_power_rounded,
              color: Color(0xFFE2E8F0),
              size: 16,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProfileCard() {
    final name = _driver?.name.isNotEmpty == true ? _driver!.name : 'Driver';
    final idText = _driver?.employeeId.isNotEmpty == true
        ? _driver!.employeeId
        : 'N/A';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF1F2937)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: const Color(0xFFF1F5F9),
            child: Text(
              name
                  .split(' ')
                  .where((p) => p.isNotEmpty)
                  .map((p) => p[0])
                  .take(2)
                  .join()
                  .toUpperCase(),
              style: const TextStyle(
                color: Color(0xFF111827),
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_greeting()}, ${name.split(' ').first}!',
                  style: const TextStyle(
                    color: Color(0xFFF8FAFC),
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  idText,
                  style: const TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFF0F172A),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF334155)),
            ),
            child: const Text(
              'On Duty',
              style: TextStyle(
                color: Color(0xFFBAE6FD),
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorBanner(String message) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFF3F1B1F),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFF7F1D1D)),
      ),
      child: Row(
        children: [
          const Icon(Icons.wifi_off_rounded, color: Color(0xFFFCA5A5), size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(color: Color(0xFFFECACA), fontSize: 11),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssignmentCard() {
    final trip = _trip;
    if (trip == null) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: _cardDecoration(),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "TODAY'S ASSIGNMENT",
              style: TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 10,
                letterSpacing: 1.2,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 10),
            const Text(
              'No active trip right now',
              style: TextStyle(
                color: Color(0xFFE2E8F0),
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () {
                  _onTabTapped(1);
                },
                icon: const Icon(Icons.history_rounded, size: 18),
                label: const Text('Open History'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFFBAE6FD),
                  side: const BorderSide(color: Color(0xFF334155)),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text(
                "TODAY'S ASSIGNMENT",
                style: TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 10,
                  letterSpacing: 1.2,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF0E2A3B),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  trip.status == 'active' ? 'Active' : 'Ready',
                  style: const TextStyle(
                    color: Color(0xFF7DD3FC),
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _tripCode(trip),
            style: const TextStyle(
              color: Color(0xFFF8FAFC),
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          _routeLine(
            icon: Icons.radio_button_checked_rounded,
            iconColor: const Color(0xFF7DD3FC),
            label: 'Origin',
            value: trip.originLabel,
          ),
          const SizedBox(height: 8),
          _routeLine(
            icon: Icons.location_on_rounded,
            iconColor: const Color(0xFFFB7185),
            label: 'Destination',
            value: trip.destinationLabel,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: _miniStat(
                  title: 'ETA',
                  value: _etaText(trip),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _miniStat(
                  title: 'Distance',
                  value: trip.distanceKm != null
                      ? '${trip.distanceKm!.toStringAsFixed(0)} km'
                      : '--',
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 42,
            child: ElevatedButton.icon(
              onPressed: _openTrip,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF7DD3FC),
                foregroundColor: const Color(0xFF082F49),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              icon: const Icon(Icons.play_arrow_rounded, size: 20),
              label: Text(
                trip.status == 'active' ? 'Resume Trip' : 'Start Trip',
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsSection() {
    final vehicle = _driver?.vehicle;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'VEHICLE METRICS',
              style: TextStyle(
                color: Color(0xFFE2E8F0),
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
            const Spacer(),
            if (vehicle != null)
              Text(
                vehicle.plate,
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 11,
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _metricCard(
                title: 'FUEL LEVEL',
                value: '${_mockFuelLevel()}%',
                subtitle: '+2% vs avg depot',
                icon: Icons.local_gas_station_rounded,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _metricCard(
                title: 'DRIVE DURATION',
                value: _driveDurationText(),
                subtitle: 'On schedule',
                icon: Icons.schedule_rounded,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTrafficAlertCard() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0A243A), Color(0xFF0C3656)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1E4D73)),
      ),
      child: Row(
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: BoxDecoration(
              color: const Color(0xFF144A70),
              borderRadius: BorderRadius.circular(9),
            ),
            child: const Icon(Icons.navigation_rounded,
                color: Color(0xFFBAE6FD), size: 16),
          ),
          const SizedBox(width: 10),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Traffic Alert',
                  style: TextStyle(
                    color: Color(0xFFE0F2FE),
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  'Heavy congestion reported on S4. Alternate route suggested.',
                  style: TextStyle(
                    color: Color(0xFFBAE6FD),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    return Container(
      margin: const EdgeInsets.fromLTRB(14, 0, 14, 14),
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF111827),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFF1F2937)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _bottomItem(
            icon: Icons.home_rounded,
            label: 'Home',
            index: 0,
          ),
          _bottomItem(
            icon: Icons.history_rounded,
            label: 'History',
            index: 1,
          ),
          _bottomItem(
            icon: Icons.person_rounded,
            label: 'Profile',
            index: 2,
          ),
        ],
      ),
    );
  }

  Widget _bottomItem({
    required IconData icon,
    required String label,
    required int index,
  }) {
    final selected = _selectedTab == index;
    return GestureDetector(
      onTap: () => _onTabTapped(index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF0E2A3B) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              color: selected ? const Color(0xFF7DD3FC) : const Color(0xFF64748B),
              size: 18,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(
                color:
                    selected ? const Color(0xFFBAE6FD) : const Color(0xFF64748B),
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _routeLine({
    required IconData icon,
    required Color iconColor,
    required String label,
    required String value,
  }) {
    return Row(
      children: [
        Icon(icon, size: 14, color: iconColor),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(
            color: Color(0xFF94A3B8),
            fontSize: 11,
            fontWeight: FontWeight.w600,
          ),
        ),
        Expanded(
          child: Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFFE2E8F0),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _miniStat({required String title, required String value}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFFE2E8F0),
              fontSize: 12,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }

  Widget _metricCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: const Color(0xFF94A3B8), size: 15),
          const SizedBox(height: 10),
          Text(
            title,
            style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 9,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              color: Color(0xFFF8FAFC),
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(
              color: Color(0xFF94A3B8),
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileSheet() {
    final driver = _driver;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(18, 14, 18, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFF334155),
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
            ),
            const SizedBox(height: 14),
            const Text(
              'Profile',
              style: TextStyle(
                color: Color(0xFFF8FAFC),
                fontSize: 18,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 10),
            Text(
              driver?.name ?? 'Unknown driver',
              style: const TextStyle(
                color: Color(0xFFE2E8F0),
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'ID: ${driver?.employeeId ?? '--'}',
              style: const TextStyle(
                color: Color(0xFF94A3B8),
                fontSize: 12,
              ),
            ),
            if (driver != null) ...[
              const SizedBox(height: 4),
              Text(
                'Vehicle: ${driver.vehicle.plate}',
                style: const TextStyle(
                  color: Color(0xFF94A3B8),
                  fontSize: 12,
                ),
              ),
            ],
            if (driver?.isSuperAdmin == true) ...[
              const SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    Navigator.pop(context);
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => const SamahaScreen(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.admin_panel_settings_rounded),
                  label: const Text('Samaha Admin'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0E7490),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _logout,
                icon: const Icon(Icons.logout_rounded),
                label: const Text('Logout'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFB91C1C),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  BoxDecoration _cardDecoration() {
    return BoxDecoration(
      color: const Color(0xFF111827),
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: const Color(0xFF1F2937)),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.25),
          blurRadius: 20,
          offset: const Offset(0, 10),
        ),
      ],
    );
  }
}
