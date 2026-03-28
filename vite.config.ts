import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 【注意】这里必须改成你的实际 GitHub 仓库名称，例如 '/tdee-tracker/'
  base: '/tdee-tracker/', 
})
