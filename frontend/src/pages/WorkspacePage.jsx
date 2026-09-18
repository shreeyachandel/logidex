import { useEffect, useState } from 'react';
import { Alert, Snackbar } from '@mui/material';
import ReactFlow from 'reactflow';

import CircuitNode from '../components/circuit/CircuitNode';
import CircuitToolbar from '../components/CircuitToolbar';
import ComputationPanel from '../components/ComputationPanel';
import FormulaPanel from '../components/FormulaPanel';
import TutorialDialog from '../components/TutorialDialog';
import WelcomeModal from '../components/WelcomeModal';
import { useCircuitEditor } from '../hooks/useCircuitEditor';
import '../App.css';

const NODE_TYPES = {
  INPUT: CircuitNode,
  OUTPUT: CircuitNode,
  AND: CircuitNode,
  OR: CircuitNode,
  NOT: CircuitNode,
  NAND: CircuitNode,
  NOR: CircuitNode,
  XOR: CircuitNode,
  XNOR: CircuitNode,
};

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');
  const [formula, setFormula] = useState('');
  const [showResetToast, setShowResetToast] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const editor = useCircuitEditor();

  useEffect(() => {
    if (!error) return undefined;
    const timeout = window.setTimeout(() => setError(''), 6000);
    return () => window.clearTimeout(timeout);
  }, [error]);

  const startTutorial = () => {
    setShowWelcome(false);
    setShowTutorial(true);
  };

  const resetWorkspace = () => {
    editor.reset();
    setShowResetToast(true);
  };

  const submitFormula = async () => {
    setError('');
    try {
      await editor.replaceWithFormula(formula.trim());
    } catch (requestError) {
      setError(requestError.message || 'Unable to create a circuit from that formula.');
    }
  };

  return (
    <>
      <header className="top-bar" aria-label="LogiDex">
        <span className="logi-text">Logi</span>
        <span className="dex-text">Dex</span>
      </header>

      <main className="page-container">
        <WelcomeModal
          open={showWelcome}
          onClose={() => setShowWelcome(false)}
          onStartTutorial={startTutorial}
        />
        <TutorialDialog open={showTutorial} onClose={() => setShowTutorial(false)} />

        <div className="container">
          <CircuitToolbar
            inputNodeLimitReached={editor.inputNodeLimitReached}
            onReset={resetWorkspace}
            onSelect={editor.setSelectedNodeType}
            selectedNodeType={editor.selectedNodeType}
          />

          <div className="canvas-container">
            <ReactFlow
              edges={editor.edges}
              fitView
              minZoom={0.35}
              nodes={editor.nodes}
              nodeTypes={NODE_TYPES}
              onConnect={editor.connectNodes}
              onEdgesChange={editor.onEdgesChange}
              onNodesChange={editor.onNodesChange}
              onPaneClick={editor.addNode}
            />
          </div>

          <FormulaPanel
            error={error}
            formula={formula}
            onChange={setFormula}
            onSubmit={submitFormula}
          />
        </div>

        <ComputationPanel
          activeTab={activeTab}
          edges={editor.edges}
          nodes={editor.nodes}
          onTabChange={setActiveTab}
          resetVersion={editor.resetVersion}
        />
      </main>

      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        autoHideDuration={3000}
        onClose={() => setShowResetToast(false)}
        open={showResetToast}
      >
        <Alert severity="info" onClose={() => setShowResetToast(false)}>
          Canvas and computation have been reset.
        </Alert>
      </Snackbar>
    </>
  );
}
