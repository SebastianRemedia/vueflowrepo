import { defineAsyncComponent, markRaw, ref } from 'vue'
import type { Edge, Node, NodeTypesObject } from '@vue-flow/core'

export const useFlowNodes = () => {
  const BlocklyNode = markRaw(defineAsyncComponent(() => import('@/components/BlocklyNode.vue')))
  const SelectNode = markRaw(defineAsyncComponent(() => import('@/components/Flow/SelectNode.vue')))
  const InputNode = markRaw(defineAsyncComponent(() => import('@/components/Flow/InputNode.vue')))

  const nodes = ref<Node[]>([])
  const edges = ref<Edge[]>([]) // Load initial edges

  // Register custom node type(s)
  const nodeTypes = ref<NodeTypesObject>({
    blockly: BlocklyNode,
    select: SelectNode,
    customInput: InputNode,
  })

  return {
    BlocklyNode,
    SelectNode,
    InputNode,
    nodeTypes,
    nodes,
    edges,
  }
}
