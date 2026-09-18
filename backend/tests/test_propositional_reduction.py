import unittest
from backend.logic.propositional_reduction import (
    Formula,
    Literal,
    Not,
    And,
    Or,
    True_,
    False_,
    build_formula,
    build_xor,
    build_xnor,
    apply_de_morgans_step,
    simplify_step,
    distribute_or_over_and_step,
    distribute_and_over_or_step,
    is_in_cnf,
    is_in_dnf,
    to_cnf,
    to_dnf,
    generate_propositional_reduction,
    generate_propositional_formula,
)


def normalize_formula(formula_str):
    """
    Normalize a formula string to account for different orderings of literals.
    This makes tests less brittle to equivalent but differently ordered formulas.
    """
    # Remove all whitespace
    formula_str = formula_str.replace(" ", "")

    # Helper function to sort binary operations (AND, OR)
    def sort_binary_op(match, op):
        parts = match.group(1).split(op)
        sorted_parts = sorted([p.strip() for p in parts])
        return f"({op.join(sorted_parts)})"

    # Split the formula into pieces we can analyze
    # This is a simplistic approach - a real parser would be more accurate
    import re

    # Handle binary operations with more than 2 operands
    # Keep applying until no more changes (for nested operations)
    prev = ""
    while prev != formula_str:
        prev = formula_str
        # Sort AND operands
        matches = re.findall(r"\(([^()]+\∧[^()]+)\)", formula_str)
        for match in matches:
            operands = sorted(match.split("∧"))
            formula_str = formula_str.replace(f"({match})", f"({'∧'.join(operands)})")

        # Sort OR operands
        matches = re.findall(r"\(([^()]+\∨[^()]+)\)", formula_str)
        for match in matches:
            operands = sorted(match.split("∨"))
            formula_str = formula_str.replace(f"({match})", f"({'∨'.join(operands)})")

    return formula_str


