<script setup lang="ts">
</script>
<template>
    <div>
        <Block class="clothes-area-card">
            <TwelveText><slot>культурный код</slot></TwelveText>
            <div><img src="../public/images/Jacket.svg"></div>
            <ButtonAction :disabled="true" class="hun">
                куплено
            </ButtonAction>
        </Block>
    </div>
</template>
<style>
.clothes-area-card{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    background-color: #EFEFEF;
    height: 200px;
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
}
.hun{
    width: 100%;
}
</style>