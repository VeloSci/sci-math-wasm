import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import './style.css';
import BenchmarkRunner from './components/BenchmarkRunner.vue';
import OptimizationHUD from './components/OptimizationHUD.vue';

const theme: Theme = {
  extends: DefaultTheme,
  Layout: () => {
    return h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(OptimizationHUD)
    })
  },
  enhanceApp({ app }) {
    app.component('BenchmarkRunner', BenchmarkRunner);
  }
};

export default theme;
