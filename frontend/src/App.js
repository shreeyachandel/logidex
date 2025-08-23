import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import UseTool from './pages/UseTool';

function App() {
  return (
    <ReactFlowProvider>
      <Router>
      <Routes>
      <Route path="/" element={<Navigate to="/use-tool" />} />
        <Route path="/use-tool" element={<UseTool />} />
      </Routes>
    </Router>
    </ReactFlowProvider>
  );
}

export default App;

