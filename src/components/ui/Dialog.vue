<template>
  <div class="dialog" :class="{ open: modelValue }">
    <i class="fas fa-times close fa-2x" @click="$emit('update:modelValue', false)"></i>

    <slot />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
  },
});
</script>
