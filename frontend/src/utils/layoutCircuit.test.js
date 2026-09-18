import assert from 'node:assert/strict';
import test from 'node:test';

import { layoutCircuit } from './layoutCircuit.js';

test('lays generated circuits out from inputs to output', () => {
  const nodes = ['A', 'B', 'AND1', 'OUTPUT1'].map((id) => ({ id, position: {} }));
  const edges = [
    { source: 'A', target: 'AND1' },
    { source: 'B', target: 'AND1' },
    { source: 'AND1', target: 'OUTPUT1' },
  ];
  const positions = Object.fromEntries(
    layoutCircuit(nodes, edges).map(({ id, position }) => [id, position])
  );

  assert.equal(positions.A.x, positions.B.x);
  assert.ok(positions.A.x < positions.AND1.x);
  assert.ok(positions.AND1.x < positions.OUTPUT1.x);
});
