export default defineNuxtPlugin(async () => {
  const profileStore = useProfileStore()
  await profileStore.execute()
})
