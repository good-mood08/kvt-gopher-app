<script setup lang="ts">
type StatItem = {
  id: string
  number: number | string
  label: string
}

defineProps<{
  stats: StatItem[]
}>()
</script>

<template>
  <div class="flex flex-col gap-[16px] items-center">
    
    <div 
      class="w-full max-w-full rounded-[26px] border border-gray-200 box-border overflow-hidden pt-[14px] px-[12px] pb-[16px] shadow-sm [background:linear-gradient(90deg,rgba(93,134,245,0.6)_0%,rgba(231,207,82,0.6)_50%,rgba(126,203,205,0.6)_100%)_0_0_/_100%_4px_no-repeat,_linear-gradient(165deg,#f3f4f6_0%,#e5e7eb_100%)]" 
      role="region" 
    >
      <div class="flex flex-col gap-[10px]" role="list">
        
        <div 
          v-for="row in stats"
          :key="row.id"
          class="grid grid-cols-[minmax(2.75rem,auto)_minmax(0,1fr)] items-center gap-x-[clamp(12px,3.5vw,18px)] py-[clamp(13px,3.2vw,16px)] px-[clamp(14px,3.6vw,18px)] min-w-0 box-border rounded-[18px] bg-white border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] even:bg-[#fafafa] even:border-gray-50 max-[380px]:gap-x-[10px] max-[380px]:py-[12px] max-[380px]:px-[12px] max-[380px]:rounded-[16px]" 
          role="listitem"
        >
          <span class="m-0 text-left text-gray-900 [font-family:'Gothic_60',sans-serif] text-[clamp(22px,5.2vw,28px)] leading-none tabular-nums max-[380px]:text-[clamp(20px,5vw,24px)]">
            {{ row.number }}
          </span>
          <span class="m-0 min-w-0 text-gray-600 [font-family:'Gothic_60',sans-serif] text-[clamp(12px,3.1vw,14px)] leading-[1.22] text-left [word-break:normal] break-words hyphens-none [text-wrap:balance] max-[380px]:text-[11px]">
            {{ row.label }}
          </span>
        </div>

      </div>
    </div>

  </div>
</template>