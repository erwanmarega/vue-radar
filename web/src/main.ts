import { createApp } from 'vue'
import type { Directive } from 'vue'
import App from './App.vue'
import './style.css'

// v-reveal — fade element up as it scrolls into view.
// Falls back to "always visible" when reduced motion is requested
// or IntersectionObserver is unavailable.
const reveal: Directive<HTMLElement> = {
  mounted(el) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion || !('IntersectionObserver' in window)) {
      el.classList.add('reveal-in')
      return
    }
    el.classList.add('reveal')
    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-in')
            obs.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
    )
    observer.observe(el)
  },
}

createApp(App).directive('reveal', reveal).mount('#app')
