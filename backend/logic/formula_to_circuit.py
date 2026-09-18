"""
Converts propositional logic formulas in string form to circuit data format.
This allows easily creating circuits from text expressions.
"""

import re


class FormulaParser:
    """Parser for propositional logic formulas"""

    def __init__(self):
        self.node_counters = {}
        self.nodes = []
        self.connections = []
        self.input_nodes = set()
        self.allowed_literals = set()

    def _generate_id(self, node_type):
        """Generate a unique ID for a node based on its type"""
        self.node_counters[node_type] = self.node_counters.get(node_type, 0) + 1
        return f"{node_type}{self.node_counters[node_type]}"

    def _add_node(self, node_type, inputs=None):
        """Add a node of given type and return its ID"""
        inputs = inputs or []
        if node_type.upper() not in ["INPUT", "NOT", "OUTPUT"] and len(inputs) < 2:
            raise ValueError(f"{node_type.upper()} gate must have at least 2 inputs.")

        node_id = self._generate_id(node_type)
        self.nodes.append({"id": node_id, "type": node_type, "inputValues": []})
        return node_id

    def _add_connection(self, source_id, target_id):
        """Add a connection between two nodes, ensuring no duplicates."""
        if any(
            conn["source"] == source_id and conn["target"] == target_id
            for conn in self.connections
        ):
            raise ValueError(
                f"Duplicate connection from {source_id} to {target_id} is not allowed."
            )
        self.connections.append({"source": source_id, "target": target_id})

    def _ensure_input_node(self, variable_name):
        """Ensure an input node exists for the given variable"""
        # Before creating a literal, ensure it's in allowed_literals
        if variable_name not in self.allowed_literals:
            if not self.allowed_literals:
                raise ValueError(
                    "No known literal names found. You can name your variables as single capital letters A-J."
                )
            if not variable_name:
                raise ValueError("The formula is missing a variable.")
            raise ValueError(
                f"Unknown literal '{variable_name}'. Use single capital letters from A to J."
            )

        if variable_name not in self.input_nodes:
            self.nodes.append({"id": variable_name, "type": "INPUT"})
            self.input_nodes.add(variable_name)
        return variable_name

    def parse_formula(self, formula_str):
        """
        Parse a propositional logic formula and generate circuit data.
        Returns the ID of the root node.
        """
        # Gather variables (A-J) from formula
        found_vars = re.findall(r"\b[A-J]\b", formula_str)
        self.allowed_literals = set(found_vars)

        # Check for grammar correctness
        self._validate_grammar(formula_str)

        # Normalize the formula by adding spaces around operators and parentheses
        formula_str = re.sub(r"([∧∨¬()])", r" \1 ", formula_str)
        formula_str = re.sub(r"\s+", " ", formula_str).strip()

        # Replace symbolic operators with text operators if present
        formula_str = (
            formula_str.replace("∧", "AND").replace("∨", "OR").replace("¬", "NOT")
        )

        # Parse the formula recursively
        return self._parse_expression(formula_str)

    def _validate_grammar(self, formula_str):
        """Validate the grammar of the formula"""
        # Basic grammar validation - this can be expanded for more sophisticated checks

        # Convert symbols to text for consistent checking
        formula = (
            formula_str.replace("∧", " AND ").replace("∨", " OR ").replace("¬", " NOT ")
        )

        # Check for NOT directly before operators
        if re.search(r"NOT\s+(AND|OR)\b", formula, re.IGNORECASE):
            raise ValueError(
                "Invalid syntax: NOT cannot be directly followed by AND/OR operators"
            )

        # Check for consecutive operators
        if re.search(r"\b(AND|OR)\s+(AND|OR)\b", formula, re.IGNORECASE):
            raise ValueError(
                "Invalid syntax: Consecutive operators (AND/OR) are not allowed"
            )

        # Check for operators at the beginning (except NOT)
        if re.match(r"\s*(AND|OR)\b", formula, re.IGNORECASE):
            raise ValueError(
                "Invalid syntax: Formula cannot start with AND/OR operators"
            )

        # Check for operators at the end
        if re.search(r"\b(AND|OR|NOT)\s*$", formula, re.IGNORECASE):
            raise ValueError("Invalid syntax: Formula cannot end with operators")

        # Check for unbalanced parentheses
        count = 0
        for char in formula:
            if char == "(":
                count += 1
            elif char == ")":
                count -= 1
                if count < 0:
                    raise ValueError("Invalid syntax: Unbalanced parentheses")

        if count != 0:
            raise ValueError("Invalid syntax: Unbalanced parentheses")

    def _parse_expression(self, expr):
        """Parse a logical expression recursively"""
        expr = expr.strip()

        # Check for parenthesized expression
        if expr.startswith("(") and expr.endswith(")"):
            # Find the matching closing parenthesis
            if self._find_matching_paren(expr) == len(expr) - 1:
                return self._parse_expression(expr[1:-1])

        # Check for NOT operator
        if expr.upper().startswith("NOT "):
            # Create a NOT gate
            not_id = self._add_node("NOT", inputs=[expr[4:].strip()])

            # Parse the rest of the expression
            inner_id = self._parse_expression(expr[4:])

            # Connect the inner expression to the NOT gate
            self._add_connection(inner_id, not_id)

            return not_id

        # Look for binary operators (AND, OR)
        binary_op_match = self._find_main_operator(expr)
        if binary_op_match:
            op, left_expr, right_expr = binary_op_match

            # Create the appropriate gate
            gate_id = self._add_node(op, inputs=[left_expr.strip(), right_expr.strip()])

            # Parse the left and right expressions
            left_id = self._parse_expression(left_expr)
            right_id = self._parse_expression(right_expr)

            # Connect the left and right expressions to the gate
            self._add_connection(left_id, gate_id)
            self._add_connection(right_id, gate_id)

            return gate_id

        # If no operators found, it must be a variable (input)
        return self._ensure_input_node(expr)

    def _find_matching_paren(self, expr):
        """Find the index of the matching closing parenthesis"""
        if not expr.startswith("("):
            return -1

        count = 0
        for i, char in enumerate(expr):
            if char == "(":
                count += 1
            elif char == ")":
                count -= 1
                if count == 0:
                    return i

        return -1

    def _find_main_operator(self, expr):
        """
        Find the main binary operator in an expression.
        Returns (operator, left_expr, right_expr)
        """
        # Define operator precedence (higher number = lower precedence)
        precedence = {"AND": 1, "OR": 2, "XOR": 2, "NAND": 1, "NOR": 1, "XNOR": 1}

        # Find all operators at the top level (not in parentheses)
        paren_level = 0
        operators = []

        i = 0
        while i < len(expr):
            if expr[i] == "(":
                paren_level += 1
            elif expr[i] == ")":
                paren_level -= 1
            elif paren_level == 0:
                # Check for operators at current position
                for op in ["AND", "OR", "XOR", "NAND", "NOR", "XNOR"]:
                    if i + len(op) <= len(expr) and expr[i : i + len(op)].upper() == op:
                        # Ensure it's a whole word (surrounded by spaces or parentheses)
                        if (
                            i == 0 or expr[i - 1].isspace() or expr[i - 1] in "()"
                        ) and (
                            i + len(op) >= len(expr)
                            or expr[i + len(op)].isspace()
                            or expr[i + len(op)] in "()"
                        ):
                            operators.append((op, i, precedence[op]))
                            i += len(op) - 1
                            break
            i += 1

        if not operators:
            return None

        # Find the operator with the lowest precedence (highest precedence value)
        # If tied, choose the rightmost one (for right-associativity)
        main_op = max(operators, key=lambda x: (x[2], x[1]))
        op, pos, _ = main_op

        # Split the expression at the main operator
        left_expr = expr[:pos].strip()
        right_expr = expr[pos + len(op) :].strip()

        return op, left_expr, right_expr

    def generate_circuit_data(self, formula_str):
        """
        Generate circuit data from a logical formula string.
        Returns a dictionary with nodes and connections.
        """
        # Reset state
        self.node_counters = {}
        self.nodes = []
        self.connections = []
        self.input_nodes = set()

        # Parse the formula
        output_node_id = self._add_node("OUTPUT")
        root_node_id = self.parse_formula(formula_str)

        # Connect the root node to the output node
        self._add_connection(root_node_id, output_node_id)

        return {"nodes": self.nodes, "connections": self.connections}


def formula_to_circuit(formula_str):
    """
    Convert a propositional logic formula string to circuit data.

    Examples:
        "A AND B" -> AND gate with inputs A and B
        "A OR (B AND C)" -> OR gate connected to A and the output of an AND gate
        "NOT (A AND B)" -> NOT gate connected to the output of an AND gate

    Returns:
        Dictionary containing nodes and connections
        Or error message string if validation fails
    """
    parser = FormulaParser()
    return parser.generate_circuit_data(formula_str)
