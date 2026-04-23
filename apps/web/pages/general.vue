<script setup lang="ts">
import { getData, setData } from '~/composables/useLocalStore'

const { fetchUser } = useStrapiAuth()
const user = await fetchUser()
const { find, findOne } = useStrapi()
const cities = ref<any>(null)

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
const route = useRoute()
const activeTab = ref('телефон')
const bottomNavRef = ref<HTMLElement | null>(null)
const contentBottomPadding = ref('12px')

let navResizeObserver: ResizeObserver | null = null

const getTabByPath = (path: string) => {
  if (path.startsWith('/shop')) {
    return 'магазин'
  }
  if (path.startsWith('/rating')) {
    return 'рейтинг'
  }
  if (path.startsWith('/profile')) {
    return 'настройки'
  }
  return 'телефон'
}

watch(
  () => route.path,
  (path) => {
    activeTab.value = getTabByPath(path)

    if (path.startsWith('/general')) {
      void refreshSelectedCity()
    }
  },
  { immediate: true }
)

const onTabClick = async (tab: string, path: string) => {
  activeTab.value = tab
  await navigateTo(path)
}

const updateContentBottomPadding = () => {
  if (!bottomNavRef.value) {
    return
  }

  const parsedBottom = Number.parseFloat(getComputedStyle(bottomNavRef.value).bottom || '0')
  const computedBottom = Number.isFinite(parsedBottom) ? parsedBottom : 0

  if (window.innerWidth < 1024) {
    const compactBottomPadding = 0
    contentBottomPadding.value = `${Math.ceil(computedBottom + compactBottomPadding)}px`
    return
  }

  const navHeight = bottomNavRef.value.offsetHeight
  const extraGap = 12
  contentBottomPadding.value = `${Math.ceil(navHeight + computedBottom + extraGap)}px`
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
  updateContentBottomPadding()

  navResizeObserver = new ResizeObserver(() => {
    updateContentBottomPadding()
  })

  if (bottomNavRef.value) {
    navResizeObserver.observe(bottomNavRef.value)
  }

  window.addEventListener('resize', updateContentBottomPadding)
})

onBeforeUnmount(() => {
  navResizeObserver?.disconnect()
  window.removeEventListener('resize', updateContentBottomPadding)
})

onActivated(() => {
  void refreshSelectedCity()
})
</script>


