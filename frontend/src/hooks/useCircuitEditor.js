import { useCallback, useEffect, useMemo, useState } from 'react';
import { addEdge, useEdgesState, useNodesState, useReactFlow } from 'reactflow';

import { createCircuit as requestCircuit } from '../api/circuitApi';
import { MAX_INPUT_NODES, NODE_TERMINALS } from '../config/gates';
import {
  createNodeId,
  getConnectionStatus,
  getInputValues,
  nextInputId,
} from '../utils/circuitData';
import { mapGeneratedCircuit } from '../utils/generatedCircuit';

const arraysEqual = (left = [], right = []) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export function useCircuitEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [nodeValues, setNodeValues] = useState({});
  const [selectedNodeType, setSelectedNodeType] = useState(null);
  const [resetVersion, setResetVersion] = useState(0);
  const { fitView, project } = useReactFlow();

  const updateNodeValue = useCallback((nodeId, value) => {
    setNodeValues((previous) =>
      previous[nodeId] === value ? previous : { ...previous, [nodeId]: value }
    );
  }, []);

  const deleteNode = useCallback((nodeId) => {
    setNodes((current) => current.filter(({ id }) => id !== nodeId));
    setEdges((current) =>
      current.filter(({ source, target }) => source !== nodeId && target !== nodeId)
    );
    setNodeValues((current) => {
      if (!(nodeId in current)) return current;
      const next = { ...current };
      delete next[nodeId];
      return next;
    });
  }, [setEdges, setNodes]);

  const inputValues = useMemo(
    () => getInputValues(nodes, edges, nodeValues),
    [edges, nodeValues, nodes]
  );

  useEffect(() => {
    const connectionStatus = getConnectionStatus(nodes, edges);
    setNodes((current) => {
      let changed = false;
      const next = current.map((node) => {
        const nextInputs = inputValues[node.id] || [];
        const nextStatus = connectionStatus[node.id] || { input: [], output: [] };
        const inputsChanged = !arraysEqual(node.data.inputValues, nextInputs);
        const statusChanged =
          !arraysEqual(node.data.isConnected?.input, nextStatus.input) ||
          !arraysEqual(node.data.isConnected?.output, nextStatus.output);

        if (!inputsChanged && !statusChanged) return node;
        changed = true;
        return {
          ...node,
          data: {
            ...node.data,
            inputValues: nextInputs,
            isConnected: nextStatus,
            updateNodeValue,
          },
        };
      });
      return changed ? next : current;
    });
  }, [edges, inputValues, nodes, setNodes, updateNodeValue]);

  const inputNodeLimitReached = useMemo(
    () => nodes.filter(({ type }) => type === 'INPUT').length >= MAX_INPUT_NODES,
    [nodes]
  );

  useEffect(() => {
    if (inputNodeLimitReached && selectedNodeType === 'INPUT') {
      setSelectedNodeType(null);
    }
  }, [inputNodeLimitReached, selectedNodeType]);

  const reset = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setNodeValues({});
    setSelectedNodeType(null);
    setResetVersion((version) => version + 1);
  }, [setEdges, setNodes]);

  const addNode = useCallback((event) => {
    if (!selectedNodeType) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const position = project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    });
    const id = selectedNodeType === 'INPUT' ? nextInputId(nodes) : createNodeId();
    if (!id) return;

    const terminals = NODE_TERMINALS[selectedNodeType];
    setNodes((current) => [
      ...current,
      {
        id,
        type: selectedNodeType,
        position,
        data: {
          id,
          label: selectedNodeType === 'INPUT' ? id : selectedNodeType,
          inputs: terminals.inputs,
          outputs: terminals.outputs,
          inputValues: [],
          onDelete: deleteNode,
          updateNodeValue,
        },
      },
    ]);
  }, [deleteNode, nodes, project, selectedNodeType, setNodes, updateNodeValue]);

  const connectNodes = useCallback(
    (connection) => setEdges((current) => addEdge(connection, current)),
    [setEdges]
  );

  const replaceWithFormula = useCallback(async (formula) => {
    const data = await requestCircuit(formula);
    const generated = mapGeneratedCircuit(data, {
      onDelete: deleteNode,
      updateNodeValue,
    });

    setNodeValues(
      Object.fromEntries(
        generated.nodes
          .filter(({ type }) => type === 'INPUT')
          .map(({ id }) => [id, null])
      )
    );
    setNodes(generated.nodes);
    setEdges(generated.edges);
    setSelectedNodeType(null);
    setResetVersion((version) => version + 1);
    window.setTimeout(() => fitView({ duration: 300, padding: 0.18 }), 0);
  }, [deleteNode, fitView, setEdges, setNodes, updateNodeValue]);

  return {
    addNode,
    connectNodes,
    edges,
    inputNodeLimitReached,
    nodes,
    onEdgesChange,
    onNodesChange,
    replaceWithFormula,
    reset,
    resetVersion,
    selectedNodeType,
    setSelectedNodeType,
  };
}
