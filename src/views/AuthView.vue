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
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
}
.auth-panel {
  width: 100%;
  max-width: 400px;
  background-color: #2d3748;
  padding: 2.5rem;
  border-radius: 12px;
}
h2 {
  text-align: center;
  margin-bottom: 2rem;
}
.form-group {
  margin-bottom: 1.5rem;
}
.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
}
.form-group input {
  width: 100%;
  box-sizing: border-box;
}
.error-message {
  color: #fc8181;
  background-color: rgba(197, 48, 48, .3);
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  text-align: center;
}
.auth-btn {
  width: 100%;
  padding: 15px;
  font-size: 1.2rem;
  font-weight: bold;
}
.toggle-form {
  margin-top: 1.5rem;
  text-align: center;
}
.toggle-form a {
  color: var(--primary-color);
  text-decoration: none;
}
.toggle-form a:hover {
  text-decoration: underline;
}
</style>