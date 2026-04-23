<template>
    <div class="city-area">
        <button class="city-area-card" type="button" @click="async () => await navigateTo('/city')">
            <div class="city-illustration">
                <span class="city-action">вперёд!</span>
            </div>

            <p class="city-title">Ваши граждане скучают <br>по своему мэру!</p>
        </button>
    </div>
</template>
<style scoped>
.city-area{
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.city-area-card{
    display: flex;
    flex-direction: column;
    width: min(300px, 100%);
    min-height: clamp(220px, 70vw, 280px);
    gap: clamp(10px, 2.8vw, 14px);
    border-radius: clamp(14px, 4.8vw, 20px);
    padding: clamp(10px, 3.8vw, 14px);
    background-color: #E9E9E9;
    box-sizing: border-box;
    border: none;
    text-align: left;
    cursor: pointer;
}

.city-illustration{
    position: relative;
    width: 100%;
    height: clamp(136px, 44vw, 182px);
    border-radius: clamp(10px, 3.6vw, 14px);
    overflow: hidden;
    background-image: url('/images/city.svg');
    background-size: cover;
    background-position: center;
    flex-shrink: 0;
}

.city-title{
    margin: 0;
    font-family: 'Gothic 60';
    color: #181818;
    line-height: 1;
    font-size: clamp(15px, 4.6vw, 18px);
}

.city-action{
    position: absolute;
    right: clamp(8px, 2.8vw, 12px);
    bottom: clamp(8px, 2.8vw, 12px);
    border-radius: clamp(10px, 3vw, 12px);
    padding: clamp(6px, 2vw, 8px) clamp(14px, 4.8vw, 18px);
    background-color: #477dff;
    box-shadow: 0 6px 14px rgba(71, 125, 255, 0.30);
    color: #ffffff;
    font-family: 'Gothic 60';
    font-size: clamp(13px, 3.9vw, 15px);
    line-height: 1;
}

@media (max-width: 360px) {
    .city-area-card {
        min-height: 58vw;
        width: min(75.5vw, 100%);
        padding: 2.5vw;
        gap: 2.2vw;
    }

    .city-illustration {
        height: 35.5vw;
    }

    .city-title {
        font-size: 3.9vw;
    }

    .city-action {
        font-size: 3.3vw;
        padding: 1.7vw 3.3vw;
    }
}
</style>
