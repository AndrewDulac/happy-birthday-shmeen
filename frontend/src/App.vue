<template>
  <div id="app">
    <BirthdayLanding/>
  </div>
</template>

<script>
import BirthdayLanding from './components/BirthdayLanding.vue'

export default {
  name: 'App',
  components: {
    BirthdayLanding
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

body {
  margin: 0;
  padding: 0;
  background: linear-gradient(135deg, #f6d365 0%, #fda085 50%, #fbc2eb 100%);
  font-family: 'Poppins', sans-serif;
  color: #fff;
  text-shadow: .2vh .2vh .2vh rgba(0, 0, 0, 0.2);
}
</style>