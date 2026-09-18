import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import WorkspacePage from './pages/WorkspacePage';

function App() {
  return (
    <ReactFlowProvider>
      <WorkspacePage />
    </ReactFlowProvider>
  );
}

export default App;
