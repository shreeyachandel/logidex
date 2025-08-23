import React, { useState, useEffect } from "react";
import { Typography, Box, Tabs, Tab, Divider } from "@mui/material";

const PropositionalComputation = ({ data }) => {
  const [value, setValue] = useState(0); // 0 for CNF, 1 for DNF
  const [propositionalData, setPropositionalData] = useState(data || {});

  useEffect(() => {
    console.log("Incoming data:", data); // debug
    if (data) {
      setPropositionalData(data);
    }
  }, [data]);

  if (!propositionalData) return null;

  const { formula, cnfsteps = [], dnfsteps = [], cnfformula, dnfformula } = propositionalData;

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const renderSteps = (steps, isCNF) => {
    const reducedFormula = isCNF ? cnfformula : dnfformula;

    return (
      <>
        {/* Display the reduced formula at the top */}
        <Box sx={{ marginBottom: "1rem", padding: "1rem", backgroundColor: "#f5f5f5" }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
            {isCNF ? "CNF Reduced Formula: " : "DNF Reduced Formula: "}
          </Typography>
          <Typography variant="body1" sx={{ fontSize: "1.2rem", fontStyle: "italic" }}>
            {reducedFormula}
          </Typography>
        </Box>
  
        {/* 🔍 Then check if steps exist */}
        {(!steps || steps.length === 0) ? (
          <Typography variant="body2" color="textSecondary">
            No steps available
          </Typography>
        ) : (
          steps.map((stepObj, index) => {
            const { step_number, step, formula } = stepObj;
  
            let beforeColon = '';
            let betweenColonAndArrow = '';
            let afterArrow = '';
  
            if (step.includes(':')) {
              const [before, after] = step.split(':');
              beforeColon = before.trim();
              if (after.includes('→')) {
                const [between, afterArrowPart] = after.split('→');
                betweenColonAndArrow = between.trim();
                afterArrow = afterArrowPart.trim();
              }
            }
  
            const highlightChangedPart = (formula) => {
              if (formula.includes('→')) {
                const [beforeArrow, afterArrow] = formula.split('→').map(part => part.trim());
                return (
                  <>
                    {beforeArrow}
                    <span style={{ color: 'red', fontWeight: 'bold' }}>
                      {afterArrow}
                    </span>
                  </>
                );
              }
              return formula;
            };
  
            return (
              <Box key={index} sx={{ marginBottom: "1rem" }}>
                <Typography
                  variant="body1"
                  gutterBottom
                  sx={{
                    color: "#3498db",
                    fontWeight: "bold",
                    fontSize: "1.1rem",
                  }}
                >
                  Step {step_number}
                </Typography>
  
                <Typography
                  variant="body2"
                  sx={{
                    color: "#8B0000",
                    fontWeight: "bold",
                    display: "inline",
                  }}
                >
                  {beforeColon}:
                </Typography>
  
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ marginBottom: "0.5rem", display: "inline", marginLeft: "0.5rem" }}
                >
                  {betweenColonAndArrow}
                </Typography>
  
                <span style={{ color: "#8B0000", fontWeight: "bold" }}>→</span>
  
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ marginBottom: "0.5rem", display: "inline", marginLeft: "0.5rem" }}
                >
                  {afterArrow}
                </Typography>
  
                <Typography variant="body2" sx={{ marginTop: "0.5rem", fontStyle: "italic" }}>
                  Formula: {highlightChangedPart(formula)}
                </Typography>
  
                <Divider sx={{ marginTop: "1rem" }} />
              </Box>
            );
          })
        )}
      </>
    );
  };

  return (
    <div style={{ padding: "1rem" }}>
      <Typography variant="h6" gutterBottom className="section-heading">
        Generated Propositional Formula
      </Typography>

      {/* Display the original formula */}
      <div className="formula-box" style={{ padding: "0.5rem", backgroundColor: "#f5f5f5", marginBottom: "1rem" }}>
        <Typography variant="body1">{formula}</Typography>
      </div>

      {/* CNF/DNF Tabs */}
      <Box sx={{ width: "100%", marginTop: "1rem" }}>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Typography variant="body2">
            Steps Generated:{" "}
            <strong>
              {value === 0 ? cnfsteps.length : dnfsteps.length}
            </strong>
          </Typography>
        </Box>

        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="formula computation tabs"
          sx={{
            display: "flex",
            justifyContent: "space-between",
            ".MuiTabs-flexContainer": {
              width: "100%",
            },
            ".MuiTab-root": {
              width: "50%",
              textAlign: "center",
            },
          }}
        >
          <Tab label="Conjunctive Normal Form" />
          <Tab label="Disjunctive Normal Form" />
        </Tabs>
  
        <Box sx={{ padding: "1rem", backgroundColor: "#f5f5f5" }}>
          {value === 0 && renderSteps(cnfsteps, true)}
          {value === 1 && renderSteps(dnfsteps, false)}
        </Box>
      </Box>
    </div>
  );
        }
  export default PropositionalComputation;
  