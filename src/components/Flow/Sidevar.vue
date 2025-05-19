<script setup lang="ts">
import { type Node, useVueFlow } from '@vue-flow/core'
import { Button } from '@/components/ui/button'
import useDragAndDrop from '@/composables/useDragAndDrop.ts'

const { addNodes, toObject } = useVueFlow()
const { onDragStart } = useDragAndDrop()

let newNodeId = 3 // Counter for unique IDs

const addBlocklyNode = () => {
  const newId = `blockly_${newNodeId++}`
  const newNode = {
    id: newId,
    type: 'blockly', // Must match the key in nodeTypes
    position: { x: Math.random() * 400, y: Math.random() * 400 },
    data: {
      // IMPORTANT: Initialize with empty XML structure for Blockly
      xml: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
      code: '', // Initialize code field
    },
    // Optional: Initial dimensions (BlocklyNode will use these)
    // These might be overridden if dimensions are stored in VueFlow's internal state later
    width: 400,
    height: 300,
  }
  addNodes([newNode])
}

const addSelectNode = () => {
  const newId = `${newNodeId++}`
  const newNode = {
    id: newId,
    type: 'select', // Must match the key in nodeTypes
    position: { x: Math.random() * 400, y: Math.random() * 400 },
    data: {
      xml: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>',
      code: '', // Initialize code field
    },
  }
  addNodes([newNode])
}

const logNodesState = () => {
  console.log('Current Nodes State:')
  nodes.value.forEach((node) => {
    if (node.type === 'blockly') {
      console.log(node.data)
      console.log(`Node ID: ${node.id}, XML:`, node.data?.xml)
      console.log(`Node ID: ${node.id}, Code:`, node.data?.code)
      console.log(`Node ID: ${node.id}, JSON:`, node.data?.json)
      console.log(`Node ID: ${node.id}, Dimensions:`, node.dimensions) // Log dimensions if stored by VueFlow
    } else {
      console.log(`Node ID: ${node.id}, Type: ${node.type}, Data:`, node.data)
    }
  })
}
const addInputNode = () => {
  const id = Date.now().toString()
  const newNode = {
    id: id,
    type: 'customInput',
    position: { x: Math.random() * 400, y: Math.random() * 400 },
    data: { label: 'Default Node', value: '' },
  } as Node
  addNodes([newNode])
}

const addNormalNode = () => {
  const id = Date.now().toString()
  const newNode = {
    id: id,
    type: 'default',
    position: { x: Math.random() * 400, y: Math.random() * 400 },
    data: { label: 'Default Node' },
  } as Node
  addNodes([newNode])
}

const logObject = () => {
  console.log(toObject())
}
</script>

<template>
  <aside class="">
    <div class="description">You can drag these nodes to the pane.</div>
    <div class="flex flex-col gap-2">
      <Button :draggable="true" @click="addBlocklyNode" @dragstart="onDragStart($event, 'blockly')">
        Add Blockly Node
      </Button>
      <Button :draggable="true" @click="addSelectNode" @dragstart="onDragStart($event, 'select')">
        Add Select Node
      </Button>
      <Button :draggable="true" @click="addInputNode" @dragstart="onDragStart($event, 'input')">
        Add input node
      </Button>
      <Button :draggable="true" @click="addNormalNode" @dragstart="onDragStart($event, 'default')">
        Add node
      </Button>
      <Button @click="logNodesState"> Log Nodes State (XML)</Button>
      <Button @click="logObject"> Log Object</Button>
    </div>
  </aside>
</template>
