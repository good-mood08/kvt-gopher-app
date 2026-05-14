<script setup lang="ts">
import { getData, setData } from '~/composables/useLocalStore'

const { fetchUser } = useStrapiAuth()
const user = await fetchUser()
const { find, findOne } = useStrapi()
const cities = ref<any>(null)
const userTourId = computed(() => {
  const currentUser = user.value as Record<string, unknown> | null | undefined
  return currentUser?.documentId ?? currentUser?.id ?? null
})

const refreshSelectedCity = async () => {
  const selectedCityId = getData('cityId')

  if (!selectedCityId) {
    cities.value = null
    return
  }

  cities.value = await findOne('cities', selectedCityId)
}

await refreshSelectedCity()

const name = user.value?.username!
const isNewMassege = ref(false)
const headerRef = ref<HTMLElement | null>(null)
const headerHeight = ref(0)
const contentBottomPadding = ref('104px')

let headerResizeObserver: ResizeObserver | null = null

const updateHeaderHeight = () => {
  headerHeight.value = headerRef.value?.offsetHeight ?? 0
}

const updateContentBottomPadding = () => {
  if (window.innerWidth < 1024) {
    contentBottomPadding.value = '104px'
    return
  }

  contentBottomPadding.value = '126px'
}

onMounted(async()=>{



   isNewMassege.value = await isRead(getData('cityId'))
    async function isRead(id){
      const { find, create, findOne } = useStrapi()
      const {  fetchUser } = useStrapiAuth()
      const user = await fetchUser()
      const userId = user.value?.documentId

      const existingRead = await find('read-notigications', {
        populate:{
            sity_notification:{
                populate:{
                    city:true
                }
            }
        },
      filters: {
        users_permissions_user: { documentId: { $eq: userId } },
        },
      })
      const filteredRead = existingRead.data.filter(doc => {
        const docId = doc.sity_notification?.city?.documentId;
        // Оставляем объект, если documentId НЕ существует ИЛИ равен targetId
        return docId === undefined || docId === null || docId === id;
        });
    //   console.log(filteredRead.length);
      const Userexisting = await find('user-notigications', {
        filters: {
            users_permissions_user: { documentId: { $eq: userId } },
            },
        })
        const Cityexisting = await find('sity-notifications', {
        filters: {
        
            city:{
                documentId: { $eq: id }   
            } 
            
        },
        })
        // console.log(Userexisting.data , Cityexisting.data);
        
        if ( ((Userexisting.data.length + Cityexisting.data.length) - filteredRead.length) > 0 ) {
            // console.log((Userexisting.data.length + Cityexisting.data.length) - filteredRead.length);
            
            return true
        } else {
            return false
        }
      
    
    }

})

onMounted(() => {
  const { startHomeTour } = useHomeOnboardingTour()

  updateHeaderHeight()
  updateContentBottomPadding()

  headerResizeObserver = new ResizeObserver(() => {
    updateHeaderHeight()
  })

  if (headerRef.value) {
    headerResizeObserver.observe(headerRef.value)
  }

  window.addEventListener('resize', updateHeaderHeight)
  window.addEventListener('resize', updateContentBottomPadding)

  void startHomeTour({ userId: userTourId.value })
})

onBeforeUnmount(() => {
  headerResizeObserver?.disconnect()
  window.removeEventListener('resize', updateHeaderHeight)
  window.removeEventListener('resize', updateContentBottomPadding)
})

onActivated(() => {
  void refreshSelectedCity()
})
</script>


<template >

 
    <div class="main" :style="{ '--header-offset': `${headerHeight}px` }">
        <div ref="headerRef">
          <TheHeader :username="name" @click="async() => await navigateTo('/profile')"/>
        </div>
        <div class="display" :style="{ paddingBottom: contentBottomPadding }">
        <div class="right-ornaments" aria-hidden="true">
          <span class="right-ornaments__line right-ornaments__line--outer"></span>
          <span class="right-ornaments__line right-ornaments__line--inner"></span>

          <div class="right-triangle right-triangle--top">
            <div class="right-triangle__base"></div>
            <div class="right-triangle__gradient right-triangle__gradient--top"></div>
          </div>

          <div class="right-triangle right-triangle--middle">
            <div class="right-triangle__base"></div>
            <div class="right-triangle__gradient right-triangle__gradient--up"></div>
          </div>

          <div class="right-triangle right-triangle--bottom">
            <div class="right-triangle__base"></div>
            <div class="right-triangle__gradient right-triangle__gradient--down"></div>
          </div>
        </div>
         
        <div class="city-section" data-tour="home-city-section">
            <TwentyText class="section-title">город</TwentyText>
            <div class="cards-lane">
              <CityArea></CityArea>
            </div>
        </div>

        <div class="plot-section" data-tour="home-stories-section">
            <TwentyText class="section-title">выбор сюжета</TwentyText>
            <div class="cards-lane plot-cards-lane">
              <CardSwiper
                  v-if="cities?.data?.documentId"
                  :id="cities.data.documentId"
              />
            </div>      
        </div>

      </div>

      <FooterNav />
    </div>
