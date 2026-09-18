import EqualizerIcon from '@mui/icons-material/Equalizer';
import { useEffect, useMemo, useState } from 'react';

const DESCRIPTIONS = {
  AND: 'Returns 1 when every input is 1.',
  OR: 'Returns 1 when at least one input is 1.',
  NOT: 'Returns the opposite of its input.',
  NAND: 'Returns 0 when every input is 1.',
  NOR: 'Returns 1 when every input is 0.',
  XOR: 'Returns 1 when the inputs differ.',
  XNOR: 'Returns 1 when the inputs match.',
};

export function computeGateOutput(inputs, gateType) {
  if (inputs.length === 0 || inputs.some((value) => value == null)) return null;

  const operations = {
    AND: () => Number(inputs.every((value) => value === 1)),
    OR: () => Number(inputs.some((value) => value === 1)),
    NOT: () => Number(inputs[0] !== 1),
    NAND: () => Number(!inputs.every((value) => value === 1)),
    NOR: () => Number(!inputs.some((value) => value === 1)),
    XOR: () => inputs.reduce((result, value) => result ^ value, 0),
    XNOR: () => Number(inputs[0] === inputs[1]),
  };
  return operations[gateType]?.() ?? null;
}

function buildTruthTable(gateType, inputCount) {
  return Array.from({ length: 2 ** inputCount }, (_, rowIndex) => {
    const inputs = rowIndex.toString(2).padStart(inputCount, '0').split('').map(Number);
    return [...inputs, computeGateOutput(inputs, gateType)];
  });
}

export default function GateNode({
  gateType,
  icon,
  id,
  inputCount = 2,
  inputValues = [],
  label,
  showDetails,
  updateNodeValue,
}) {
  const [showTable, setShowTable] = useState(false);
  const output = useMemo(
    () => computeGateOutput(inputValues, gateType),
    [gateType, inputValues]
  );
  const table = useMemo(() => buildTruthTable(gateType, inputCount), [gateType, inputCount]);

  useEffect(() => updateNodeValue(id, output), [id, output, updateNodeValue]);

  const stateClass = output === 1 ? 'true-value' : output === 0 ? 'false-value' : 'transparent';
  const currentInputs = inputValues.join('');

  return (
    <div className={`node ${stateClass}`}>
      {showDetails ? (
        <div className="node-backside">
          <h4>{gateType} Gate</h4>
          <p>{DESCRIPTIONS[gateType]}</p>
          <div
            className="truth-table-toggle"
            onMouseEnter={() => setShowTable(true)}
            onMouseLeave={() => setShowTable(false)}
          >
            <EqualizerIcon className="table-icon" />
            <span className="table-text">Truth table</span>
            {showTable && (
              <div className="truth-table-popup">
                <table className="mini-truth-table">
                  <tbody>
                    {table.map((row) => {
                      const rowKey = row.join('-');
                      return (
                        <tr key={rowKey} className={row.slice(0, -1).join('') === currentInputs ? 'highlighted' : ''}>
                          {row.map((value, index) => (
                            <td key={`${rowKey}-${index}`} className={index === row.length - 1 ? 'output-column' : ''}>
                              {value}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <img src={icon} alt={`${gateType} gate`} className="node-image" />
          <p className="node-label">{label}</p>
        </>
      )}
    </div>
  );
}
