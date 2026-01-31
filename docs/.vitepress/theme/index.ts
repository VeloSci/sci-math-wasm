import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import './style.css';



const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Register global components here if needed
  }
};

export default theme;
