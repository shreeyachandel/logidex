import { useState } from 'react';
import { Handle, Position } from 'reactflow';

import { GATE_TOOLS } from '../../config/gateTools';
import GateNode from './GateNode';
import InputNode from './InputNode';
import OutputNode from './OutputNode';
import './CircuitNode.css';

const GATE_ICONS = Object.fromEntries(GATE_TOOLS.map(({ type, icon }) => [type, icon]));

export default function CircuitNode({ data, type }) {
  const {
    id,
    inputValues,
    inputs,
    isConnected,
    label,
    onDelete,
    outputs,
    updateNodeValue,
  } = data;
  const [showDetails, setShowDetails] = useState(false);

  const content = type === 'INPUT'
    ? <InputNode id={id} label={label} updateNodeValue={updateNodeValue} />
    : type === 'OUTPUT'
      ? <OutputNode id={id} inputValues={inputValues} label={label} updateNodeValue={updateNodeValue} />
      : (
        <GateNode
          gateType={type}
          icon={GATE_ICONS[type]}
          id={id}
          inputCount={inputs}
          inputValues={inputValues}
          label={label}
          showDetails={showDetails}
          updateNodeValue={updateNodeValue}
        />
      );

  return (
    <div className="node-container">
      <button
        aria-label={`Delete ${label}`}
        className="delete-button"
        onClick={() => onDelete(id)}
        type="button"
      >
        ×
      </button>

      {content}

      {!['INPUT', 'OUTPUT'].includes(type) && (
        <button
          aria-label={`${showDetails ? 'Hide' : 'Show'} ${type} gate details`}
          className="info-button"
          onClick={() => setShowDetails((visible) => !visible)}
          type="button"
        >
          ↻
        </button>
      )}

      {Array.from({ length: inputs }, (_, index) => (
        <Handle
          className={`handle-input ${isConnected?.input?.[index] ? 'connected' : ''}`}
          id={`input-${index}`}
          key={`input-${index}`}
          position={Position.Left}
          style={{ top: `${(index + 1) * 40}px` }}
          type="target"
        />
      ))}

      {Array.from({ length: outputs }, (_, index) => (
        <Handle
          className={`handle-output ${isConnected?.output?.[index] ? 'connected' : ''}`}
          id={`output-${index}`}
          key={`output-${index}`}
          position={Position.Right}
          type="source"
        />
      ))}
    </div>
  );
}
