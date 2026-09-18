export function layoutCircuit(nodes, connections) {
  const nodeById = Object.fromEntries(nodes.map((node) => [node.id, node]));
  const inDegree = Object.fromEntries(nodes.map((node) => [node.id, 0]));
  const levelById = {};

  connections.forEach(({ target }) => {
    if (target in inDegree) inDegree[target] += 1;
  });

  const queue = Object.keys(inDegree).filter((id) => {
    if (inDegree[id] === 0) {
      levelById[id] = 0;
      return true;
    }
    return false;
  });

  while (queue.length > 0) {
    const current = queue.shift();
    connections.forEach(({ source, target }) => {
      if (source !== current || !(target in inDegree)) return;
      levelById[target] = Math.max(levelById[target] || 0, levelById[current] + 1);
      inDegree[target] -= 1;
      if (inDegree[target] === 0) queue.push(target);
    });
  }

  const nodesByLevel = {};
  nodes.forEach((node) => {
    const level = levelById[node.id] || 0;
    nodesByLevel[level] = [...(nodesByLevel[level] || []), nodeById[node.id]];
  });

  const horizontalSpacing = 220;
  const verticalSpacing = 120;
  const largestLevel = Math.max(
    1,
    ...Object.values(nodesByLevel).map((levelNodes) => levelNodes.length)
  );

  return Object.entries(nodesByLevel).flatMap(([level, levelNodes]) => {
    const verticalOffset = ((largestLevel - levelNodes.length) * verticalSpacing) / 2 + 40;
    return levelNodes.map((node, index) => ({
      ...node,
      position: {
        x: Number(level) * horizontalSpacing,
        y: index * verticalSpacing + verticalOffset,
      },
    }));
  });
}
