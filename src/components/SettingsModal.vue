<script setup lang="ts">
import { useTdeeStore } from '../store/useTdeeStore';
const store = useTdeeStore();
const emit = defineEmits(['close']);
</script>

<template>
  <div class="fixed inset-0 bg-black/70 flex justify-center items-center z-50 backdrop-blur-sm">
    <div class="bg-[#1e1e1e] p-6 rounded-2xl border border-[#333] w-96 shadow-2xl">
      <h2 class="text-xl font-bold mb-4 text-white">⚙️ 个人基础数据设置</h2>
      
      <div class="space-y-4 mb-6">
        <div>
          <label class="block text-xs text-gray-400 mb-1">出生日期 (用于计算年龄)</label>
          <input type="date" v-model="store.userProfile.birthDate" class="w-full bg-[#2c2c2c] border border-[#444] rounded-lg p-2 text-white outline-none focus:border-green-500">
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">身高 (cm)</label>
          <input type="number" v-model="store.userProfile.heightCm" class="w-full bg-[#2c2c2c] border border-[#444] rounded-lg p-2 text-white outline-none focus:border-green-500">
        </div>
        <div>
          <label class="block text-xs text-gray-400 mb-1">生理性别 (影响BMR计算)</label>
          <select v-model="store.userProfile.gender" class="w-full bg-[#2c2c2c] border border-[#444] rounded-lg p-2 text-white outline-none focus:border-green-500">
            <option value="M">男性</option>
            <option value="F">女性</option>
          </select>
        </div>
      </div>
      
      <button @click="emit('close')" class="w-full bg-green-600 hover:bg-green-500 py-2 rounded-lg font-bold transition">保存并关闭</button>
    </div>
  </div>
</template>
