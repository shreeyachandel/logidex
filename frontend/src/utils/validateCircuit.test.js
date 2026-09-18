import assert from 'node:assert/strict';
import test from 'node:test';

import { validateCircuit } from './validateCircuit.js';

const node = (id, type, value = null) => ({
  id,
  type,
  data: { inputValues: type === 'INPUT' ? [value] : [] },
});

const validNodes = [
  node('A', 'INPUT', 1),
  node('B', 'INPUT', 0),
  node('AND1', 'AND'),
  node('OUTPUT1', 'OUTPUT'),
];

const validEdges = [
  { source: 'A', target: 'AND1', targetHandle: 'input-0' },
  { source: 'B', target: 'AND1', targetHandle: 'input-1' },
  { source: 'AND1', target: 'OUTPUT1', targetHandle: 'input-0' },
];

test('accepts a complete acyclic circuit', () => {
  assert.deepEqual(validateCircuit(validNodes, validEdges), { valid: true });
});

test('requires exactly one output', () => {
  const result = validateCircuit([...validNodes, node('OUTPUT2', 'OUTPUT')], validEdges);
  assert.equal(result.valid, false);
  assert.match(result.error, /exactly one output/i);
});

test('rejects two connections to the same input handle', () => {
  const duplicateHandleEdges = [
    validEdges[0],
    { source: 'B', target: 'AND1', targetHandle: 'input-0' },
    validEdges[2],
  ];
  assert.match(validateCircuit(validNodes, duplicateHandleEdges).error, /only one connection/i);
});

test('rejects cycles', () => {
  const nodes = [node('NOT1', 'NOT'), node('NOT2', 'NOT'), node('OUTPUT1', 'OUTPUT')];
  const edges = [
    { source: 'NOT2', target: 'NOT1', targetHandle: 'input-0' },
    { source: 'NOT1', target: 'NOT2', targetHandle: 'input-0' },
    { source: 'NOT2', target: 'OUTPUT1', targetHandle: 'input-0' },
  ];
  assert.match(validateCircuit(nodes, edges).error, /cycle/i);
});
