<script setup lang="ts">
import { getData, setData } from '~/composables/useLocalStore'


const { fetchUser,logout } = useStrapiAuth()
const user = await fetchUser()
const { find, findOne } = useStrapi()
const userId = user.value?.documentId

const FALLBACK_SUSLIK = '/images/suslo.svg'

const ownedCloths = ref<Array<{
  documentId: string
  dataUrl: string
  sislikUrl: string
}>>([])

if (userId) {
  const clothUsersRes = await find('cloth-users', {
    filters: {
      users_permissions_user: { documentId: { $eq: userId } },
    },
    populate: {
      cloth: { populate: { data: true, sislik: true } },
    },
  })
  const byId = new Map<string, { documentId: string, dataUrl: string, sislikUrl: string }>()
  for (const row of clothUsersRes?.data ?? []) {
    const cloth = row.cloth as Record<string, unknown> | undefined
    if (!cloth?.documentId) continue
    const id = String(cloth.documentId)
    if (byId.has(id)) continue
    const sislikUrl = useStrapiMediaUrlFirst(cloth.sislik)
    const dataUrl = useStrapiMediaUrl(cloth.data)
    byId.set(id, {
      documentId: id,
      dataUrl: dataUrl || '/images/Jacket.svg',
      sislikUrl: sislikUrl || dataUrl || FALLBACK_SUSLIK,
    })
  }
  ownedCloths.value = [...byId.values()]
}

const suslic = ref(FALLBACK_SUSLIK)

function equipCloth(sislikUrl: string) {
  suslic.value = sislikUrl || FALLBACK_SUSLIK
}

function unequip() {
  suslic.value = FALLBACK_SUSLIK
}
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
  { number: locationComlite.data.length, label: 'зданий собрано' },
  { number: map.data.length, label: 'карт открыто' },
  { number: achievementsComplite.data.length, label: 'достижений собрано' },
  { number: mapComplite.value, label: 'карт пройдено' }
]
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

type WardrobeSlot = {
  id: string
  kind: 'icon' | 'image' | 'empty'
  icon?: string
  image?: string
  outfit?: string | null
}

const wardrobeSlots: WardrobeSlot[] = [
  { id: 'reset', kind: 'icon', icon: 'mdi:close', outfit: '/images/suslo.svg' },
  { id: 'jacket', kind: 'image', image: '/images/Jacket.svg', outfit: '/images/suskic_in_jacket.svg' },
  { id: 'empty-1', kind: 'empty' },
  { id: 'empty-2', kind: 'empty' },
  { id: 'empty-3', kind: 'empty' },
  { id: 'empty-4', kind: 'empty' },
  { id: 'empty-5', kind: 'empty' },
  { id: 'empty-6', kind: 'empty' },
  { id: 'empty-7', kind: 'empty' },
  { id: 'empty-8', kind: 'empty' },
  { id: 'empty-9', kind: 'empty' },
  { id: 'empty-10', kind: 'empty' }
]
const selectWardrobeSlot = (slot: WardrobeSlot) => {
  if (!slot.outfit) {
    return
  }

  suslic.value = slot.outfit
}

const isWardrobeSlotActive = (slot: WardrobeSlot) =>
  Boolean(slot.outfit && suslic.value === slot.outfit)
</script>


