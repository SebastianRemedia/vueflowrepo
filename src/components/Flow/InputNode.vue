<script setup lang="ts">
import { ref } from 'vue'
import { Handle, type NodeProps, Position } from '@vue-flow/core'

const props = defineProps<NodeProps>()

const inputValue = ref()
</script>

<template>
  <div class="custom-node-container w-fit bg-white border border-solid rounded-sm px-2 py-2">
    <div class="flex flex-col gap-1">
      <label for="input"> Input </label>
      <input name="input" class="nodrag rounded-xs border-solid border-1" v-model="inputValue" />
    </div>
  </div>

  <Handle type="target" :position="Position.Top" />
  <Handle type="source" :position="Position.Bottom" />
</template>