<template >

 
    <div class="main">
        <TheHeader :username="name "  @click="async() => await navigateTo('/profile')"/>
        <div class="display" :style="{ paddingBottom: contentBottomPadding }">
        <div class="right-ornaments" aria-hidden="true">
          <span class="right-ornaments__line right-ornaments__line--outer"></span>
          <span class="right-ornaments__line right-ornaments__line--inner"></span>

          <div class="right-triangle right-triangle--top">
            <div class="right-triangle__base"></div>
            <div class="right-triangle__stroke"></div>
            <div class="right-triangle__suslik"></div>
            <span class="right-triangle__city-name">{{ cities?.data?.name }}</span>
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
         
        <div class="city-section">
            <TwentyText class="section-title">город</TwentyText>
            <div class="cards-lane">
              <CityArea></CityArea>
            </div>
        </div>

        <div class="plot-section">
            <TwentyText class="section-title">выбор сюжета</TwentyText>
            <div class="cards-lane plot-cards-lane">
              <CardSwiper
                  v-if="cities?.data?.documentId"
                  :id="cities.data.documentId"
              />
            </div>      
        </div>

      </div>

      <nav ref="bottomNavRef" class="fixed inset-x-0 bottom-[env(safe-area-inset-bottom)] z-40 flex justify-center px-0 pb-0 md:bottom-6 md:px-4 md:pb-0">
        <div class="w-full max-w-none min-h-[70px] rounded-none bg-[#EAEAEA] px-6 pb-2 pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.14)] md:max-w-[760px] md:min-h-[80px] md:rounded-[30px] md:px-7 md:py-4">
          <ul class="grid h-full grid-cols-4 items-center gap-3 md:h-full md:items-center md:gap-5">
            <li>
              <button
                @click="onTabClick('телефон', '/notification')"
                class="relative flex w-full flex-col items-center justify-center px-1.5 py-1.5 md:py-2"
              >
                <Smartphone
                  :stroke-width="1.7"
                  class="h-[28px] w-[28px]"
                  :class="activeTab === 'телефон' ? 'stroke-[#D33030]' : 'stroke-black'"
                />
                <span
                  class="px-2 py-0.5 text-[15px] leading-none md:text-[13px]"
                  :class="activeTab === 'телефон' ? 'text-[#D33030] border-[#D33030]' : 'text-black border-transparent'"
                >
                  телефон
                </span>
                <span
                  v-if="isNewMassege"
                  class="absolute right-[18%] top-0 h-2.5 w-2.5 rounded-full bg-[#FF4B4B]"
                />
              </button>
            </li>

            <li>
              <button @click="onTabClick('магазин', '/shop')" class="flex w-full flex-col items-center justify-center px-1.5 py-1.5 md:py-2">
                <ShoppingBag
                  :stroke-width="1.7"
                  class="h-[28px] w-[27px]"
                  :class="activeTab === 'магазин' ? 'stroke-[#D33030]' : 'stroke-black'"
                />
                <span
                  class="px-2 py-0.5 text-[15px] leading-none md:text-[13px]"
                  :class="activeTab === 'магазин' ? 'text-[#D33030] border-[#D33030]' : 'text-black border-transparent'"
                >
                  магазин
                </span>
              </button>
            </li>

            <li>
              <button @click="onTabClick('рейтинг', '/rating')" class="flex w-full flex-col items-center justify-center px-1.5 py-1.5 md:py-2">
                <Trophy
                  :stroke-width="1.7"
                  class="h-[25px] w-[27px]"
                  :class="activeTab === 'рейтинг' ? 'stroke-[#D33030]' : 'stroke-black'"
                />
                <span
                  class="px-2 py-0.5 text-[15px] leading-none md:text-[13px]"
                  :class="activeTab === 'рейтинг' ? 'text-[#D33030] border-[#D33030]' : 'text-black border-transparent'"
                >
                  рейтинг
                </span>
              </button>
            </li>

            <li>
              <button @click="onTabClick('настройки', '/profile')" class="flex w-full flex-col items-center justify-center px-1.5 py-1.5 md:py-2">
                <Settings
                  :stroke-width="1.7"
                  class="h-[27px] w-[27px]"
                  :class="activeTab === 'настройки' ? 'stroke-[#D33030]' : 'stroke-black'"
                />
                <span
                  class="px-2 py-0.5 text-[15px] leading-none md:text-[13px]"
                  :class="activeTab === 'настройки' ? 'text-[#D33030] border-[#D33030]' : 'text-black border-transparent'"
                >
                  настройки
                </span>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </div>
</template>
  
<style scoped>
.main {
  font-size: 20px;
    gap: 16px;
    display: flex;
    flex-direction: column;
    overflow-x: hidden;
}

.display{
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0px 20px;
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
    min-width: 0;
}

.plot-cards-lane {
    overflow: visible;
}

.right-ornaments {
    pointer-events: none;
    position: absolute;
    --ornament-right-offset: -8px;
    --triangle-width: 111px;
    --triangle-right-offset: 12px;
    --line-gap: 20px;
    --line-width: 6px;
    --triangle-center-from-right: calc(var(--triangle-right-offset) + (var(--triangle-width) / 2) - (var(--line-width) / 2));
    top: -8px;
    right: var(--ornament-right-offset);
    bottom: 0;
    width: 146px;
    z-index: 0;
}

.right-ornaments__line {
    position: absolute;
    top: -8px;
    bottom: -120px;
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
    top: 18px;
    right: 12px;
}

.right-triangle--middle {
    top: 146px;
    right: 6px;
    width: 124px;
    height: 176px;
    transform: scaleX(-1);
    transform-origin: center;
}

.right-triangle--bottom {
    top: 292px;
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
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: clip;
    transform: translate(-50%, -50%);
    z-index: 5;
}

@media (max-width: 460px) {
  .cards-lane {
    width: max(198px, calc(100% - 110px)) !important;
  }

  .right-ornaments {
    --ornament-right-offset: -14px;
    width: 134px;
  }

  .right-ornaments__line {
    top: -34px;
    bottom: -150px;
  }

  .right-triangle {
    width: 111px;
    height: 157px;
  }

  .right-triangle--middle {
    top: 144px;
    right: 5px;
    width: 120px;
    height: 170px;
  }

  .right-triangle--bottom {
    top: 280px;
    right: 5px;
    width: 120px;
    height: 170px;
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
}

@media (max-width: 1023px) {
  .plot-section {
    margin-top: 80px;
  }

  .cards-lane {
    width: max(206px, calc(100% - 118px));
  }

}

@media (min-width: 1024px) {
  .right-ornaments {
    display: none;
  }
}

</style>
  



