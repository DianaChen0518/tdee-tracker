import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useStorage } from '@vueuse/core';
import { UserProfile, Database, DayData, Food } from '../types';
import { calculateAge, calcBMR, calcNEAT, calcEAT } from '../utils/formulas';

export const getLocalYYYYMMDD = (d: Date) => {
  const tzOffset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
};

export const useTdeeStore = defineStore('tdee', () => {
  const userProfile = useStorage<UserProfile>('tdee_user_v2', {
    birthDate: '', 
    heightCm: 0,
    gender: 'M'
  });

  const database = useStorage<Database>('tdee_db_v2', {});
  const commonFoods = useStorage<Food[]>('tdee_foods_v2', [
    { name: '生鸡胸肉 (100g)', cals: 133 },
    { name: '熟米饭 (100g)', cals: 116 },
    { name: '水煮蛋 (1个)', cals: 75 },
    { name: '黑咖啡', cals: 5 }
  ]);

  const selectedDate = ref(getLocalYYYYMMDD(new Date()));

  const isConfigured = computed(() => {
    return userProfile.value.birthDate !== '' && userProfile.value.heightCm > 0;
  });

  const activeDay = computed((): DayData => {
    if (!database.value[selectedDate.value]) {
      let defaultWeight = 0;
      const pastDates = Object.keys(database.value).filter(d => d < selectedDate.value).sort();
      if (pastDates.length > 0) {
        defaultWeight = database.value[pastDates[pastDates.length - 1]].weight;
      }
      database.value[selectedDate.value] = { weight: defaultWeight, steps: 0, workouts: [], foods: [] };
    }
    return database.value[selectedDate.value];
  });

  const age = computed(() => calculateAge(userProfile.value.birthDate));
  
  const bmr = computed(() => calcBMR(activeDay.value.weight, userProfile.value.heightCm, age.value, userProfile.value.gender));
  const baseCalories = computed(() => bmr.value * 1.1);
  const stepCalories = computed(() => calcNEAT(activeDay.value.weight, activeDay.value.steps));
  const workoutCalories = computed(() => calcEAT(activeDay.value.workouts, activeDay.value.weight, age.value));
  const tdee = computed(() => baseCalories.value + stepCalories.value + workoutCalories.value);
  const totalConsumed = computed(() => activeDay.value.foods.reduce((sum, f) => sum + f.cals, 0));
  const dailyDeficit = computed(() => tdee.value - totalConsumed.value);

  const changeDate = (days: number) => {
    const d = new Date(selectedDate.value);
    d.setDate(d.getDate() + days);
    selectedDate.value = getLocalYYYYMMDD(d);
  };
  
  const goToToday = () => selectedDate.value = getLocalYYYYMMDD(new Date());

  // 新增：清空当前选定日期的数据
  const clearDayData = () => {
    database.value[selectedDate.value] = { weight: 0, steps: 0, workouts: [], foods: [] };
  };

  return {
    userProfile, database, commonFoods, selectedDate, activeDay,
    isConfigured, 
    age, bmr, baseCalories, stepCalories, workoutCalories, tdee, totalConsumed, dailyDeficit,
    changeDate, goToToday, clearDayData
  };
});
