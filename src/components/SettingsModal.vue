<script setup lang="ts">
import { computed } from 'vue';
import { useTdeeStore } from '../store/useTdeeStore';

const store = useTdeeStore();
const emit = defineEmits(['close']);

// 验证数据是否填完
const isValid = computed(() => {
  return store.userProfile.birthDate !== '' && store.userProfile.heightCm > 0;
});

// 只有填完了才允许关闭
const handleClose = () => {
  if (isValid.value) {
    emit('close');
  }
};
</script>

<template>
  <!-- 点击背景也会触发 handleClose 判断，没填完就关不掉 -->
  <div class="fixed inset-0 bg-black/80 flex justify-center items-center z-50 backdrop-blur-sm" @click.self="handleClose">
    <div class="bg-[#1e1e1e] p-6 rounded-2xl border border-[#333] w-96 shadow-2xl">
      <h2 class="text-xl font-bold mb-2 text-white">⚙️ 个人基础生理数据</h2>
      
      <!-- 如果没填过，给出高亮提示 -->
      <p v-if="!store.isConfigured" class="text-xs text-orange-400 mb-4 bg-orange-900/20 p-2 rounded border border-orange-800/50">
        首次使用必填！此数据仅保存在您的本地浏览器，绝对隐私安全，不会上传到任何服务器。
      </p>
      <p v-else class="text-xs text-gray-400 mb-4">数据变动会影响全局 BMR 代谢计算公式。</p>

      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-xs text-gray-400 mb-1">出生日期 (用于精确计算年龄)</label>
          <input type="date" v-model="store.userProfile.birthDate" class="w-full bg-[#2c2c2c] border border-[#444] rounded-lg p-2 text-white outline-none focus:border-green-500">
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">身高 (cm)</label>
          <input type="number" v-model.number="store.userProfile.heightCm" class="w-full bg-[#2c2c2c] border border-[#444] rounded-lg p-2 text-white outline-none focus:border-green-500">
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">生理性别 (Mifflin-St Jeor 公式基数)</label>
          <select v-model="store.userProfile.gender" class="w-full bg-[#2c2c2c] border border-[#444] rounded-lg p-2 text-white outline-none focus:border-green-500">
            <option value="M">男性</option>
            <option value="F">女性</option>
          </select>
        </div>
      </div>
      
      <!-- 按钮动态状态 -->
      <button 
        @click="handleClose" 
        :disabled="!isValid" 
        :class="['w-full py-2 rounded-lg font-bold transition', isValid ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer' : 'bg-gray-700 text-gray-500 cursor-not-allowed']"
      >
        {{ store.isConfigured ? '保存并关闭' : '保存并开始使用' }}
      </button>
    </div>
  </div>
</template>
