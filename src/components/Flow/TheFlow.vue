<script setup lang="ts">
import { ref, markRaw, defineAsyncComponent, computed } from 'vue'
import {
  VueFlow,
  useVueFlow,
  type Node,
  type Edge,
  type Connection,
  type EdgeUpdateEvent,
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import FlowControls from '@/components/Flow/FlowControls.vue'
import { useFlowNodes } from '@/useFlowNodes.ts'
import Sidevar from '@/components/Flow/Sidevar.vue'
import useDragAndDrop from '@/composables/useDragAndDrop.ts'
import DropzoneBackground from '@/components/Flow/DropzoneBackground.vue'

const { nodes, edges, nodeTypes } = useFlowNodes()

const { onDragOver, onDrop, onDragLeave, isDragOver } = useDragAndDrop()

const { addEdges, toObject, updateEdge } = useVueFlow()

// --- Event Handlers ---
const onConnect = (params: Connection) => {
  console.log('on connect', params)
  addEdges(params)
}

const onEdgeUpdate = ({ edge, connection }: EdgeUpdateEvent) => {
  updateEdge(edge, connection)
}

const logObject = () => {
  console.log(toObject())
}
</script>

<template>
  <div class="h-full flex flex-column" @drop="onDrop">
    <Sidevar />
    <VueFlow
      v-model:nodes="nodes"
      v-model:edges="edges"
      :node-types="nodeTypes"
      fit-view-on-init
      @connect="onConnect"
      @edge-update="onEdgeUpdate"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
    >
      <DropzoneBackground
        :style="{
          backgroundColor: isDragOver ? '#e7f3ff' : 'transparent',
          transition: 'background-color 0.2s ease',
        }"
      >
        <p v-if="isDragOver">Drop here</p>
      </DropzoneBackground>
      <FlowControls />
    </VueFlow>
  </div>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
@import '@vue-flow/node-resizer/dist/style.css';

html,
body,
#app {
  height: 100%;
  margin: 0;
  font-family: sans-serif;
}
</style>
