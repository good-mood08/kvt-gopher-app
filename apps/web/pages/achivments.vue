<script setup lang="ts">
const { fetchUser } = useStrapiAuth()
const user = await fetchUser()

const name = computed(() => user.value?.username ?? 'игрок')

const achievements = Array.from({ length: 10 }, (_, index) => ({
  id: `local-${index + 1}`,
  title: 'собиратель',
  description: 'соберите 100 зданий',
  active: true,
}))
</script>

<template >
    <div class="main">
        <TheHeader :username="name"/>
        <div class="display">
            <ButtonsAchivments>
                <template #left>

                    <MenuButton title="мир">
                        <template #icon>
                            <Icon name="material-symbols:travel-explore"/>
                        </template>
                    </MenuButton>

                </template>
                <template #middle>
                        <MenuButton title="город">
                        <template #icon>
                            <Icon name="tdesign:city-filled"/>
                        </template>
                    </MenuButton>
                </template>
                <template #right>
                    <MenuButton title="битвы">
                    <template #icon>
                            <Icon name="material-symbols-light:swords-rounded"/>
                        </template>
                    </MenuButton>
                </template>
                    <template #main>
                        <MenuButton title="другое">
                        <template #icon>
                            <Icon name="majesticons:more-menu"/>
                        </template>
                    </MenuButton>
                </template>
            </ButtonsAchivments>

            <div class="cards" >
                <Card 
                    v-for="item in achievements"
                    :key="item.id"
                    :id="item.id"
                    :title="item.title"
                    :description="item.description"
                    :active="item.active"
                />
            </div>
      </div>
    </div>
</template>
  
<style scoped>
.cards{
    display: grid;
    grid-template-columns: 1fr 1fr;
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
    gap: 16px;
    padding: 0px 20px;
}

@media (max-width: 1024px) {
  .cards {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .display {
    padding: 0 12px;
    gap: 12px;
  }

  .main {
    gap: 12px;
  }
}

</style>