/** Hands a downloaded file to the browser's save flow. */
export function saveFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  // Revoked later: some browsers start reading the URL after click() returns.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