</template>
  
<style scoped>
.main {
  font-size: clamp(16px, 4.8vw, 20px);
    gap: clamp(10px, 2.5vw, 16px);
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    overflow-x: hidden;
}

.display{
    display: flex;
    flex-direction: column;
    gap: clamp(10px, 2.8vw, 16px);
    padding: 0 clamp(12px, 4vw, 20px);
    position: relative;
}
.city-section{
    display: flex;
    flex-direction: column;
    gap: 0;
    position: relative;
    z-index: 1;
}

.plot-section{
    display: flex;
    flex-direction: column;
    gap: 0;
    margin-top: 30px;
    position: relative;
    z-index: 1;
}

.section-title {
    margin: 0 0 12px;
    padding-inline: 0;
    font-size: 22px !important;
    line-height: 1;
}

.cards-lane {
    width: 100%;
    max-width: 100%;
    min-width: 0;
}

.plot-cards-lane {
    overflow: visible;
}

.right-ornaments {
    pointer-events: none;
    position: absolute;
    --ornament-right-offset: 8px;
    --triangle-width: 111px;
    --triangle-right-offset: 12px;
    --line-gap: 20px;
    --line-width: 6px;
    --triangle-center-from-right: calc(var(--triangle-right-offset) + (var(--triangle-width) / 2) - (var(--line-width) / 2));
    --triangles-top: var(--header-offset, 0px);
    top: calc(var(--header-offset, 0px) * -1);
    right: var(--ornament-right-offset);
    bottom: auto;
    height: 100dvh;
    width: 146px;
    z-index: 0;
}

.right-ornaments__line {
    position: absolute;
    top: 0;
    bottom: 0;
    width: var(--line-width);
    background: #E2E2E2;
    z-index: 0;
}

.right-ornaments__line--outer {
    right: calc(var(--triangle-center-from-right) + (var(--line-gap) / 2));
}

.right-ornaments__line--inner {
    right: calc(var(--triangle-center-from-right) - (var(--line-gap) / 2));
}

.right-triangle {
    position: absolute;
    width: var(--triangle-width);
    height: 157px;
    overflow: hidden;
    clip-path: polygon(0 0, 100% 37%, 100% 63%, 0 100%);
    z-index: 1;
}

.right-triangle--top {
    top: var(--triangles-top);
    right: 6px;
    width: 124px;
    height: 176px;
}

.right-triangle--middle {
    top: calc(var(--triangles-top) + 128px);
    right: 6px;
    width: 124px;
    height: 176px;
    transform: scaleX(-1);
    transform-origin: center;
}

.right-triangle--bottom {
    top: calc(var(--triangles-top) + 274px);
    right: 6px;
    width: 124px;
    height: 176px;
}

.right-triangle__base {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background-image: url('/images/background_triangle.svg');
    background-repeat: no-repeat;
    background-size: 100% 100%;
    background-position: center;
    z-index: 1;
}

.right-triangle__gradient {
    position: absolute;
    inset: 0;
    background-position: center;
    background-size: cover;
    background-repeat: no-repeat;
    opacity: 0.8;
    z-index: 2;
}

.right-triangle__gradient--up {
    background-image: url('/images/triangle_up.svg');
    transform: scaleX(-1);
    transform-origin: center;
}

.right-triangle__gradient--top {
    background-image: url('/images/34.svg');
    inset: 10% 9%;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
}

.right-triangle__gradient--down {
    background-image: url('/images/triangle_down.svg');
}

.right-triangle__stroke {
    position: absolute;
    inset: 10% 9%;
    width: 82%;
    height: 80%;
    background-image: url('/images/triangle.svg');
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    z-index: 3;
}

