import unittest
from backend.logic.formula_to_circuit import formula_to_circuit
from backend.logic.propositional_reduction import generate_propositional_reduction
from backend.logic.truth_table import generate_truth_table


class TestLogicIntegration(unittest.TestCase):
    """Integration tests for the logic modules"""

    def test_formula_to_circuit_to_formula(self):
        """Test converting a formula to a circuit and back to a formula"""
        original_formula = "(A AND B) OR NOT C"

        # Convert formula to circuit
        circuit = formula_to_circuit(original_formula)

        # Generate propositional formula from circuit
        result = generate_propositional_reduction(circuit)

        # The resulting formula should be equivalent to the original
        # Note: The exact string may differ due to formatting and normalization
        # so we check for presence of key components
        self.assertIn("formula", result)
        self.assertIn("A", result["formula"])
        self.assertIn("B", result["formula"])
        self.assertIn("C", result["formula"])
        self.assertIn("∧", result["formula"])  # AND
        self.assertIn("∨", result["formula"])  # OR
        self.assertIn("¬", result["formula"])  # NOT

    def test_formula_to_circuit_to_truth_table(self):
        """Test converting a formula to a circuit then generating a truth table"""
        formula = "A AND B"

        # Convert formula to circuit
        circuit = formula_to_circuit(formula)

        # Add current_input_combination for truth table generation
        circuit["current_input_combination"] = [
            {"nodeId": "A", "value": [0]},
            {"nodeId": "B", "value": [1]},
        ]

        # Generate truth table
        truth_table = generate_truth_table(circuit)

        # Verify truth table
        self.assertEqual(len(truth_table["table"]), 4)  # 2^2 rows

        # Check specific truth values for AND
        found_rows = {tuple(row["row"]) for row in truth_table["table"]}
        self.assertIn((0, 0, 0), found_rows)  # 0 AND 0 = 0
        self.assertIn((0, 1, 0), found_rows)  # 0 AND 1 = 0
        self.assertIn((1, 0, 0), found_rows)  # 1 AND 0 = 0
        self.assertIn((1, 1, 1), found_rows)  # 1 AND 1 = 1

    def test_complex_integration(self):
        """Test a complex formula through the full pipeline"""
        formula = "(A OR B) AND NOT (C AND D)"

        # Convert formula to circuit
        circuit = formula_to_circuit(formula)

        # Generate propositional formula
        prop_result = generate_propositional_reduction(circuit)

        # Verify CNF and DNF forms are generated
        self.assertIn("cnfformula", prop_result)
        self.assertIn("dnfformula", prop_result)

        # Add current_input_combination for truth table
        circuit["current_input_combination"] = [
            {"nodeId": "A", "value": [1]},
            {"nodeId": "B", "value": [0]},
            {"nodeId": "C", "value": [1]},
            {"nodeId": "D", "value": [0]},
        ]

        # Generate truth table
        truth_table = generate_truth_table(circuit)

        # Verify truth table has 2^4 = 16 rows
        self.assertEqual(len(truth_table["table"]), 16)

        # Verify highlighted row matches our input combination
        highlighted = [row for row in truth_table["table"] if row.get("highlighted")]
        self.assertEqual(len(highlighted), 1)
        self.assertEqual(highlighted[0]["row"][:4], [1, 0, 1, 0])

        # For this combination:
        # (A OR B) AND NOT (C AND D)
        # (1 OR 0) AND NOT (1 AND 0)
        # 1 AND NOT 0
        # 1 AND 1
        # 1
        self.assertEqual(highlighted[0]["row"][4], 1)

    def test_complex_integration_with_all_gate_types(self):
        """Test a complex formula using all supported gate types through the entire pipeline"""
        # This formula uses every gate type: AND, OR, NOT, XOR, NAND, NOR, XNOR
        formula = "((A AND B) OR (NOT C)) XOR ((D NAND E) NOR (F XNOR G))"

        # Convert formula to circuit
        circuit = formula_to_circuit(formula)

        # Check that all gate types are present
        node_types = set(node["type"] for node in circuit["nodes"])
        self.assertIn("AND", node_types)
        self.assertIn("OR", node_types)
        self.assertIn("NOT", node_types)
        self.assertIn("XOR", node_types)
        self.assertIn("NAND", node_types)
        self.assertIn("NOR", node_types)
        self.assertIn("XNOR", node_types)

        # Generate propositional formula
        prop_result = generate_propositional_reduction(circuit)

        # Verify CNF and DNF forms are generated and contain steps
        self.assertIn("cnfformula", prop_result)
        self.assertIn("dnfformula", prop_result)
        self.assertIn("cnfsteps", prop_result)
        self.assertIn("dnfsteps", prop_result)
        self.assertGreater(len(prop_result["cnfsteps"]), 0)
        self.assertGreater(len(prop_result["dnfsteps"]), 0)

        # Add current_input_combination for truth table
        input_values = {}
        for node in circuit["nodes"]:
            if node["type"] == "INPUT":
                input_values[node["id"]] = 1  # Set all inputs to 1 for testing

        circuit["current_input_combination"] = [
            {"nodeId": node_id, "value": [value]}
            for node_id, value in input_values.items()
        ]

        # Generate truth table
        truth_table = generate_truth_table(circuit)

        # Verify truth table has 2^7 = 128 rows (7 inputs)
        self.assertEqual(len(truth_table["table"]), 128)

        # Verify highlighted row exists
        highlighted = [row for row in truth_table["table"] if row.get("highlighted")]
        self.assertEqual(len(highlighted), 1)

        # Test that the formula's truth table evaluates to the expected value for the given inputs
        # For all 1's, we work it out manually:
        # ((1 AND 1) OR (NOT 1)) XOR ((1 NAND 1) NOR (1 XNOR 1))
        # (1 OR 0) XOR ((NOT 1) NOR 1)
        # 1 XOR (0 NOR 1)
        # 1 XOR 0
        # 1
        all_ones_input = [1] * 7
        # Include index of highlighted row with all 1's input
        highlighted_index = [
            i
            for i, row in enumerate(truth_table["table"])
            if row.get("highlighted") and row["row"][:-1] == all_ones_input
        ]

        if highlighted_index:  # If we found the all-1's row
            self.assertEqual(
                highlighted[0]["row"][-1],
                1,
                "Expected output for all 1's input should be 1",
            )

        # Verify that all rows in the truth table have the correct number of columns
        # (7 inputs + 1 output = 8)
        for row in truth_table["table"]:
            self.assertEqual(len(row["row"]), 8)

    def test_error_propagation_invalid_formula(self):
        """Test that errors from invalid formulas propagate correctly through the pipeline"""
        # Try an invalid formula with syntax errors
        invalid_formula = "A AND B AND"  # Missing operand

        with self.assertRaises(ValueError) as context:
            circuit = formula_to_circuit(invalid_formula)

            # If somehow the above doesn't raise (shouldn't happen),
            # the next steps should still catch issues
            circuit["current_input_combination"] = [
                {"nodeId": "A", "value": [1]},
                {"nodeId": "B", "value": [1]},
            ]

            truth_table = generate_truth_table(circuit)
            prop_result = generate_propositional_reduction(circuit)

        self.assertIn("syntax", str(context.exception).lower())

    def test_error_recovery_circuit_with_missing_connections(self):
        """Test how the system handles a circuit with missing connections"""
        # Create a manually broken circuit (missing connection)
        broken_circuit = {
            "nodes": [
                {"id": "A", "type": "INPUT"},
                {"id": "B", "type": "INPUT"},
                {"id": "and1", "type": "AND"},
                {"id": "out1", "type": "OUTPUT"},
            ],
            "connections": [
                {"source": "A", "target": "and1"},
                # Missing connection from B to and1
                {"source": "and1", "target": "out1"},
            ],
            "current_input_combination": [
                {"nodeId": "A", "value": [1]},
                {"nodeId": "B", "value": [1]},
            ],
        }

        # The truth table should indicate errors with "?" outputs
        truth_table = generate_truth_table(broken_circuit)
        has_error_indicator = any(
            "?" in str(row["row"][-1]) for row in truth_table["table"]
        )
        self.assertTrue(
            has_error_indicator, "Truth table should indicate errors for broken circuit"
        )


if __name__ == "__main__":
    unittest.main()
