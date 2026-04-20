
<template>
    <div class="grid grid-cols-4 gap-4 max-sm:grid-cols-2 max-sm:gap-2.5">
        <div>
            <slot name="left" />
        </div>
        <div>
            <slot name="middle" />
        </div>
        <div>
            <slot name="main" />
        </div>
        <div>
            <slot name="right" />
        </div>
    </div>
</template>