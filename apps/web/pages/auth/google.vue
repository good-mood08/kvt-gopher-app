<script setup lang="ts">
const route = useRoute()
const authError = ref('')
const { authenticateProvider, fetchUser } = useStrapiAuth()

const isFreshRegistration = (createdAt: unknown) => {
  if (typeof createdAt !== 'string')
    return false

  const createdAtTime = Date.parse(createdAt)
  if (Number.isNaN(createdAtTime))
    return false

  return Date.now() - createdAtTime < 10 * 60 * 1000
}

// Обрабатываем callback от Google
onMounted(async () => {
  const accessToken = route.query.access_token
  if (!accessToken || typeof accessToken !== 'string') {
    authError.value = 'Ошибка авторизации Google: не получен access_token. Проверь настройки callback URL.'
    return
  }

  try {
    await authenticateProvider('google', accessToken)
    const user = await fetchUser() // Обновляем данные пользователя
    const currentUser = user.value as Record<string, unknown> | null | undefined
    const userId = currentUser?.documentId ?? currentUser?.id

    if (userId != null && isFreshRegistration(currentUser?.createdAt))
      markHomeTourPendingForUser(String(userId))

    await navigateTo(`/general`)
  } catch (error) {
    console.error('Ошибка авторизации:', error)
    authError.value = 'Ошибка авторизации Google. Попробуйте снова.'
  }
})
</script>



<template>
  <div class="loading-container">
    <template v-if="authError">
      <p class="loading-text">{{ authError }}</p>
      <button class="retry-button" type="button" @click="navigateTo('/')">
        Вернуться к авторизации
      </button>
    </template>
    <template v-else>
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading<span class="dot">.</span><span class="dot">.</span><span class="dot">.</span></p>
    </template>
  </div>
</template>

<style scoped>


.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}


@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
}


.loading-text {
  margin-top: 30px;
  color: #fff;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: 2px;
  text-align: center;
}

.dot {
  display: inline-block;
  opacity: 0;
  animation: dots 1.5s infinite;
}
  
.dot:nth-child(1) { animation-delay: 0s; }
.dot:nth-child(2) { animation-delay: 0.5s; }
.dot:nth-child(3) { animation-delay: 1s; }
  
@keyframes dots {
  0%, 20% { opacity: 0; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-5px); }
  80%, 100% { opacity: 0; transform: translateY(0); }
}

.retry-button {
  margin-top: 16px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: #3498db;
  color: #fff;
  font-size: 14px;
  cursor: pointer;
}
</style>
