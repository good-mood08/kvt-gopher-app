<script setup lang="ts">
import { getData, setData } from '~/composables/useLocalStore'

const { fetchUser } = useStrapiAuth()
const user = await fetchUser()
const { find, findOne } = useStrapi()
const cities = await findOne('cities',getData('cityId'))

const name = user.value?.username!
const isNewMassege = ref(false)
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
</script>


<template >

 
    <div class="main">
        <TheHeader :username="name "  @click="async() => await navigateTo('/profile')"/>
        <div class="display">
            <HomeHeader>
                <template #left>

                    <MenuButton title="Телефон" :unread="isNewMassege" @click="async() => await navigateTo('/notification')">
                        <template #icon>
                            <Icon name="material-symbols:phone-android"/>
                        </template>
                    </MenuButton>

                </template>
                <template #middle>
                        <MenuButton title="магазин" @click="async() => await navigateTo('/shop')">
                        <template #icon>
                            <Icon name="tdesign:shop"/>
                        </template>
                    </MenuButton>
                </template>
            <template #right>
                    <MenuButton title="рейтинг" @click="async() => await navigateTo('/profile')">
                    <template #icon>
                            <Icon name="solar:cup-outline"/>
                        </template>
                    </MenuButton>
            </template>
            
            
        </HomeHeader>
        
        <div class="city-section">
            <TwentyText>город</TwentyText>
            <CityArea></CityArea>
        </div>

        <div class="plot-section">
            <TwentyText>выбор сюжета</TwentyText>
            <CardSwiper 
                :id="cities.data.documentId"
            />      
        </div>

      </div>
    </div>
</template>
  
<style scoped>
.main {
  font-size: 20px;
    gap: 16px;
    display: flex;
    flex-direction: column;
}

.display{
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 0px 20px;
}
.city-section{
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.plot-section{
    display: flex;
    flex-direction: column;
}


</style>
  