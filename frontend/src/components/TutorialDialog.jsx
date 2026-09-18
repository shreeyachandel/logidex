import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Typography,
} from '@mui/material';

const STEPS = [
  ['Choose components', 'Select inputs, outputs, or gates from the toolbar, then click the canvas to place them.'],
  ['Connect the circuit', 'Drag from a node output to the required input handle on another node.'],
  ['Set input values', 'Choose 0 or 1 on every input node to simulate the circuit in real time.'],
  ['Generate a circuit', 'Enter a formula such as A AND (B OR C) to build and arrange it automatically.'],
  ['Explore the result', 'Generate a truth table or inspect the step-by-step CNF and DNF reductions.'],
];

export default function TutorialDialog({ onClose, open }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  const [title, description] = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <LinearProgress variant="determinate" value={((step + 1) / STEPS.length) * 100} />
      <DialogTitle>{step + 1}. {title}</DialogTitle>
      <DialogContent>
        <Typography>{description}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Skip</Button>
        <Button disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
          Back
        </Button>
        <Button
          onClick={isLastStep ? onClose : () => setStep((current) => current + 1)}
          variant="contained"
        >
          {isLastStep ? 'Start building' : 'Next'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
