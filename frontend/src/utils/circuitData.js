import { NODE_TERMINALS } from '../config/gates.js';

export function createNodeId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `node-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function nextInputId(nodes) {
  const usedIds = new Set(
    nodes.filter(({ type }) => type === 'INPUT').map(({ id }) => id)
  );

  for (let index = 0; index < 10; index += 1) {
    const candidate = String.fromCharCode(65 + index);
    if (!usedIds.has(candidate)) return candidate;
  }

  return null;
}

export function getInputValues(nodes, edges, nodeValues) {
  const values = {};

  nodes.forEach((node) => {
    if (node.type === 'INPUT') {
      values[node.id] = [nodeValues[node.id] ?? null];
    } else {
      values[node.id] = Array(NODE_TERMINALS[node.type]?.inputs || 0).fill(null);
    }
  });

  edges.forEach((edge) => {
    const targetIndex = Number(edge.targetHandle?.split('-')[1] ?? 0);
    if (values[edge.target] && targetIndex < values[edge.target].length) {
      values[edge.target][targetIndex] = nodeValues[edge.source] ?? null;
    }
  });

  return values;
}

export function getConnectionStatus(nodes, edges) {
  const status = Object.fromEntries(
    nodes.map((node) => [
      node.id,
      {
        input: Array(node.data.inputs || 0).fill(false),
        output: Array(node.data.outputs || 0).fill(false),
      },
    ])
  );

  edges.forEach((edge) => {
    const sourceIndex = Number(edge.sourceHandle?.split('-')[1] ?? 0);
    const targetIndex = Number(edge.targetHandle?.split('-')[1] ?? 0);

    if (status[edge.source]?.output[sourceIndex] !== undefined) {
      status[edge.source].output[sourceIndex] = true;
    }
    if (status[edge.target]?.input[targetIndex] !== undefined) {
      status[edge.target].input[targetIndex] = true;
    }
  });

  return status;
}

export function serializeCircuit(nodes, edges, includeInputValues = false) {
  const circuit = {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: node.type,
      inputValues: node.data.inputValues || [],
    })),
    connections: edges.map(({ source, target }) => ({ source, target })),
  };

  if (includeInputValues) {
    circuit.current_input_combination = nodes
      .filter(({ type }) => type === 'INPUT')
      .map((node) => ({
        nodeId: node.id,
        value: node.data.inputValues || [],
      }));
  }

  return circuit;
}
