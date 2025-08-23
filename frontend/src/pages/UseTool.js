import React, { useState, useEffect, useRef, useCallback} from 'react';
import { Snackbar, Alert, Tooltip, Tabs, Tab , Button} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ReactFlow from 'react-flow-renderer';
import { useReactFlow } from 'reactflow';
import WelcomeModal from "../components/WelcomeModal";
import ReactTour from 'reactour';
import Node from '../components/Base Node/Node.js';
import TruthTableGeneration from "../subtabs/TruthTableGeneration";
import PropositionalReduction from "../subtabs/PropositionalReduction";
import "../App.css";

// Icons
import AndGateIcon from '../icons/and-gate-icon.svg';
import OrGateIcon from '../icons/or-gate-icon.svg';
import NotGateIcon from '../icons/not-gate-icon.svg';
import NandGateIcon from '../icons/nand-gate-icon.svg';
import NorGateIcon from '../icons/nor-gate-icon.svg';
import XorGateIcon from '../icons/xor-gate-icon.svg';
import XnorGateIcon from '../icons/xnor-gate-icon.svg';

import { v4 as uuidv4 } from 'uuid';
import clsx from 'clsx';

// Initial constants
const initialElements = [];
const apiUrl = process.env.REACT_APP_API_BASE_URL;
const nodeTypes = {
  INPUT: Node,
  OUTPUT: Node,
  AND: Node,
  OR: Node,
  NOT: Node,
  NAND: Node,
  NOR: Node,
  XOR: Node,
  XNOR: Node,
};

const terminalConfig = {
  INPUT: { inputs: 0, outputs: 1 },
    OUTPUT: { inputs: 1, outputs: 0 },
    NOT: { inputs: 1, outputs: 1 },
    AND: { inputs: 2, outputs: 1 },
    OR: { inputs: 2, outputs: 1 },
    NAND: { inputs: 2, outputs: 1 },
    NOR: { inputs: 2, outputs: 1 },
    XOR: { inputs: 2, outputs: 1 },
    XNOR: { inputs: 2, outputs: 1 },
  };

