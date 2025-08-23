import React , {useState, useEffect} from "react";
import "./Node.css";
import GateNode from '../Nodes/GateNode'; // Import the reusable GateNode component
import InputNode from '../Nodes/InputNode'; // Import the InputNode component
import OutputNode from '../Nodes/OutputNode'; // Import the OutputNode component

import AndGateIcon from "../../icons/and-gate-icon.svg";
import OrGateIcon from "../../icons/or-gate-icon.svg";
import NotGateIcon from "../../icons/not-gate-icon.svg";
import NandGateIcon from "../../icons/nand-gate-icon.svg";
import NorGateIcon from "../../icons/nor-gate-icon.svg";
import XorGateIcon from "../../icons/xor-gate-icon.svg";
import XnorGateIcon from "../../icons/xnor-gate-icon.svg";

import {Handle, Position} from "react-flow-renderer"

const Node = ({type, data }) => {
  const { onDelete, label, id, inputs, outputs, isConnected, inputValues, updateNodeValue} = data;
  const [isFlipped, setIsFlipped] = useState(false);

  const gateIcons = {
    AND: AndGateIcon,
    OR: OrGateIcon,
    NOT: NotGateIcon,
    NAND: NandGateIcon,
    NOR: NorGateIcon,
    XOR: XorGateIcon,
    XNOR: XnorGateIcon,
  };

  const icon = gateIcons[type];
  
  const getNodeComponent = () => {
    switch (type) {
      case 'INPUT':
        return <InputNode id={id} label={label} updateNodeValue={updateNodeValue}/>;
      case 'OUTPUT':
        return <OutputNode id={id} label={label} inputValues={inputValues} updateNodeValue={updateNodeValue}/>;
      case 'AND':
      case 'OR':
      case 'NOT':
      case 'NAND':
      case 'NOR':
      case 'XOR':
      case 'XNOR':
        return <GateNode id={id} label={label} gateType={type} icon={icon}  inputValues={inputValues} updateNodeValue={updateNodeValue} isFlipped={isFlipped}
        inputCount={inputs}/>;
      default:
        return null;
    }
  };

  return (
    <div className="node-container">
      {/* Delete Button */}
      <button className="delete-button" onClick={() => onDelete(id)}>
        ✖
      </button>

      {getNodeComponent()}

      {/* Flip button for logic gates */}
      {type !== 'INPUT' && type !== 'OUTPUT' && (
        <button className="info-button" onClick={() => setIsFlipped(prev => !prev)}>
        ⤾
      </button>
      )}

      {/* Input Handles */}
      {Array.from({ length: inputs }).map((_, index) => (
      <Handle
        key={`input-${index}`}
        type="target"
        position={Position.Left}
        id={`input-${index}`}
        className={`handle-input ${isConnected?.input?.[index] ? 'connected' : ''}`}
        style={{
          top: `${(index + 1) * 40}px`, 
        }}
      />
    ))}


      {/* Output Handles */}
      {Array.from({ length: outputs }).map((_, index) => (
        <Handle
          key={`output-${index}`}
          type="source"
          position={Position.Right}
          id={`output-${index}`}
          className={`handle-output ${isConnected?.output?.[index] ? 'connected' : ''}`}
        />
      ))}
    </div>
  );
};

export default Node;
