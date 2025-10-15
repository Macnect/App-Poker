<template>
  <div class="date-picker-wrapper" ref="datePickerRef">
    <div class="date-input-container" @click="toggleCalendar">
      <input
        type="text"
        :value="formattedDate"
        readonly
        :placeholder="placeholder"
        class="date-display-input"
      />
      <span class="calendar-icon">📅</span>
    </div>

    <transition name="calendar-fade">
      <div v-if="isOpen" class="calendar-dropdown" :style="dropdownStyle">
        <div class="calendar-header">
          <button class="nav-btn" @click.stop="previousMonth" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <div class="month-year-label">
            {{ monthYearLabel }}
          </div>
          <button class="nav-btn" @click.stop="nextMonth" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

        <div class="calendar-grid">
          <div v-for="day in weekDays" :key="day" class="weekday-label">
            {{ day }}
          </div>

          <div
            v-for="(date, index) in calendarDays"
            :key="index"
            class="calendar-day"
            :class="{
              'other-month': !date.isCurrentMonth,
              'today': date.isToday,
              'selected': date.isSelected,
              'disabled': date.disabled
            }"
            @click.stop="selectDate(date)"
          >
            {{ date.day }}
          </div>
        </div>

        <div class="calendar-footer">
          <button class="today-btn" @click.stop="selectToday" type="button">
            Hoy
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: 'Seleccionar fecha'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const datePickerRef = ref(null);
const isOpen = ref(false);
const currentMonth = ref(new Date().getMonth());
const currentYear = ref(new Date().getFullYear());
const dropdownStyle = ref({});

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const monthYearLabel = computed(() => {
  return `${monthNames[currentMonth.value]} ${currentYear.value}`;
});

