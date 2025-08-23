import React, { useState } from 'react';
import { Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material';

const InputNode = ({ id, label, updateNodeValue}) => {
  const [inputValue, setInputValue] = useState(null); // Default value is 0
  
  // Handle the change in radio button
  const handleChange = (event) => {
    const newValue = Number(event.target.value);
    console.log(`📌 InputNode [${id}]: Changing value to ${newValue}`);
    setInputValue(newValue);
    updateNodeValue(id, newValue);
    console.log(`✅ InputNode [${id}]: updateNodeValue(${id}, ${newValue}) called`);
  }

  return (
    <div className={`node ${
      inputValue === 1 ? 'true-value' :
      inputValue === 0 ? 'false-value' :
      'transparent'
    }`}>
      <div className="node-container">
      
      <div className="node-header">
        <span>{label}</span>
      </div>

      <div className="node-body">
        <FormControl component="fieldset">
          <RadioGroup row value={inputValue} onChange={handleChange}>
            <FormControlLabel value={0} control={<Radio />} label="0" />
            <FormControlLabel value={1} control={<Radio />} label="1" />
          </RadioGroup>
        </FormControl>
      </div>
    </div>
    </div>
  );

  };

export default InputNode;
