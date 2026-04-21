<script setup lang="ts">
import { getData, setData } from 'nuxt-storage/local-storage';
const { getProviderAuthenticationUrl } = useStrapiAuth()

const handleGoogleLogin = () => {
  window.location.href = getProviderAuthenticationUrl(`google/`)
}
const { find, findOne } = useStrapi()
const cities = await find('cities')


 const hasSelection = ref(false)
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
          :cities="cities.data"
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
  text-align: center;
  background: white;
  border-radius: 16px;
  width: min(100%, 360px);
  max-width: calc(100vw - 32px);
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 16px;
  box-sizing: border-box;
  margin-inline: auto;
}




.google-button {
  width: 100%;
}

@media (max-width: 480px) {
  .welcome-container {
    width: 100%;
    max-width: calc(100vw - 24px);
    min-height: auto;
    border-radius: 12px;
  }

  .container-text {
    gap: 14px;
  }

  .container-select {
    gap: 12px;
  }
}
</style>