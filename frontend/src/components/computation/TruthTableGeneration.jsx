import React, { useState, useEffect } from "react";
import TruthTable from "../TruthTable";
import { Button, Typography } from "@mui/material";
import "./styles.css";
import { validateCircuit } from "../../utils/validateCircuit";
import { computeTruthTable } from "../../api/circuitApi";
import { serializeCircuit } from "../../utils/circuitData";

const TruthTableGeneration = ({ elements, edges, resetSignal }) => {
  const [truthTableData, setTruthTableData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
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

    try {
      const data = await computeTruthTable(serializeCircuit(elements, edges, true));
      setTruthTableData(data);
    } catch (requestError) {
      setError(requestError.message || "Unable to generate the truth table.");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h6" className="sleek-heading">
        Truth Table Generation
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

      {truthTableData && <TruthTable data={truthTableData} />}
    </div>
  );
};

export default TruthTableGeneration;
