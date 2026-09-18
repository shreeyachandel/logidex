import { Box, Divider, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';

function StepDescription({ description }) {
  const [action = description, transformation = ''] = description.split(':', 2);
  const [before = transformation, after = ''] = transformation.split('→', 2);

  return (
    <Typography component="div" variant="body2">
      <strong style={{ color: '#8b0000' }}>{action.trim()}:</strong>{' '}
      <span>{before.trim()}</span>
      {after && <><strong style={{ color: '#8b0000' }}> → </strong>{after.trim()}</>}
    </Typography>
  );
}

function FormulaChange({ formula }) {
  const [before, after] = formula.split('→', 2);
  if (!after) return formula;

  return (
    <>
      {before.trim()} →{' '}
      <strong style={{ color: '#c62828' }}>{after.trim()}</strong>
    </>
  );
}

function ReductionSteps({ finalFormula, label, steps }) {
  return (
    <>
      <Box sx={{ backgroundColor: '#f5f5f5', marginBottom: 2, padding: 2 }}>
        <Typography variant="h6" fontWeight="bold">{label} formula</Typography>
        <Typography variant="body1" fontSize="1.2rem" fontStyle="italic">
          {finalFormula}
        </Typography>
      </Box>

      {steps.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No transformation was required.</Typography>
      ) : steps.map((item) => (
        <Box key={`${item.step_number}-${item.step}`} sx={{ marginBottom: 2 }}>
          <Typography color="primary" fontWeight="bold">
            Step {item.step_number}
          </Typography>
          <StepDescription description={item.step} />
          <Typography variant="body2" sx={{ fontStyle: 'italic', marginTop: 1 }}>
            Formula: <FormulaChange formula={item.formula} />
          </Typography>
          <Divider sx={{ marginTop: 2 }} />
        </Box>
      ))}
    </>
  );
}

export default function PropositionalComputation({ data }) {
  const [activeForm, setActiveForm] = useState(0);
  if (!data) return null;

  const {
    cnfformula,
    cnfsteps = [],
    dnfformula,
    dnfsteps = [],
    formula,
  } = data;
  const activeSteps = activeForm === 0 ? cnfsteps : dnfsteps;

  return (
    <section style={{ padding: '1rem' }}>
      <Typography variant="h6" gutterBottom className="section-heading">
        Generated Propositional Formula
      </Typography>
      <Box sx={{ backgroundColor: '#f5f5f5', marginBottom: 2, padding: 1 }}>
        <Typography>{formula}</Typography>
      </Box>

      <Typography variant="body2" sx={{ marginBottom: 2 }}>
        Steps generated: <strong>{activeSteps.length}</strong>
      </Typography>
      <Tabs
        aria-label="Formula normal forms"
        onChange={(_, value) => setActiveForm(value)}
        value={activeForm}
        variant="fullWidth"
      >
        <Tab label="Conjunctive Normal Form" />
        <Tab label="Disjunctive Normal Form" />
      </Tabs>

      <Box sx={{ backgroundColor: '#f5f5f5', padding: 2 }}>
        {activeForm === 0 ? (
          <ReductionSteps finalFormula={cnfformula} label="CNF" steps={cnfsteps} />
        ) : (
          <ReductionSteps finalFormula={dnfformula} label="DNF" steps={dnfsteps} />
        )}
      </Box>
    </section>
  );
}
