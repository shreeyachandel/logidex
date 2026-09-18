import { FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';
import { useState } from 'react';

export default function InputNode({ id, label, updateNodeValue }) {
  const [value, setValue] = useState(null);

  const handleChange = (event) => {
    const nextValue = Number(event.target.value);
    setValue(nextValue);
    updateNodeValue(id, nextValue);
  };

  const stateClass = value === 1 ? 'true-value' : value === 0 ? 'false-value' : 'transparent';
  return (
    <div className={`node ${stateClass}`}>
      <div className="node-header"><span>{label}</span></div>
      <div className="node-body">
        <FormControl component="fieldset">
          <RadioGroup aria-label={`${label} value`} onChange={handleChange} row value={value}>
            <FormControlLabel value={0} control={<Radio />} label="0" />
            <FormControlLabel value={1} control={<Radio />} label="1" />
          </RadioGroup>
        </FormControl>
      </div>
    </div>
  );
}
