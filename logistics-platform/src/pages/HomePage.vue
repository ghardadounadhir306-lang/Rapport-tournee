<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container hero-content">
        <div class="hero-text">
          <h1>Welcome to LogisticHub</h1>
          <p class="hero-subtitle">Professional logistics management platform for modern transportation businesses</p>
          <div class="hero-buttons">
            <RouterLink to="/login" class="btn btn-accent">Get Started</RouterLink>
            <a href="#services" class="btn btn-outline">Learn More</a>
          </div>
        </div>
        <div class="hero-image">
          <div class="hero-visual">
            <div class="truck-icon">🚛</div>
            <div class="ship-icon">🚢</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="services">
      <div class="container">
        <div class="section-header">
          <h2>Our Services</h2>
          <p>Comprehensive logistics solutions for your business needs</p>
        </div>
        <div class="services-grid">
          <div class="service-card" v-for="service in services" :key="service.id">
            <div class="service-icon">{{ service.icon }}</div>
            <h3>{{ service.title }}</h3>
            <p>{{ service.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section id="stats" class="stats">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-card" v-for="stat in stats" :key="stat.id">
            <div class="stat-number">{{ stat.number }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features">
      <div class="container">
        <div class="section-header">
          <h2>Why Choose LogisticHub?</h2>
          <p>Industry-leading logistics management system</p>
        </div>
        <div class="features-grid">
          <div class="feature-item" v-for="feature in features" :key="feature.id">
            <div class="feature-checkbox">✓</div>
            <div>
              <h4>{{ feature.title }}</h4>
              <p>{{ feature.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta">
      <div class="container cta-content">
        <h2>Ready to Transform Your Logistics?</h2>
        <p>Start using LogisticHub today and streamline your operations</p>
        <RouterLink to="/login" class="btn btn-accent">Start Free Trial</RouterLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const services = [
  {
    id: 1,
    icon: '🚚',
    title: 'Freight Management',
    description: 'Efficient management of freight shipments with real-time tracking and updates.',
  },
  {
    id: 2,
    icon: '📍',
    title: 'Route Optimization',
    description: 'Intelligent routing algorithms to reduce costs and delivery times.',
  },
  {
    id: 3,
    icon: '📊',
    title: 'Analytics & Reports',
    description: 'Comprehensive analytics and detailed reports for data-driven decisions.',
  },
  {
    id: 4,
    icon: '🤝',
    title: 'Customer Integration',
    description: 'Seamless integration with your existing business systems and tools.',
  },
]

const stats = [
  { id: 1, number: '50k+', label: 'Shipments Managed' },
  { id: 2, number: '150+', label: 'Partner Companies' },
  { id: 3, number: '99.8%', label: 'Uptime Guarantee' },
  { id: 4, number: '24/7', label: 'Customer Support' },
]

const features = [
  {
    id: 1,
    title: 'Real-time Tracking',
    description: 'Monitor your shipments in real-time with live GPS tracking.',
  },
  {
    id: 2,
    title: 'Smart Scheduling',
    description: 'Automated scheduling with conflict resolution and optimization.',
  },
  {
    id: 3,
    title: 'Cost Optimization',
    description: 'Reduce operational costs with intelligent resource allocation.',
  },
  {
    id: 4,
    title: 'Custom Reports',
    description: 'Generate custom reports tailored to your business needs.',
  },
  {
    id: 5,
    title: 'Mobile Access',
    description: 'Full platform access from mobile devices on the go.',
  },
  {
    id: 6,
    title: 'API Access',
    description: 'Integrate with your systems using our comprehensive REST API.',
  },
]
</script>

<style scoped>
.home-page {
  width: 100%;
}

/* Hero Section */
.hero {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: 80px 0;
}

.hero-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.hero-text h1 {
  color: var(--color-white);
  font-size: 3rem;
  margin-bottom: 16px;
  line-height: 1.1;
}

.hero-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  margin-bottom: 32px;
}

.hero-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-visual {
  position: relative;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.truck-icon,
.ship-icon {
  font-size: 6rem;
  animation: float 3s ease-in-out infinite;
}

.ship-icon {
  animation-delay: 1.5s;
  margin-left: 40px;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

/* Services Section */
.services {
  padding: 80px 0;
  background-color: var(--color-light-bg);
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-header h2 {
  color: var(--color-primary);
  margin-bottom: 12px;
}

.section-header p {
  color: var(--color-text-light);
  font-size: 1.1rem;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.service-card {
  background: var(--color-white);
  padding: 32px 24px;
  border-radius: var(--radius-lg);
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: var(--transition);
  border: 2px solid transparent;
}

.service-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.service-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
}

.service-card h3 {
  color: var(--color-primary);
  margin-bottom: 12px;
}

.service-card p {
  color: var(--color-text-light);
  font-size: 0.95rem;
}

/* Stats Section */
.stats {
  padding: 80px 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 32px;
}

.stat-card {
  text-align: center;
  padding: 32px;
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: var(--transition);
}

.stat-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-accent);
  margin-bottom: 8px;
}

.stat-label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

/* Features Section */
.features {
  padding: 80px 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.feature-item {
  display: flex;
  gap: 16px;
  padding: 20px;
  border-radius: var(--radius-lg);
  background: var(--color-light-bg);
  transition: var(--transition);
}

.feature-item:hover {
  background: var(--color-white);
  border-left: 4px solid var(--color-accent);
  padding-left: 16px;
}

.feature-checkbox {
  width: 32px;
  height: 32px;
  background-color: var(--color-accent);
  color: var(--color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  flex-shrink: 0;
}

.feature-item h4 {
  color: var(--color-primary);
  margin-bottom: 8px;
}

.feature-item p {
  color: var(--color-text-light);
  font-size: 0.95rem;
  margin: 0;
}

/* CTA Section */
.cta {
  background: linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-light) 100%);
  color: var(--color-white);
  padding: 80px 0;
}

.cta-content {
  text-align: center;
}

.cta-content h2 {
  color: var(--color-white);
  font-size: 2.5rem;
  margin-bottom: 12px;
}

.cta-content p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  margin-bottom: 32px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content {
    grid-template-columns: 1fr;
    gap: 40px;
  }

  .hero-text h1 {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .hero-buttons {
    justify-content: flex-start;
  }

  .hero-visual {
    height: 200px;
  }

  .truck-icon,
  .ship-icon {
    font-size: 4rem;
  }

  .services {
    padding: 60px 0;
  }

  .stats {
    padding: 60px 0;
  }

  .stats-grid {
    gap: 16px;
  }

  .stat-card {
    padding: 24px;
  }

  .features {
    padding: 60px 0;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .cta {
    padding: 60px 0;
  }

  .cta-content h2 {
    font-size: 1.75rem;
  }
}
</style>
