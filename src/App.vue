<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useTdeeStore, getLocalYYYYMMDD } from './store/useTdeeStore';
import SettingsModal from './components/SettingsModal.vue';
import * as XLSX from 'xlsx';

const store = useTdeeStore();

// 弹窗状态
const showSettings = ref(false);

// 首次打开自动弹窗
onMounted(() => {
  if (!store.isConfigured) showSettings.value = true;
});

// 监听配置状态，如果不小心被清空，强制弹窗
watch(() => store.isConfigured, (configured) => {
  if (!configured) showSettings.value = true;
});

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
  <div class="p-4 md:p-6 flex justify-center w-full min-h-screen">
    <div class="w-full max-w-[1400px]">
      
      <!-- 头部栏 -->
      <div class="flex flex-col md:flex-row justify-between items-center mb-6 bg-[#1e1e1e] p-4 rounded-2xl border border-[#333]">
        <h1 class="text-xl font-bold flex items-center gap-2 mb-4 md:mb-0">
          📅 科学 TDEE 管理
          <button @click="showSettings = true" class="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg ml-2 transition">⚙️ 设置</button>
        </h1>
        <div class="flex items-center gap-3">
          <button @click="store.changeDate(-1)" class="bg-[#2c2c2c] hover:bg-[#3c3c3c] px-4 py-2 rounded-lg transition">←</button>
          <input type="date" v-model="store.selectedDate" class="bg-[#121212] border border-[#444] rounded-lg px-4 py-2 text-white outline-none focus:border-green-500 font-bold text-center">
          <button @click="store.changeDate(1)" :disabled="isToday" :class="['px-4 py-2 rounded-lg transition', isToday ? 'bg-[#1a1a1a] text-gray-600' : 'bg-[#2c2c2c] hover:bg-[#3c3c3c]']">→</button>
          <button @click="store.goToToday" v-if="!isToday" class="text-sm text-green-400 hover:text-green-300 ml-2">回到今日</button>
        </div>
      </div>

      <!-- 主体网格：改为 items-stretch 实现等高布局 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        
        <!-- 左侧：基础与运动 -->
        <div class="flex flex-col gap-6 h-full">
          <div class="bg-[#1e1e1e] p-6 rounded-2xl border border-[#333] shrink-0">
            <h2 class="text-lg font-bold mb-4">⚡ 基础消耗</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-400 mb-2">体重 (kg)</label>
                <input type="number" v-model.number="store.activeDay.weight" step="0.1" class="w-full bg-[#2c2c2c] border border-[#444] rounded-lg p-3 text-white outline-none focus:border-green-500">
              </div>
              <div>
                <label class="block text-xs text-gray-400 mb-2">手环步数 (步)</label>
                <input type="number" v-model.number="store.activeDay.steps" class="w-full bg-[#2c2c2c] border border-[#444] rounded-lg p-3 text-white outline-none focus:border-green-500">
              </div>
            </div>
          </div>

          <!-- 运动模块占满剩下的高度 -->
          <div class="bg-[#1e1e1e] p-6 rounded-2xl border border-[#333] flex-1 flex flex-col">
            <div class="flex justify-between items-center mb-4 shrink-0">
              <h2 class="text-lg font-bold">🏋️ 运动记录</h2>
              <button @click="store.activeDay.workouts.push({hr: 0, mins: 0, secs: 0})" class="text-xs bg-gray-700 px-3 py-1.5 rounded-md">+ 添加</button>
            </div>
            <div class="overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div v-for="(wo, i) in store.activeDay.workouts" :key="i" class="bg-[#252525] p-4 rounded-lg border border-[#333] mb-3 relative">
                <button @click="store.activeDay.workouts.splice(i,1)" class="absolute top-2 right-2 text-gray-500 hover:text-red-400">✕</button>
                <div class="grid grid-cols-3 gap-3">
                  <div><label class="text-xs text-gray-400">心率(bpm)</label><input type="number" v-model.number="wo.hr" class="w-full bg-[#1e1e1e] border border-[#444] rounded p-2 text-sm mt-1"></div>
                  <div><label class="text-xs text-gray-400">时长(分)</label><input type="number" v-model.number="wo.mins" class="w-full bg-[#1e1e1e] border border-[#444] rounded p-2 text-sm mt-1"></div>
                  <div><label class="text-xs text-gray-400">时长(秒)</label><input type="number" v-model.number="wo.secs" class="w-full bg-[#1e1e1e] border border-[#444] rounded p-2 text-sm mt-1"></div>
                </div>
              </div>
              <div v-if="store.activeDay.workouts.length === 0" class="text-gray-500 text-sm text-center py-4">当日无运动记录</div>
            </div>
          </div>
        </div>

        <!-- 中间：饮食 -->
        <div class="bg-[#1e1e1e] p-6 rounded-2xl border border-[#333] h-full flex flex-col">
          <h2 class="text-lg font-bold mb-4 shrink-0">🍽️ 饮食摄入</h2>
          <div class="flex flex-wrap gap-2 mb-4 bg-[#252525] p-3 rounded-xl border border-[#333] shrink-0">
            <input type="text" v-model="customFood.name" placeholder="食物名称" class="flex-1 min-w-[100px] bg-[#1e1e1e] border border-[#444] rounded-lg p-2 text-sm">
            <input type="number" v-model="customFood.cals" placeholder="数值" class="w-16 bg-[#1e1e1e] border border-[#444] rounded-lg p-2 text-sm">
            <select v-model="customFood.unit" class="bg-[#1e1e1e] border border-[#444] rounded-lg p-2 text-sm">
              <option value="kcal">千卡</option>
              <option value="kJ">千焦</option>
            </select>
            <div class="flex gap-2 w-full mt-2">
              <button @click="addFood" class="bg-blue-600 hover:bg-blue-500 flex-1 py-2 rounded-lg text-xs font-bold transition">吃下肚</button>
              <button @click="saveQuickFood" class="bg-purple-600 hover:bg-purple-500 flex-1 py-2 rounded-lg text-xs font-bold transition">存快捷</button>
            </div>
          </div>
          
          <div class="mb-4 shrink-0">
            <p class="text-xs text-gray-400 mb-2">快捷食物库：</p>
            <div class="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-1">
              <div v-for="(f, i) in store.commonFoods" :key="i" class="flex items-center bg-[#2c2c2c] border border-[#444] rounded-full overflow-hidden">
                <button @click="store.activeDay.foods.push({name: f.name, cals: f.cals})" class="text-xs px-2.5 py-1 hover:bg-[#3c3c3c]">{{ f.name }} ({{ Math.round(f.cals) }})</button>
                <button @click="store.commonFoods.splice(i,1)" class="px-2 py-1 text-gray-500 hover:text-red-400 hover:bg-red-900/30 text-xs border-l border-[#444]">✕</button>
              </div>
            </div>
          </div>

          <!-- 吃下肚的食物列表占满剩下的高度 -->
          <div class="flex-1 border-t border-[#333] pt-4 flex flex-col min-h-[200px]">
            <h3 class="text-xs text-gray-400 mb-3 shrink-0">当日已摄入：</h3>
            <div class="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
              <div v-for="(f, i) in store.activeDay.foods" :key="i" class="flex justify-between items-center bg-[#252525] p-2.5 rounded-lg border border-[#333]">
                <span class="text-sm truncate">{{ f.name }}</span>
                <div class="flex items-center gap-3">
                  <span class="text-orange-400 font-bold text-sm">{{ Math.round(f.cals) }} kcal</span>
                  <button @click="store.activeDay.foods.splice(i,1)" class="text-gray-500 hover:text-red-400 text-xs">撤销</button>
                </div>
              </div>
              <div v-if="store.activeDay.foods.length === 0" class="text-gray-500 text-sm text-center py-4">当日未记录饮食</div>
            </div>
          </div>
        </div>

        <!-- 右侧：数据大盘 -->
        <div class="flex flex-col gap-6 h-full">
          <!-- 数据大盘占满剩余高度 -->
          <div class="bg-[#183321] p-5 rounded-2xl border border-[#1f5030] flex-1 flex flex-col justify-center">
            <h2 class="text-xl font-black text-green-400 border-b border-[#1f5030] pb-3 mb-4">当日大盘</h2>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-xs text-gray-300"><span>BMR</span><span>{{ store.bmr.toFixed(0) }} kcal</span></div>
              <div class="flex justify-between text-xs text-gray-300"><span>NEAT (步数)</span><span>{{ store.stepCalories.toFixed(0) }} kcal</span></div>
              <div class="flex justify-between text-xs text-gray-300"><span>EAT (运动)</span><span class="text-green-300">+ {{ store.workoutCalories.toFixed(0) }} kcal</span></div>
              <div class="flex justify-between font-bold text-base mt-1 pt-1 border-t border-[#1f5030]">
                <span>TDEE</span><span class="text-green-400">{{ store.tdee.toFixed(0) }} kcal</span>
              </div>
            </div>
            <div class="flex justify-between font-bold text-base mb-4 border-b border-[#1f5030] pb-3">
              <span>总摄入 (IN)</span><span class="text-orange-400">{{ store.totalConsumed.toFixed(0) }} kcal</span>
            </div>
            <div class="bg-[#121212] p-4 rounded-xl border border-[#333] text-center mt-auto">
              <div class="text-xs text-gray-400 mb-2">当日热量缺口</div>
              <div :class="['text-4xl font-black mb-2', store.dailyDeficit > 0 ? 'text-blue-400' : 'text-red-400']">
                {{ store.dailyDeficit > 0 ? '-' : '+' }}{{ Math.abs(store.dailyDeficit).toFixed(0) }}
              </div>
              <div class="text-xs text-gray-300">等价于 {{ store.dailyDeficit > 0 ? '消耗' : '囤积' }} <span :class="store.dailyDeficit > 0 ? 'text-blue-300' : 'text-red-300'" class="font-bold">{{ (Math.abs(store.dailyDeficit) / 7.7).toFixed(1) }}g</span> 脂肪</div>
            </div>
          </div>

          <div class="bg-[#1e1e1e] p-5 rounded-2xl border border-[#333] shrink-0">
            <button @click="exportToExcel" class="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg text-sm font-bold transition">
              📊 导出全部历史记录为 Excel
            </button>
          </div>
        </div>

      </div>
    </div>
    
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
  </div>
</template>
