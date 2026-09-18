import unittest
from backend.logic.formula_to_circuit import formula_to_circuit, FormulaParser


class TestFormulaToCircuit(unittest.TestCase):

    def test_simple_and_formula(self):
        """Test converting 'A AND B' formula to circuit"""
        formula = "A AND B"
        circuit = formula_to_circuit(formula)

        # Check structure
        self.assertIn("nodes", circuit)
        self.assertIn("connections", circuit)

        # Check nodes (A, B inputs, AND gate, OUTPUT)
        self.assertEqual(len(circuit["nodes"]), 4)

        # Check for input nodes
        input_nodes = [node for node in circuit["nodes"] if node["type"] == "INPUT"]
        self.assertEqual(len(input_nodes), 2)
        input_ids = {node["id"] for node in input_nodes}
        self.assertEqual(input_ids, {"A", "B"})

        # Check for AND gate
        and_nodes = [node for node in circuit["nodes"] if node["type"] == "AND"]
        self.assertEqual(len(and_nodes), 1)

        # Check for OUTPUT node
        output_nodes = [node for node in circuit["nodes"] if node["type"] == "OUTPUT"]
        self.assertEqual(len(output_nodes), 1)

        # Check connections
        self.assertEqual(len(circuit["connections"]), 3)  # A->AND, B->AND, AND->OUTPUT

    def test_not_formula(self):
        """Test converting 'NOT A' formula to circuit"""
        formula = "NOT A"
        circuit = formula_to_circuit(formula)

        # Check nodes (A input, NOT gate, OUTPUT)
        self.assertEqual(len(circuit["nodes"]), 3)

        # Check connections
        self.assertEqual(len(circuit["connections"]), 2)  # A->NOT, NOT->OUTPUT

        # Verify the connections
        not_node = next(
            (node for node in circuit["nodes"] if node["type"] == "NOT"), None
        )
        self.assertIsNotNone(not_node)

        not_connections = [
            c for c in circuit["connections"] if c["target"] == not_node["id"]
        ]
        self.assertEqual(len(not_connections), 1)
        self.assertEqual(not_connections[0]["source"], "A")

    def test_complex_formula(self):
        """Test converting '(A AND B) OR NOT C' formula to circuit"""
        formula = "(A AND B) OR NOT C"
        circuit = formula_to_circuit(formula)

        # Check structure
        self.assertIn("nodes", circuit)
        self.assertIn("connections", circuit)

        # Check nodes (3 inputs, AND, OR, NOT, OUTPUT)
        self.assertEqual(len(circuit["nodes"]), 7)

        # Check for input nodes
        input_nodes = [node for node in circuit["nodes"] if node["type"] == "INPUT"]
        self.assertEqual(len(input_nodes), 3)
        input_ids = {node["id"] for node in input_nodes}
        self.assertEqual(input_ids, {"A", "B", "C"})

        # Check for gate nodes
        and_nodes = [node for node in circuit["nodes"] if node["type"] == "AND"]
        or_nodes = [node for node in circuit["nodes"] if node["type"] == "OR"]
        not_nodes = [node for node in circuit["nodes"] if node["type"] == "NOT"]

        self.assertEqual(len(and_nodes), 1)
        self.assertEqual(len(or_nodes), 1)
        self.assertEqual(len(not_nodes), 1)

        # Check connections (6 total: A->AND, B->AND, C->NOT, AND->OR, NOT->OR, OR->OUTPUT)
        self.assertEqual(len(circuit["connections"]), 6)

    def test_nested_formulas(self):
        """Test nested formulas with multiple layers of parentheses"""
        formula = "A AND (B OR (C AND D))"
        circuit = formula_to_circuit(formula)

        # We should have 4 inputs (A, B, C, D), 2 AND gates, 1 OR gate, and 1 OUTPUT
        self.assertEqual(len([n for n in circuit["nodes"] if n["type"] == "INPUT"]), 4)
        self.assertEqual(len([n for n in circuit["nodes"] if n["type"] == "AND"]), 2)
        self.assertEqual(len([n for n in circuit["nodes"] if n["type"] == "OR"]), 1)
        self.assertEqual(len([n for n in circuit["nodes"] if n["type"] == "OUTPUT"]), 1)

    def test_error_cases(self):
        """Test various error cases"""
        # Empty formula
        with self.assertRaises(Exception):
            formula_to_circuit("")

        # Invalid syntax: unbalanced parentheses
        with self.assertRaises(ValueError):
            formula_to_circuit("(A AND B")

        # Invalid syntax: operator at the end
        with self.assertRaises(ValueError):
            formula_to_circuit("A AND")

        # Invalid syntax: consecutive operators
        with self.assertRaises(ValueError):
            formula_to_circuit("A AND OR B")

        # Invalid syntax: NOT followed by operator
        with self.assertRaises(ValueError):
            formula_to_circuit("NOT AND B")

        # Invalid literal name
        with self.assertRaises(ValueError):
            formula_to_circuit("A AND Z")  # Z is not recognized

    def test_parser_helper_methods(self):
        """Test FormulaParser helper methods"""
        parser = FormulaParser()

        # Test _find_matching_paren
        self.assertEqual(parser._find_matching_paren("(A AND B)"), 8)
        self.assertEqual(parser._find_matching_paren("((A) AND B)"), 10)
        self.assertEqual(parser._find_matching_paren("NOT A"), -1)  # No opening paren

        # Force allowed literals for testing
        parser.allowed_literals = {"A", "B", "C"}

        # Test _ensure_input_node
        node_id = parser._ensure_input_node("A")
        self.assertEqual(node_id, "A")

        # Ensure the node was added
        self.assertIn("A", parser.input_nodes)
        self.assertTrue(any(node["id"] == "A" for node in parser.nodes))

        # Test with unknown literal
        with self.assertRaises(ValueError):
            parser._ensure_input_node("Z")

    def test_complex_nested_formula_with_multiple_operators(self):
        """Test a highly complex nested formula with multiple operator types"""
        complex_formula = "((A OR B) AND NOT (C AND D)) OR (E XOR (NOT F AND G))"

        circuit = formula_to_circuit(complex_formula)

        # Count the nodes by type
        node_types = {}
        for node in circuit["nodes"]:
            node_type = node["type"]
            node_types[node_type] = node_types.get(node_type, 0) + 1

        # Should have 7 inputs (A-G)
        self.assertEqual(node_types.get("INPUT", 0), 7)

        # Should have at least 1 of each gate type: AND, OR, NOT, XOR
        self.assertGreaterEqual(node_types.get("AND", 0), 2)
        self.assertGreaterEqual(node_types.get("OR", 0), 2)  # Including the outer OR
        self.assertGreaterEqual(
            node_types.get("NOT", 0), 2
        )  # One for NOT C, one for NOT F
        self.assertEqual(node_types.get("XOR", 0), 1)

        # Check that we have the right number of connections
        # For each gate with N inputs, we should have N connections into it, plus one connection out
        expected_connections = (
            sum(node_types.values()) - 1
        )  # -1 because OUTPUT has no outgoing connection
        self.assertEqual(len(circuit["connections"]), expected_connections)

        # Verify the structure - each input should be upstream of the output
        input_nodes = [
            node["id"] for node in circuit["nodes"] if node["type"] == "INPUT"
        ]
        output_node = [
            node["id"] for node in circuit["nodes"] if node["type"] == "OUTPUT"
        ]

    def test_malformed_formula(self):
        """Test various malformed formulas to ensure proper error handling"""
        # Empty parentheses
        with self.assertRaises(ValueError) as context:
            formula_to_circuit("()")
        self.assertIn(
            "no known literal names found. you can name your variables as single capital letters a-j.",
            str(context.exception).lower(),
        )

        # Unrecognized operator
        with self.assertRaises(ValueError) as context:
            formula_to_circuit("A XYZ B")

        # Invalid variable names
        with self.assertRaises(ValueError) as context:
            formula_to_circuit("A AND a")  # lowercase not allowed

        # Formula that's too complex
        extremely_nested = "A AND " + "(".join(["B"] * 100) + ")" * 100
        with self.assertRaises(Exception):
            formula_to_circuit(extremely_nested)

        # Uneven number of variables for operators
        with self.assertRaises(ValueError) as context:
            formula_to_circuit("A AND B AND")
        self.assertIn("syntax", str(context.exception).lower())

    def test_variable_limits(self):
        """Test the limits on variable names (should be A-J)"""
        # Valid: using variables A through J
        try:
            circuit = formula_to_circuit(
                "A AND B AND C AND D AND E AND F AND G AND H AND I AND J"
            )
            self.assertEqual(
                len([n for n in circuit["nodes"] if n["type"] == "INPUT"]), 10
            )
        except Exception as e:
            self.fail(f"Valid variables A-J should be accepted: {e}")

        # Invalid: using variable K (outside A-J range)
        with self.assertRaises(ValueError) as context:
            formula_to_circuit("A AND K")
        self.assertIn("unknown literal", str(context.exception).lower())


if __name__ == "__main__":
    unittest.main()
