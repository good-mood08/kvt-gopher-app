<script setup lang="ts">
import { getData, setData } from 'nuxt-storage/local-storage';
import BlockClothes from '~/components/BlockClothes.vue';
import SelectClothes from '~/components/BlockClothes.vue';

const { fetchUser } = useStrapiAuth()
const user = await fetchUser()
const { find, findOne } = useStrapi()
const cities = await findOne('cities',getData('cityId'))

const name = user.value?.username!

</script>


<template >
    <div class="main">
        <TheHeader :username="name "/>
        <div class="display">
            <ButtonsShop>
                <template #left>

                    <MenuButton title="назад" @click="async() => await navigateTo('/general')">
                        <template #icon>
                            <Icon name="tdesign:arrow-left"/>
                        </template>
                    </MenuButton>

                </template>
                <template #middle>
                        <MenuButton title="костюмы">
                        <template #icon>
                            <Icon name="fa6-solid:shirt"/>
                        </template>
                    </MenuButton>
                </template>
            <template #right>
                    <MenuButton title="обмен">
                    <template #icon>
                            <Icon name="fluent-emoji-high-contrast:counterclockwise-arrows-button"/>
                        </template>
                    </MenuButton>
            </template>
            
            
        </ButtonsShop>
        <Section>
            Магазин
            <div class="shop-section">
                <Clothes />
                <BlockClothes/>
            </div>
        </Section>
      </div>
    </div>
</template>
  
<style scoped>
.shop-section{
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 20px 0px;
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

</style>
  