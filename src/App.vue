<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useTdeeStore, getLocalYYYYMMDD } from './store/useTdeeStore';
import SettingsModal from './components/SettingsModal.vue';
import * as XLSX from 'xlsx';
import { useDark, useToggle } from '@vueuse/core';

// 主题切换控制：自动读取系统偏好，并记忆手动切换选择
const isDark = useDark();
const toggleDark = useToggle(isDark);

const store = useTdeeStore();
const showSettings = ref(false);

onMounted(() => { if (!store.isConfigured) showSettings.value = true; });
watch(() => store.isConfigured, (configured) => { if (!configured) showSettings.value = true; });

const isToday = computed(() => store.selectedDate === getLocalYYYYMMDD(new Date()));
const customFood = ref({ name: '', cals: '', unit: 'kcal' });

const addFood = () => {
  const cals = parseFloat(customFood.value.cals);
  if (customFood.value.name && !isNaN(cals) && cals > 0) {
    const finalCals = customFood.value.unit === 'kJ' ? (cals / 4.184) : cals;
    store.activeDay.foods.push({ name: customFood.value.name, cals: finalCals });
    customFood.value.name = ''; customFood.value.cals = '';
  }
};

const saveQuickFood = () => {
  const cals = parseFloat(customFood.value.cals);
  if (customFood.value.name && !isNaN(cals) && cals > 0) {
    const finalCals = customFood.value.unit === 'kJ' ? (cals / 4.184) : cals;
    store.commonFoods.push({ name: customFood.value.name, cals: finalCals });
    customFood.value.name = ''; customFood.value.cals = '';
  }
};

// 【新增】交互式保存动画提示
const showSaveToast = ref(false);
const handleSave = () => {
  // 数据实际上一直是实时保存的，这里做一个 UX 视觉反馈让用户安心
  showSaveToast.value = true;
  setTimeout(() => { showSaveToast.value = false; }, 2000);
};

// 【新增】清空数据保护机制
const handleDelete = () => {
  if (confirm(`⚠️ 危险操作：\n确定要清空 ${store.selectedDate} 这天的所有数据吗？\n此操作不可逆！`)) {
    store.clearDayData();
  }
};

const exportToExcel = () => {
  const exportData = Object.entries(store.database).map(([date, data]) => {
    const dayBmr = (10 * data.weight) + (6.25 * store.userProfile.heightCm) - (5 * store.age) + (store.userProfile.gender === 'M' ? 5 : -161);
    const dayEat = data.workouts.reduce((t, wo) => {
      const mins = (wo.mins || 0) + ((wo.secs || 0)/60);
      return (wo.hr > 80 && mins > 0) ? t + Math.max(0, ((0.2017 * store.age + 0.09036 * data.weight + 0.6309 * wo.hr - 55.0969) * mins) / 4.184) : t;
    }, 0);
    const dayTdee = (dayBmr * 1.1) + (data.steps * 0.045 * (data.weight / 100)) + dayEat;
    const dayIn = data.foods.reduce((sum, f) => sum + f.cals, 0);

    return {
      "日期": date,
      "体重(kg)": data.weight,
      "步数": data.steps,
      "总摄入(kcal)": Math.round(dayIn),
      "总消耗_TDEE(kcal)": Math.round(dayTdee),
      "当日缺口(kcal)": Math.round(dayTdee - dayIn)
    };
  });

  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "数据追踪");
  XLSX.writeFile(wb, `TDEE_Data_${getLocalYYYYMMDD(new Date())}.xlsx`);
};
</script>

