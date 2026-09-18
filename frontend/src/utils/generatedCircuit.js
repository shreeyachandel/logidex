import { NODE_TERMINALS } from '../config/gates.js';
import { layoutCircuit } from './layoutCircuit.js';

export function mapGeneratedCircuit(data, { onDelete, updateNodeValue }) {
  const inputIdMap = {};
  let nextInputIndex = 0;

  const nodes = data.nodes.flat().map((node) => {
    const id = node.type === 'INPUT'
      ? String.fromCharCode(65 + nextInputIndex++)
      : node.id;

    if (node.type === 'INPUT') inputIdMap[node.id] = id;

    return {
      id,
      type: node.type,
      position: node.position || { x: 0, y: 0 },
      data: {
        id,
        label: node.type === 'INPUT' ? id : node.type,
        inputValues: [],
        inputs: NODE_TERMINALS[node.type]?.inputs || 0,
        outputs: NODE_TERMINALS[node.type]?.outputs || 0,
        updateNodeValue,
        onDelete,
      },
    };
  });

  const connectionCount = {};
  const edges = data.connections.map((connection, index) => {
    const source = inputIdMap[connection.source] || connection.source;
    const target = inputIdMap[connection.target] || connection.target;
    const targetIndex = connectionCount[target] || 0;
    connectionCount[target] = targetIndex + 1;

    return {
      id: `generated-edge-${index}`,
      source,
      target,
      sourceHandle: 'output-0',
      targetHandle: `input-${targetIndex}`,
    };
  });

  return {
    nodes: layoutCircuit(nodes, edges),
    edges,
  };
}
