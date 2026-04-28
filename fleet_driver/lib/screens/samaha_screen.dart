import 'package:flutter/material.dart';
import '../models/trip.dart';
import '../services/admin_service.dart';

class SamahaScreen extends StatefulWidget {
  const SamahaScreen({Key? key}) : super(key: key);

  @override
  State<SamahaScreen> createState() => _SamahaScreenState();
}

class _SamahaScreenState extends State<SamahaScreen> {
  int _selectedTabIndex = 0; // 0: View Pending, 1: Create New
  List<Tournee> _pendingTrips = [];
  bool _isLoading = false;
  String? _errorMessage;

  // Form fields for creating new trip
  late TextEditingController _otdcodeController;
  late TextEditingController _sitcodeController;
  late TextEditingController _salIdController;
  late TextEditingController _voydtdController;
  late TextEditingController _voyhrdController;
  late TextEditingController _chargementController;

  @override
  void initState() {
    super.initState();
    _otdcodeController = TextEditingController();
    _sitcodeController = TextEditingController();
    _salIdController = TextEditingController();
    _voydtdController = TextEditingController();
    _voyhrdController = TextEditingController();
    _chargementController = TextEditingController();

    _loadPendingTrips();
  }

  @override
  void dispose() {
    _otdcodeController.dispose();
    _sitcodeController.dispose();
    _salIdController.dispose();
    _voydtdController.dispose();
    _voyhrdController.dispose();
    _chargementController.dispose();
    super.dispose();
  }

  Future<void> _loadPendingTrips() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final trips = await AdminService.getPendingTrips();
      setState(() {
        _pendingTrips = trips;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _handleCreateTrip() async {
    if (_otdcodeController.text.isEmpty ||
        _sitcodeController.text.isEmpty ||
        _salIdController.text.isEmpty ||
        _voydtdController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please fill in all required fields'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      await AdminService.createTrip(
        otdcode: _otdcodeController.text.trim(),
        sitcode: _sitcodeController.text.trim(),
        salId: _salIdController.text.trim(),
        voydtd: _voydtdController.text.trim(),
        voyhrd: _voyhrdController.text.isNotEmpty
            ? _voyhrdController.text.trim()
            : null,
        chargement: _chargementController.text.isNotEmpty
            ? _chargementController.text.trim()
            : null,
      );

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Trip created successfully!'),
          backgroundColor: Colors.green,
        ),
      );

      // Clear form
      _otdcodeController.clear();
      _sitcodeController.clear();
      _salIdController.clear();
      _voydtdController.clear();
      _voyhrdController.clear();
      _chargementController.clear();

      // Reload pending trips
      _loadPendingTrips();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to create trip: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleMarkAsDone(Tournee trip) async {
    try {
      await AdminService.updateTripState(
        tripId: trip.id,
        states: 'done',
      );

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Trip ${trip.toucode} marked as done'),
          backgroundColor: Colors.green,
        ),
      );

      _loadPendingTrips();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Samaha | Permissions & Trips'),
        centerTitle: true,
        backgroundColor: Colors.blueAccent,
      ),
      body: _isLoading && _pendingTrips.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                // Tabs
                Container(
                  color: Colors.grey.shade200,
                  child: Row(
                    children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () =>
                              setState(() => _selectedTabIndex = 0),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              border: Border(
                                bottom: BorderSide(
                                  color: _selectedTabIndex == 0
                                      ? Colors.blueAccent
                                      : Colors.transparent,
                                  width: 3,
                                ),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                'Pending Trips (${_pendingTrips.length})',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _selectedTabIndex == 0
                                      ? Colors.blueAccent
                                      : Colors.grey,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () =>
                              setState(() => _selectedTabIndex = 1),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            decoration: BoxDecoration(
                              border: Border(
                                bottom: BorderSide(
                                  color: _selectedTabIndex == 1
                                      ? Colors.blueAccent
                                      : Colors.transparent,
                                  width: 3,
                                ),
                              ),
                            ),
                            child: Center(
                              child: Text(
                                'Create New Trip',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _selectedTabIndex == 1
                                      ? Colors.blueAccent
                                      : Colors.grey,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                // Content
                Expanded(
                  child: _selectedTabIndex == 0
                      ? _buildPendingTripsView()
                      : _buildCreateTripView(),
                ),
              ],
            ),
    );
  }

  Widget _buildPendingTripsView() {
    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Error: $_errorMessage'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadPendingTrips,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_pendingTrips.isEmpty) {
      return const Center(
        child: Text(
          'No pending trips',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadPendingTrips,
      child: ListView.builder(
        padding: const EdgeInsets.all(8),
        itemCount: _pendingTrips.length,
        itemBuilder: (context, index) {
          final trip = _pendingTrips[index];
          return Card(
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              trip.toucode ?? 'N/A',
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${trip.originLabel} → ${trip.destinationLabel}',
                              style: const TextStyle(fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.orange.shade100,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'PENDING',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.orange,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Chauffeur: ${trip.chauffeurFullName}',
                    style: const TextStyle(fontSize: 13),
                  ),
                  Text(
                    'Date: ${trip.voydtd ?? 'N/A'} at ${trip.voyhrd ?? 'N/A'}',
                    style: const TextStyle(
                      fontSize: 13,
                      color: Colors.grey,
                    ),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _handleMarkAsDone(trip),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                      ),
                      child: const Text(
                        'Mark as Done',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCreateTripView() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Create New Trip',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          // Destination Code
          _buildTextField(
            controller: _otdcodeController,
            label: 'Destination Code (otdcode) *',
            hint: 'e.g., POI-001',
          ),
          const SizedBox(height: 12),
          // Origin Code
          _buildTextField(
            controller: _sitcodeController,
            label: 'Origin Depot Code (sitcode) *',
            hint: 'e.g., DEPOT-01',
          ),
          const SizedBox(height: 12),
          // Chauffeur ID
          _buildTextField(
            controller: _salIdController,
            label: 'Chauffeur ID (sal_id) *',
            hint: 'e.g., 1 or DRV-00412',
            keyboardType: TextInputType.text,
          ),
          const SizedBox(height: 12),
          // Date Départ
          _buildTextField(
            controller: _voydtdController,
            label: 'Date Départ (YYYY-MM-DD) *',
            hint: 'e.g., 2026-04-16',
            onTap: _selectDate,
          ),
          const SizedBox(height: 12),
          // Heure Départ
          _buildTextField(
            controller: _voyhrdController,
            label: 'Heure Départ (HH:MM)',
            hint: 'e.g., 08:30',
          ),
          const SizedBox(height: 12),
          // Chargement
          _buildTextField(
            controller: _chargementController,
            label: 'Chargement (Description)',
            hint: 'e.g., 10 palettes alimentaires',
            maxLines: 2,
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _isLoading ? null : _handleCreateTrip,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blueAccent,
              ),
              child: _isLoading
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text(
                      'Create Trip',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    String? hint,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    VoidCallback? onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          maxLines: maxLines,
          minLines: maxLines == 1 ? 1 : maxLines,
          onTap: onTap,
          decoration: InputDecoration(
            hintText: hint,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 10,
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _selectDate() async {
    final pickedDate = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime(2000),
      lastDate: DateTime(2100),
    );
    if (pickedDate != null) {
      _voydtdController.text =
          '${pickedDate.year}-${pickedDate.month.toString().padLeft(2, '0')}-${pickedDate.day.toString().padLeft(2, '0')}';
    }
  }
}