<template>
  <div class="p-4 md:p-6 flex justify-center w-full min-h-screen transition-colors duration-300">
    
    <!-- 顶部保存成功提示框 (Toast) -->
    <transition enter-active-class="transition ease-out duration-300 transform" enter-from-class="-translate-y-10 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition ease-in duration-200" leave-from-class="opacity-100" leave-to-class="opacity-0">
      <div v-if="showSaveToast" class="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg font-bold flex items-center gap-2">
        ✅ <span>已安全保存 {{ store.selectedDate }} 的数据到本地</span>
      </div>
    </transition>

    <div class="w-full max-w-[1400px]">
      
      <!-- 头部栏 -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 bg-white dark:bg-[#1e1e1e] p-4 rounded-2xl border border-gray-200 dark:border-[#333] shadow-sm transition-colors">
        <h1 class="text-xl font-bold flex items-center gap-3 mb-4 md:mb-0 text-gray-800 dark:text-white">
          📅 科学 TDEE 管理
          <button @click="showSettings = true" class="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg transition-colors">⚙️ 设置</button>
          <button @click="toggleDark()" class="text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-lg transition-colors">
            {{ isDark ? '☀️ 白天' : '🌙 黑夜' }}
          </button>
        </h1>
        <div class="flex items-center gap-3">
          <button @click="store.changeDate(-1)" class="bg-gray-100 dark:bg-[#2c2c2c] hover:bg-gray-200 dark:hover:bg-[#3c3c3c] px-4 py-2 rounded-lg transition-colors">←</button>
          <input type="date" v-model="store.selectedDate" class="bg-gray-50 dark:bg-[#121212] border border-gray-300 dark:border-[#444] rounded-lg px-4 py-2 text-gray-800 dark:text-white outline-none focus:border-green-500 font-bold text-center transition-colors">
          <button @click="store.changeDate(1)" :disabled="isToday" :class="['px-4 py-2 rounded-lg transition-colors', isToday ? 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-400 dark:text-gray-600 cursor-not-allowed' : 'bg-gray-100 dark:bg-[#2c2c2c] hover:bg-gray-200 dark:hover:bg-[#3c3c3c]']">→</button>
          <button @click="store.goToToday" v-if="!isToday" class="text-sm text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 ml-2 font-bold transition-colors">回今日</button>
        </div>
      </div>

      <!-- 主体网格 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        <!-- 左侧：基础与运动 -->
        <div class="flex flex-col gap-6 h-full">
          <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-200 dark:border-[#333] shadow-sm shrink-0 transition-colors">
            <h2 class="text-lg font-bold mb-4 text-gray-800 dark:text-white">⚡ 基础消耗</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-2">体重 (kg)</label>
                <input type="number" v-model.number="store.activeDay.weight" step="0.1" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-lg p-3 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors">
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-2">手环步数 (步)</label>
                <input type="number" v-model.number="store.activeDay.steps" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-lg p-3 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors">
              </div>
            </div>
          </div>

          <!-- 运动模块 -->
          <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-200 dark:border-[#333] shadow-sm flex-1 flex flex-col transition-colors">
            <div class="flex justify-between items-center mb-4 shrink-0">
              <h2 class="text-lg font-bold text-gray-800 dark:text-white">🏋️ 运动记录</h2>
              <button @click="store.activeDay.workouts.push({hr: 0, mins: 0, secs: 0})" class="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white px-3 py-1.5 rounded-md transition-colors">+ 添加</button>
            </div>
            <div class="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div v-for="(wo, i) in store.activeDay.workouts" :key="i" class="bg-gray-50 dark:bg-[#252525] p-4 rounded-lg border border-gray-200 dark:border-[#333] mb-3 relative transition-colors">
                <button @click="store.activeDay.workouts.splice(i,1)" class="absolute top-2 right-2 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-colors">✕</button>
                <div class="grid grid-cols-3 gap-3">
                  <div><label class="text-xs text-gray-500 dark:text-gray-400">心率(bpm)</label><input type="number" v-model.number="wo.hr" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
                  <div><label class="text-xs text-gray-500 dark:text-gray-400">时长(分)</label><input type="number" v-model.number="wo.mins" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
                  <div><label class="text-xs text-gray-500 dark:text-gray-400">时长(秒)</label><input type="number" v-model.number="wo.secs" class="w-full bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded p-2 text-sm mt-1 text-gray-800 dark:text-white transition-colors"></div>
                </div>
              </div>
              <div v-if="store.activeDay.workouts.length === 0" class="text-gray-400 dark:text-gray-500 text-sm text-center py-4">当日无运动记录</div>
            </div>
          </div>
        </div>

        <!-- 中间：饮食 -->
        <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-200 dark:border-[#333] shadow-sm h-full flex flex-col transition-colors">
          <h2 class="text-lg font-bold mb-4 shrink-0 text-gray-800 dark:text-white">🍽️ 饮食摄入</h2>
          <div class="flex flex-wrap gap-2 mb-4 bg-gray-50 dark:bg-[#252525] p-3 rounded-xl border border-gray-200 dark:border-[#333] shrink-0 transition-colors">
            <input type="text" v-model="customFood.name" placeholder="食物名称" class="flex-1 min-w-[100px] bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-sm text-gray-800 dark:text-white transition-colors">
            <input type="number" v-model="customFood.cals" placeholder="数值" class="w-16 bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-sm text-gray-800 dark:text-white transition-colors">
            <select v-model="customFood.unit" class="bg-white dark:bg-[#1e1e1e] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-sm text-gray-800 dark:text-white transition-colors">
              <option value="kcal">千卡</option>
              <option value="kJ">千焦</option>
            </select>
            <div class="flex gap-2 w-full mt-2">
              <button @click="addFood" class="bg-blue-600 hover:bg-blue-500 text-white flex-1 py-2 rounded-lg text-xs font-bold transition-colors">吃下肚</button>
              <button @click="saveQuickFood" class="bg-purple-600 hover:bg-purple-500 text-white flex-1 py-2 rounded-lg text-xs font-bold transition-colors">存快捷</button>
            </div>
          </div>
          
          <div class="mb-4 shrink-0">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">快捷食物库：</p>
            <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              <div v-for="(f, i) in store.commonFoods" :key="i" class="flex items-center bg-gray-100 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-full overflow-hidden transition-colors">
                <button @click="store.activeDay.foods.push({name: f.name, cals: f.cals})" class="text-xs px-2.5 py-1 hover:bg-gray-200 dark:hover:bg-[#3c3c3c] text-gray-700 dark:text-gray-200 transition-colors">{{ f.name }} ({{ Math.round(f.cals) }})</button>
                <button @click="store.commonFoods.splice(i,1)" class="px-2 py-1 text-gray-400 dark:text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 text-xs border-l border-gray-300 dark:border-[#444] transition-colors">✕</button>
              </div>
            </div>
          </div>

          <div class="flex-1 border-t border-gray-200 dark:border-[#333] pt-4 flex flex-col min-h-[200px] transition-colors">
            <h3 class="text-xs text-gray-500 dark:text-gray-400 mb-3 shrink-0">当日已摄入：</h3>
            <div class="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div v-for="(f, i) in store.activeDay.foods" :key="i" class="flex justify-between items-center bg-gray-50 dark:bg-[#252525] p-2.5 rounded-lg border border-gray-200 dark:border-[#333] transition-colors">
                <span class="text-sm truncate text-gray-800 dark:text-white">{{ f.name }}</span>
                <div class="flex items-center gap-3">
                  <span class="text-orange-500 dark:text-orange-400 font-bold text-sm">{{ Math.round(f.cals) }} kcal</span>
                  <button @click="store.activeDay.foods.splice(i,1)" class="text-gray-400 dark:text-gray-500 hover:text-red-500 text-xs transition-colors">撤销</button>
                </div>
              </div>
              <div v-if="store.activeDay.foods.length === 0" class="text-gray-400 dark:text-gray-500 text-sm text-center py-4">当日未记录饮食</div>
            </div>
          </div>
        </div>

        <!-- 右侧：数据大盘及操作按钮 -->
        <div class="flex flex-col gap-6 h-full">
          <div class="bg-green-50 dark:bg-[#183321] p-5 rounded-2xl border border-green-200 dark:border-[#1f5030] shadow-sm flex-1 flex flex-col justify-center transition-colors">
            <h2 class="text-xl font-black text-green-700 dark:text-green-400 border-b border-green-200 dark:border-[#1f5030] pb-3 mb-4 transition-colors">当日大盘</h2>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300"><span>BMR</span><span>{{ store.bmr.toFixed(0) }} kcal</span></div>
              <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300"><span>NEAT (步数)</span><span>{{ store.stepCalories.toFixed(0) }} kcal</span></div>
              <div class="flex justify-between text-xs text-gray-600 dark:text-gray-300"><span>EAT (运动)</span><span class="text-green-600 dark:text-green-300">+ {{ store.workoutCalories.toFixed(0) }} kcal</span></div>
              <div class="flex justify-between font-bold text-base mt-1 pt-1 border-t border-green-200 dark:border-[#1f5030] transition-colors">
                <span class="text-gray-800 dark:text-white">TDEE</span><span class="text-green-600 dark:text-green-400">{{ store.tdee.toFixed(0) }} kcal</span>
              </div>
            </div>
            <div class="flex justify-between font-bold text-base mb-4 border-b border-green-200 dark:border-[#1f5030] pb-3 transition-colors">
              <span class="text-gray-800 dark:text-white">总摄入 (IN)</span><span class="text-orange-600 dark:text-orange-400">{{ store.totalConsumed.toFixed(0) }} kcal</span>
            </div>
            <div class="bg-white dark:bg-[#121212] p-4 rounded-xl border border-green-100 dark:border-[#333] shadow-sm text-center mt-auto transition-colors">
              <div class="text-xs text-gray-500 dark:text-gray-400 mb-2">当日热量缺口</div>
              <div :class="['text-4xl font-black mb-2 transition-colors', store.dailyDeficit > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400']">
                {{ store.dailyDeficit > 0 ? '-' : '+' }}{{ Math.abs(store.dailyDeficit).toFixed(0) }}
              </div>
              <div class="text-xs text-gray-600 dark:text-gray-300">等价于 {{ store.dailyDeficit > 0 ? '消耗' : '囤积' }} <span :class="store.dailyDeficit > 0 ? 'text-blue-500 dark:text-blue-300' : 'text-red-500 dark:text-red-400'" class="font-bold">{{ (Math.abs(store.dailyDeficit) / 7.7).toFixed(1) }}g</span> 脂肪</div>
            </div>
          </div>

          <!-- 操作按钮组 -->
          <div class="bg-white dark:bg-[#1e1e1e] p-5 rounded-2xl border border-gray-200 dark:border-[#333] shadow-sm shrink-0 flex flex-col gap-3 transition-colors">
            <div class="flex gap-3">
              <!-- 保存按钮 -->
              <button @click="handleSave" class="flex-1 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-1">
                💾 保存当日
              </button>
              <!-- 删除按钮 -->
              <button @click="handleDelete" class="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-600 dark:text-red-400 py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-1">
                🗑️ 清空重置
              </button>
            </div>
            <!-- 导出按钮 -->
            <button @click="exportToExcel" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2">
              📊 导出全部历史记录为 Excel
            </button>
          </div>
        </div>

      </div>
    </div>
    
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
  </div>
</template>
