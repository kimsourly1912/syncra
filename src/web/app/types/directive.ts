import type { Directive } from 'vue'

export type KeyFilterModifier = 'int' | 'num'
export type KeyFilterDirective = Directive<HTMLInputElement, RegExp, KeyFilterModifier>
