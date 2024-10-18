<script setup>
import { onMounted, ref } from 'vue';

const randomImage = ref('./assets/images/1.png');
const images = [
    './assets/images/1.png',
    './assets/images/2.png',
    './assets/images/3.png',
    './assets/images/4.png',
    './assets/images/5.png',
    './assets/images/6.png',
    './assets/images/7.png',
    './assets/images/8.png',
    './assets/images/9.png',
    './assets/images/10.png',
    './assets/images/11.png',
    './assets/images/12.png',
];

onMounted(() => {
    randomImage.value = images[Math.floor(Math.random() * images.length)];
});
</script>

<template>
  <div class="image-container">
      <img :src="randomImage" />
  </div>
</template>

<style scoped>
.image-container {
  text-align: center;
}
img {
  margin-top: 20px;
  max-width: 20%;
  height: auto;
  border-radius: 8px;
}
</style>