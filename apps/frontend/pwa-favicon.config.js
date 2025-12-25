import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    appleSplashScreens: false,
    // 這裡只保留 favicon 相關設定
    favicons: [[32, 'favicon.ico']]
  },
  images: ['public/logo-circle.png']
})
