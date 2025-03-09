<template>
  <v-app>

    <v-container>
    

      <HelloWorld />
    </v-container>

  </v-app>
</template>

<script>
  import HelloWorld from "./components/HelloWorld"
  import axios from "axios";

  export default {
    components: { HelloWorld },
    
  };
</script>
