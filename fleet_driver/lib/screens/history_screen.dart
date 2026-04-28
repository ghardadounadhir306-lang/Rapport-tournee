import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/trip.dart';
import '../services/trip_service.dart';
import '../theme.dart';
import 'trip_detail_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  final _tripService = TripService();

  List<Tournee> _tournees = <Tournee>[];
  List<Tournee> _filtered = <Tournee>[];

  bool _loading = true;
  String? _error;
  String _searchQuery = '';
  String _filterEtat = 'all';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final tournees =
          await _tripService.getTourneeHistory(includeAllDrivers: true);
      if (!mounted) return;
      setState(() {
        _tournees = tournees;
        _applyFilters();
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

  void _applyFilters() {
    _filtered = _tournees.where((trip) {
      if (_searchQuery.isNotEmpty) {
        final q = _searchQuery.toLowerCase();
        final match = trip.originLabel.toLowerCase().contains(q) ||
            trip.destinationLabel.toLowerCase().contains(q) ||
            (trip.sitcode?.toLowerCase().contains(q) ?? false) ||
            (trip.otdcode?.toLowerCase().contains(q) ?? false) ||
            (trip.toucode?.toLowerCase().contains(q) ?? false) ||
            (trip.sitecamion?.toLowerCase().contains(q) ?? false);
        if (!match) return false;
      }

      if (_filterEtat != 'all') {
        final state = _normalizeState(trip.otsetat);
        if (state != _filterEtat) return false;
      }

      return true;
    }).toList();
  }

  String _normalizeState(String? rawState) {
    if (rawState == null || rawState.trim().isEmpty) return 'done';
    final state = rawState.toLowerCase();
    if (state.contains('livr')) return 'livre';
    if (state.contains('part')) return 'partiel';
    if (state.contains('echec') || state.contains('echou')) return 'echec';
    return 'done';
  }

  String _statusText(String? rawState) {
    switch (_normalizeState(rawState)) {
      case 'livre':
        return 'Delivered';
      case 'partiel':
        return 'Partial';
      case 'echec':
        return 'Failed';
      default:
        return 'Completed';
    }
  }

  Color _statusColor(String? rawState) {
    switch (_normalizeState(rawState)) {
      case 'livre':
        return AppTheme.accent;
      case 'partiel':
        return AppTheme.warning;
      case 'echec':
        return AppTheme.danger;
      default:
        return AppTheme.primary;
    }
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '--';

    final parsed = DateTime.tryParse(dateStr);
    if (parsed == null) return dateStr;

    final now = DateUtils.dateOnly(DateTime.now());
    final date = DateUtils.dateOnly(parsed);
    final diff = now.difference(date).inDays;

    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';

    return DateFormat('dd MMM yyyy').format(parsed);
  }

  int _deliveredCount() {
    return _tournees.where((t) => _normalizeState(t.otsetat) == 'livre').length;
  }

  double _totalDistanceKm() {
    return _tournees.fold<double>(0.0, (sum, t) => sum + (t.distanceKm ?? 0));
  }

  void _openDetails(Tournee trip) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => TripDetailScreen(tournee: trip)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [AppTheme.bg, AppTheme.bgSecondary],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              _buildHeader(),
              _buildSearchBar(),
              _buildFilters(),
              Expanded(child: _buildContent()),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: AppTheme.solidCard,
        child: Column(
          children: [
            Row(
              children: [
                GestureDetector(
                  onTap: () => Navigator.pop(context),
                  child: Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(11),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: const Icon(
                      Icons.arrow_back_ios_new_rounded,
                      color: AppTheme.textSecondary,
                      size: 16,
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                const Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Trip History',
                        style: TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 2),
                      Text(
                        'Completed tours and delivery records',
                        style: TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.14),
                    borderRadius: BorderRadius.circular(16),
                    border:
                        Border.all(color: AppTheme.primary.withOpacity(0.35)),
                  ),
                  child: Text(
                    '${_filtered.length} items',
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _headerStat(
                    icon: Icons.route_rounded,
                    label: 'Distance',
                    value: '${_totalDistanceKm().toStringAsFixed(0)} km',
                    tint: AppTheme.info,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _headerStat(
                    icon: Icons.check_circle_rounded,
                    label: 'Delivered',
                    value: _deliveredCount().toString(),
                    tint: AppTheme.accent,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _headerStat({
    required IconData icon,
    required String label,
    required String value,
    required Color tint,
  }) {
    return Container(
      padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: tint.withOpacity(0.14),
              borderRadius: BorderRadius.circular(7),
            ),
            child: Icon(icon, color: tint, size: 14),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  label,
                  style: const TextStyle(
                    color: AppTheme.textMuted,
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

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: Container(
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: AppTheme.border),
        ),
        child: TextField(
          style: const TextStyle(color: AppTheme.textPrimary, fontSize: 13),
          cursorColor: AppTheme.primary,
          onChanged: (value) {
            setState(() {
              _searchQuery = value;
              _applyFilters();
            });
          },
          decoration: const InputDecoration(
            hintText: 'Search by route, code, or truck...',
            hintStyle: TextStyle(color: AppTheme.textMuted, fontSize: 12),
            border: InputBorder.none,
            prefixIcon:
                Icon(Icons.search_rounded, color: AppTheme.textMuted, size: 18),
            contentPadding: EdgeInsets.symmetric(vertical: 13),
          ),
        ),
      ),
    );
  }

  Widget _buildFilters() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _filterChip('All', 'all', AppTheme.primary),
            const SizedBox(width: 8),
            _filterChip('Delivered', 'livre', AppTheme.accent),
            const SizedBox(width: 8),
            _filterChip('Partial', 'partiel', AppTheme.warning),
            const SizedBox(width: 8),
            _filterChip('Failed', 'echec', AppTheme.danger),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String label, String value, Color color) {
    final selected = _filterEtat == value;

    return GestureDetector(
      onTap: () {
        setState(() {
          _filterEtat = value;
          _applyFilters();
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
        decoration: BoxDecoration(
          color: selected ? color.withOpacity(0.14) : AppTheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? color.withOpacity(0.45) : AppTheme.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? color : AppTheme.textMuted,
            fontSize: 11,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    if (_error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: AppTheme.solidCard,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.cloud_off_rounded,
                  color: AppTheme.danger,
                  size: 30,
                ),
                const SizedBox(height: 10),
                Text(
                  _error!,
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 12,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 14),
                ElevatedButton(
                  onPressed: _load,
                  style: AppTheme.primaryButton,
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_filtered.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Container(
            padding: const EdgeInsets.all(18),
            decoration: AppTheme.solidCard,
            child: const Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.history_toggle_off_rounded,
                  color: AppTheme.textMuted,
                  size: 32,
                ),
                SizedBox(height: 8),
                Text(
                  'No trips found for this filter.',
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _load,
      color: AppTheme.primary,
      backgroundColor: AppTheme.surface,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 2, 16, 22),
        itemCount: _filtered.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) {
          final trip = _filtered[index];
          return _buildTripCard(trip, index);
        },
      ),
    );
  }

  Widget _buildTripCard(Tournee trip, int index) {
    final statusColor = _statusColor(trip.otsetat);
    final statusText = _statusText(trip.otsetat);
    final tripCode = trip.toucode ?? 'TR-${trip.id.toString().padLeft(4, '0')}';

    final glow = index % 3 == 0
        ? AppTheme.primary
        : index % 3 == 1
            ? AppTheme.info
            : AppTheme.purple;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(17),
        onTap: () => _openDetails(trip),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: AppTheme.glowCard(glow, radius: 17),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      tripCode,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.14),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: statusColor.withOpacity(0.45)),
                    ),
                    child: Text(
                      statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              _routeLine(
                icon: Icons.radio_button_checked_rounded,
                iconColor: AppTheme.info,
                label: 'Origin',
                value: trip.originLabel,
              ),
              const SizedBox(height: 6),
              _routeLine(
                icon: Icons.place_rounded,
                iconColor: AppTheme.accent,
                label: 'Destination',
                value: trip.destinationLabel,
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  _miniStat(
                    icon: Icons.calendar_today_rounded,
                    text: _formatDate(trip.voydtd),
                  ),
                  const SizedBox(width: 10),
                  _miniStat(
                    icon: Icons.route_rounded,
                    text: trip.distanceKm != null
                        ? '${trip.distanceKm!.toStringAsFixed(0)} km'
                        : '--',
                  ),
                  const SizedBox(width: 10),
                  _miniStat(
                    icon: Icons.inventory_2_outlined,
                    text: trip.voypal != null ? '${trip.voypal} pal' : '--',
                  ),
                ],
              ),
              const SizedBox(height: 9),
              Row(
                children: [
                  const Icon(
                    Icons.arrow_forward_rounded,
                    color: AppTheme.primary,
                    size: 14,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Tap for full details',
                    style: TextStyle(
                      color: AppTheme.primary.withOpacity(0.92),
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
          ),
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
        Icon(icon, color: iconColor, size: 14),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(
            color: AppTheme.textMuted,
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
              color: AppTheme.textSecondary,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _miniStat({required IconData icon, required String text}) {
    return Expanded(
      child: Row(
        children: [
          Icon(icon, color: AppTheme.textMuted, size: 12),
          const SizedBox(width: 4),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppTheme.textSecondary,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
