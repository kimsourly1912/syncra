import type { KeyFilterModifier } from '@/types/directive'

export default defineNuxtPlugin((nuxtApp) => {
  function useKeyfilterDirective<E extends HTMLInputElement, V extends RegExp, M extends KeyFilterModifier>() {
    const DEFAULT_PATTERNS: Record<KeyFilterModifier, RegExp> = {
      int: /[\d-]/,
      num: /[\d-.]/,
    } as const

    function allowedControlKeys(evt: KeyboardEvent) {
      /**
       * ctrl + 👇
       * paste, copy, select all, cut
       *
       * ctrl + r = reload page
       */
      const keys = ['v', 'V', 'c', 'C', 'a', 'A', 'x', 'X', 'r', 'R', 'ArrowLeft', 'ArrowRight']
      return (evt.ctrlKey || evt.metaKey) && keys.includes(evt.key)
    }

    function allowedSpecialKeys(evt: KeyboardEvent) {
      const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Backspace', 'Enter', 'Tab']
      return keys.includes(evt.key)
    }

    function onKeydown(this: RegExp) {
      return (evt: KeyboardEvent) => {
        if (allowedControlKeys(evt)) {
          return
        }
        if (allowedSpecialKeys(evt)) {
          return
        }
        if (!this.test(evt.key)) {
          evt.preventDefault()
        }
      }
    }

    function onPaste(this: RegExp) {
      return (evt: ClipboardEvent) => {
        if (!evt.clipboardData) return
        const text = evt.clipboardData.getData('text')
        if (!text.length) return
        for (const v of text) {
          if (!this.test(v)) {
            evt.preventDefault()
            return
          }
        }
      }
    }

    // TODO: 👇 find a way to eliminate the auto-complete from email or phone
    function onInput(this: RegExp) {
      return (_evt: Event) => {
        // const inp = evt.target as HTMLInputElement
        // const text = inp.value
        // if (!text.length) return
        // let res = ''
        // for (const v of text) {
        //   if (this.test(v)) res += v
        // }
      }
    }

    function getPattern(binding: DirectiveBinding<V, M>): RegExp {
      /**
       * TODO: currently we support only one REGX at once
       * invalid example: v-keyfilter.num.int="/[\w]/"
       * the result contains 3 regx
       */
      const { value, modifiers } = binding
      if (value) return value
      const keys = Object.keys(modifiers) as KeyFilterModifier[]
      if (!keys.length) return DEFAULT_PATTERNS.int
      return DEFAULT_PATTERNS[keys[0]!]
    }

    let onInputEvent: (evt: Event) => void
    let onPasteEvent: (evt: ClipboardEvent) => void
    let onKeydownEvent: (evt: KeyboardEvent) => void

    nuxtApp.vueApp.directive<E, V, M>('keyfilter', {
      beforeMount(_, binding) {
        const pattern = getPattern(binding)
        // store same reference for cleanup
        onInputEvent = onInput.bind(pattern)()
        onPasteEvent = onPaste.bind(pattern)()
        onKeydownEvent = onKeydown.bind(pattern)()
      },
      mounted(el) {
        if (!el) return
        el.setAttribute('data-keyfilter', 'true')
        el.addEventListener('input', onInputEvent)
        el.addEventListener('paste', onPasteEvent)
        el.addEventListener('keydown', onKeydownEvent)
      },
      unmounted(el) {
        el.removeEventListener('input', onInputEvent)
        el.removeEventListener('paste', onPasteEvent)
        el.removeEventListener('keydown', onKeydownEvent)
      },
    })
  }

  useKeyfilterDirective()
})
