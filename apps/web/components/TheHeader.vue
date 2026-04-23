<script setup lang="ts">
import { Bell } from 'lucide-vue-next'

defineProps<{
    /**
     * имя пользователя
     */
    username: string
}>()

const goToNotifications = async () => {
  await navigateTo('/notification')
}
</script>
<template>
    <div class="header-shell">
        <div class="header">
            <div class="header-content">
                <div class="img">
                    <img src="/images/Semen.png" alt="Profile avatar">
                </div>

                <p class="name">{{ username }}</p>
                <p class="exp">0 EXP</p>
                <button class="help-mark" type="button" aria-label="Уведомления" @click.stop="goToNotifications">
                  <Bell :stroke-width="2" class="help-mark-icon" />
                </button>
            </div>
        </div>
    </div>
</template>
<style scoped>
.header-shell {
    width: 100%;
    min-height: 96px;
    position: relative;
    z-index: 20;
}

.header{
    position: relative;
    padding: 14px 18px 10px;
    background-color: #DCDCDD;
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    width: 100%;
    border-radius: 0;
    min-height: 96px;
}

.header-content {
    display: grid;
    grid-template-columns: 52px auto;
    grid-template-rows: auto auto;
    column-gap: 14px;
    row-gap: 0;
    align-items: center;
    width: max-content;
}

.img{
    grid-column: 1;
    grid-row: 1 / 3;
    border-radius: 50%;
    width: 52px;
    height: 52px;
    overflow: hidden;
    border: 1px solid #ffffffcc;
    background: #ffffff;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    flex-shrink: 0;
}

.img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.name {
    grid-column: 2;
    grid-row: 1;
    margin: 0;
    font-family: 'Gothic 60';
    font-size: 22px;
    line-height: 1;
    color: #131313;
}

.exp {
    grid-column: 2;
    grid-row: 2;
    margin: -2px 0 0;
    font-family: 'Gothic 60';
    font-size: 13px;
    line-height: 0.92;
    color: #8c8c8c;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}

.help-mark {
    position: absolute;
    right: 12px;
    top: 50%;
    width: 35px;
    height: 34px;
    border-radius: 999px;
    border: 1px solid #dddddd;
    background: #f0f0f0;
    color: #d53c3c;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0;
    transform: translateY(-50%);
    cursor: default;
}

.help-mark-icon {
    width: 18px;
    height: 18px;
}

@media (max-width: 480px) {
    .header {
        padding: 12px 16px 9px;
        min-height: 90px;
    }

    .header-content {
        grid-template-columns: 48px auto;
        column-gap: 12px;
    }

    .img {
        width: 48px;
        height: 48px;
    }

    .name {
        font-size: 20px;
    }

    .exp {
        font-size: 12px;
    }

    .help-mark {
        width: 35px;
        height: 34px;
        right: 10px;
        top: 50%;
    }
}

@media (max-width: 360px) {
    .header-shell {
        min-height: 22vw;
    }

    .header {
        padding: 2.8vw 3.3vw 2.2vw;
        min-height: 22vw;
    }

    .header-content {
        grid-template-columns: 11.7vw auto;
        column-gap: 2.8vw;
    }

    .img {
        width: 11.7vw;
        height: 11.7vw;
    }

    .name {
        font-size: 4.7vw;
    }

    .exp {
        font-size: 3.1vw;
    }

    .help-mark {
        width: 8.3vw;
        height: 8.3vw;
        font-size: 5.6vw;
        right: 2.2vw;
    }
}

</style>
