import { NODE_TERMINALS } from '../config/gates.js';

const invalid = (error) => ({ valid: false, error });

export function validateCircuit(nodes, connections) {
  if (nodes.length === 0) return invalid('Add some nodes before computing a result.');

  const outputNodes = nodes.filter(({ type }) => type === 'OUTPUT');
  if (outputNodes.length !== 1) {
    return invalid(`The circuit must contain exactly one output node; found ${outputNodes.length}.`);
  }

  const graph = Object.fromEntries(
    nodes.map((node) => [node.id, { inputs: [], outputs: [], node }])
  );
  const connectedHandles = new Set();

  for (const connection of connections) {
    const { source, sourceHandle, target, targetHandle } = connection;
    if (!graph[source] || !graph[target]) {
      return invalid('The circuit contains a connection to a missing node.');
    }

    const handleKey = `${target}:${targetHandle || 'input-0'}`;
    if (connectedHandles.has(handleKey)) {
      return invalid('Each gate input can accept only one connection.');
    }
    connectedHandles.add(handleKey);
    graph[source].outputs.push(target);
    graph[target].inputs.push(source);
  }

  const outputId = outputNodes[0].id;
  if (graph[outputId].inputs.length !== 1) {
    return invalid(`The output node requires one input; found ${graph[outputId].inputs.length}.`);
  }
  if (graph[outputId].outputs.length > 0) {
    return invalid('The output node cannot connect to another node.');
  }

  const reachable = new Set();
  const queue = [outputId];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (reachable.has(nodeId)) continue;
    reachable.add(nodeId);
    queue.push(...graph[nodeId].inputs);
  }
  if (nodes.some(({ id }) => !reachable.has(id))) {
    return invalid('Every node must contribute to the output. Remove or connect disconnected nodes.');
  }

  for (const node of nodes) {
    if (node.type === 'INPUT' && node.data?.inputValues?.[0] == null) {
      return invalid('Select a value for every input node.');
    }

    const requiredInputs = NODE_TERMINALS[node.type]?.inputs;
    if (requiredInputs === undefined) return invalid(`Unknown node type: ${node.type}.`);
    if (graph[node.id].inputs.length !== requiredInputs) {
      return invalid(
        `${node.type} requires ${requiredInputs} input${requiredInputs === 1 ? '' : 's'}; ` +
        `found ${graph[node.id].inputs.length}.`
      );
    }
  }

  const inDegree = Object.fromEntries(
    Object.entries(graph).map(([id, node]) => [id, node.inputs.length])
  );
  const ready = Object.keys(inDegree).filter((id) => inDegree[id] === 0);
  let processed = 0;

  while (ready.length > 0) {
    const nodeId = ready.shift();
    processed += 1;
    graph[nodeId].outputs.forEach((target) => {
      inDegree[target] -= 1;
      if (inDegree[target] === 0) ready.push(target);
    });
  }

  if (processed !== nodes.length) return invalid('The circuit contains a cycle.');
  return { valid: true };
}