const formattedDate = computed(() => {
  if (!props.modelValue) return '';

  const date = new Date(props.modelValue + 'T00:00:00');
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${month} de ${year}`;
});

const calendarDays = computed(() => {
  const days = [];
  const firstDay = new Date(currentYear.value, currentMonth.value, 1);
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0);

  let startDay = firstDay.getDay();
  startDay = startDay === 0 ? 6 : startDay - 1;

  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate();

  for (let i = startDay - 1; i >= 0; i--) {
    days.push({
      day: prevMonthLastDay - i,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      disabled: true
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(currentYear.value, currentMonth.value, day);
    date.setHours(0, 0, 0, 0);

    const dateString = formatDateToYYYYMMDD(date);

    days.push({
      day,
      date: dateString,
      isCurrentMonth: true,
      isToday: date.getTime() === today.getTime(),
      isSelected: dateString === props.modelValue,
      disabled: false
    });
  }

  const remainingDays = 42 - days.length;
  for (let day = 1; day <= remainingDays; day++) {
    days.push({
      day,
      isCurrentMonth: false,
      isToday: false,
      isSelected: false,
      disabled: true
    });
  }

  return days;
});

function formatDateToYYYYMMDD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toggleCalendar() {
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    if (props.modelValue) {
      const date = new Date(props.modelValue + 'T00:00:00');
      currentMonth.value = date.getMonth();
      currentYear.value = date.getFullYear();
    }

    setTimeout(() => {
      calculateDropdownPosition();
    }, 0);
  }
}

function calculateDropdownPosition() {
  if (!datePickerRef.value) return;

  const rect = datePickerRef.value.getBoundingClientRect();
  const dropdownHeight = 350;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const isMobile = window.innerWidth <= 768;

  if (isMobile) {
    // En móvil, centrar verticalmente en la pantalla
    dropdownStyle.value = {
      top: '50%',
      transform: 'translate(-50%, -50%)',
      bottom: 'auto',
      marginTop: '0'
    };
  } else if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
    dropdownStyle.value = {
      bottom: '100%',
      top: 'auto',
      marginBottom: '8px',
      transform: 'none'
    };
  } else {
    dropdownStyle.value = {
      top: '100%',
      bottom: 'auto',
      marginTop: '8px',
      transform: 'none'
    };
  }
}

function selectDate(dateObj) {
  if (dateObj.disabled || !dateObj.isCurrentMonth) return;

  emit('update:modelValue', dateObj.date);
  emit('change', dateObj.date);
  isOpen.value = false;
}

function selectToday() {
  const today = new Date();
  const dateString = formatDateToYYYYMMDD(today);

  emit('update:modelValue', dateString);
  emit('change', dateString);
  isOpen.value = false;
}

function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
}

function handleClickOutside(event) {
  if (datePickerRef.value && !datePickerRef.value.contains(event.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', calculateDropdownPosition);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', calculateDropdownPosition);
});

watch(() => props.modelValue, (newValue) => {
  if (newValue && isOpen.value) {
    const date = new Date(newValue + 'T00:00:00');
    currentMonth.value = date.getMonth();
    currentYear.value = date.getFullYear();
  }
});
</script>

<style scoped>
.date-picker-wrapper {
  position: relative;
  width: 100%;
}

.date-input-container {
  position: relative;
  width: 100%;
  cursor: pointer;
}

.date-display-input {
  width: 100%;
  padding: 10px 40px 10px 14px;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 10px;
  border: 1.5px solid rgba(212, 175, 55, 0.25);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.4) 0%, rgba(31, 41, 55, 0.6) 100%);
  color: #f9fafb;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.date-display-input::placeholder {
  color: rgba(209, 213, 219, 0.5);
}

.date-input-container:hover .date-display-input {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border-color: rgba(212, 175, 55, 0.4);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.date-input-container:focus-within .date-display-input {
  outline: none;
  border-color: rgba(212, 175, 55, 0.6);
  box-shadow:
    0 4px 8px rgba(0, 0, 0, 0.3),
    0 0 0 3px rgba(212, 175, 55, 0.1);
}

.calendar-icon {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
  pointer-events: none;
  opacity: 0.8;
  filter: grayscale(0.3) sepia(0.5) hue-rotate(10deg);
}

.calendar-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 1000;
  width: 300px;
  margin: 0 auto;

  background: linear-gradient(145deg, rgba(31, 41, 55, 0.98) 0%, rgba(17, 24, 39, 1) 100%);
  border: 1.5px solid rgba(212, 175, 55, 0.3);
  border-radius: 12px;
  padding: 1rem;

  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset,
    0 0 30px rgba(212, 175, 55, 0.1);

  backdrop-filter: blur(10px);
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(212, 175, 55, 0.2);
  gap: 0.5rem;
}

.month-year-label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #d4af37;
  letter-spacing: 0.025em;
  flex: 1;
  text-align: center;
}

.nav-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1px solid rgba(212, 175, 55, 0.25);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #ffffff;
}

.nav-btn svg {
  width: 18px;
  height: 18px;
  stroke-width: 2.5;
}

.nav-btn:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 1) 100%);
  border-color: rgba(212, 175, 55, 0.5);
  transform: scale(1.05);
  color: #d4af37;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.weekday-label {
  text-align: center;
  font-size: 0.7rem;
  font-weight: 600;
  color: #d4af37;
  padding: 6px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 500;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #d1d5db;
  background: rgba(55, 65, 81, 0.3);
  border: 1px solid transparent;
  min-height: 30px;
}

.calendar-day.other-month {
  color: rgba(156, 163, 175, 0.3);
  background: transparent;
}

.calendar-day.disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.calendar-day:not(.disabled):not(.other-month):hover {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.3) 100%);
  border-color: rgba(212, 175, 55, 0.4);
  transform: scale(1.05);
  color: #f9fafb;
}

.calendar-day.today {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3) 0%, rgba(37, 99, 235, 0.4) 100%);
  border-color: rgba(59, 130, 246, 0.5);
  color: #ffffff;
  font-weight: 700;
}

.calendar-day.selected {
  background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%);
  border-color: #d4af37;
  color: #1f2937;
  font-weight: 700;
  box-shadow: 0 0 12px rgba(212, 175, 55, 0.4);
}

.calendar-day.selected:hover {
  transform: scale(1.05);
}

.calendar-footer {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(212, 175, 55, 0.2);
  display: flex;
  justify-content: center;
}

.today-btn {
  padding: 8px 20px;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.6) 0%, rgba(31, 41, 55, 0.8) 100%);
  border: 1px solid rgba(212, 175, 55, 0.25);
  color: #d1d5db;
}

.today-btn:hover {
  background: linear-gradient(135deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 1) 100%);
  border-color: rgba(212, 175, 55, 0.5);
  transform: translateY(-2px);
  color: #d4af37;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.calendar-fade-enter-active,
.calendar-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.calendar-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

.calendar-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

@media (max-width: 768px) {
  .calendar-dropdown {
    position: fixed;
    left: 50%;
    transform: translateX(-50%);
    width: 280px;
    top: auto;
    bottom: auto;
    margin-top: 0;
  }

  .month-year-label {
    font-size: 0.9rem;
  }

  .nav-btn {
    width: 34px;
    height: 34px;
    color: #ffffff;
  }

  .nav-btn svg {
    width: 20px;
    height: 20px;
    stroke-width: 3;
  }

  .calendar-grid {
    gap: 3px;
  }

  .calendar-day {
    font-size: 0.8rem;
    min-height: 28px;
  }

  .weekday-label {
    font-size: 0.65rem;
    padding: 5px 0;
  }
}

@media (max-width: 480px) {
  .date-display-input {
    font-size: 0.9rem;
    padding: 9px 36px 9px 12px;
  }

  .calendar-icon {
    font-size: 1.1rem;
    right: 12px;
  }

  .calendar-dropdown {
    width: 260px;
    padding: 0.85rem;
  }

  .calendar-grid {
    gap: 2px;
  }

  .calendar-day {
    font-size: 0.75rem;
    min-height: 26px;
  }

  .nav-btn {
    width: 32px;
    height: 32px;
    color: #ffffff;
  }

  .nav-btn svg {
    width: 18px;
    height: 18px;
    stroke-width: 3;
  }

  .today-btn {
    padding: 6px 16px;
    font-size: 0.8rem;
  }
}
</style>
