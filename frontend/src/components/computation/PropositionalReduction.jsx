import React, { useState, useEffect } from "react";
import { Button, Typography } from "@mui/material";
import { validateCircuit } from "../../utils/validateCircuit";
import PropositionalComputation from "../PropositionalComputation"
import "./styles.css";
import { computePropositionalReduction } from "../../api/circuitApi";
import { serializeCircuit } from "../../utils/circuitData";

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

    try {
      const data = await computePropositionalReduction(serializeCircuit(elements, edges));
      setPropositionalData(data);
    } catch (requestError) {
      setError(requestError.message || "Unable to reduce the propositional formula.");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
  <Typography variant="h6" className="sleek-heading">
        Propositional Reduction
      </Typography>


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
