<script setup lang="ts">
import { computed } from 'vue';
import { useTdeeStore } from '../store/useTdeeStore';

const store = useTdeeStore();
const emit = defineEmits(['close']);

const isValid = computed(() => {
  return store.userProfile.birthDate !== '' && store.userProfile.heightCm > 0;
});

const handleClose = () => {
  if (isValid.value) {
    emit('close');
  }
};
</script>

<template>
  <div class="fixed inset-0 bg-black/50 dark:bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm" @click.self="handleClose">
    <!-- 适配了白天和黑夜的背景色 -->
    <div class="bg-white dark:bg-[#1e1e1e] p-6 rounded-2xl border border-gray-200 dark:border-[#333] w-96 shadow-2xl transition-colors">
      <h2 class="text-xl font-bold mb-2 text-gray-800 dark:text-white">⚙️ 个人基础生理数据</h2>
      
      <p v-if="!store.isConfigured" class="text-xs text-orange-600 dark:text-orange-400 mb-4 bg-orange-100 dark:bg-orange-900/20 p-2 rounded border border-orange-200 dark:border-orange-800/50">
        首次使用必填！此数据仅保存在本地浏览器，绝对隐私安全。
      </p>
      <p v-else class="text-xs text-gray-500 dark:text-gray-400 mb-4">数据变动会影响全局 BMR 代谢计算公式。</p>

      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">出生日期 (用于精确计算年龄)</label>
          <input type="date" v-model="store.userProfile.birthDate" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors">
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">身高 (cm)</label>
          <input type="number" v-model.number="store.userProfile.heightCm" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors">
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">生理性别 (Mifflin-St Jeor 公式基数)</label>
          <select v-model="store.userProfile.gender" class="w-full bg-gray-50 dark:bg-[#2c2c2c] border border-gray-300 dark:border-[#444] rounded-lg p-2 text-gray-800 dark:text-white outline-none focus:border-green-500 transition-colors">
            <option value="M">男性</option>
            <option value="F">女性</option>
          </select>
        </div>
      </div>
      
      <button 
        @click="handleClose" 
        :disabled="!isValid" 
        :class="['w-full py-2 rounded-lg font-bold transition-colors', isValid ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer' : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed']"
      >
        {{ store.isConfigured ? '保存并关闭' : '保存并开始使用' }}
      </button>
    </div>
  </div>
</template>
