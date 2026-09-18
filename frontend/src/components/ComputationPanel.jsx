import { Tab, Tabs } from '@mui/material';

import PropositionalReduction from './computation/PropositionalReduction';
import TruthTableGeneration from './computation/TruthTableGeneration';

export default function ComputationPanel({ activeTab, edges, nodes, onTabChange, resetVersion }) {
  return (
    <section className="compute-section">
      <Tabs
        className="compute-tabs"
        onChange={(_, value) => onTabChange(value)}
        slotProps={{
          indicator: {
            className: activeTab === 0 ? 'active-tab-0' : 'active-tab-1',
          },
        }}
        value={activeTab}
        variant="fullWidth"
      >
        <Tab label="Truth Table Generation" />
        <Tab label="Propositional Reduction" />
      </Tabs>

      <div className="compute-content">
        {activeTab === 0 && (
          <TruthTableGeneration elements={nodes} edges={edges} resetSignal={resetVersion} />
        )}
        {activeTab === 1 && (
          <PropositionalReduction elements={nodes} edges={edges} resetSignal={resetVersion} />
        )}
      </div>
    </section>
  );
}
