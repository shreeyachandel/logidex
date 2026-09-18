import assert from 'node:assert/strict';
import test from 'node:test';

import { getInputValues } from './circuitData.js';

test('maps source values to their explicit target handles', () => {
  const nodes = [
    { id: 'A', type: 'INPUT' },
    { id: 'B', type: 'INPUT' },
    { id: 'AND1', type: 'AND' },
  ];
  const edges = [
    { source: 'A', target: 'AND1', targetHandle: 'input-1' },
    { source: 'B', target: 'AND1', targetHandle: 'input-0' },
  ];

  assert.deepEqual(getInputValues(nodes, edges, { A: 1, B: 0 }).AND1, [0, 1]);
});
