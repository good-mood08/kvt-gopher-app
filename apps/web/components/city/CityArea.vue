<template>
    <div class="city-area">
        <div class="city-area-card">
            <div class="city-illustration">
                <button class="city-action" type="button">вперёд!</button>
            </div>

            <p class="city-title">Ваши граждане скучают <br>по своему мэру!</p>
        </div>
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
    width: min(320px, calc(100% - 12px));
    height: 300px;
    gap: 14px;
    border-radius: 20px;
    padding: 14px;
    background-color: #E9E9E9;
    box-sizing: border-box;
}

.city-illustration{
    position: relative;
    width: 100%;
    height: 196px;
    border-radius: 14px;
    overflow: hidden;
    background-image: url('/images/uihtfio.svg');
    background-size: cover;
    background-position: center;
    flex-shrink: 0;
}

.city-title{
    margin: 0;
    font-family: 'Gothic 60';
    color: #181818;
    line-height: 1;
    font-size: 20px;
}

.city-action{
    position: absolute;
    right: 12px;
    bottom: 12px;
    border: none;
    border-radius: 12px;
    padding: 8px 18px;
    background-color: #477dff;
    box-shadow: 0 6px 14px rgba(71, 125, 255, 0.30);
    color: #ffffff;
    font-family: 'Gothic 60';
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
}

@media (max-width: 768px) {
    .city-area-card{
        width: min(304px, calc(100% - 14px));
        height: 286px;
        gap: 12px;
        border-radius: 18px;
        padding: 12px;
    }

    .city-illustration{
        height: 182px;
        border-radius: 12px;
    }

    .city-title{
        font-size: 18px;
    }
}
</style>
