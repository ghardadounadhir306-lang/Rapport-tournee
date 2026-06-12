<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Left Side - Branding -->
      <div class="login-branding">
        <div class="branding-content">
          <div class="branding-icon">🚚</div>
          <h2>LogisticHub</h2>
          <p>Professional Logistics Management Platform</p>
        </div>
      </div>

      <!-- Right Side - Form -->
      <div class="login-form-section">
        <div class="form-wrapper">
          <h1>Welcome Back</h1>
          <p class="form-subtitle">Sign in to your account to continue</p>

          <form @submit.prevent="handleLogin" class="login-form">
            <!-- Email Field -->
            <div class="form-group">
              <label for="email">Email Address</label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                placeholder="you@example.com"
                required
                @blur="validateEmail"
              />
              <span v-if="errors.email" class="form-error">{{ errors.email }}</span>
            </div>

            <!-- Password Field -->
            <div class="form-group">
              <label for="password">Password</label>
              <input
                id="password"
                v-model="formData.password"
                type="password"
                placeholder="••••••••"
                required
                @blur="validatePassword"
              />
              <span v-if="errors.password" class="form-error">{{ errors.password }}</span>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="form-options">
              <label class="remember-me">
                <input v-model="formData.rememberMe" type="checkbox" />
                Remember me
              </label>
              <a href="#" class="forgot-password">Forgot password?</a>
            </div>

            <!-- Error Message -->
            <div v-if="loginError" class="error-message">
              {{ loginError }}
            </div>

            <!-- Submit Button -->
            <button type="submit" class="btn btn-accent btn-full" :disabled="isLoading">
              <span v-if="!isLoading">Sign In</span>
              <span v-else>Signing in...</span>
            </button>
          </form>

          <!-- Sign Up Link -->
          <p class="sign-up-link">
            Don't have an account?
            <a href="#" @click.prevent="showSignUp = true" class="sign-up-btn">Create one</a>
          </p>

          <!-- Demo Credentials -->
          <div class="demo-info">
            <p><strong>Demo Credentials:</strong></p>
            <p>Email: demo@example.com</p>
            <p>Password: any password</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sign Up Modal -->
    <div v-if="showSignUp" class="modal-overlay" @click="showSignUp = false">
      <div class="modal-content" @click.stop>
        <button class="modal-close" @click="showSignUp = false">×</button>
        <h2>Create Account</h2>
        <p>Sign up to get started with LogisticHub</p>
        
        <form @submit.prevent="handleSignUp" class="login-form">
          <div class="form-group">
            <label>Full Name</label>
            <input v-model="signUpData.name" type="text" placeholder="John Doe" required />
          </div>
          
          <div class="form-group">
            <label>Email Address</label>
            <input v-model="signUpData.email" type="email" placeholder="you@example.com" required />
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input v-model="signUpData.password" type="password" placeholder="••••••••" required />
          </div>
          
          <div class="form-group">
            <label class="checkbox">
              <input v-model="signUpData.agreeToTerms" type="checkbox" required />
              I agree to the Terms and Conditions
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-full">Create Account</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()
const router = useRouter()

const formData = ref({
  email: '',
  password: '',
  rememberMe: false,
})

const signUpData = ref({
  name: '',
  email: '',
  password: '',
  agreeToTerms: false,
})

const errors = ref({
  email: '',
  password: '',
})

const loginError = ref('')
const isLoading = ref(false)
const showSignUp = ref(false)

const validateEmail = () => {
  const email = formData.value.email
  if (!email) {
    errors.value.email = 'Email is required'
  } else if (!email.includes('@')) {
    errors.value.email = 'Please enter a valid email'
  } else {
    errors.value.email = ''
  }
}

const validatePassword = () => {
  const password = formData.value.password
  if (!password) {
    errors.value.password = 'Password is required'
  } else if (password.length < 6) {
    errors.value.password = 'Password must be at least 6 characters'
  } else {
    errors.value.password = ''
  }
}

