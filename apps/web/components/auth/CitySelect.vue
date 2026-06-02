<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  cities: { type: Array, required: true },
  placeholder: { type: String, default: 'Выберите город...' },
  value: { type: Object, default: null } 
})

const emit = defineEmits(['update:hasSelection', 'citySelected'])

const selected = ref(props.value)

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
        ui: { base: 'font-[\'Gothic_60\'] text-[14px] py-3 border-0 ring-0 focus:ring-0 bg-transparent' }
      }"
      :placeholder="placeholder"
      :ui="{
        base: 'w-full h-[60px] px-6 rounded-[24px] bg-white border border-black/10 font-[\'Gothic_60\'] text-[14px] text-black uppercase tracking-wider focus:outline-none transition-colors',
        content: 'w-(--reka-select-trigger-width) bg-white shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[24px] border border-black/5 p-2 mt-2 ring-0 flex flex-col',
        viewport: 'relative p-1',
        item: 'group relative w-full flex items-center select-none outline-none rounded-[16px] px-4 py-3.5 cursor-pointer text-black data-[highlighted]:bg-[#477DFF] data-[highlighted]:!text-white data-[state=checked]:bg-[#477DFF] data-[state=checked]:!text-white transition-colors before:hidden',
        itemLabel: 'truncate font-[\'Gothic_60\'] uppercase text-[14px] group-data-[highlighted]:!text-white group-data-[state=checked]:!text-white',
        input: 'border-0 ring-0 focus:ring-0 bg-transparent placeholder:text-black/30 p-4 font-[\'Gothic_60\'] text-[14px]',
        empty: 'p-4 text-center text-black/40 font-[\'Gothic_60\'] text-[14px] uppercase'
      }"
    />
  </div>
</template>