class TestCircuitLogic(unittest.TestCase):

    def setUp(self):
        # Simple circuit with AND gate
        self.and_circuit = {
            "nodes": [
                {"id": "in1", "type": "INPUT"},
                {"id": "in2", "type": "INPUT"},
                {"id": "and1", "type": "AND"},
                {"id": "out1", "type": "OUTPUT"},
            ],
            "connections": [
                {"source": "in1", "target": "and1"},
                {"source": "in2", "target": "and1"},
                {"source": "and1", "target": "out1"},
            ],
        }

        # Circuit with multiple gates
        self.complex_circuit = {
            "nodes": [
                {"id": "in1", "type": "INPUT"},
                {"id": "in2", "type": "INPUT"},
                {"id": "in3", "type": "INPUT"},
                {"id": "and1", "type": "AND"},
                {"id": "or1", "type": "OR"},
                {"id": "not1", "type": "NOT"},
                {"id": "out1", "type": "OUTPUT"},
            ],
            "connections": [
                {"source": "in1", "target": "and1"},
                {"source": "in2", "target": "and1"},
                {"source": "and1", "target": "or1"},
                {"source": "in3", "target": "not1"},
                {"source": "not1", "target": "or1"},
                {"source": "or1", "target": "out1"},
            ],
        }

        # XOR circuit
        self.xor_circuit = {
            "nodes": [
                {"id": "in1", "type": "INPUT"},
                {"id": "in2", "type": "INPUT"},
                {"id": "xor1", "type": "XOR"},
                {"id": "out1", "type": "OUTPUT"},
            ],
            "connections": [
                {"source": "in1", "target": "xor1"},
                {"source": "in2", "target": "xor1"},
                {"source": "xor1", "target": "out1"},
            ],
        }

        # NAND circuit
        self.nand_circuit = {
            "nodes": [
                {"id": "in1", "type": "INPUT"},
                {"id": "in2", "type": "INPUT"},
                {"id": "nand1", "type": "NAND"},
                {"id": "out1", "type": "OUTPUT"},
            ],
            "connections": [
                {"source": "in1", "target": "nand1"},
                {"source": "in2", "target": "nand1"},
                {"source": "nand1", "target": "out1"},
            ],
        }

        # NOR circuit
        self.nor_circuit = {
            "nodes": [
                {"id": "in1", "type": "INPUT"},
                {"id": "in2", "type": "INPUT"},
                {"id": "nor1", "type": "NOR"},
                {"id": "out1", "type": "OUTPUT"},
            ],
            "connections": [
                {"source": "in1", "target": "nor1"},
                {"source": "in2", "target": "nor1"},
                {"source": "nor1", "target": "out1"},
            ],
        }

        # XNOR circuit
        self.xnor_circuit = {
            "nodes": [
                {"id": "in1", "type": "INPUT"},
                {"id": "in2", "type": "INPUT"},
                {"id": "xnor1", "type": "XNOR"},
                {"id": "out1", "type": "OUTPUT"},
            ],
            "connections": [
                {"source": "in1", "target": "xnor1"},
                {"source": "in2", "target": "xnor1"},
                {"source": "xnor1", "target": "out1"},
            ],
        }

    def assertFormulasEqual(self, formula1, formula2, msg=None):
        """Compare formulas in a way that's insensitive to the order of terms"""
        normalized1 = normalize_formula(formula1)
        normalized2 = normalize_formula(formula2)
        self.assertEqual(normalized1, normalized2, msg)

    def test_literal(self):
        lit = Literal("A")
        self.assertEqual(str(lit), "A")

    def test_not(self):
        not_formula = Not(Literal("A"))
        self.assertEqual(str(not_formula), "¬A")

    def test_and(self):
        and_formula = And(Literal("A"), Literal("B"))
        self.assertEqual(str(and_formula), "(A ∧ B)")

    def test_or(self):
        or_formula = Or(Literal("A"), Literal("B"))
        self.assertEqual(str(or_formula), "(A ∨ B)")

    def test_xor(self):
        xor_formula = build_xor(Literal("A"), Literal("B"))
        self.assertEqual(str(xor_formula), "((A ∧ ¬B) ∨ (¬A ∧ B))")

    def test_build_formula(self):
        # Test AND circuit
        formula = build_formula(self.and_circuit)
        self.assertEqual(str(formula), "(in1 ∧ in2)")

        # Test complex circuit
        formula = build_formula(self.complex_circuit)
        self.assertEqual(str(formula), "((in1 ∧ in2) ∨ ¬in3)")

    def test_apply_de_morgans_step(self):
        # Test ¬(A ∧ B) → (¬A ∨ ¬B)
        formula = Not(And(Literal("A"), Literal("B")))
        result, steps, _, _, _ = apply_de_morgans_step(formula)
        self.assertFormulasEqual(str(result), "(¬A ∨ ¬B)")
        self.assertTrue(len(steps) > 0)

        # Test ¬(A ∨ B) → (¬A ∧ ¬B)
        formula = Not(Or(Literal("A"), Literal("B")))
        result, steps, _, _, _ = apply_de_morgans_step(formula)
        self.assertFormulasEqual(str(result), "(¬A ∧ ¬B)")
        self.assertTrue(len(steps) > 0)

        # Test nested application
        formula = Not(And(Literal("A"), Not(Or(Literal("B"), Literal("C")))))
        result, steps, _, _, _ = apply_de_morgans_step(formula)
        self.assertIn("¬A", str(result))
        self.assertTrue(len(steps) > 0)

    def test_simplify_step(self):
        # Test double negation elimination
        formula = Not(Not(Literal("A")))
        result, steps, _, _, _ = simplify_step(formula)
        self.assertEqual(str(result), "A")
        self.assertTrue(len(steps) > 0)

        # Test complement law
        formula = And(Literal("A"), Not(Literal("A")))
        result, steps, _, _, _ = simplify_step(formula)
        self.assertEqual(str(result), "FALSE")
        self.assertTrue(len(steps) > 0)

        # Test identity law
        formula = And(Literal("A"), True_())
        result, steps, _, _, _ = simplify_step(formula)
        self.assertEqual(str(result), "A")
        self.assertTrue(len(steps) > 0)

    def test_distribute_or_over_and_step(self):
        # Test A ∨ (B ∧ C) → (A ∨ B) ∧ (A ∨ C)
        formula = Or(Literal("A"), And(Literal("B"), Literal("C")))
        result, steps, _, _, _ = distribute_or_over_and_step(formula)
        self.assertFormulasEqual(str(result), "((A ∨ B) ∧ (A ∨ C))")
        self.assertTrue(len(steps) > 0)

    def test_distribute_and_over_or_step(self):
        # Test A ∧ (B ∨ C) → (A ∧ B) ∨ (A ∧ C)
        formula = And(Literal("A"), Or(Literal("B"), Literal("C")))
        result, steps, _, _, _ = distribute_and_over_or_step(formula)
        self.assertFormulasEqual(str(result), "((A ∧ B) ∨ (A ∧ C))")
        self.assertTrue(len(steps) > 0)

    def test_is_in_cnf(self):
        # Simple CNF formulas
        self.assertTrue(is_in_cnf(Literal("A")))
        self.assertTrue(is_in_cnf(And(Literal("A"), Literal("B"))))
        self.assertTrue(is_in_cnf(Or(Literal("A"), Literal("B"))))
        self.assertTrue(
            is_in_cnf(
                And(Or(Literal("A"), Literal("B")), Or(Literal("C"), Literal("D")))
            )
        )

        # Not in CNF
        self.assertFalse(is_in_cnf(Or(And(Literal("A"), Literal("B")), Literal("C"))))
        self.assertFalse(
            is_in_cnf(
                And(Or(Literal("A"), And(Literal("B"), Literal("C"))), Literal("D"))
            )
        )

    def test_is_in_dnf(self):
        # Simple DNF formulas
        self.assertTrue(is_in_dnf(Literal("A")))
        self.assertTrue(is_in_dnf(And(Literal("A"), Literal("B"))))
        self.assertTrue(is_in_dnf(Or(Literal("A"), Literal("B"))))
        self.assertTrue(
            is_in_dnf(
                Or(And(Literal("A"), Literal("B")), And(Literal("C"), Literal("D")))
            )
        )

        # Not in DNF
        self.assertFalse(is_in_dnf(And(Or(Literal("A"), Literal("B")), Literal("C"))))
        self.assertFalse(
            is_in_dnf(
                Or(And(Literal("A"), Or(Literal("B"), Literal("C"))), Literal("D"))
            )
        )

    def test_to_cnf(self):
        # Test conversion to CNF
        formula = Or(Literal("A"), And(Literal("B"), Literal("C")))
        cnf_formula, steps = to_cnf(formula)
        self.assertFormulasEqual(cnf_formula, "((A ∨ B) ∧ (A ∨ C))")
        self.assertTrue(len(steps) >= 1)

        # Complex formula with De Morgan's law
        formula = And(Literal("A"), Not(And(Literal("B"), Literal("C"))))
        cnf_formula, steps = to_cnf(formula)
        self.assertFormulasEqual(cnf_formula, "(A ∧ (¬B ∨ ¬C))")
        self.assertTrue(len(steps) >= 1)

    def test_to_dnf(self):
        # Test conversion to DNF
        formula = And(Literal("A"), Or(Literal("B"), Literal("C")))
        dnf_formula, steps = to_dnf(formula)
        self.assertFormulasEqual(dnf_formula, "((A ∧ B) ∨ (A ∧ C))")
        self.assertTrue(len(steps) >= 1)

        # Complex formula with De Morgan's law
        formula = Or(Literal("A"), Not(Or(Literal("B"), Literal("C"))))
        dnf_formula, steps = to_dnf(formula)
        self.assertFormulasEqual(dnf_formula, "(A ∨ (¬B ∧ ¬C))")
        self.assertTrue(len(steps) >= 1)

    def test_generate_propositional_reduction(self):
        result = generate_propositional_reduction(self.and_circuit)
        # Check the structure of the result
        self.assertIn("formula", result)
        self.assertIn("cnfformula", result)
        self.assertIn("dnfformula", result)
        self.assertIn("cnfsteps", result)
        self.assertIn("dnfsteps", result)

        # Check the formula content with order-insensitive comparison
        self.assertFormulasEqual(result["formula"], "(in1 ∧ in2)")
        # CNF of an AND is already in CNF form
        self.assertFormulasEqual(result["cnfformula"], "(in1 ∧ in2)")
        # DNF of an AND is also already in DNF form
        self.assertFormulasEqual(result["dnfformula"], "(in1 ∧ in2)")

        # Also test with the complex circuit
        result = generate_propositional_reduction(self.complex_circuit)
        # The formula should be ((in1 ∧ in2) ∨ ¬in3), but order might differ
        self.assertIn("formula", result)
        self.assertIn("cnfformula", result)
        self.assertIn("dnfformula", result)


if __name__ == "__main__":
    unittest.main()
