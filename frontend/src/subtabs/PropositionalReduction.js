import React, { useState, useEffect } from "react";
import { Button, Typography } from "@mui/material";
import { validateCircuit } from "../utils/validateCircuit";
import PropositionalComputation from "../components/PropositionalComputation"
import "./styles.css";
const apiUrl = process.env.REACT_APP_API_BASE_URL;

const PropositionalReduction = ({ elements, edges, resetSignal }) => {
  const [propositionalData, setPropositionalData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setPropositionalData(null);
    setError("");
  }, [resetSignal]); 

  useEffect(() => {
    const { valid } = validateCircuit(elements, edges);
    if (!valid) {
      setPropositionalData(null);
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
    };

    console.log("📤 Sending circuit data:", circuitData);

    try {
      const response = await fetch(`${apiUrl}/api/compute-propositional-formula`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(circuitData),
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      console.log("✅ Received propositional formula data:", data);
      setPropositionalData(data);
    } catch (error) {
      setError("Error fetching propositional formula data.");
      console.error("❌ API Error:", error);
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
  <Typography variant="h6" className="sleek-heading">
        Propositional Reduction
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

      {propositionalData && <PropositionalComputation data={propositionalData} />}
    </div>
  );
};


export default PropositionalReduction;
