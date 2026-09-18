import React from "react";
import { Dialog, DialogTitle, DialogContent, Button, Typography } from "@mui/material";

const WelcomeModal = ({ onClose, onStartTutorial, open }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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

        <Button variant="contained" onClick={onStartTutorial} sx={{ marginRight: "1rem" }}>
          Start Tutorial
        </Button>
        <Button variant="outlined" onClick={onClose}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomeModal;
