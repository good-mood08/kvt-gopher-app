<script setup>
const props = defineProps({
  cities: { type: Array, required: true },
  placeholder: { type: String, default: 'Выберите город...' },
  value: { type: Object, default: null } // 1. Принимаем текущий город из профиля
})

const emit = defineEmits(['update:hasSelection', 'citySelected'])

// 2. Инициализируем селект тем, что пришло из профиля
const selected = ref(props.value)

// 3. Если данные профиля загрузятся чуть позже, обновляем селект
watch(() => props.value, (newVal) => {
  selected.value = newVal
})

watch(selected, (newVal) => {
  if (newVal) {
    emit('update:hasSelection', true)
    emit('citySelected', { city: newVal.documentId })
  } else {
    emit('update:hasSelection', false)
  }
})
</script>

<template>
  <div class="w-full">
    <USelectMenu
      v-model="selected"
      :items="cities"
      label-key="name"
      searchable
      :search-input="{ 
        placeholder: 'Поиск города...',
        ui: { base: 'font-[\'Gothic_60\'] text-[14px] py-3 border-0 ring-0 focus:ring-0 bg-white text-black' }
      }"
      :placeholder="placeholder"
      class="w-full"
      :ui="{
        base: 'w-full h-[60px] px-6 rounded-[24px] bg-white border border-black/10 font-[\'Gothic_60\'] text-[14px] text-black uppercase tracking-wider focus:outline-none transition-colors',
        content: 'w-(--reka-select-trigger-width) bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[24px] border border-black/5 p-2 mt-2 ring-0 ring-transparent flex flex-col',
        viewport: 'relative p-1',
        item: 'group relative w-full flex items-center select-none outline-none rounded-[16px] px-4 py-3.5 cursor-pointer text-black data-[highlighted]:bg-[#477DFF] data-[highlighted]:text-white transition-colors before:hidden',
        itemLabel: 'truncate font-[\'Gothic_60\'] uppercase text-[14px]',
        input: 'border-0 ring-0 focus:ring-0 bg-white text-black placeholder:text-black/30 p-4 font-[\'Gothic_60\'] text-[14px]',
        empty: 'p-4 text-center text-black/40 font-[\'Gothic_60\'] text-[14px] uppercase'
      }"
    />
  </div>
</template>