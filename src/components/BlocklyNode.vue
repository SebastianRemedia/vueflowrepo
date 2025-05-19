<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick, defineProps, defineEmits } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { NodeResizer } from '@vue-flow/node-resizer' // Import NodeResizer
import * as Blockly from 'blockly/core'
import * as en from 'blockly/msg/en' // Import English language pack
import { javascriptGenerator } from 'blockly/javascript' // Import JavaScript generator
import 'blockly/blocks' // Import standard blocks
import '@vue-flow/node-resizer/dist/style.css'

// --- Props and Emits ---
const props = defineProps({
  id: { type: String, required: true },
  // data MUST contain 'xml' for storing blockly state
  data: {
    type: Object,
    required: true,
    default: () => ({ xml: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>' }),
  },
  // Optional: Pass initial dimensions via node data
  width: { type: Number, default: 400 },
  height: { type: Number, default: 300 },
})

const emit = defineEmits(['update:data', 'resize']) // Emit data updates and resize events

// --- Refs ---
const blocklyContainerRef = ref(null)
const workspace = ref(null)
const generatedCode = ref('')
const showCode = ref(false)
const nodeWidth = ref(props.width)
const nodeHeight = ref(props.height)

// Access VueFlow instance if needed (e.g., for zooming)
const { updateNodeData } = useVueFlow()

// --- Blockly Configuration ---
Blockly.setLocale(en)

// Example Toolbox Definition (XML)
const toolboxXml = `
  <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
<category name="Logic" colour="%{BKY_LOGIC_HUE}">
<block type="controls_if"></block>
  <block type="logic_compare"></block>
  <block type="logic_operation"></block>
  <block type="logic_negate"></block>
  <block type="logic_boolean"></block>
  </category>
  <category name="Loops" colour="%{BKY_LOOPS_HUE}">
<block type="controls_repeat_ext">
<value name="TIMES">
<shadow type="math_number">
<field name="NUM">10</field>
  </shadow>
  </value>
  </block>
  <block type="controls_whileUntil"></block>
  </category>
  <category name="Math" colour="%{BKY_MATH_HUE}">
<block type="math_number">
<field name="NUM">123</field>
  </block>
  <block type="math_arithmetic"></block>
  <block type="math_single"></block>
  </category>
  <category name="Text" colour="%{BKY_TEXTS_HUE}">
<block type="text"></block>
  <block type="text_length"></block>
  <block type="text_print"></block>
  </category>
  <sep></sep>
  <category name="Variables" colour="%{BKY_VARIABLES_HUE}" custom="VARIABLE"></category>
  <category name="Functions" colour="%{BKY_PROCEDURES_HUE}" custom="PROCEDURE"></category>
  </xml>
 `;

const initializeBlockly = () => {
  if (!blocklyContainerRef.value || workspace.value) return // Prevent re-initialization

  try {
    // Inject Blockly into the container
    workspace.value = Blockly.inject(blocklyContainerRef.value, {
      toolbox: toolboxXml,
      // Other options:
      // grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
      // zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2 },
      // trashcan: true,
      // media: 'https://unpkg.com/blockly/media/' // If needed and not bundled
    })

    // Load initial state from props.data.xml if available
    if (props.data?.xml) {
      const xml = Blockly.utils.xml.textToDom(props.data.xml)
      Blockly.Xml.domToWorkspace(xml, workspace.value)
    }

    // Add listener for changes
    workspace.value.addChangeListener(onBlocklyChange)
    // Initial code generation
    updateGeneratedCode()

    // Ensure Blockly resizes correctly if the node is resized
    // Use nextTick to wait for DOM updates if resizing happens fast
    Blockly.svgResize(workspace.value)
  } catch (error) {
    console.error('Failed to initialize Blockly:', error)
  }
}

const onBlocklyChange = (event) => {
  // Filter out UI events like clicks or drags if you only care about structural changes
  console.log("blockly change", event)
  if (event.type === Blockly.Events.UI || event.isUiEvent) {
    return
  }

  // Serialize workspace to XML
  const xmlDom = Blockly.Xml.workspaceToDom(workspace.value)
  const xmlText = Blockly.Xml.domToText(xmlDom)

  // Generate code
  updateGeneratedCode()

  // Emit the updated data back to the parent VueFlow component
  // IMPORTANT: Only emit if the XML actually changed from the prop to avoid infinite loops
  if (xmlText !== props.data?.xml) {
    const workspaceState = Blockly.serialization.workspaces.save(workspace.value);
    const jsonString = JSON.stringify(workspaceState);
    // Use updateNodeData provided by useVueFlow - preferred method
    updateNodeData(props.id, { xml: xmlText, code: generatedCode.value, json: jsonString })
    // Alternative: Direct emit (less ideal with v-model:nodes)
    // emit('update:data', { xml: xmlText, code: generatedCode.value });
  }
}

const updateGeneratedCode = () => {
  if (!workspace.value) return
  try {
    generatedCode.value = javascriptGenerator.workspaceToCode(workspace.value)
  } catch (error) {
    console.error('Error generating code:', error)
    generatedCode.value = '// Error generating code'
  }
}

// Handle resizing from NodeResizer


// Watch for external changes to props.data.xml (e.g., loading a saved flow)
// Be careful with this to avoid loops if the emission/update isn't handled correctly.
// The check `xmlText !== props.data?.xml` in onBlocklyChange helps prevent this.
watch(
  () => props.data?.xml,
  (newXml, oldXml) => {
    if (newXml && newXml !== oldXml && workspace.value) {
      // Check if the new XML is different from the *current* workspace state
      // This avoids reloading if the change originated from this instance itself
      const currentXmlDom = Blockly.Xml.workspaceToDom(workspace.value)
      const currentXmlText = Blockly.Xml.domToText(currentXmlDom)

      if (newXml !== currentXmlText) {
        console.log(`Node ${props.id}: Received external XML update. Reloading workspace.`)
        try {
          const xml = Blockly.utils.xml.textToDom(newXml)
          // Clear existing blocks before loading new ones
          workspace.value.clear()
          Blockly.Xml.domToWorkspace(xml, workspace.value)
          updateGeneratedCode() // Update code display after loading
        } catch (e) {
          console.error(`Node ${props.id}: Error loading XML state:`, e)
        }
      }
    }
  },
)

// Watch for external dimension changes (if parent App modifies node dimensions)
watch(
  () => [props.width, props.height],
  ([newWidth, newHeight]) => {
    if (newWidth !== nodeWidth.value || newHeight !== nodeHeight.value) {
      nodeWidth.value = newWidth
      nodeHeight.value = newHeight
      nextTick(() => {
        if (workspace.value) {
          Blockly.svgResize(workspace.value)
        }
      })
    }
  },
)

onMounted(() => {
  // Ensure dimensions are set from props initially
  nodeWidth.value = props.width
  nodeHeight.value = props.height
  initializeBlockly()
})

// --- Lifecycle Hooks ---
onBeforeUnmount(() => {
  // Clean up Blockly instance
  if (workspace.value) {
    workspace.value.dispose()
    workspace.value = null
  }
})
</script>

<template>
  <NodeResizer :min-width="100" :min-height="30" />
  <div
    class="blockly-node"
    :style="{ width: `${nodeWidth}px`, height: `${nodeHeight}px` }"
  >
    <div ref="blocklyContainerRef" class="blockly-container"></div>

    <div v-if="showCode" class="generated-code">
      <strong>Generated Code:</strong>
      <pre><code>{{ generatedCode }}</code></pre>
    </div>

  </div>

  <Handle type="source" :position="Position.Bottom" />
</template>
