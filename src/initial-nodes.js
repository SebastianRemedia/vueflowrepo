// src/initial-nodes.js
const initialNodes = [
  {
    id: 'blockly_1',
    type: 'blockly', // Use the registered type name
    position: { x: 50, y: 50 },
    data: {
      // Start with empty or predefined blocks
      xml: `<xml xmlns="https://developers.google.com/blockly/xml">
              <block type="controls_if" id="!TUA(+!_5!F5)%=@I{?*" x="70" y="70">
                <value name="IF0">
                  <block type="logic_compare" id="iX1;[.+J]%}K!rz=8Q*@">
                    <field name="OP">EQ</field>
                    <value name="A">
                      <block type="math_number" id="q5Naxzpl]j=g[Rwyf|MS">
                        <field name="NUM">1</field>
                      </block>
                    </value>
                    <value name="B">
                      <block type="math_number" id="yH9x]kD=y1G~?%k[+n?(">
                        <field name="NUM">1</field>
                      </block>
                    </value>
                  </block>
                </value>
              </block>
            </xml>`,
      code: '' // Will be generated on load
    },
    // You can specify initial dimensions here too
    width: 450,
    height: 350,
  },
  {
    id: 'blockly_2',
    type: 'blockly',
    position: { x: 550, y: 150 },
    data: {
      xml: '<xml xmlns="https://developers.google.com/blockly/xml"></xml>', // Empty
      code: ''
    },
    width: 400,
    height: 300,
  },
];

export default initialNodes;