const UseToolPage = () => {

  // =============== STATES ===============
  const [elements, setElements] = useState(initialElements); // Nodes on the canvas
  const [selectedNodeType, setSelectedNodeType] = useState(null); // Node type selected on the toolbar
  const [edges, setEdges] = useState([]); // Connections between nodes on the canvas
  const [nodeValues, setNodeValues] = useState({}); // Value stored by each node
  const [inputValues, setInputValues] = useState({}); // Input values provided to each node
  const [activeTab, setActiveTab] = useState(0); // Active tab in the computational section
  const [showResetToast, setShowResetToast] = useState(false); // Reset toast visibility
  const [resetSignal, setResetSignal] = useState(false); // Signal to TruthTableGeneration to reset
  const [showWelcomeModal, setShowWelcomeModal] = useState(true); // Welcome modal on first open
  const [tutorialActive, setTutorialActive] = useState(false); // Tutorial provided in welcome modal
  const [formulaInput, setFormulaInput] = useState(""); // Formula inputted for conversion to visualisation
  const [errorMessage, setErrorMessage] = useState("");  // Error Message for incorrect formula format
  const [inputNodeLimitReached, setInputNodeLimitReached] = useState(false); // Tracking the input nodes limit
  const usedInputIds = useRef([]); // Input nodes currently in use
  const { project } = useReactFlow();


// =============== SIDE EFFECTS ===============

// Track the connections between nodes (input/output connections)

useEffect(() => {
  // Skip if there are no elements or edges to process
  if (elements.length === 0) return;
  
  // Create connection map to track input/output connections
  const connectionMap = {};
  
   // Initialize the map with input and output handle arrays based on the node data (terminalConfig)
  elements.forEach(node => {
    if (!node.data) return;
    
    connectionMap[node.id] = {
      input: Array(node.data.inputs || 0).fill(false),
      output: Array(node.data.outputs || 0).fill(false),
    };
  });
  
  // Fill connection map with connections using the edges state
  edges.forEach(edge => {
    try {
      // For the source node, mark the corresponding output as connected
      if (connectionMap[edge.source] && edge.sourceHandle) {
        const outputIndex = parseInt(edge.sourceHandle.split('-')[1]);
        if (!isNaN(outputIndex) && connectionMap[edge.source].output[outputIndex] !== undefined) {
          connectionMap[edge.source].output[outputIndex] = true;
        }
      }
      
      // For the target node, mark the corresponding input as connected
      if (connectionMap[edge.target] && edge.targetHandle) {
        const inputIndex = parseInt(edge.targetHandle.split('-')[1]);
        if (!isNaN(inputIndex) && connectionMap[edge.target].input[inputIndex] !== undefined) {
          connectionMap[edge.target].input[inputIndex] = true;
        }
      }
    } catch (err) {
      console.error("Error processing edge:", edge, err);
    }
  });
  
  // Update elements with the connection status for each node
  setElements(els => 
    els.map(node => ({
      ...node,
      data: {
        ...node.data,
        isConnected: connectionMap[node.id] || { input: [], output: [] }
      }
    }))
  );
}, [edges, edges.length]);

  // Update input values when edges or node values change
  useEffect(() => {
    const newInputValues = {};
  
    edges.forEach(edge => {
      const { source, target } = edge; // source → output node, target → input node
      if (!newInputValues[target]) newInputValues[target] = [];
      newInputValues[target].push(nodeValues[source] ?? null);  // Get source node value
    });
  
    elements.forEach((node) => {
      if (node.type === "INPUT") {
        newInputValues[node.id] = [nodeValues[node.id] ?? null];
      }
    });

    setInputValues(newInputValues);
  }, [edges, nodeValues]);

  // Update elements when input values or node values change
  useEffect(() => {
    setElements((els) => {
      let updated = false; // Track if anything changes
  
      const newElements = els.map((node) => {
        
        // If no valid inputs, store empty list; otherwise, keep the computed values
        const newInputValues = inputValues[node.id] || [];

        // Only update if inputValues changed
        if (JSON.stringify(node.data.inputValues) !== JSON.stringify(newInputValues)) {
          updated = true;
          return {
            ...node,
            data: {
              ...node.data,
              updateNodeValue,
              inputValues: newInputValues,
            },
          };
        }
  
        return node;
      });
  
      return updated ? newElements : els; // Only update state if something changed
    });
  }, [nodeValues, inputValues]); 

  useEffect(() => {
    const inputNodeCount = elements.filter(el => el.type === 'INPUT').length;
    if (inputNodeCount >= 10) {
      setInputNodeLimitReached(true);
      if (selectedNodeType === 'INPUT') {
        setSelectedNodeType(null); // Prevent adding more input nodes
      }
    } else {
      setInputNodeLimitReached(false);
    }
  }, [elements, selectedNodeType]);
  

// Auto-dismiss error message
useEffect(() => {
  if (errorMessage) {
    const timeout = setTimeout(() => {
      setErrorMessage("");
    }, 6000); // 3 seconds

    return () => clearTimeout(timeout); // cleanup
  }
}, [errorMessage]);
  
// Load react flow
const onLoad = (reactFlowInstance) => {
  console.log("React Flow Loaded", reactFlowInstance);
};

  // Handle tab switching
  const handleChange = (event, newValue) => {
    setActiveTab(newValue);
  };


// =============== HANDLERS ===============

  // Function to handle the start of the tutorial
const handleStartTutorial = () => {
  setShowWelcomeModal(false);   // Hide modal
  setTutorialActive(true);      // Start tutorial
};

// Function to handle changes in the formula input
const handleFormulaChange = (e) => {
  setFormulaInput(e.target.value);
};

// Function to prettify the layout of nodes based on connections
function prettifyLayout(nodes, connections) {
  const nodeMap = {};
  const inDegrees = {};
  const levels = {};

  // Map nodes & initialize inDegrees
  nodes.forEach(node => {
    nodeMap[node.id] = node;
    inDegrees[node.id] = 0;
  });

  // Build in-degree map from connections
  connections.forEach(conn => {
    inDegrees[conn.target] += 1;
  });

  // Start with nodes with in-degree 0 (inputs)
  const queue = [];
  Object.keys(inDegrees).forEach(id => {
    if (inDegrees[id] === 0) {
      levels[id] = 0;
      queue.push(id);
    }
  });

  // BFS to assign levels (horizontal columns)
  while (queue.length > 0) {
    const curr = queue.shift();
    const currLevel = levels[curr];

    connections.forEach(conn => {
      if (conn.source === curr) {
        levels[conn.target] = Math.max(levels[conn.target] || 0, currLevel + 1);
        inDegrees[conn.target] -= 1;
        if (inDegrees[conn.target] === 0) {
          queue.push(conn.target);
        }
      }
    });
  }

  // Group nodes by level
  const levelMap = {};
  Object.entries(levels).forEach(([id, level]) => {
    if (!levelMap[level]) levelMap[level] = [];
    levelMap[level].push(nodeMap[id]);
  });

  // Assign positions: left to right
  const horizontalSpacing = 220;
  const verticalSpacing = 120;

  Object.entries(levelMap).forEach(([levelStr, nodesAtLevel]) => {
    const level = parseInt(levelStr);
    const totalHeight = (nodesAtLevel.length - 1) * verticalSpacing;

    nodesAtLevel.forEach((node, index) => {
      node.position = {
        x: level * horizontalSpacing,
        y: index * verticalSpacing - totalHeight / 2,
      };
    });
  });

  return nodes;
}

// Function to handle the submission of the formula and create the circuit
const handleFormulaSubmit = () => {
  handleReset(); // Clear existing state first
  fetch(`${apiUrl}/api/create-circuit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ formula: formulaInput }),
  })
    .then(response => response.json())
    .then((data) => {
      if (data.error) {
        setErrorMessage(data.error);
      } else {
        setErrorMessage('');
        
        // Process nodes and connections
        const tempNodes = [];
        const inputNodeMap = {}; // Map backend input IDs to frontend IDs

        const flattenedNodes = data.nodes.flat(); // Flatten nodes if needed

        // First pass: Create all nodes and build ID mapping
        flattenedNodes.forEach((node) => {
          const { x, y } = node.position || { x: Math.random() * 400 + 100, y: Math.random() * 300 + 50 };

          let id;
          let label;

          if (node.type === 'INPUT') {
            id = getNextAvailableInputId(); // Get the next available input ID from frontend logic
            if (!id) {
              console.warn('Maximum 10 input nodes allowed!');
              return;
            }
            inputNodeMap[node.id] = id; // Map backend ID to frontend ID
            label = id;
          } else {
            // For non-input nodes (like gates), use the backend-provided ID
            id = node.id;
            label = node.type;
          }

          // Create node with proper data
          tempNodes.push({
            id,
            type: node.type,
            position: { x, y },
            data: {
              id,
              label,
              inputValues: [],
              inputs: terminalConfig[node.type]?.inputs || 0,
              outputs: terminalConfig[node.type]?.outputs || 0,
              updateNodeValue,
              onDelete: handleDelete,
            }
          });
        });

        // Initialize input values
        const initialNodeValues = {};
        tempNodes.forEach(node => {
          if (node.type === 'INPUT') {
            initialNodeValues[node.id] = null; // Default inputs to null
          }
        });

        // Set nodes first
        const prettyNodes = prettifyLayout(tempNodes, data.connections);
        setElements(prettyNodes);

        // Set initial values for input nodes
        setNodeValues(initialNodeValues);

        // Process connections with a slight delay to ensure nodes are fully rendered
        setTimeout(() => {
          const connectionCounts = {};

          // Map connections to use frontend input IDs
          const mappedConnections = data.connections.map(conn => {
            const source = inputNodeMap[conn.source] || conn.source;
            const target = inputNodeMap[conn.target] || conn.target;

            if (!source || !target) return null;

            if (!connectionCounts[target]) {
              connectionCounts[target] = 0;
            }

            const inputIdx = connectionCounts[target];
            const targetNode = tempNodes.find(n => n.id === target);

            if (targetNode && inputIdx >= targetNode.data.inputs) {
              console.warn(`Too many connections to ${target}, max is ${targetNode.data.inputs}`);
              return null;
            }

            connectionCounts[target]++;

            return {
              source,
              target,
              sourceHandle: 'output-0',
              targetHandle: `input-${inputIdx}`,
            };
          }).filter(Boolean);

          setEdges(mappedConnections);
        }, 300);
      }
    })
    .catch((err) => {
      setErrorMessage('An error occurred while processing the formula.');
      console.error(err);
    });
};

// Function to get the next available input ID for the frontend
const getNextAvailableInputId = () => {
  for (let i = 0; i < 10; i++) {
    const letter = String.fromCharCode(65 + i); // 'A' to 'J'
    if (!usedInputIds.current.includes(letter)) {
      usedInputIds.current.push(letter);
      return letter;
    }
  }
  return null; // Max 10 input nodes
};

// Function to release the input ID when a node is deleted
const releaseInputId = (id) => {
  usedInputIds.current = usedInputIds.current.filter((item) => item !== id);
};

// Function to add a new node to the canvas
const onPaneClick = useCallback((event) => {
  if (!selectedNodeType) return;

  const reactFlowBounds = event.target.getBoundingClientRect();
  const position = project({
    x: event.clientX - reactFlowBounds.left,
    y: event.clientY - reactFlowBounds.top
  });

  let id;
  let label;

  if (selectedNodeType === 'INPUT') {
    id = getNextAvailableInputId();
    if (!id) {
      alert('Maximum 10 input nodes allowed!');
      return;
    }
    label = id;
  } else {
    id = uuidv4();
    label = selectedNodeType;
  }

  const newNode = {
    id,
    type: selectedNodeType,
    data: {
      id,
      label,
      onDelete: handleDelete,
      inputs: terminalConfig[selectedNodeType]?.inputs || 0,
      outputs: terminalConfig[selectedNodeType]?.outputs || 0,
      updateNodeValue,
      inputValues: inputValues[id] || [],
    },
    position,
  };

  setElements((els) => [...els, newNode]);
}, [selectedNodeType, inputValues]);

// Function to delete a node and its associated edges
const handleDelete = (id) => {
  setElements((els) => els.filter((el) => el.id !== id));
  if (usedInputIds.current.includes(id)) {
    releaseInputId(id);
  }
  setEdges((prevEdges) => {
    const updatedEdges = prevEdges.filter((edge) => edge.source !== id && edge.target !== id);
    return updatedEdges;
  });

  setNodeValues((prevValues) => {
    const updatedValues = { ...prevValues };
    delete updatedValues[id];
    return updatedValues;
  });
};

// Function to update the value stored in a node
const updateNodeValue = (nodeId, value) => {
  setNodeValues((prevValues) => {
    const updatedValues = {
      ...prevValues,
      [nodeId]: value,
    };
    return updatedValues;
  });
};

// Function to reset the state, clearing nodes, edges, and other states
const handleReset = () => {
  setElements([]);
  setEdges([]);
  setNodeValues({});
  setInputValues({});
  setSelectedNodeType(null);

  usedInputIds.current = [];

  // Trigger reset in TruthTableGeneration
  setResetSignal(prev => !prev);  // Flip the signal
  setShowResetToast(true);
};

// Function to handle new connections between nodes
const onConnect = (params) => {
  setEdges((eds) => [...eds, params]);  // Add the new edge to the state
};

// Function to update node position when dragged
const onNodeDrag = (event, node) => {
  setElements((els) =>
    els.map((el) =>
      el.id === node.id
        ? { ...el, position: { x: node.position.x, y: node.position.y } }
        : el
    )
  );
};

return (
  <>
  <div className="top-bar">
  <span className="logi-text">Logi</span>
  <span className="dex-text">Dex</span>
</div>
  <div className="page-container">
    
    {/* Welcome Modal */}
    {showWelcomeModal && <WelcomeModal onStartTutorial={handleStartTutorial} />}

    {/* Tutorial Flow (Reactour) */}
    {tutorialActive && (
      <ReactTour
        steps={[
          {
            selector: '.left-toolbar',
            content: 'This is the toolbar where you can select the gates and nodes to add to your circuit.',
          },
          {
            selector: '.canvas-container',
            content: 'This is where you can draw the logic circuit. Click on the icons in the toolbar, drag and drop nodes and draw connections between them.',
          },
          {
            selector: '.reset-button',
            content: 'You can reset the canvas and computation using this button.',
          },
          {
            selector: '.formula-section',
            content: 'You can also input a logical formula here, and we’ll automatically generate the corresponding circuit for you!',
          },
          {
            selector: '.compute-section',
            content: 'Here, you can create a truth table for your circuit! Click on the Compute button and see what happens!',
          },
          {
            selector: '.compute-section',
            content: 'You can also switch to the Propositional Reduction tab. It will show the process of reducing the propositional formula into conjunctive and disjunctive normal forms.',
          },
        ]}
        isOpen={tutorialActive}
        onRequestClose={() => setTutorialActive(false)}  // Close the tutorial when done
      />
    )}

    <div className="container">
      {/* Toolbar */}
      <div className="left-toolbar">
        <div className="reset-toolbar-top">
          <Tooltip title="RESET CANVAS AND COMPUTATION">
            <button
              onClick={handleReset}
              className="toolbar-button reset-button"
              style={{ backgroundColor: '#ffdddd', color: 'red', fontWeight: 'bold' }}
            >
              <RestartAltIcon style={{ fontSize: '20px' }} />
              Reset
            </button>
          </Tooltip>
        </div>

        <div className="scrollable-toolbar">
          <Tooltip title={
            inputNodeLimitReached
              ? "Sorry, you have exceeded the number of input nodes you can use – 10/10"
              : "INPUT NODE"
          }>
            <button
              onClick={() => !inputNodeLimitReached && setSelectedNodeType('INPUT')}
              className={clsx("toolbar-button", {
                selected: selectedNodeType === 'INPUT',
                disabled: inputNodeLimitReached,
              })}
              disabled={inputNodeLimitReached}
            >
              Input Node
            </button>
          </Tooltip>

          <Tooltip title="OUTPUT NODE">
            <button
              onClick={() => setSelectedNodeType('OUTPUT')}
              className={clsx("toolbar-button", {
                selected: selectedNodeType === 'OUTPUT',
              })}
            >
              Output Node
            </button>
          </Tooltip>

          {[{ type: 'AND', icon: AndGateIcon }, { type: 'OR', icon: OrGateIcon }, 
            { type: 'NOT', icon: NotGateIcon }, { type: 'NAND', icon: NandGateIcon }, 
            { type: 'NOR', icon: NorGateIcon }, { type: 'XOR', icon: XorGateIcon }, 
            { type: 'XNOR', icon: XnorGateIcon }]
            .map(({ type, icon }) => (
              <Tooltip title={`${type} GATE`} key={type}>
                <button
                  onClick={() => setSelectedNodeType(type)}
                  className={clsx("toolbar-button", {
                    selected: selectedNodeType === type,
                  })}
                >
                  <img src={icon} alt={`${type} Gate`} style={{ width: '30px', height: '30px' }} />
                </button>
              </Tooltip>
            ))
          }
        </div>
      </div>

      <Snackbar
        open={showResetToast}
        autoHideDuration={3000}
        onClose={() => setShowResetToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="info" onClose={() => setShowResetToast(false)} sx={{ width: '100%' }}>
          Canvas and computation have been reset!
        </Alert>
      </Snackbar>

      {/* Canvas */}
      <div className="canvas-container">
        <ReactFlow
          nodes={elements}
          edges={edges}
          onLoad={onLoad}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          onNodeDrag={onNodeDrag}
          onConnect={onConnect}
        >
        </ReactFlow>
        <canvas id="toolCanvas" />
      </div>

      <div className="formula-section">
        <h3>Create Circuit Diagram from Formula:</h3>
        <textarea
            value={formulaInput}
            onChange={handleFormulaChange}
            placeholder={`Enter your propositional formula here\n(e.g. A AND (B OR C))`}
            rows="9"
            maxLength={400}
            className="formula-textarea"
/>
          <div style={{ display: "flex", justifyContent: "flex-end", margin: "1.5rem 0" }}>
            <Button
              onClick={handleFormulaSubmit}
              variant="outlined"
              color="primary"
              className="formula-submit-button"
            >
              Create Circuit
            </Button>
          </div>
        {errorMessage && (
          <div className="error-box">
            {errorMessage}
          </div>
        )}
      </div>
    </div>

    {/* Compute Section (BELOW CANVAS) */}
    <div className="compute-section">
      <Tabs
        value={activeTab}
        onChange={handleChange}
        className="compute-tabs"
        variant="fullWidth"
        slotProps={{
          indicator: {
            className: activeTab === 0 ? 'active-tab-0' : 'active-tab-1'
          }
        }}
      >
        <Tab label="Truth Table Generation" />
        <Tab label="Propositional Reduction" />
      </Tabs>

      {/* Content for each tab */}
      <div className="compute-content">
        {activeTab === 0 && <TruthTableGeneration elements={elements} edges={edges} resetSignal={resetSignal} />}
        {activeTab === 1 && <PropositionalReduction elements={elements} edges={edges} resetSignal={resetSignal} />}
      </div>
    </div>
  </div>
  </>
);
};

export default UseToolPage;