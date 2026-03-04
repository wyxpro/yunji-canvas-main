<script setup>
/**
 * Root App component | 根组件
 * Provides naive-ui config and router view
 */
import { computed } from 'vue'
import { NConfigProvider, NMessageProvider, NDialogProvider, darkTheme } from 'naive-ui'
import { isDark } from './stores/theme'

// Naive UI theme based on dark mode | 基于深色模式的 Naive UI 主题
const theme = computed(() => isDark.value ? darkTheme : null)

const commonOverrides = {
  primaryColor: '#8b5cf6',
  primaryColorHover: '#7c3aed',
  primaryColorPressed: '#6d28d9',
  borderRadius: '16px',
  borderRadiusSmall: '8px'
}

// Dark theme overrides | 深色主题覆盖
const darkThemeOverrides = {
  common: commonOverrides,
  Dialog: {
    borderRadius: '24px',
    padding: '32px',
    color: 'rgba(10, 15, 28, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    titleTextColor: '#f8fafc',
    textColor: '#cbd5e1',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
  },
  Modal: {
    borderRadius: '24px',
    padding: '32px',
    color: 'rgba(10, 15, 28, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    textColor: '#cbd5e1',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
  },
  Card: {
    borderRadius: '20px',
    padding: '24px',
    color: 'rgba(10, 15, 28, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    titleTextColor: '#f8fafc'
  },
  Button: {
    borderRadiusMedium: '12px',
    borderRadiusSmall: '8px',
    borderRadiusLarge: '16px',
    heightMedium: '42px',
    paddingMedium: '0 24px',
    colorOpacitySecondary: '0.1',
    colorSecondaryHover: 'rgba(139, 92, 246, 0.2)',
    textColor: '#f8fafc'
  },
  Input: {
    borderRadius: '12px',
    heightMedium: '42px',
    color: 'rgba(255, 255, 255, 0.03)',
    colorFocus: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderHover: '1px solid rgba(139, 92, 246, 0.4)',
    borderFocus: '1px solid #8b5cf6',
    textColor: '#f8fafc',
    placeholderColor: 'rgba(255, 255, 255, 0.3)'
  },
  Dropdown: {
    color: 'rgba(10, 15, 28, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '8px',
    optionColorHover: 'rgba(139, 92, 246, 0.2)',
    optionTextColor: '#cbd5e1'
  }
}

// Light theme overrides | 浅色主题覆盖
const lightThemeOverrides = {
  common: commonOverrides,
  Dialog: {
    borderRadius: '24px',
    padding: '32px',
    color: 'rgba(255, 255, 255, 0.92)',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    titleTextColor: '#0f172a',
    textColor: '#334155',
    boxShadow: '0 25px 50px -12px rgba(2, 6, 23, 0.18)'
  },
  Modal: {
    borderRadius: '24px',
    padding: '32px',
    color: 'rgba(255, 255, 255, 0.92)',
    border: '1px solid rgba(15, 23, 42, 0.08)',
    textColor: '#334155',
    boxShadow: '0 25px 50px -12px rgba(2, 6, 23, 0.18)'
  },
  Card: {
    borderRadius: '20px',
    padding: '24px',
    color: 'rgba(255, 255, 255, 0.82)',
    borderColor: 'rgba(15, 23, 42, 0.08)',
    titleTextColor: '#0f172a'
  },
  Button: {
    borderRadiusMedium: '12px',
    borderRadiusSmall: '8px',
    borderRadiusLarge: '16px',
    heightMedium: '42px',
    paddingMedium: '0 24px',
    colorOpacitySecondary: '0.06',
    colorSecondaryHover: 'rgba(139, 92, 246, 0.14)'
  },
  Input: {
    borderRadius: '12px',
    heightMedium: '42px',
    color: 'rgba(15, 23, 42, 0.03)',
    colorFocus: 'rgba(139, 92, 246, 0.10)',
    border: '1px solid rgba(15, 23, 42, 0.10)',
    borderHover: '1px solid rgba(139, 92, 246, 0.45)',
    borderFocus: '1px solid #8b5cf6',
    textColor: '#0f172a',
    placeholderColor: 'rgba(15, 23, 42, 0.35)'
  },
  Dropdown: {
    color: 'rgba(255, 255, 255, 0.98)',
    border: '1px solid rgba(15, 23, 42, 0.10)',
    borderRadius: '16px',
    padding: '8px',
    optionColorHover: 'rgba(139, 92, 246, 0.14)',
    optionTextColor: '#0f172a'
  }
}

// Global theme overrides | 全局主题覆盖
const themeOverrides = computed(() => (isDark.value ? darkThemeOverrides : lightThemeOverrides))
</script>

<template>
  <n-config-provider :theme="theme" :theme-overrides="themeOverrides">
    <n-message-provider>
      <n-dialog-provider>
        <router-view />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
/* Global app styles handled in style.css */
</style>
