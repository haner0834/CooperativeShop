import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    appleSplashScreens: false,
    favicons: [] // 這裡設為空陣列，防止覆蓋 logo-circle 生成的 favicon.ico
  },
  images: ['public/logo.jpg']
})