<template >
    <div class="main">
        <div class="profile-topbar">
            <div class="profile-topbar-inner">
                <div class="profile-user">
                    <div class="profile-avatar">
                        <img src="/images/Semen.png" alt="Profile avatar">
                    </div>
                    <div class="profile-user-meta">
                        <p class="profile-name">{{ name }}</p>
                        <p class="profile-exp">0 EXP</p>
                    </div>
                </div>
                <CitySelect
                    class="profile-city-select"
                    :cities="cities.data"
                    @citySelected="handleCitySelected"
                    :value="city.data.name"
                />
            </div>
        </div>
        <div class="display">
            <div class="section profile-stats-section">
                <TwentyText class="profile-stats-title">статистика</TwentyText>
                <div class="statistic-card">
                    <Statistic
                        v-for="i in stats"
                        :key="i.label"
                        :title="i.number"
                        :description="i.label"
                    />
                </div>
            </div>
                
            
                <!-- <img src="../public/images/block-suslik.png" alt=""> -->
            



            <div class="inv-area">
                <div class="achievements-header">
                    <TwentyText>твой чушпан</TwentyText>
                </div>
                <div class="dress-layout">
                    <div class="dress-scene">
                        <img src="/images/shopsuslik.svg" class="dress-scene-bg" alt="" aria-hidden="true">
                        <img :src="suslic" class="dress-suslik" alt="суслик в образе">
                    </div>

                    <div class="wardrobe-grid">
                        <button
                          v-for="slot in wardrobeSlots"
                          :key="slot.id"
                          type="button"
                          class="wardrobe-slot"
                          :class="{
                            'wardrobe-slot--clickable': Boolean(slot.outfit),
                            'wardrobe-slot--selected': isWardrobeSlotActive(slot),
                            'wardrobe-slot--empty': slot.kind === 'empty'
                          }"
                          :disabled="!slot.outfit"
                          @click="selectWardrobeSlot(slot)"
                        >
                          <img
                            v-if="slot.kind === 'image' && slot.image"
                            :src="slot.image"
                            alt=""
                            class="wardrobe-slot-image"
                          >
                          <Icon
                            v-else-if="slot.kind === 'icon' && slot.icon"
                            :name="slot.icon"
                            class="wardrobe-slot-icon"
                          />
                        </button>
                    </div>
                </div>
            </div>

            <div class="section">
                <div class="achievements-header">
                    <TwentyText>достижения</TwentyText>
                    <NuxtLink class="achievements-link" to="/achivments">см.всё</NuxtLink>
                </div>
                <div class="blocks achievements-cards">
                    <ProfileAchievementCard
                      v-for="(i, idx) in achievements.data"
                      :key="i.documentId"
                      :id="i.documentId"
                      :collected="Boolean(i.collected)"
                      :description="String(i.achievement?.description || '')"
                      :title="String(i.achievement?.title || '')"
                      :variant="idx % 2 === 0 ? 'sun' : 'mint'"
                    />
                </div>
            </div>
            <ButtonAction class="exit" @click="() => {logout(), navigateTo('/')}" >
                выход из профиля
            </ButtonAction>
        </div>
        <FooterNav />
    </div>
</template>

<style scoped>

.profile-topbar{
    background-color: #D3D3D5;
    padding: 14px 20px 10px;
}

.profile-topbar-inner{
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
}

.profile-user{
    display: flex;
    align-items: center;
    gap: 14px;
    min-width: 0;
}

.profile-avatar{
    width: 48px;
    height: 48px;
    border-radius: 999px;
    overflow: hidden;
    background-color: #f2f2f2;
    flex-shrink: 0;
}

