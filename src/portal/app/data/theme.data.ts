import type { ThemeColor, ThemeVariant } from '~/types/common'

interface ThemeItem {
  bg: string
  text: string
  ring: string
  border: string
}

export const colorMap = {
  primary: {
    bg: tw`bg-primary`,
    text: tw`text-primary`,
    ring: tw`ring-primary`,
    border: tw`border-primary`,
  },
  error: {
    bg: tw`bg-error`,
    text: tw`text-error`,
    ring: tw`ring-error`,
    border: tw`border-error`,
  },
  info: {
    bg: tw`bg-info`,
    text: tw`text-info`,
    ring: tw`ring-info`,
    border: tw`border-info`,
  },
  neutral: {
    bg: tw`bg-neutral`,
    text: tw`text-neutral`,
    ring: tw`ring-neutral`,
    border: tw`border-neutral`,
  },
  secondary: {
    bg: tw`bg-secondary`,
    text: tw`text-secondary`,
    ring: tw`ring-secondary`,
    border: tw`border-secondary`,
  },
  success: {
    bg: tw`bg-success`,
    text: tw`text-success`,
    ring: tw`ring-success`,
    border: tw`border-success`,
  },
  warning: {
    bg: tw`bg-warning`,
    text: tw`text-warning`,
    ring: tw`ring-warning`,
    border: tw`border-warning`,
  },
} satisfies Record<ThemeColor, ThemeItem>

export const variantMap = {
  outline: {
    bg: '50',
    text: '50',
    ring: '50',
    border: '50',
  },
  soft: {
    bg: '10',
    text: '10',
    ring: '10',
    border: '10',
  },
  solid: {
    bg: '50',
    text: '50',
    ring: '50',
    border: '50',
  },
  subtle: {
    bg: '50',
    text: '50',
    ring: '50',
    border: '50',
  },
} satisfies Record<ThemeVariant, ThemeItem>
