// src/components/WelcomeModal.js
import React, { useEffect, useState } from "react";
import { Dialog, DialogTitle, DialogContent, Button, Typography } from "@mui/material";


const WelcomeModal = ({ onStartTutorial }) => {
  const [open, setOpen] = useState(false);
  
  const handleStartTutorial = () => {
    console.log("typeof onStartTutorial", typeof onStartTutorial);
      onStartTutorial(); // this should now work
    };

  useEffect(() => {
    setOpen(true); // Force modal to open on page load
  }, []);

  const handleClose = () => {
    localStorage.setItem("seenWelcomeModal", "true");
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>👋 Welcome to LogiDex</DialogTitle>
      <DialogContent>
        <Typography variant="body1" sx={{ marginBottom: "1rem" }}>
          LogiDex helps you create, simulate, and analyze digital logic circuits.
          You can drag logic gates, connect them, and generate truth tables and propositional formulas.
        </Typography>

        <Typography variant="h6" sx={{ marginBottom: "0.5rem" }}>
          🧠 What can you do?
        </Typography>
        <ul style={{ paddingLeft: "1.2rem", marginBottom: "1rem" }}>
          <li>Create logic circuits visually</li>
          <li>Generate propositional logic formulas</li>
          <li>Reduce formulas to CNF / DNF with step-by-step views</li>
          <li>Generate truth tables and analyse them</li>
        </ul>

        <Button variant="contained" onClick={handleStartTutorial} sx={{ marginRight: "1rem" }}>
          Start Tutorial
        </Button>
        <Button variant="outlined" onClick={handleClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
