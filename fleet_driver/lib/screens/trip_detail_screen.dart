import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../models/trip.dart';
import '../services/trip_service.dart';
import '../theme.dart';

class TripDetailScreen extends StatefulWidget {
  final Tournee tournee;

  const TripDetailScreen({super.key, required this.tournee});

  @override
  State<TripDetailScreen> createState() => _TripDetailScreenState();
}

class _TripDetailScreenState extends State<TripDetailScreen> {
  final _tripService = TripService();
  late Tournee _tournee;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _tournee = widget.tournee;
  }

  String _formatDate(String? value) {
    if (value == null || value.isEmpty) return '--';
    final parsed = DateTime.tryParse(value);
    if (parsed == null) return value;
    return DateFormat('dd MMM yyyy').format(parsed);
  }

  String _formatTime(String? value) {
    if (value == null || value.isEmpty) return '--:--';
    if (value.contains(':')) {
      final parts = value.split(':');
      if (parts.length >= 2) return '${parts[0]}:${parts[1]}';
    }
    return value;
  }

  String _formatKm(dynamic value) {
    if (value == null) return '--';
    if (value is double) return value.toStringAsFixed(1);
    if (value is String && value.isNotEmpty) {
      final parsed = double.tryParse(value);
      if (parsed != null) return parsed.toStringAsFixed(1);
      return value;
    }
    return '--';
  }

  Color _statusColor() {
    final state = (_tournee.otsetat ?? '').toLowerCase();
    if (state.contains('livr')) return AppTheme.accent;
    if (state.contains('part')) return AppTheme.warning;
    if (state.contains('echec') || state.contains('echou')) {
      return AppTheme.danger;
    }
    return AppTheme.primary;
  }

  String _statusText() {
    final value = _tournee.otsetat;
    if (value == null || value.isEmpty) {
      return 'Completed';
    }
    return value[0].toUpperCase() + value.substring(1);
  }

  // ── EDIT helpers ──────────────────────────────────────────────

  Future<void> _editField({
    required String title,
    required String apiField,
    required String currentValue,
    required String type, // 'text', 'number', 'time'
    required void Function(String newValue) onUpdated,
  }) async {
    String value = currentValue == '--' || currentValue == '--:--'
        ? ''
        : currentValue;

    if (type == 'time') {
      final initial = _parseTimeOfDay(value);
      final picked = await showTimePicker(
        context: context,
        initialTime: initial,
        builder: (ctx, child) {
          return Theme(
            data: ThemeData.dark().copyWith(
              colorScheme: const ColorScheme.dark(
                primary: AppTheme.primary,
                surface: AppTheme.surface,
              ),
            ),
            child: child!,
          );
        },
      );
      if (picked == null || !mounted) return;
      value =
          '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
    } else {
      final controller = TextEditingController(text: value);
      final result = await showDialog<String>(
        context: context,
        builder: (ctx) {
          return AlertDialog(
            backgroundColor: AppTheme.surface,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16)),
            title: Text(
              title,
              style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w700),
            ),
            content: TextField(
              controller: controller,
              autofocus: true,
              keyboardType: type == 'number'
                  ? const TextInputType.numberWithOptions(decimal: true)
                  : TextInputType.text,
              style: const TextStyle(
                  color: AppTheme.textPrimary, fontSize: 14),
              cursorColor: AppTheme.primary,
              decoration: InputDecoration(
                hintText: 'Enter $title',
                hintStyle:
                    const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: const BorderSide(color: AppTheme.primary),
                ),
                filled: true,
                fillColor: AppTheme.bg,
                contentPadding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 12),
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Cancel',
                    style: TextStyle(color: AppTheme.textMuted)),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                ),
                onPressed: () => Navigator.pop(ctx, controller.text),
                child: const Text('Save'),
              ),
            ],
          );
        },
      );
      if (result == null || !mounted) return;
      value = result;
    }

    // Save to backend
    setState(() => _saving = true);
    try {
      await _tripService.updateTourneeDetails(
        _tournee.id,
        {apiField: value.isEmpty ? null : value},
      );
      if (!mounted) return;
      onUpdated(value);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✅ $title updated'),
          backgroundColor: AppTheme.accent,
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 2),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Failed: ${e.toString().replaceAll("Exception: ", "")}'),
          backgroundColor: AppTheme.danger,
          behavior: SnackBarBehavior.floating,
        ),
      );
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  TimeOfDay _parseTimeOfDay(String value) {
    if (value.contains(':')) {
      final parts = value.split(':');
      final h = int.tryParse(parts[0]) ?? 0;
      final m = int.tryParse(parts[1]) ?? 0;
      return TimeOfDay(hour: h, minute: m);
    }
    return TimeOfDay.now();
  }

  // We need to rebuild the Tournee with updated field. Since Tournee is immutable,
  // we'll track overrides in local state.
  late final Map<String, String> _overrides = {};

  String _getOverride(String key, String? original) {
    return _overrides[key] ?? original ?? '';
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _statusColor();
    final tripCode =
        _tournee.toucode ?? 'TF-${_tournee.id.toString().padLeft(4, '0')}';

    return Scaffold(
      backgroundColor: AppTheme.bg,
      body: Stack(
        children: [
          Container(
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
                  // ── App bar ──────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                    child: Row(
                      children: [
                        _iconCircle(
                          icon: Icons.arrow_back_rounded,
                          onTap: () => Navigator.pop(context),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Text(
                            'Trip Details',
                            style: TextStyle(
                              color: AppTheme.textPrimary,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.14),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                                color: AppTheme.primary.withOpacity(0.35)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.edit_rounded,
                                  color: AppTheme.primary, size: 12),
                              SizedBox(width: 4),
                              Text(
                                'EDITABLE',
                                style: TextStyle(
                                  color: AppTheme.primary,
                                  fontSize: 9,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // ── Scrollable content ───────────────────────────
                  Expanded(
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
                      children: [
                        // ── Header card ────────
                        _buildHeaderCard(tripCode, statusColor),
                        const SizedBox(height: 12),

                        // ── Route card ──────
                        _buildRouteCard(),
                        const SizedBox(height: 12),

                        // ── Marchandise + Total Palette ─────────────
                        _buildMarchandiseRow(),
                        const SizedBox(height: 12),

                        // ── Departure info ──────────────────────────
                        _buildSectionHeader(
                            'DÉPART', Icons.flight_takeoff_rounded),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _editableMetricTile(
                              icon: Icons.access_time_rounded,
                              label: 'H. Départ',
                              value: _formatTime(
                                  _getOverride('voyhrd', _tournee.voyhrd)),
                              tint: AppTheme.info,
                              onTap: () => _editField(
                                title: 'H. Départ',
                                apiField: 'voyhrd',
                                currentValue: _formatTime(
                                    _getOverride('voyhrd', _tournee.voyhrd)),
                                type: 'time',
                                onUpdated: (v) =>
                                    setState(() => _overrides['voyhrd'] = v),
                              ),
                            ),
                            const SizedBox(width: 8),
                            _editableMetricTile(
                              icon: Icons.speed_rounded,
                              label: 'Km. Départ',
                              value: _formatKm(
                                  _getOverride('plakm1', _tournee.plakm1?.toString())),
                              tint: AppTheme.info,
                              onTap: () => _editField(
                                title: 'Km. Départ',
                                apiField: 'plakm1',
                                currentValue: _formatKm(
                                    _getOverride('plakm1', _tournee.plakm1?.toString())),
                                type: 'number',
                                onUpdated: (v) =>
                                    setState(() => _overrides['plakm1'] = v),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // ── Return info ─────────────────────────────
                        _buildSectionHeader(
                            'RETOUR', Icons.flight_land_rounded),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _editableMetricTile(
                              icon: Icons.access_time_rounded,
                              label: 'H. Retour',
                              value: _formatTime(
                                  _getOverride('voyhrf', _tournee.voyhrf)),
                              tint: AppTheme.purple,
                              onTap: () => _editField(
                                title: 'H. Retour',
                                apiField: 'voyhrf',
                                currentValue: _formatTime(
                                    _getOverride('voyhrf', _tournee.voyhrf)),
                                type: 'time',
                                onUpdated: (v) =>
                                    setState(() => _overrides['voyhrf'] = v),
                              ),
                            ),
                            const SizedBox(width: 8),
                            _editableMetricTile(
                              icon: Icons.speed_rounded,
                              label: 'Km. Retour',
                              value: _formatKm(
                                  _getOverride('plakm2', _tournee.plakm2?.toString())),
                              tint: AppTheme.purple,
                              onTap: () => _editField(
                                title: 'Km. Retour',
                                apiField: 'plakm2',
                                currentValue: _formatKm(
                                    _getOverride('plakm2', _tournee.plakm2?.toString())),
                                type: 'number',
                                onUpdated: (v) =>
                                    setState(() => _overrides['plakm2'] = v),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // ── Km dernier client ───────────────────────
                        _buildSectionHeader(
                            'KM DERNIER CLIENT', Icons.pin_drop_rounded),
                        const SizedBox(height: 8),
                        _buildEditableFullWidthMetric(
                          icon: Icons.map_rounded,
                          label: 'Km dernier client',
                          value: _formatKm(_getOverride(
                              'km_dernier_client',
                              _tournee.kmDernierClient ?? _tournee.otskm2)),
                          tint: AppTheme.warning,
                          onTap: () => _editField(
                            title: 'Km dernier client',
                            apiField: 'km_dernier_client',
                            currentValue: _formatKm(_getOverride(
                                'km_dernier_client',
                                _tournee.kmDernierClient ?? _tournee.otskm2)),
                            type: 'number',
                            onUpdated: (v) => setState(
                                () => _overrides['km_dernier_client'] = v),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // ── Client arrival / departure ──────────────
                        _buildSectionHeader(
                            'DÉTAILS CLIENT', Icons.store_rounded),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _editableMetricTile(
                              icon: Icons.login_rounded,
                              label: 'Arrivée.Client',
                              value: _formatTime(_getOverride(
                                  'arrivee_client',
                                  _tournee.arriveeClient ?? _tournee.otdhd)),
                              tint: AppTheme.accent,
                              onTap: () => _editField(
                                title: 'Arrivée Client',
                                apiField: 'arrivee_client',
                                currentValue: _formatTime(_getOverride(
                                    'arrivee_client',
                                    _tournee.arriveeClient ?? _tournee.otdhd)),
                                type: 'time',
                                onUpdated: (v) => setState(
                                    () => _overrides['arrivee_client'] = v),
                              ),
                            ),
                            const SizedBox(width: 8),
                            _editableMetricTile(
                              icon: Icons.logout_rounded,
                              label: 'Départ.Client',
                              value: _formatTime(_getOverride(
                                  'depart_client', _tournee.departClient)),
                              tint: AppTheme.danger,
                              onTap: () => _editField(
                                title: 'Départ Client',
                                apiField: 'depart_client',
                                currentValue: _formatTime(_getOverride(
                                    'depart_client', _tournee.departClient)),
                                type: 'time',
                                onUpdated: (v) => setState(
                                    () => _overrides['depart_client'] = v),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _buildEditableFullWidthMetric(
                          icon: Icons.straighten_rounded,
                          label: 'Km. Arv. Client',
                          value: _formatKm(_getOverride(
                              'km_arv_client', _tournee.kmArvClient)),
                          tint: AppTheme.accent,
                          onTap: () => _editField(
                            title: 'Km Arv Client',
                            apiField: 'km_arv_client',
                            currentValue: _formatKm(_getOverride(
                                'km_arv_client', _tournee.kmArvClient)),
                            type: 'number',
                            onUpdated: (v) => setState(
                                () => _overrides['km_arv_client'] = v),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // ── Distance + Date summary ─────────────────
                        Row(
                          children: [
                            _metricTile(
                              icon: Icons.route_rounded,
                              label: 'Distance',
                              value: _tournee.distanceKm != null
                                  ? '${_tournee.distanceKm!.toStringAsFixed(1)} km'
                                  : '--',
                              tint: AppTheme.primary,
                            ),
                            const SizedBox(width: 8),
                            _metricTile(
                              icon: Icons.calendar_month_rounded,
                              label: 'Date fin',
                              value: _formatDate(_tournee.voydtf),
                              tint: AppTheme.primary,
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),

                        // ── Trip Timeline ────────────────────────────
                        _buildTimelineCard(),
                        const SizedBox(height: 12),

                        // ── Driver + Truck card ──────────────────────
                        _buildDriverCard(),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Saving overlay ──
          if (_saving)
            Container(
              color: Colors.black.withOpacity(0.3),
              child: const Center(
                child: CircularProgressIndicator(color: AppTheme.primary),
              ),
            ),
        ],
      ),
    );
  }

  // ── HEADER CARD ──────────────────────────────────────────────

  Widget _buildHeaderCard(String tripCode, Color statusColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.glowCard(AppTheme.primary, radius: 18),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              gradient: AppTheme.primaryGradient,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.local_shipping_rounded,
              color: Colors.white,
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tripCode,
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'Date ${_formatDate(_tournee.voydtd)}',
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.14),
              borderRadius: BorderRadius.circular(20),
              border:
                  Border.all(color: statusColor.withOpacity(0.45)),
            ),
            child: Text(
              _statusText(),
              style: TextStyle(
                color: statusColor,
                fontWeight: FontWeight.w700,
                fontSize: 11,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── ROUTE CARD ───────────────────────────────────────────────

  Widget _buildRouteCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.solidCard,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ROUTE',
            style: TextStyle(
              color: AppTheme.textMuted,
              letterSpacing: 1.1,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 12),
          _routePoint(
            color: AppTheme.info,
            icon: Icons.radio_button_checked_rounded,
            title: 'Origin',
            value: _tournee.originLabel,
          ),
          Container(
            margin: const EdgeInsets.only(left: 6),
            width: 2,
            height: 24,
            color: AppTheme.borderLight,
          ),
          _routePoint(
            color: AppTheme.accent,
            icon: Icons.place_rounded,
            title: 'Destination',
            value: _tournee.destinationLabel,
          ),
        ],
      ),
    );
  }

  // ── MARCHANDISE + PALETTE ROW ────────────────────────────────

  Widget _buildMarchandiseRow() {
    return Row(
      children: [
        _editableMetricTile(
          icon: Icons.inventory_rounded,
          label: 'Marchandise',
          value: _getOverride('chargement', _tournee.chargement).isEmpty
              ? '--'
              : _getOverride('chargement', _tournee.chargement),
          tint: AppTheme.warning,
          onTap: () => _editField(
            title: 'Marchandise',
            apiField: 'chargement',
            currentValue:
                _getOverride('chargement', _tournee.chargement),
            type: 'text',
            onUpdated: (v) =>
                setState(() => _overrides['chargement'] = v),
          ),
        ),
        const SizedBox(width: 8),
        _editableMetricTile(
          icon: Icons.palette_rounded,
          label: 'Total Palette',
          value: _getOverride('voypal', _tournee.voypal?.toString()).isEmpty
              ? '--'
              : _getOverride('voypal', _tournee.voypal?.toString()),
          tint: AppTheme.accent,
          onTap: () => _editField(
            title: 'Total Palette',
            apiField: 'voypal',
            currentValue:
                _getOverride('voypal', _tournee.voypal?.toString()),
            type: 'number',
            onUpdated: (v) => setState(() => _overrides['voypal'] = v),
          ),
        ),
      ],
    );
  }

  // ── SECTION HEADER ───────────────────────────────────────────

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppTheme.textMuted, size: 14),
        const SizedBox(width: 6),
        Text(
          title,
          style: const TextStyle(
            color: AppTheme.textMuted,
            letterSpacing: 1.1,
            fontSize: 10,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }

  // ── EDITABLE FULL WIDTH METRIC ──────────────────────────────

  Widget _buildEditableFullWidthMetric({
    required IconData icon,
    required String label,
    required String value,
    required Color tint,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.border),
        ),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: tint.withOpacity(0.12),
                borderRadius: BorderRadius.circular(9),
              ),
              child: Icon(icon, color: tint, size: 16),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    value,
                    style: const TextStyle(
                      color: AppTheme.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    label,
                    style: const TextStyle(
                      color: AppTheme.textMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            Icon(
              Icons.edit_rounded,
              color: AppTheme.primary.withOpacity(0.6),
              size: 16,
            ),
          ],
        ),
      ),
    );
  }

  // ── TIMELINE CARD ────────────────────────────────────────────

  Widget _buildTimelineCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.solidCard,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'TRIP TIMELINE',
            style: TextStyle(
              color: AppTheme.textMuted,
              letterSpacing: 1.1,
              fontSize: 10,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 14),
          _timelineStep(
            done: true,
            title: 'Depart from depot',
            subtitle:
                '${_tournee.originLabel} at ${_formatTime(_getOverride('voyhrd', _tournee.voyhrd))}',
          ),
          _timelineStep(
            done: true,
            title: 'On route',
            subtitle: 'Truck code ${_tournee.sitecamion ?? '--'}',
          ),
          _timelineStep(
            done: (_getOverride('arrivee_client',
                        _tournee.arriveeClient ?? _tournee.otdhd))
                    .isNotEmpty,
            title: 'Arrival at client',
            subtitle:
                '${_tournee.destinationLabel} at ${_formatTime(_getOverride('arrivee_client', _tournee.arriveeClient ?? _tournee.otdhd))}',
          ),
          _timelineStep(
            done:
                _getOverride('depart_client', _tournee.departClient)
                    .isNotEmpty,
            title: 'Departure from client',
            subtitle:
                'Left at ${_formatTime(_getOverride('depart_client', _tournee.departClient))}',
          ),
          _timelineStep(
            done: true,
            title: 'Delivery status',
            subtitle: _statusText(),
            last: true,
          ),
        ],
      ),
    );
  }

  // ── DRIVER CARD ──────────────────────────────────────────────

  Widget _buildDriverCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: AppTheme.solidCard,
      child: Row(
        children: [
          const Icon(
            Icons.person_rounded,
            color: AppTheme.primary,
            size: 20,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _tournee.chauffeurFullName,
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  'Truck ${_tournee.sitecamion ?? '--'}',
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── REUSABLE WIDGETS ─────────────────────────────────────────

  Widget _editableMetricTile({
    required IconData icon,
    required String label,
    required String value,
    Color tint = AppTheme.primary,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 26,
                    height: 26,
                    decoration: BoxDecoration(
                      color: tint.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(7),
                    ),
                    child: Icon(icon, color: tint, size: 14),
                  ),
                  const Spacer(),
                  Icon(
                    Icons.edit_rounded,
                    color: AppTheme.primary.withOpacity(0.5),
                    size: 13,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                label,
                style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _metricTile({
    required IconData icon,
    required String label,
    required String value,
    Color tint = AppTheme.primary,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 26,
              height: 26,
              decoration: BoxDecoration(
                color: tint.withOpacity(0.12),
                borderRadius: BorderRadius.circular(7),
              ),
              child: Icon(icon, color: tint, size: 14),
            ),
            const SizedBox(height: 8),
            Text(
              value,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppTheme.textPrimary,
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                color: AppTheme.textMuted,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _timelineStep({
    required bool done,
    required String title,
    required String subtitle,
    bool last = false,
  }) {
    final color = done ? AppTheme.accent : AppTheme.textMuted;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: done ? color : AppTheme.surfaceLight,
                border: Border.all(
                  color: done ? color : AppTheme.borderLight,
                ),
              ),
            ),
            if (!last)
              Container(
                width: 2,
                height: 34,
                margin: const EdgeInsets.symmetric(vertical: 4),
                color: done ? color.withOpacity(0.55) : AppTheme.border,
              ),
          ],
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 1),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color:
                        done ? AppTheme.textPrimary : AppTheme.textSecondary,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    color: AppTheme.textMuted,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _iconCircle({
    required IconData icon,
    required VoidCallback onTap,
    bool enabled = true,
  }) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(
          color: AppTheme.surface,
          shape: BoxShape.circle,
          border: Border.all(color: AppTheme.border),
        ),
        child: Icon(
          icon,
          size: 20,
          color: enabled ? AppTheme.textSecondary : AppTheme.textMuted,
        ),
      ),
    );
  }

  Widget _routePoint({
    required Color color,
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 14),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 11,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: AppTheme.textPrimary,
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
