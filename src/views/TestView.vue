<script setup lang="ts">
import { onBeforeUnmount, ref, nextTick, shallowRef, onMounted } from 'vue'
import { Workspace } from 'blockly'
import { Button } from '@/components/ui/button'

import * as Blockly from 'blockly/core'
import * as libraryBlocks from 'blockly/blocks'
import * as En from 'blockly/msg/en'

type BlocklyWorkspace = Blockly.WorkspaceSvg

const blocklyContainerRef = ref(null)
const workspace = shallowRef<BlocklyWorkspace | null>(null)
type BlocklyToolboxContents =
  | Blockly.utils.toolbox.ToolboxDefinition
  | Blockly.utils.toolbox.FlyoutDefinition // More specific types can be used

const toolbox = `<xml>
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
                <block type="math_number">
                  <field name="NUM">10</field>
                </block>
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
          <category name="Variables" custom="VARIABLE" colour="%{BKY_VARIABLES_HUE}">
            </category>
          <category name="Stocks" colour="%{BKY_LOOPS_HUE}">
            <block type="stock_buy_simple"></block>
            <block type="stock_buy_prog"></block>
            <block type="stock_fetch_price"></block>
          </category>
        </xml>`

const initializeBlockly = () => {
  if (!blocklyContainerRef.value || workspace.value) return // Prevent re-initialization

  try {
    // Inject Blockly into the container
    workspace.value = Blockly.inject(blocklyContainerRef.value, {
      toolbox: toolbox,
    })

    // Ensure Blockly resizes correctly if the node is resized
    // Use nextTick to wait for DOM updates if resizing happens fast
    Blockly.svgResize(workspace.value)
  } catch (error) {
    console.error('Failed to initialize Blockly:', error)
  }
}

const options = {
  media: 'media/',
  grid: {
    spacing: 25,
    length: 3,
    colour: '#ccc',
    snap: true,
  },
  toolbox: `<xml>
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
                <block type="math_number">
                  <field name="NUM">10</field>
                </block>
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
          <category name="Variables" custom="VARIABLE" colour="%{BKY_VARIABLES_HUE}">
            </category>
          <category name="Stocks" colour="%{BKY_LOOPS_HUE}">
            <block type="stock_buy_simple"></block>
            <block type="stock_buy_prog"></block>
            <block type="stock_fetch_price"></block>
          </category>
        </xml>`,
}

onMounted(() => {
  Blockly.setLocale(En)
  Blockly.inject(blocklyContainerRef.value, options)
})

const redraw = () => {
  nextTick(() => {
    if (workspace.value) {
      Blockly.svgResize(workspace.value)
    }
  })
}
</script>

<template>
  <Button class="border-solid border-1 px-4 rounded-sm text-sm nodrag" @click="initializeBlockly">
    Init blockly
  </Button>

  <Button class="border-solid border-1 px-4 rounded-sm text-sm nodrag" @click="redraw">
    Redraw
  </Button>

  Blockly node

  <div class="blockly-node !w-2xl !h-2xl">
    <div
      ref="blocklyContainerRef"
      style="height: 480px; width: 100%; border: 1px solid #ccc"
      class="blockly-container"
    ></div>
  </div>
</template>