.profile-avatar img{
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.profile-user-meta{
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.profile-name{
    margin: 0;
    color: #111111;
    font-family: 'Gothic 60';
    font-size: 20px;
    line-height: 0.92;
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
}

.profile-exp{
    margin: 0;
    color: #7e7e7e;
    font-family: 'Gothic 60';
    font-size: 10px;
    line-height: 0.9;
    text-transform: uppercase;
}

.profile-city-select{
    width: min(280px, 40vw);
    flex-shrink: 0;
}

.profile-city-select :deep(.trigger){
    height: 64px;
    border: none;
    border-radius: 999px;
    padding: 0 20px;
    gap: 10px;
    background-color: #f1f1f1;
    box-shadow: none;
}

.profile-city-select :deep(.input){
    color: #111111;
    font-family: 'Gothic 60';
    font-size: 15px;
    line-height: 1;
    text-transform: uppercase;
}

.profile-city-select :deep(.icon){
    font-size: 16px;
    line-height: 1;
    transform: translateY(-2px);
}

.profile-city-select :deep(.item){
    font-size: 16px;
}

.profile-stats-section{
    align-items: center;
}

.profile-stats-title{
    margin: 8px 0 2px;
    text-align: center;
    font-family: 'Gothic 60';
    font-size: 24px;
    line-height: 0.92;
}

.achievements-header :deep(.text){
    font-size: 24px;
    text-align: center;
    margin: 0 auto;
}

.exit{
    width: 100%;
}
.inv-area{
    display: flex;
    flex-direction: column;
    gap: 0;
}

.inv-area .achievements-header{
    margin-bottom: -12px;
}

.dress-layout{
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(214px, 0.98fr);
    gap: 0;
    align-items: end;
}

.dress-scene{
    position: relative;
    min-height: 424px;
    width: calc(100% + 124px);
    max-width: 560px;
    display: flex;
    align-items: end;
    justify-content: flex-start;
}

.dress-scene-bg{
    width: 100%;
    height: auto;
    display: block;
}

.dress-suslik{
    position: absolute;
    z-index: 1;
    left: min(58%, 320px);
    bottom: 26px;
    height: 332px;
    width: auto;
    transform: translateX(-50%);
}

.wardrobe-grid{
    display: grid;
    grid-template-columns: repeat(3, 47px);
    gap: 8px;
    width: 157px;
    justify-self: end;
    align-self: end;
    margin-left: 0;
    margin-bottom: 34px;
    position: relative;
    z-index: 2;
}

.wardrobe-slot{
    width: 47px;
    height: 47px;
    border: none;
    border-radius: 16px;
    background: #EFEFEF;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
}

.wardrobe-slot--clickable{
    cursor: pointer;
}

.wardrobe-slot--selected{
    outline: 2px solid #5d7eea;
    outline-offset: -2px;
    background: #edf1ff;
}

.wardrobe-slot--empty{
    background: #EFEFEF;
}

.wardrobe-slot:disabled{
    cursor: default;
}

.wardrobe-slot-image{
    width: 30px;
    height: 30px;
    object-fit: contain;
}

.wardrobe-slot-icon{
    font-size: 28px;
    color: #1d1d1f;
}

.section{
    display: flex;
    gap: 16px;
    flex-direction: column;
}
.achievements-header{
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    position: relative;
}

.achievements-link{
    color: #6188f3;
    text-decoration: none;
    font-family: 'Gothic 60';
    font-size: 15px;
    line-height: 0.9;
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
}

.achievements-link:hover{
    opacity: 0.85;
}

.blocks{
    display: flex;
    gap: 16px;
}

.achievements-cards{
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 12px;
    row-gap: 12px;
    align-items: stretch;
}
.statistic-card{
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    width: 100%;
}
.main {
    font-size: 20px;
    gap: 0;
    display: flex;
    flex-direction: column;
}

.display{
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 0px 20px 110px;
}

.inventar-area{
    display: grid;
    grid-template-columns: repeat(3,1fr);
    grid-template-rows: repeat(3,1fr);
    gap: 16px;
}

@media (max-width: 900px) {
    .profile-city-select{
        width: min(220px, 36vw);
    }

    .profile-city-select :deep(.trigger){
        height: 56px;
        border-radius: 999px;
        padding: 0 16px;
    }

    .profile-city-select :deep(.input){
        font-size: 14px;
    }

    .dress-layout{
        grid-template-columns: minmax(0, 1fr) minmax(172px, 0.95fr);
        gap: 0;
    }

    .dress-scene{
        min-height: 356px;
        width: calc(100% + 96px);
        max-width: 500px;
    }

    .dress-scene-bg{
        width: 100%;
    }

    .dress-suslik{
        left: min(58%, 270px);
        bottom: 22px;
        height: 274px;
    }

    .wardrobe-grid{
        grid-template-columns: repeat(3, 47px);
        gap: 8px;
        width: 157px;
        justify-self: end;
        align-self: end;
        margin-left: 0;
        margin-bottom: 32px;
    }

    .wardrobe-slot{
        width: 47px;
        height: 47px;
        border-radius: 16px;
    }

    .wardrobe-slot-image{
        width: 30px;
        height: 30px;
    }

    .wardrobe-slot-icon{
        font-size: 28px;
    }
}

@media (max-width: 560px) {
    .profile-topbar{
        padding: 12px 14px 10px;
    }

    .profile-topbar-inner{
        gap: 10px;
    }

    .profile-user{
        gap: 10px;
    }

    .display{
        padding: 0 14px 100px;
    }

    .profile-avatar{
        width: 48px;
        height: 48px;
    }

    .profile-exp{
        font-size: 10px;
    }

    .profile-city-select{
        width: min(156px, 40vw);
    }

    .profile-city-select :deep(.trigger){
        height: 44px;
        border-radius: 999px;
        padding: 0 12px;
    }

    .profile-city-select :deep(.input){
        font-size: 13px;
    }

    .profile-city-select :deep(.icon){
        font-size: 12px;
        transform: translateY(-1px);
    }

    .statistic-card{
        gap: 12px;
    }

    .dress-layout{
        grid-template-columns: minmax(0, 1fr) minmax(132px, 0.92fr);
        gap: 0;
    }

    .dress-scene{
        min-height: 288px;
        width: calc(100% + 70px);
        max-width: 430px;
    }

    .dress-scene-bg{
        width: 100%;
    }

    .dress-suslik{
        left: min(58%, 230px);
        bottom: 18px;
        height: 226px;
    }

    .wardrobe-grid{
        grid-template-columns: repeat(3, 47px);
        gap: 6px;
        width: 153px;
        justify-self: end;
        align-self: end;
        margin-left: 0;
        margin-bottom: 28px;
    }

    .wardrobe-slot{
        width: 47px;
        height: 47px;
        border-radius: 16px;
    }

    .wardrobe-slot-image{
        width: 30px;
        height: 30px;
    }

    .wardrobe-slot-icon{
        font-size: 28px;
    }

}

</style>
  
