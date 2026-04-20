
<template>
    <div class="grid grid-cols-3 gap-4 max-sm:grid-cols-1 max-sm:gap-2.5">
        <div>
            <slot name="left" />
        </div>
        <div>
            <slot name="middle" />
        </div>
        <div>
            <slot name="right" />
        </div>
    </div>
</template>