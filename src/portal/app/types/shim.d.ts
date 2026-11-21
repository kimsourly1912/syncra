import type { KeyFilterDirective } from './directive'

declare module '#app' {
}

declare module 'vue' {
  export interface ComponentCustomProperties {
    vKeyfilter: KeyFilterDirective
  }

}

export { }
