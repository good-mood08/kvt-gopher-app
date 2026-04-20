<script setup lang="ts">
const props = defineProps<{
    /**
     * id ачивки в базе данных
     */
  id: string
  /**
   * заголовок для достижения
   */
  title: string
  /**
   * описание для достижения
   */
  description: string
    /**
     *собрано ли достижение 
     */
  active: boolean
}>()
const { update } = useStrapi()
const IsActive = ref(!props.active)
async function up() {
    await update('user-achievements',props.id,{ collected:true})
}
</script>
<template>
    
    <Block class="card-area-card">
        <div class="card-call-area">
            <div class="card-name-area">
                <TwentyText>{{ title }}</TwentyText>
                <TenText class="opacity">{{ description }}</TenText>
            </div>
            <div class="card-inf-area">
                <TwelveText class="opacity"></TwelveText>
            </div>
        </div>

        <ButtonAction :disabled="!IsActive" @click="() => {up(), IsActive=false}">

            <span v-if="!IsActive">собрано</span>
            <span v-if="IsActive">собрать!</span>
        </ButtonAction>
    </Block>
    

</template>
<style scoped>
.card-area-card {
  background: radial-gradient(#FFE586, #FBFBFB);
  background-position: bottom left;
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

/* .card-area-card:hover {
  transform: translateY(-5px);
} */

.card-name-area{
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.card-call-area{
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.opacity{
    color: #00000050;
}
.card-inf-area{
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 6px;
    padding: 24px 0px;
}

@media (max-width: 640px) {
  .card-area-card {
    gap: 8px;
    padding: 16px;
    align-items: stretch;
  }

  .card-inf-area {
    padding: 16px 0;
  }
}
</style>