export function useURL() {
  const { public: { webURL, portalURL } } = useRuntimeConfig()

  function toPortal(path: string) {
    return `${portalURL}${path}`
  }

  function toWeb(path: string) {
    return `${webURL}/${path}`
  }

  return {
    toWeb,
    toPortal,
  }
}
