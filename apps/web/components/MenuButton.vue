<script setup lang="ts">
defineProps<{
    title: string,
    unread?: boolean
}>()
</script>

<template>
    <button class="relative inline-flex w-full cursor-pointer flex-col items-center rounded-2xl border-none bg-[#EFEFEF] px-2.5 pb-2.5 pt-3.5 max-sm:rounded-xl max-sm:px-2 max-sm:pb-2 max-sm:pt-2.5">
        <span class="text-[26px] text-[#333] max-sm:text-[22px]">
            <slot name="icon" />
        </span>
        <TwelveText class="text-center font-medium text-[#333]">{{ title }}</TwelveText>
        <span v-if="unread" class="absolute right-2 top-2 z-[2] h-2.5 w-2.5 rounded-full bg-[#FF4B4B]"></span>
    </button>
</template>