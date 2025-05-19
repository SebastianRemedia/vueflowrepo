<script setup lang="ts">
import { type NodeProps, useVueFlow } from '@vue-flow/core'
import { Handle, Position } from '@vue-flow/core'
import { defineProps, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import * as Blockly from 'blockly/core'
import { Workspace } from 'blockly'
import { javascriptGenerator } from 'blockly/javascript'
import * as en from 'blockly/msg/en'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogTitle,
  DialogTrigger,
  DialogContent,
  DialogHeader,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const selectedItem = ref<string>()
const items = ref<string[]>(['dog', 'cat', 'hamster'])

const blocklyContainerRef = ref(null)
const generatedCode = ref('')
const workspace = ref<Workspace | null>(null)
const isBlocklyVisible = ref<boolean>(false)
const { updateNodeData } = useVueFlow()

Blockly.setLocale(en)

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
</xml>`
const initializeBlockly = () => {
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

const updateGeneratedCode = () => {
  if (!workspace.value) return
  try {
    generatedCode.value = javascriptGenerator.workspaceToCode(workspace.value)
  } catch (error) {
    console.error('Error generating code:', error)
    generatedCode.value = '// Error generating code'
  }
}

const onBlocklyChange = (event) => {
  // Filter out UI events like clicks or drags if you only care about structural changes
  console.log('blockly change', event)
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
    const workspaceState = Blockly.serialization.workspaces.save(workspace.value)
    const jsonString = JSON.stringify(workspaceState)
    // Use updateNodeData provided by useVueFlow - preferred method
    updateNodeData(props.id, { xml: xmlText, code: generatedCode.value, json: jsonString })
    // Alternative: Direct emit (less ideal with v-model:nodes)
    // emit('update:data', { xml: xmlText, code: generatedCode.value });
  }
}

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

const cleanupBlockly = () => {
  if (workspace.value) {
    workspace.value.dispose()
    workspace.value = null
  }
}
onBeforeUnmount(() => {
  cleanupBlockly()
})

const showDialog = ref<boolean>(false)

const openDialog = async () => {
  showDialog.value = true

  // Wait for dialog to render
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 100))

  if (blocklyContainerRef.value && !workspace.value) {
    workspace.value = Blockly.inject(blocklyContainerRef.value, {
      toolbox: toolboxXml,
    })

    // Force resize after initialization
    setTimeout(() => {
      if (workspace.value) {
        Blockly.svgResize(workspace.value)
      }
    }, 200)
  } else if (workspace.value) {
    Blockly.svgResize(workspace.value)
  }
}

const onOpen = (value: boolean) => {
  showDialog.value = value
  if (!value) {
    cleanupBlockly()
  }
}
</script>

<template>
  <Card class="gap-4">
    <CardHeader>
      <CardTitle>Define options</CardTitle>
      <CardDescription>Define options for your node here</CardDescription>
    </CardHeader>

    <CardContent class="flex flex-col gap-4 mt-0">
      <Select v-model="selectedItem">
        <SelectTrigger>
          <SelectValue placeholder="Select a fruit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple"> Apple</SelectItem>
          <SelectItem v-for="item in items" :key="item" :value="item">
            {{ item }}
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog :open="showDialog" @update:open="onOpen">
        <DialogTrigger @click="openDialog" as-child>
          <Button> Open Blockly Editor</Button>
        </DialogTrigger>
        <DialogContent class="min-w-[90vw] min-h-[90vh]">
          <div>
            <DialogHeader>
              <DialogTitle>Blockly Editor</DialogTitle>
              <DialogDescription> Build your blocks here</DialogDescription>
            </DialogHeader>

            <div class="blockly-node w-full h-[90%]">
              <div ref="blocklyContainerRef" class="blockly-container"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </CardContent>
  </Card>
  <Handle id="a" type="source" :position="Position.Bottom" />
</template>

<style>
.blockly-node {
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #f9f9f9;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Important for Blockly */
  min-height: 200px; /* Minimum size */
  min-width: 250px;
  position: relative; /* Needed for absolute positioning of handles/resizer */
}

.blockly-container {
  flex-grow: 1; /* Takes remaining space */
  min-height: 150px; /* Ensure it has some height */
  position: relative; /* Sometimes needed for Blockly rendering */
  /* width/height are handled by the main div style and resize */
}

/* Ensure Blockly fills the container */
.blocklySvg {
  width: 100%;
  height: 100%;
}

/* Style VueFlow Handles */
.vue-flow__handle {
  width: 10px;
  height: 10px;
  background-color: dodgerblue;
}

/* Style NodeResizer Handles */
.blockly-resizer-handle {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  border-color: dodgerblue;
}

/* Style for generated code */
.generated-code {
  padding: 5px 10px;
  background-color: #eee;
  border-top: 1px solid #ddd;
  font-size: 0.8em;
  max-height: 100px;
  overflow-y: auto;
}

.generated-code pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.code-toggle-button {
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 0.7em;
  padding: 2px 5px;
  cursor: pointer;
  z-index: 10; /* Above Blockly elements */
  background-color: rgba(255, 255, 255, 0.8);
  border: 1px solid #ccc;
  border-radius: 3px;
}
</style>
