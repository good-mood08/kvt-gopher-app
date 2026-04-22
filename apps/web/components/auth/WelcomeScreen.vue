<script setup lang="ts">
import { setData } from '~/composables/useLocalStore'
const { getProviderAuthenticationUrl } = useStrapiAuth()

const handleGoogleLogin = () => {
  window.location.href = getProviderAuthenticationUrl(`google/`)
}
const { find } = useStrapi()
const cities = ref<any[]>([])
const hasSelection = ref(false)

try {
  const response = await find('cities')
  cities.value = Array.isArray((response as any)?.data) ? (response as any).data : []
} catch (error) {
  console.error('Не удалось загрузить список городов:', error)
}

const handleCitySelected = ({ city }) => {
setData('cityId', city, 1 , 'd')
}
</script>

<template>
  
  <div class="welcome-container">
    <div class="container-text">
      <TwentyText class="welcome-title">ДОБРО ПОЖАЛОВАТЬ В НАЗВАНИЕИГРЫ!</TwentyText>
      <TwelveText class="welcome-text">Пожалуйста, выберите город, в котором мы начнём</TwelveText>
    </div>
    <div class="container-select">
        <div class="select-container">
        <CitySelect 
          :cities="cities"
          v-model:hasSelection="hasSelection"
          @citySelected="handleCitySelected"
        />
      </div>

      <ButtonAction class="google-button" @click="handleGoogleLogin" :disabled="!hasSelection">
        ВОЙТИ С GOOGLE
      </ButtonAction>
    </div>
    
    
  </div>
</template>

<style scoped>
.container-select{
display: flex;
flex-direction: column;
gap: 16px;
}
.container-text{
  display: flex;
  flex-direction: column;
  text-align: start;
  gap: 20px;
}
.welcome-container {
  padding: clamp(14px, 3vw, 20px);
  padding: clamp(14px, 3vw, 20px);
  text-align: center;
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 380px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  box-sizing: border-box;
  margin-inline: auto;
  gap: 16px;
  box-sizing: border-box;
  margin-inline: auto;
}




.google-button {
  width: 100%;
}

@media (max-width: 480px) {
@media (max-width: 480px) {
  .welcome-container {
    width: 100%;
    max-width: none;
    min-height: auto;
    border-radius: 12px;
  }

  .container-text {
    gap: 14px;
  .container-text {
    gap: 14px;
  }

  .container-select {
    gap: 12px;
  .container-select {
    gap: 12px;
  }
}
}
</style>