<template>
  <div class="dashboard-page">
    <div class="container dashboard-wrapper">
      <!-- Header -->
      <div class="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome, {{ authStore.user?.name }}! Here's your logistics overview.</p>
        </div>
        <div class="header-actions">
          <button @click="toggleDarkMode" class="btn btn-outline">
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card" v-for="stat in dashboardStats" :key="stat.id" :class="stat.color">
          <div class="stat-content">
            <span class="stat-icon">{{ stat.icon }}</span>
            <div>
              <div class="stat-number">{{ stat.value }}</div>
              <div class="stat-title">{{ stat.label }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="dashboard-grid">
        <!-- Recent Shipments -->
        <div class="card">
          <div class="card-header">
            <h3>Recent Shipments</h3>
            <button class="btn btn-accent" style="padding: 8px 16px; font-size: 12px">+ New</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="shipment in shipments" :key="shipment.id">
                <td>{{ shipment.id }}</td>
                <td>{{ shipment.destination }}</td>
                <td>
                  <span class="badge" :class="'status-' + shipment.status.toLowerCase()">
                    {{ shipment.status }}
                  </span>
                </td>
                <td>{{ shipment.date }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Activity Feed -->
        <div class="card">
          <div class="card-header">
            <h3>Activity Feed</h3>
          </div>
          <div class="activity-list">
            <div class="activity-item" v-for="activity in activities" :key="activity.id">
              <div class="activity-icon">{{ activity.icon }}</div>
              <div class="activity-content">
                <p class="activity-title">{{ activity.title }}</p>
                <p class="activity-time">{{ activity.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Trip Form -->
      <div class="card full-width">
        <div class="card-header">
          <h3>Create New Trip</h3>
        </div>
        <form @submit.prevent="createTrip" class="form-grid">
          <div class="form-group">
            <label>Trip Name</label>
            <input v-model="tripForm.name" type="text" placeholder="Enter trip name" required />
          </div>
          <div class="form-group">
            <label>Destination</label>
            <input v-model="tripForm.destination" type="text" placeholder="Enter destination" required />
          </div>
          <div class="form-group">
            <label>Distance (km)</label>
            <input v-model="tripForm.distance" type="number" placeholder="0" required />
          </div>
          <div class="form-group">
            <label>Vehicle Type</label>
            <select v-model="tripForm.vehicleType" required>
              <option value="">Select vehicle</option>
              <option value="truck">Truck</option>
              <option value="van">Van</option>
              <option value="container">Container</option>
            </select>
          </div>
          <div class="form-group">
            <label>Driver</label>
            <input v-model="tripForm.driver" type="text" placeholder="Driver name" required />
          </div>
          <div class="form-group">
            <label>Date</label>
            <input v-model="tripForm.date" type="date" required />
          </div>
          <div class="form-group">
            <label>Cost</label>
            <input v-model="tripForm.cost" type="number" placeholder="0.00" required />
          </div>
          <div class="form-group">
            <label>Status</label>
            <select v-model="tripForm.status" required>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <button type="submit" class="btn btn-accent full-width">Create Trip</button>
        </form>
      </div>

      <!-- Trips List -->
      <div class="card full-width">
        <div class="card-header">
          <h3>All Trips</h3>
        </div>
        <div class="trips-grid">
          <div class="trip-card" v-for="trip in trips" :key="trip.id">
            <div class="trip-header">
              <h4>{{ trip.name }}</h4>
              <span class="badge" :class="'status-' + trip.status.toLowerCase()">
                {{ trip.status }}
              </span>
            </div>
            <div class="trip-info">
              <p><strong>Destination:</strong> {{ trip.destination }}</p>
              <p><strong>Distance:</strong> {{ trip.distance }} km</p>
              <p><strong>Driver:</strong> {{ trip.driver }}</p>
              <p><strong>Cost:</strong> ${{ trip.cost }}</p>
              <p><strong>Date:</strong> {{ trip.date }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const isDarkMode = ref(false)

const dashboardStats = [
  { id: 1, icon: '📦', label: 'Total Shipments', value: '1,234', color: 'stat-blue' },
  { id: 2, icon: '🚚', label: 'In Transit', value: '45', color: 'stat-orange' },
  { id: 3, icon: '✅', label: 'Completed', value: '1,189', color: 'stat-green' },
  { id: 4, icon: '👥', label: 'Drivers', value: '28', color: 'stat-purple' },
]

const shipments = [
  { id: 'SHP001', destination: 'New York', status: 'Delivered', date: '2024-01-15' },
  { id: 'SHP002', destination: 'Los Angeles', status: 'In Transit', date: '2024-01-14' },
  { id: 'SHP003', destination: 'Chicago', status: 'Pending', date: '2024-01-13' },
  { id: 'SHP004', destination: 'Miami', status: 'Delivered', date: '2024-01-12' },
]

const activities = [
  { id: 1, icon: '🚚', title: 'Shipment SHP001 delivered', time: '2 hours ago' },
  { id: 2, icon: '👤', title: 'New driver added: John Doe', time: '5 hours ago' },
  { id: 3, icon: '📊', title: 'Monthly report generated', time: '1 day ago' },
  { id: 4, icon: '✅', title: 'Route optimization completed', time: '2 days ago' },
]

const tripForm = ref({
  name: '',
  destination: '',
  distance: '',
  vehicleType: '',
  driver: '',
  date: '',
  cost: '',
  status: 'pending',
})

const trips = ref([
  {
    id: 1,
    name: 'Urgent Delivery NYC',
    destination: 'New York, NY',
    distance: 350,
    driver: 'John Smith',
    cost: 1500,
    date: '2024-01-16',
    status: 'In Progress',
  },
  {
    id: 2,
    name: 'West Coast Route',
    destination: 'Los Angeles, CA',
    distance: 2800,
    driver: 'Mary Johnson',
    cost: 4200,
    date: '2024-01-17',
    status: 'Pending',
  },
])

const createTrip = () => {
  const newTrip = {
    id: trips.value.length + 1,
    name: tripForm.value.name,
    destination: tripForm.value.destination,
    distance: parseInt(tripForm.value.distance),
    driver: tripForm.value.driver,
    cost: parseFloat(tripForm.value.cost),
    date: tripForm.value.date,
    status: tripForm.value.status.charAt(0).toUpperCase() + tripForm.value.status.slice(1),
  }

  trips.value.unshift(newTrip)

  // Reset form
  tripForm.value = {
    name: '',
    destination: '',
    distance: '',
    vehicleType: '',
    driver: '',
    date: '',
    cost: '',
    status: 'pending',
  }
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
}
</script>

<style scoped>
.dashboard-page {
  background-color: var(--color-light-bg);
  padding: 40px 0;
  min-height: calc(100vh - 200px);
}

.dashboard-wrapper {
  max-width: 1400px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.dashboard-header h1 {
  color: var(--color-primary);
  margin-bottom: 8px;
}

.dashboard-header p {
  color: var(--color-text-light);
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.stat-card {
  background: var(--color-white);
  padding: 24px;
  border-radius: var(--radius-lg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid;
}

.stat-card.stat-blue {
  border-left-color: var(--color-primary);
}

.stat-card.stat-orange {
  border-left-color: var(--color-accent);
}

.stat-card.stat-green {
  border-left-color: var(--color-success);
}

.stat-card.stat-purple {
  border-left-color: #9C27B0;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 2rem;
}

.stat-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-text-dark);
}

.stat-title {
  color: var(--color-text-light);
  font-size: 0.95rem;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
}

.card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.card-header h3 {
  color: var(--color-primary);
  margin: 0;
}

/* Data Table */
.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background-color: var(--color-light-bg);
}

.data-table th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: var(--color-text-dark);
  border-bottom: 2px solid var(--color-border);
  font-size: 0.9rem;
}

.data-table td {
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-light);
}

.data-table tbody tr:hover {
  background-color: var(--color-light-bg);
}

/* Badges */
.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-pending {
  background-color: rgba(255, 193, 7, 0.2);
  color: #F57F17;
}

.status-in-progress {
  background-color: rgba(33, 150, 243, 0.2);
  color: #1976D2;
}

.status-delivered {
  background-color: rgba(76, 175, 80, 0.2);
  color: #388E3C;
}

.status-completed {
  background-color: rgba(76, 175, 80, 0.2);
  color: #388E3C;
}

.status-in\ transit {
  background-color: rgba(255, 152, 0, 0.2);
  color: #E65100;
}

/* Activity List */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px;
  border-radius: var(--radius-md);
  background-color: var(--color-light-bg);
}

.activity-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
}

.activity-title {
  margin: 0;
  font-weight: 500;
  color: var(--color-text-dark);
}

.activity-time {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: var(--color-text-light);
}

/* Form */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 600;
  color: var(--color-text-dark);
  margin-bottom: 8px;
  font-size: 0.9rem;
}

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: var(--transition);
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(44, 95, 124, 0.1);
}

.full-width {
  grid-column: 1 / -1;
}

/* Trips Grid */
.trips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.trip-card {
  background: linear-gradient(135deg, var(--color-light-bg) 0%, var(--color-white) 100%);
  padding: 20px;
  border-radius: var(--radius-lg);
  border-left: 4px solid var(--color-accent);
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.trip-header h4 {
  color: var(--color-primary);
  margin: 0;
}

.trip-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trip-info p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-light);
}

.trip-info strong {
  color: var(--color-text-dark);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 20px 0;
  }

  .dashboard-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .trips-grid {
    grid-template-columns: 1fr;
  }

  .data-table {
    font-size: 0.85rem;
  }

  .data-table th,
  .data-table td {
    padding: 8px;
  }
}
</style>
