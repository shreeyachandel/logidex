import React, { useEffect, useState } from 'react';

const OutputNode = ({ id, label, inputValues = [], updateNodeValue }) => {
  const [outputValue, setOutputValue] = useState(null);

  useEffect(() => {
    // OutputNode takes value of its first connected input
    const value = inputValues.length > 0 ? inputValues[0] : null;
    setOutputValue(value);
    updateNodeValue(id, value); // Update the node value
  }, [inputValues, id, updateNodeValue]);

  return (
    <div className={`node ${
      outputValue === 1 ? 'true-value' :
      outputValue === 0 ? 'false-value' :
      'transparent'
    }`}>
      <div className="node-container">
        <p className="node-label">{label}</p>
        <p className="node-output">Output: {outputValue !== null ? outputValue : 'N/A'}</p>
      </div>
    </div>
  );
};

export default OutputNode;
