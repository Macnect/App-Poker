<template>
  <div class="auth-container">
    <div class="auth-panel">
      <h2>{{ isLogin ? 'Iniciar Sesión' : 'Crear Cuenta' }}</h2>
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" v-model="email" required>
        </div>
        <div v-if="!isLogin" class="form-group">
          <label for="username">Nombre de Usuario</label>
          <input type="text" id="username" v-model="username" required>
        </div>
        <div class="form-group">
          <label for="password">Contraseña</label>
          <input type="password" id="password" v-model="password" required>
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button type="submit" class="auth-btn">{{ isLogin ? 'Entrar' : 'Registrarse' }}</button>
      </form>
      <div class="toggle-form">
        <a href="#" @click.prevent="isLogin = !isLogin">
          {{ isLogin ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión' }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/store/useAuthStore';

const authStore = useAuthStore();
const isLogin = ref(true);
const email = ref('');
const password = ref('');
const username = ref('');
const errorMessage = ref('');

async function handleSubmit() {
  errorMessage.value = '';
  try {
    if (isLogin.value) {
      await authStore.signIn(email.value, password.value);
    } else {
      await authStore.signUp(email.value, password.value, username.value);
      alert('¡Registro exitoso! Revisa tu email para confirmar tu cuenta.');
    }
  } catch (error) {
    errorMessage.value = error.message;
  }
}
</script>

<style scoped>
/* ========================================
   PREMIUM POKER ROOM DESIGN SYSTEM
   AuthView - Premium Login/Signup
   ======================================== */

.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%);
}

.auth-panel {
  width: 100%;
  max-width: 450px;

  /* Premium glass card effect */
  background: linear-gradient(145deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%);
  border: 1px solid rgba(212, 175, 55, 0.15);
  border-radius: 20px;
  padding: 3rem 2.5rem;

  /* Multi-layer shadow for depth */
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 10px 25px -3px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 20px 60px -15px rgba(212, 175, 55, 0.03);

  backdrop-filter: blur(10px);
  animation: cardSlideIn 0.5s ease-out;
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Premium accent line at top */
.auth-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(212, 175, 55, 0.3) 50%,
    transparent 100%
  );
  border-radius: 0 0 4px 4px;
}

h2 {
  text-align: center;
  margin-bottom: 2.5rem;
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #f9fafb 0%, #d4af37 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
}

.form-group {
  margin-bottom: 1.75rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: #d1d5db;
  letter-spacing: 0.025em;
  text-transform: uppercase;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.form-group input {
  width: 100%;
  box-sizing: border-box;
  padding: 16px 20px;
  font-size: 1.1rem;
  font-weight: 500;
  border-radius: 12px;

  /* Premium input styling */
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1.5px solid rgba(156, 163, 175, 0.2);
  color: #f9fafb;

  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 0 1px rgba(255, 255, 255, 0.03) inset;
}

.form-group input:hover {
  border-color: rgba(212, 175, 55, 0.4);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(31, 41, 55, 0.9) 100%);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.2) inset,
    0 0 8px rgba(212, 175, 55, 0.05);
}

.form-group input:focus {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 1) 100%);
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.3) inset,
    0 0 0 3px rgba(212, 175, 55, 0.1),
    0 0 12px rgba(212, 175, 55, 0.08);
}

.form-group input::placeholder {
  color: #9ca3af;
  opacity: 0.7;
}

.error-message {
  color: #fca5a5;
  background: linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(185, 28, 28, 0.2) 100%);
  border: 1.5px solid rgba(220, 38, 38, 0.3);
  padding: 1rem;
  border-radius: 10px;
  margin-bottom: 1.5rem;
  text-align: center;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.2);
  animation: errorShake 0.4s ease-in-out;
}

@keyframes errorShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.auth-btn {
  width: 100%;
  padding: 18px 24px;
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  border-radius: 12px;
  margin-top: 0.5rem;
  color: white;
  border: none;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  /* Premium emerald gradient */
  background: linear-gradient(135deg, #047857 0%, #059669 100%);

  /* Multi-layer shadow for depth */
  box-shadow:
    0 4px 6px -1px rgba(4, 120, 87, 0.3),
    0 10px 20px -3px rgba(4, 120, 87, 0.2),
    0 0 0 1px rgba(255, 255, 255, 0.08) inset,
    0 -2px 0 rgba(0, 0, 0, 0.15) inset;

  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

/* Shine effect overlay */
.auth-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 50%,
    transparent 100%
  );
  transition: left 0.6s ease;
}

.auth-btn:hover {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  transform: translateY(-3px) scale(1.02);
  box-shadow:
    0 8px 16px -2px rgba(4, 120, 87, 0.35),
    0 16px 32px -4px rgba(4, 120, 87, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset,
    0 0 24px rgba(4, 120, 87, 0.15),
    0 -2px 0 rgba(0, 0, 0, 0.15) inset;
}

.auth-btn:hover::before {
  left: 100%;
}

.auth-btn:active {
  transform: translateY(-1px) scale(1);
  box-shadow:
    0 4px 8px -1px rgba(4, 120, 87, 0.4),
    0 8px 16px -2px rgba(4, 120, 87, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.1) inset,
    0 1px 0 rgba(0, 0, 0, 0.3) inset;
}

.toggle-form {
  margin-top: 2rem;
  text-align: center;
  padding-top: 1.5rem;
  border-top: 1.5px solid rgba(212, 175, 55, 0.1);
}

.toggle-form a {
  color: #d4af37;
  text-decoration: none;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toggle-form a:hover {
  color: #fbbf24;
  text-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
}

/* ========================================
   RESPONSIVE DESIGN
   ======================================== */
@media (max-width: 480px) {
  .auth-container {
    padding: 1rem;
  }

  .auth-panel {
    padding: 2rem 1.5rem;
  }

  h2 {
    font-size: 1.75rem;
    margin-bottom: 2rem;
  }

  .form-group input {
    padding: 14px 18px;
    font-size: 1.05rem;
  }

  .auth-btn {
    padding: 16px 20px;
    font-size: 1.15rem;
  }

  .toggle-form a {
    font-size: 0.95rem;
  }
}
</style>