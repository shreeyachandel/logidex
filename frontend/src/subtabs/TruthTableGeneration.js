import React, { useState, useEffect } from "react";
import TruthTable from "../components/TruthTable";
import { Button, Typography } from "@mui/material";
import "./styles.css";
import { validateCircuit } from "../utils/validateCircuit";
const apiUrl = process.env.REACT_APP_API_BASE_URL;

const TruthTableGeneration = ({ elements, edges, resetSignal }) => {
  const [truthTableData, setTruthTableData] = useState(null);
  const [error, setError] = useState("");
  const [truthTableRows, setTruthTableRows] = useState([]);

  useEffect(() => {
    setTruthTableRows([]);
    setTruthTableData(null);
    setError("");
  }, [resetSignal]);

  useEffect(() => {
    const { valid } = validateCircuit(elements, edges);
    if (!valid) {
      setTruthTableData(null);
    }
  }, [elements, edges]);


  const handleCompute = async () => {
    setError("");

    const { valid, error: validationError } = validateCircuit(elements, edges);
    if (!valid) {
      setError(validationError);
      return;
    }

    // Creating the current_input_combination with input node values (0 or 1)
    const current_input_combination = elements
      .filter((node) => node.type === "INPUT")
      .map((node) => ({
        nodeId: node.id,
        value: node.data.inputValues || [], // Assuming inputValues is an array, adjust if needed
      }));

    // Log the current_input_combination for debugging
    console.log("🔍 Current Input Combination:", current_input_combination);

    const circuitData = {
      nodes: elements.map((node) => ({
        id: node.id,
        type: node.type,
        inputValues: node.data.inputValues || [],
      })),
      connections: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
      current_input_combination,
    };

    console.log("📤 Sending circuit data:", circuitData);

    try {
      const response = await fetch(`${apiUrl}/api/compute-truth-table`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(circuitData),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      console.log("✅ Received truth table data:", data);
      setTruthTableData(data);
    } catch (error) {
      setError("Error fetching truth table data.");
      console.error("❌ API Error:", error);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h6" className="sleek-heading">
        Truth Table Generation
      </Typography>

      {/* Align the button on the left */}
      <div style={{ display: "flex", justifyContent: "flex-start", margin: "1.5rem 0" }}>
        <Button 
          onClick={handleCompute} 
          variant="outlined" 
          color="primary"
          className="compute-button"
        >
          Compute
        </Button>
      </div>

      {error && <Typography color="error">{error}</Typography>}

      {truthTableData && <TruthTable data={truthTableData} />}
    </div>
  );
};

export default TruthTableGeneration;

