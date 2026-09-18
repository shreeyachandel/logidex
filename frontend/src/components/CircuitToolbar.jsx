import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { Tooltip } from '@mui/material';
import clsx from 'clsx';

import { GATE_TOOLS } from '../config/gateTools';

function ToolButton({ disabled = false, icon, label, onClick, selected = false }) {
  return (
    <Tooltip title={label}>
      <span>
        <button
          type="button"
          aria-label={label}
          className={clsx('toolbar-button', { disabled, selected })}
          disabled={disabled}
          onClick={onClick}
        >
          {icon || label}
        </button>
      </span>
    </Tooltip>
  );
}

export default function CircuitToolbar({
  inputNodeLimitReached,
  onReset,
  onSelect,
  selectedNodeType,
}) {
  return (
    <div className="left-toolbar">
      <div className="reset-toolbar-top">
        <ToolButton
          label="Reset canvas and computation"
          icon={<><RestartAltIcon sx={{ fontSize: 20 }} /> Reset</>}
          onClick={onReset}
        />
      </div>

      <div className="scrollable-toolbar">
        <ToolButton
          disabled={inputNodeLimitReached}
          label={inputNodeLimitReached ? 'Maximum of 10 input nodes reached' : 'Input node'}
          onClick={() => onSelect('INPUT')}
          selected={selectedNodeType === 'INPUT'}
        />
        <ToolButton
          label="Output node"
          onClick={() => onSelect('OUTPUT')}
          selected={selectedNodeType === 'OUTPUT'}
        />

        {GATE_TOOLS.map(({ type, icon }) => (
          <ToolButton
            key={type}
            label={`${type} gate`}
            icon={<img src={icon} alt="" width="30" height="30" />}
            onClick={() => onSelect(type)}
            selected={selectedNodeType === type}
          />
        ))}
      </div>
    </div>
  );
}
