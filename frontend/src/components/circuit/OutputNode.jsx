import { useEffect } from 'react';

export default function OutputNode({ id, inputValues = [], label, updateNodeValue }) {
  const value = inputValues[0] ?? null;
  useEffect(() => updateNodeValue(id, value), [id, updateNodeValue, value]);

  const stateClass = value === 1 ? 'true-value' : value === 0 ? 'false-value' : 'transparent';
  return (
    <div className={`node ${stateClass}`}>
      <p className="node-label">{label}</p>
      <p className="node-output">Output: {value ?? 'N/A'}</p>
    </div>
  );
}
