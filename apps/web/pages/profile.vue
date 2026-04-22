<script setup lang="ts">
import { getData, setData } from '~/composables/useLocalStore'


const { fetchUser,logout } = useStrapiAuth()
const user = await fetchUser()
const { find, findOne } = useStrapi()
const userId = user.value?.documentId
const maps = await find('maps',{
    populate:'*'
})


const mapComplite = ref(0)

for (const map of maps.data) {
  const mapData = await findOne('maps', map.documentId, { populate: 'locations' })
  const progresses = await find('user-location-progresses', {
    filters: {
      users_permissions_user: { documentId: userId },
      location: { map: { documentId: map.documentId } }
    }
  })
  if (Math.round((progresses.data.length / mapData.data.locations.length) * 100) === 100){
      mapComplite.value++
  }
}
const map = await find('user-map-stories',{filters:{
    users_permissions_user: { documentId: { $eq: userId } }
}})
const locationComlite = await find('user-location-progresses',{filters:{
    users_permissions_user: { documentId: { $eq: userId } }
}})
const achievementsComplite = await find('user-achievements',{filters:{
    users_permissions_user: { documentId: { $eq: userId } }
}})
const name = user.value?.username!
const stats = [
  { number: locationComlite.data.length, label: 'локаций пройдено' },
  { number: map.data.length, label: 'карт опробовано' },
  { number: achievementsComplite.data.length, label: 'достижений собрано' },
  { number: mapComplite.value, label: 'карт пройдено' }
]

// const achievements = [
//   {
//     id: '1',
//     title: 'СОБИРАТЕЛЬ',
//     description: 'СОБЕРИТЕ 100 ЗАДАНИЙ',
//     color: '#FFE586',
//     active: true
//   },
//   {
//     id: '2',
//     title: 'ЧУДО-МЭР',
//     description: 'ДОСТИГНИТЕ ОТМЕТКИ В 1000 ЖИТЕЛЕЙ В СВОЕМ ГОРОДЕ',
//     color: '#FFD6D6',
//     active: false
//   }
// ]
const achievements = await find('user-achievements',{
    populate:{
        achievement:true
    }
})
const city = ref()
city.value = await findOne('cities',getData('cityId'))

const cities = await find('cities')
const handleCitySelected = ({ city }) => {
setData('cityId', city, 1 , 'd')
}

const suslic = ref('/images/suslo.svg')
</script>


<template >
    <div class="main">
        <TheHeader :username="name "/>
        <div class="display">
            <CitySelect
                :cities="cities.data"
                @citySelected="handleCitySelected"
                :value="city.data.name"
            />

            <div class="section">
                <TwentyText>статистика</TwentyText>
                <div class="statistic-card">
                    <Statistic :title="i.number" :description="i.label" v-for="i in stats"></Statistic>
                </div>
            </div>
                
            
                <!-- <img src="../public/images/block-suslik.png" alt=""> -->
            



            <div class="inv-area">
                <div class="achievements-header">
                    <TwentyText>твой суслик</TwentyText>
                </div>
                <div class="ch-area">
                    <img :src="suslic" class="p" style="height: 202px;">
                    <div class="inventar-area">
                        <Block @click="() => {suslic = '/images/suslo.svg' }" class="e"><div class="ssss"><Icon class="wwww" name="tdesign:close"></Icon></div></Block>
                        <Block @click="() => {suslic = '/images/suskic_in_jacket.svg' }" class="g"><img src="/images/Jacket.svg" alt="" style="height: 37px;"></Block>
                        <Block class="g"></Block>
                        <Block class="g"></Block>
                        <Block class="g"></Block>
                        <Block class="g"></Block>
                        <Block class="g"></Block>
                        <Block class="g"></Block>
                        <Block class="g"></Block>
                    </div>
                </div>            
            </div>
                                  <div class="section">
                        <div class="achievements-header">
                            <TwentyText>достижения</TwentyText>
                            <a style="text-decoration: none; color: black;" href="???"><TwentyText>смотреть всё></TwentyText></a>
                        </div>
                        <div class="blocks">
                            <Card :id="i.documentId" :active="i.collected" :description="i.achievement.description" :title="i.achievement.title" v-for="i in achievements.data"/>
                    
                        </div>
                    </div>
                <ButtonAction class="exit" @click="() => {logout(), navigateTo('/')}">
                    выход из профиля
                </ButtonAction>
        </div>
    </div>
</template>

<style scoped>

.ssss{
    display: flex;
    align-items: center;
    text-align: center;
}
.exit{
    width: 100%;
}
.e{
    background-color: #EFEFEF;
    width: 57px;
    aspect-ratio: 1;
    color: #00000050;
    border: 1px solid #00000050;
}
.p{
    padding-left: 24px;
}
.inv-area{
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.g{
    display: flex;
    background-color: #EFEFEF;
    justify-content: center;
    align-items: center;
    width: 57px;
    aspect-ratio: 1;
}
.tab-area-grid{
    display: grid;
    grid-template-rows: repeat(4, 1fr);
    grid-template-columns: 1fr;
}
.ch-area{
    display: grid;
    grid-template-columns: 4fr 5fr 1fr;
    grid-template-rows: repeat(1,1fr);
    gap: 16px;
}
.menu{
    display: flex;
    flex-direction: column;
}
.suslik-area-card{
    display: flex;
    flex-direction: row;
}

/* .suslik-card{
    display: grid;
    grid-template-columns: repeat(3, 1fr);

} */

.section{

    display: flex;
    gap: 16px;
    flex-direction: column;
}
.achievements-header{
    display: flex;
    flex-direction: row;
    justify-content: space-between;
}
.blocks{
    display: flex;
    gap: 16px;
}
.statistic-card{
    display: flex;
    flex-direction: row;
    gap: 16px;
}
.main {
  font-size: 20px;
    gap: 16px;
    display: flex;
    flex-direction: column;
}

.display{
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 0px 20px;
}

.inventar-area{
    display: grid;
    grid-template-columns: repeat(3,1fr);
    grid-template-rows: repeat(3,1fr);
    gap: 16px;
}

</style>
  