.right-triangle__suslik {
    position: absolute;
    right: 22%;
    bottom: 9%;
    width: 48%;
    height: 48%;
    background-image: url('/images/suslic_main.svg');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    z-index: 4;
}

.right-triangle__city-name {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 72%;
    margin: 0;
    color: #D33030;
    font-family: 'Gothic 60';
    font-size: 22px;
    line-height: 1.08;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    text-align: center;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    display: -webkit-box;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: clip;
    transform: translate(-50%, -50%);
    z-index: 5;
}

@media (max-width: 460px) {
  .right-ornaments {
    --ornament-right-offset: 2px;
    --triangle-width: 92px;
    --triangle-right-offset: 10px;
    --line-gap: 16px;
    --line-width: 5px;
  }

  .right-triangle {
    width: 92px;
    height: 132px;
  }

  .right-triangle--top {
    right: 4px;
    width: 102px;
    height: 146px;
  }

  .right-triangle--middle {
    top: calc(var(--triangles-top) + 104px);
    right: 4px;
    width: 102px;
    height: 146px;
  }

  .right-triangle--bottom {
    top: calc(var(--triangles-top) + 212px);
    right: 4px;
    width: 102px;
    height: 146px;
  }

  .right-triangle__suslik {
    right: 26%;
    bottom: 12%;
    width: 44%;
    height: 44%;
  }

  .right-triangle__city-name {
    top: 50%;
    left: 50%;
    width: 70%;
    font-size: 12px;
  }

  .display {
    --ornament-reserve: clamp(112px, 34vw, 132px);
    padding-inline: 12px;
  }

  .plot-section {
    margin-top: clamp(180px, 52vw, 230px);
  }
}

@media (max-width: 360px) {
  .right-ornaments {
    --triangle-width: 23.3vw;
    --triangle-right-offset: 2.2vw;
    --line-gap: 3.9vw;
    --line-width: 1.1vw;
    --ornament-right-offset: 0.4vw;
  }

  .right-triangle {
    width: 23.3vw;
    height: 33.9vw;
  }

  .right-triangle--top {
    right: 0.8vw;
    width: 26.1vw;
    height: 37.8vw;
  }

  .right-triangle--middle {
    top: calc(var(--triangles-top) + 26.7vw);
    right: 0.8vw;
    width: 26.1vw;
    height: 37.8vw;
  }

  .right-triangle--bottom {
    top: calc(var(--triangles-top) + 54.4vw);
    right: 0.8vw;
    width: 26.1vw;
    height: 37.8vw;
  }

  .right-triangle__city-name {
    font-size: 3.1vw;
  }

  .display {
    --ornament-reserve: 29vw;
    padding-inline: 2.8vw;
  }

  .plot-section {
    margin-top: 58vw;
  }

  .section-title {
    font-size: 3.9vw !important;
    margin-bottom: 1.7vw;
  }

}

@media (max-width: 1023px) {
  .right-ornaments {
    --triangle-width: clamp(94px, 25vw, 104px);
    --triangle-right-offset: 10px;
    --line-gap: 18px;
    --line-width: 5px;
  }

  .right-triangle {
    height: clamp(136px, 36vw, 148px);
  }

  .right-triangle--top {
    right: 4px;
    width: clamp(104px, 29vw, 114px);
    height: clamp(150px, 40vw, 162px);
  }

  .right-triangle--middle {
    top: calc(var(--triangles-top) + clamp(108px, 29vw, 122px));
    right: 4px;
    width: clamp(104px, 29vw, 114px);
    height: clamp(150px, 40vw, 162px);
  }

  .right-triangle--bottom {
    top: calc(var(--triangles-top) + clamp(222px, 59vw, 242px));
    right: 4px;
    width: clamp(104px, 29vw, 114px);
    height: clamp(150px, 40vw, 162px);
  }

  .display {
    gap: clamp(10px, 2.2vw, 14px);
    --ornament-reserve: clamp(118px, 35vw, 146px);
  }

  .plot-section {
    margin-top: clamp(100px, 24vw, 190px);
  }

  .city-section,
  .plot-section {
    width: calc(100% - var(--ornament-reserve));
    min-width: 0;
  }

  .section-title {
    font-size: clamp(15px, 4.8vw, 22px) !important;
    margin-bottom: clamp(6px, 2vw, 10px);
  }

}

@media (min-width: 1024px) {
  .right-ornaments {
    display: none;
  }
}

</style>
  



