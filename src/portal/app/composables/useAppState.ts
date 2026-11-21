// to provide small global state across components
export function useAppState() {
  const key = {
    fromEdit: 'from-edit',
    password: 'password',
  } as const

  const password = useState(key.password, () => ref(''))
  const fromEdit = useState(key.fromEdit, () => ref(false))

  function reset() {
    password.value = ''
    fromEdit.value = false
  }

  return {
    key,
    password,
    fromEdit,
    reset,
  }
}
