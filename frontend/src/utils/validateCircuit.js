// src/utils/validateCircuit.js

export const validateCircuit = (nodes, connections) => {
    console.log("🔍 Validating circuit...");
  
    const graph = {};
    const reverseGraph = {};
    let outputNode = null;
  
    // Build graph and reverseGraph
    nodes.forEach(node => {
      graph[node.id] = {
        type: node.type,
        inputs: [],
        outputs: [],
        value: node.data?.inputValues ?? null
      };
      reverseGraph[node.id] = [];
      if (node.type === "OUTPUT") {
        if (outputNode) {
          return { valid: false, error: "❌ Circuit must have only one output node!" };
        }
        outputNode = node.id;
      }
    });
  
    if (!outputNode) {
      return { valid: false, error: "❌ No output node found in the circuit!" };
    }
  
    connections.forEach(({ source, target }) => {
      graph[source].outputs.push(target);
      graph[target].inputs.push(source);
      reverseGraph[target].push(source);
    });
  
    // 1️⃣ Check output node has exactly one input
    if (graph[outputNode].inputs.length !== 1) {
      return {
        valid: false,
        error: `❌ Output node must have exactly one input, but found ${graph[outputNode].inputs.length}!`
      };
    }
  
    // 2️⃣ Check all nodes are connected
    const visited = new Set();
    const queue = [outputNode];
    while (queue.length > 0) {
      const node = queue.shift();
      visited.add(node);
      reverseGraph[node].forEach(parent => {
        if (!visited.has(parent)) queue.push(parent);
      });
    }
  
    if (nodes.some(node => !visited.has(node.id))) {
      return { valid: false, error: "❌ Some nodes are disconnected from the output node!" };
    }
  
    // 3️⃣ Check all input nodes have selected values
    for (const node of nodes) {
      const inputVal = node.data?.inputValues?.[0];
      if (node.type === "INPUT" && (inputVal === null || inputVal === undefined)) {
        return { valid: false, error: "❌ Please select a value for your input node(s)!" };
      }
    }
  
    // 4️⃣ Check all gates have correct number of inputs
    for (const nodeId in graph) {
      const node = graph[nodeId];
      if (node.type !== "INPUT" && node.type !== "OUTPUT") {
        const requiredInputs = node.type === "NOT" ? 1 : 2;
        if (node.inputs.length !== requiredInputs) {
          return {
            valid: false,
            error: `❌ ${node.type} gate does not have enough inputs. Required: ${requiredInputs}, Found: ${node.inputs.length}.`
          };
        }
      }
    }
  
    console.log("✅ Circuit is valid!");
    return { valid: true };
  };
  