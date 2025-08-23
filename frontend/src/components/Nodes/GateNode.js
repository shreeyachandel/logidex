import React, { useState, useEffect } from "react";
import EqualizerIcon from '@mui/icons-material/Equalizer';

// Function to compute the output based on gate type and inputs
const computeGateOutput = (inputs, gateType) => {

  // If any input is missing, return null (no computation)
  if (inputs.includes(null) || inputs.length === 0) {
    console.log(`🔴 Returning NULL for ${gateType} since some inputs are missing`);
    return null;
  }


  switch (gateType) {
    case "AND":
      return inputs.every(val => val === 1) ? 1 : 0;
    case "OR":
      return inputs.some(val => val === 1) ? 1 : 0;
    case "XOR":
      return inputs.reduce((a, b) => a ^ b, 0);
    case "NAND":
      return inputs.every(val => val === 1) ? 0 : 1;
    case "NOR":
      return inputs.some(val => val === 1) ? 0 : 1;
    case "NOT":
      return inputs[0] === 1 ? 0 : 1;
    case "XNOR":
      return inputs[0] === inputs[1] ? 1 : 0;
    default:
      return null;
  }
};


const GateNode = ({ id, label, gateType, icon, inputValues = [], updateNodeValue, isFlipped, inputCount = 2, }) => {
  const [gateOutput, setGateOutput] = useState(null);
  const [showTable, setShowTable] = useState(false);
  
  useEffect(() => {
  
    // Ensure inputValues are correctly updated
    const validInputs = inputValues.length > 0 ? inputValues : [null];
    const output = computeGateOutput(validInputs, gateType);
    setGateOutput(output);
    updateNodeValue(id, output);
  }, [inputValues, gateType]);

  const getDescription = {
    AND: "Returns 1 if all inputs are 1.",
    OR: "Returns 1 if at least one input is 1.",
    NOT: "Returns the opposite of the input.",
    NAND: "Returns 0 if all inputs are 1.",
    NOR: "Returns 1 if all inputs are 0.",
    XOR: "Returns 1 if inputs are different.",
    XNOR: "Returns 1 if inputs are the same.",
  };

  const generateTruthTable = () => {
    const rows = [];
    const totalCombinations = 2 ** inputCount;

    for (let i = 0; i < totalCombinations; i++) {
      const inputCombo = i.toString(2).padStart(inputCount, '0').split('').map(Number);
      const output = computeGateOutput(inputCombo, gateType);
      rows.push([...inputCombo, output]);
    }

    return rows;
  };

  const tableData = generateTruthTable();
  const currentInputStr = inputValues.join("");

    return (
      <div className={`node ${gateOutput === 1 ? 'true-value' : gateOutput === 0 ? 'false-value' : 'transparent'}`}>
        {isFlipped ? (
          <div className="node-container">
            <div className="node-backside">
              <h4>{gateType} Gate</h4>
              <p className="gate-description">{getDescription[gateType]}</p>
    
              <div
                className="truth-table-toggle"
                onMouseEnter={() => setShowTable(true)}
                onMouseLeave={() => setShowTable(false)}
              >
                <EqualizerIcon className="table-icon" />
                <span className="table-text">Truth Table</span>
    
                {showTable && (
                  <div
                    className="truth-table-popup"
                    onMouseEnter={() => setShowTable(true)}
                    onMouseLeave={() => setShowTable(false)}
                  >
                    <table className="mini-truth-table">
                      <tbody>
                        {tableData.map((row, idx) => {
                          const inputStr = row.slice(0, -1).join("");
                          const isHighlighted = inputStr === currentInputStr;
                          return (
                            <tr key={idx} className={isHighlighted ? 'highlighted' : ''}>
                              {row.map((val, i) => (
                                <td key={i} className={i === row.length - 1 ? 'output-column' : ''}>
                                  {val}
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
          </div>
        ) : (
          <div className="node-container">
            <img src={icon} alt={`${gateType} Gate`} className="node-image" />
            <p className="node-label">{label}</p>
          </div>
        )}
      </div>
    );
}
    

export default GateNode;