const handleLogin = async () => {
  loginError.value = ''
  validateEmail()
  validatePassword()

  if (errors.value.email || errors.value.password) {
    return
  }

  isLoading.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))

  const success = authStore.login(formData.value.email, formData.value.password)

  if (success) {
    router.push('/dashboard')
  } else {
    loginError.value = 'Invalid email or password'
  }

  isLoading.value = false
}

const handleSignUp = async () => {
  if (!signUpData.value.agreeToTerms) {
    return
  }

  isLoading.value = true
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))

  // Auto-login after signup
  authStore.login(signUpData.value.email, signUpData.value.password)
  showSignUp.value = false
  router.push('/dashboard')

  isLoading.value = false
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--color-light-bg) 0%, var(--color-white) 100%);
  padding: 20px;
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  max-width: 900px;
  width: 100%;
  min-height: 600px;
}

/* Branding Section */
.login-branding {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-white);
  padding: 60px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.branding-content {
  text-align: center;
}

.branding-icon {
  font-size: 5rem;
  margin-bottom: 24px;
  display: block;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.login-branding h2 {
  color: var(--color-white);
  font-size: 2rem;
  margin-bottom: 12px;
}

.login-branding p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
}

/* Form Section */
.login-form-section {
  padding: 60px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-wrapper {
  width: 100%;
  max-width: 350px;
}

.form-wrapper h1 {
  color: var(--color-primary);
  font-size: 1.8rem;
  margin-bottom: 8px;
}

.form-subtitle {
  color: var(--color-text-light);
  font-size: 0.95rem;
  margin-bottom: 32px;
}

.login-form {
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--color-text-dark);
  margin-bottom: 8px;
  font-size: 14px;
}

.form-group input[type="email"],
.form-group input[type="password"],
.form-group input[type="text"] {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: var(--transition);
}

.form-group input[type="email"]:focus,
.form-group input[type="password"]:focus,
.form-group input[type="text"]:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(44, 95, 124, 0.1);
}

.form-group input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.form-error {
  color: var(--color-error);
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 14px;
}

.remember-me {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: var(--color-text-light);
}

.forgot-password {
  color: var(--color-primary);
  font-weight: 500;
  transition: var(--transition);
}

.forgot-password:hover {
  color: var(--color-accent);
}

.error-message {
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--color-error);
  padding: 12px;
  border-radius: var(--radius-md);
  margin-bottom: 16px;
  font-size: 14px;
  border-left: 3px solid var(--color-error);
}

.btn-full {
  width: 100%;
  justify-content: center;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sign-up-link {
  text-align: center;
  color: var(--color-text-light);
  font-size: 14px;
  margin-bottom: 24px;
}

.sign-up-btn {
  color: var(--color-primary);
  font-weight: 600;
  transition: var(--transition);
}

.sign-up-btn:hover {
  color: var(--color-accent);
}

.demo-info {
  background-color: var(--color-light-bg);
  padding: 16px;
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--color-text-light);
}

.demo-info p {
  margin-bottom: 4px;
}

.demo-info p:last-child {
  margin-bottom: 0;
}

.demo-info strong {
  color: var(--color-primary);
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-white);
  padding: 40px;
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  font-size: 24px;
  color: var(--color-text-light);
  cursor: pointer;
  transition: var(--transition);
}

.modal-close:hover {
  color: var(--color-primary);
}

.modal-content h2 {
  color: var(--color-primary);
  margin-bottom: 8px;
}

.modal-content > p {
  color: var(--color-text-light);
  margin-bottom: 24px;
  font-size: 14px;
}

.checkbox {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  font-weight: 400;
  margin-top: 12px;
}

.checkbox input {
  margin-right: 8px;
  margin-top: 2px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .login-container {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .login-branding {
    padding: 40px 20px;
    min-height: 200px;
  }

  .branding-icon {
    font-size: 3rem;
  }

  .login-form-section {
    padding: 40px 20px;
  }

  .form-wrapper {
    max-width: 100%;
  }

  .form-wrapper h1 {
    font-size: 1.5rem;
  }
}
</style>
