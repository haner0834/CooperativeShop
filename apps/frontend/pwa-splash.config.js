import { defineConfig, createAppleSplashScreens } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  preset: {
    transparent: { sizes: [] },
    maskable: { sizes: [] },
    apple: { sizes: [] },
    appleSplashScreens: createAppleSplashScreens({
      padding: 0.5,
      resizeOptions: { background: '#ffffff', fit: 'contain' },
      darkResizeOptions: { background: '#000000', fit: 'contain' }
    })
  },
  images: ['public/logo-vertical.svg']
})
