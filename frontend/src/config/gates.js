export const MAX_INPUT_NODES = 10;

export const NODE_TERMINALS = {
  INPUT: { inputs: 0, outputs: 1 },
  OUTPUT: { inputs: 1, outputs: 0 },
  NOT: { inputs: 1, outputs: 1 },
  AND: { inputs: 2, outputs: 1 },
  OR: { inputs: 2, outputs: 1 },
  NAND: { inputs: 2, outputs: 1 },
  NOR: { inputs: 2, outputs: 1 },
  XOR: { inputs: 2, outputs: 1 },
  XNOR: { inputs: 2, outputs: 1 },
};
