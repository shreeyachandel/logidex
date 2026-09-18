"""
Circuit Logic Processing Module
Builds an AST from circuit data and applies logical transformations
"""


class Formula:
    """Base class for all formula nodes in the AST"""

    def __str__(self):
        """Convert to string representation"""
        pass

    def negate(self):
        """Return the negation of this formula"""
        return Not(self)

    def simplify(self):
        """Simplify the formula"""
        return self


class Literal(Formula):
    """A literal (variable) in the formula"""

    def __init__(self, name):
        self.name = name

    def __str__(self):
        return str(self.name)

    def __eq__(self, other):
        if isinstance(other, Literal):
            return self.name == other.name
        return False

    def simplify(self):
        return self


class True_(Formula):
    """Logical TRUE constant"""

    def __str__(self):
        return "TRUE"

    def negate(self):
        return False_()

    def simplify(self):
        return self


class False_(Formula):
    """Logical FALSE constant"""

    def __str__(self):
        return "FALSE"

    def negate(self):
        return True_()

    def simplify(self):
        return self


class Not(Formula):
    """Logical negation"""

    def __init__(self, formula):
        self.formula = formula

    def __str__(self):
        if isinstance(self.formula, Literal):
            return f"¬{self.formula}"
        return f"¬{self.formula}"

    def negate(self):
        # Double negation elimination
        return self.formula

    def __eq__(self, other):
        if isinstance(other, Not):
            return self.formula == other.formula
        return False

    def simplify(self):
        # Simplify the inner formula first
        simplified_formula = self.formula.simplify()

        # Double negation elimination
        if isinstance(simplified_formula, Not):
            return simplified_formula.formula.simplify()

        # Negation of constants
        if isinstance(simplified_formula, True_):
            return False_()
        if isinstance(simplified_formula, False_):
            return True_()

        return Not(simplified_formula)


class And(Formula):
    """Logical conjunction (AND)"""

    def __init__(self, *formulas):
        self.formulas = list(formulas)

    def __str__(self):
        # Special case for single formula
        if len(self.formulas) == 1:
            return str(self.formulas[0])

        parts = []
        for f in self.formulas:
            if isinstance(f, Or) or isinstance(f, Literal) or isinstance(f, Not):
                parts.append(str(f))
            else:
                parts.append(f"{f}")

        return f"({' ∧ '.join(parts)})"

    def negate(self):
        # De Morgan's law: ¬(A ∧ B) = ¬A ∨ ¬B
        return Or(*[f.negate() for f in self.formulas])

    def simplify(self):
        # Empty conjunction is TRUE
        if not self.formulas:
            return True_()

        # Simplify all subformulas
        simplified = [f.simplify() for f in self.formulas]

        # Filter out TRUE values (A ∧ TRUE = A)
        filtered = [f for f in simplified if not isinstance(f, True_)]

        # If there's a FALSE, the whole AND is FALSE
        if any(isinstance(f, False_) for f in filtered):
            return False_()

        # If empty after filtering TRUE, return TRUE
        if not filtered:
            return True_()

        # If only one formula left, return it
        if len(filtered) == 1:
            return filtered[0]

        # Check for complements (A ∧ ¬A = FALSE)
        for f in filtered:
            for g in filtered:
                if (
                    isinstance(f, Not)
                    and f.formula == g
                    or isinstance(g, Not)
                    and g.formula == f
                ):
                    return False_()

        # Apply absorption law: A ∧ (A ∨ B) = A
        result = []
        for i, f in enumerate(filtered):
            absorbed = False
            for j, g in enumerate(filtered):
                if i != j and isinstance(g, Or) and f in g.formulas:
                    absorbed = True
                    break
            if not absorbed:
                result.append(f)

        if not result:
            return filtered[0]  # If all absorbed, return the first one

        # Flatten nested ANDs
        flattened = []
        for f in result:
            if isinstance(f, And):
                flattened.extend(f.formulas)
            else:
                flattened.append(f)

        # Remove duplicates while preserving order
        unique = []
        for f in flattened:
            if f not in unique:
                unique.append(f)

        if len(unique) == 1:
            return unique[0]

        return And(*unique)


class Or(Formula):
    """Logical disjunction (OR)"""

    def __init__(self, *formulas):
        self.formulas = list(formulas)

    def __str__(self):
        # Special case for single formula
        if len(self.formulas) == 1:
            return str(self.formulas[0])

        parts = []
        for f in self.formulas:
            if isinstance(f, And) or isinstance(f, Literal) or isinstance(f, Not):
                parts.append(str(f))
            else:
                parts.append(f"({f})")

        return f"({' ∨ '.join(parts)})"

    def negate(self):
        # De Morgan's law: ¬(A ∨ B) = ¬A ∧ ¬B
        return And(*[f.negate() for f in self.formulas])

    def simplify(self):
        # Empty disjunction is FALSE
        if not self.formulas:
            return False_()

        # Simplify all subformulas
        simplified = [f.simplify() for f in self.formulas]

        # Filter out FALSE values (A ∨ FALSE = A)
        filtered = [f for f in simplified if not isinstance(f, False_)]

        # If there's a TRUE, the whole OR is TRUE
        if any(isinstance(f, True_) for f in filtered):
            return True_()

        # If empty after filtering FALSE, return FALSE
        if not filtered:
            return False_()

        # If only one formula left, return it
        if len(filtered) == 1:
            return filtered[0]

        # Check for complements (A ∨ ¬A = TRUE)
        for f in filtered:
            for g in filtered:
                if (
                    isinstance(f, Not)
                    and f.formula == g
                    or isinstance(g, Not)
                    and g.formula == f
                ):
                    return True_()

        # Apply absorption law: A ∨ (A ∧ B) = A
        result = []
        for i, f in enumerate(filtered):
            absorbed = False
            for j, g in enumerate(filtered):
                if i != j and isinstance(g, And) and f in g.formulas:
                    absorbed = True
                    break
            if not absorbed:
                result.append(f)

        if not result:
            return filtered[0]  # If all absorbed, return the first one

        # Flatten nested ORs
        flattened = []
        for f in result:
            if isinstance(f, Or):
                flattened.extend(f.formulas)
            else:
                flattened.append(f)

        # Remove duplicates while preserving order
        unique = []
        for f in flattened:
            if f not in unique:
                unique.append(f)

        if len(unique) == 1:
            return unique[0]

        return Or(*unique)


def build_xor(a, b):
    """Build XOR formula: A XOR B = (A ∧ ¬B) ∨ (¬A ∧ B)"""
    return Or(And(a, Not(b)), And(Not(a), b))


def build_xnor(a, b):
    """Build XNOR formula: A XNOR B = (A ∧ B) ∨ (¬A ∧ ¬B)"""
    return Or(And(a, b), And(Not(a), Not(b)))


def build_formula(circuit_data, node_id=None):
    """
    Build a formula AST from circuit data starting from the given node_id
    If node_id is None, starts from the OUTPUT node
    """
    nodes = {node["id"]: node for node in circuit_data["nodes"]}
    connections = circuit_data["connections"]

    if node_id is None:
        # Find the OUTPUT node
        node_id = next(
            node["id"]
            for node in circuit_data["nodes"]
            if node["type"].upper() == "OUTPUT"
        )

    node = nodes[node_id]
    node_type = node["type"].upper()

    if node_type == "INPUT":
        return Literal(node_id)

    # Get child formulas
    child_ids = [conn["source"] for conn in connections if conn["target"] == node_id]
    child_formulas = [build_formula(circuit_data, child_id) for child_id in child_ids]

    if node_type == "AND":
        return And(*child_formulas)
    elif node_type == "OR":
        return Or(*child_formulas)
    elif node_type == "NOT":
        return Not(child_formulas[0])
    elif node_type == "XOR":
        if len(child_formulas) != 2:
            # Multiple XOR is complex, simplify to pairwise XORs
            result = child_formulas[0]
            for i in range(1, len(child_formulas)):
                result = build_xor(result, child_formulas[i])
            return result
        return build_xor(child_formulas[0], child_formulas[1])
    elif node_type == "NAND":
        return Not(And(*child_formulas))
    elif node_type == "NOR":
        return Not(Or(*child_formulas))
    elif node_type == "XNOR":
        if len(child_formulas) != 2:
            # Handle multiple XNOR
            result = child_formulas[0]
            for i in range(1, len(child_formulas)):
                result = build_xnor(result, child_formulas[i])
            return result
        return build_xnor(child_formulas[0], child_formulas[1])
    elif node_type == "OUTPUT":
        return child_formulas[0]
    else:
        raise ValueError(f"Unknown node type: {node_type}")


def rebuild_formula(current, other_branches, junctions):
    """
    Rebuild the complete formula from current formula and branch history.

    Parameters:
        current: Current formula being processed
        other_branches: List of formulas from other branches
        junctions: List of junction types ('AND' or 'OR')

    Returns:
        The reconstructed complete formula
    """
    if not other_branches or not junctions:
        return current

    # Work backwards through the branch history
    rebuilt = current

    for branch, junction_type in zip(reversed(other_branches), reversed(junctions)):
        if junction_type == "AND":
            rebuilt = And(branch, rebuilt)
        elif junction_type == "OR":
            rebuilt = Or(branch, rebuilt)

    return rebuilt


def apply_de_morgans_step(
    formula, steps=None, step_number=1, other_branches=None, junctions=None
):
    """
    Apply De Morgan's laws to push negations inward, recording each step.
    Now tracks formula branches to reconstruct complete formula at each step.
    """
    if steps is None:
        steps = []
    if other_branches is None:
        other_branches = []
    if junctions is None:
        junctions = []

    if (
        isinstance(formula, Literal)
        or isinstance(formula, True_)
        or isinstance(formula, False_)
    ):
        return formula, steps, step_number, other_branches, junctions

    elif isinstance(formula, Not):
        inner = formula.formula

        if isinstance(inner, Not):
            # ¬(¬A) → A
            result = inner.formula

            # Reconstruct complete formula for step recording
            full_formula = rebuild_formula(result, other_branches, junctions)

            steps.append(
                {
                    "step_number": step_number,
                    "step": f"Eliminate double negation: {formula} → {result}",
                    "formula": str(full_formula),
                }
            )

            return apply_de_morgans_step(
                result, steps, step_number + 1, other_branches, junctions
            )

        elif isinstance(inner, And):
            # ¬(A ∧ B) → (¬A ∨ ¬B)
            result = Or(*[Not(f) for f in inner.formulas])

            # Reconstruct complete formula for step recording
            full_formula = rebuild_formula(result, other_branches, junctions)

            steps.append(
                {
                    "step_number": step_number,
                    "step": f"Apply De Morgan's Law to negated AND: {formula} → {result}",
                    "formula": str(full_formula),
                }
            )

            if len(inner.formulas) >= 2:
                # Process left branch (first subformula)
                left_branch = result.formulas[0]
                right_branch = result.formulas[1]

                # Save right branch info for left branch processing
                left_other = other_branches.copy()
                left_other.append(right_branch)
                left_junctions = junctions.copy()
                left_junctions.append("OR")  # OR junction since we're in an OR node

                left_result, steps, left_step, _, _ = apply_de_morgans_step(
                    left_branch, steps, step_number + 1, left_other, left_junctions
                )

                # Process right branch (second subformula)
                right_other = other_branches.copy()
                right_other.append(left_result)
                right_junctions = junctions.copy()
                right_junctions.append("OR")

                right_result, steps, right_step, _, _ = apply_de_morgans_step(
                    right_branch, steps, left_step, right_other, right_junctions
                )

                # Combine results
                final_result = Or(left_result, right_result)
                for i in range(2, len(result.formulas)):
                    final_result = Or(final_result, result.formulas[i])

                return final_result, steps, right_step, other_branches, junctions

            # Handle single formula case
            subformulas = []
            curr_step = step_number + 1
            for f in result.formulas:
                subf, steps, curr_step, _, _ = apply_de_morgans_step(
                    f, steps, curr_step, other_branches, junctions
                )
                subformulas.append(subf)

            return Or(*subformulas), steps, curr_step, other_branches, junctions

        elif isinstance(inner, Or):
            # ¬(A ∨ B) → (¬A ∧ ¬B)
            result = And(*[Not(f) for f in inner.formulas])

            # Reconstruct complete formula for step recording
            full_formula = rebuild_formula(result, other_branches, junctions)

            steps.append(
                {
                    "step_number": step_number,
                    "step": f"Apply De Morgan's Law to negated OR: {formula} → {result}",
                    "formula": str(full_formula),
                }
            )

            if len(inner.formulas) >= 2:
                # Process branches separately with branch tracking
                left_branch = result.formulas[0]
                right_branch = result.formulas[1]

                # Process left branch
                left_other = other_branches.copy()
                left_other.append(right_branch)
                left_junctions = junctions.copy()
                left_junctions.append("AND")  # AND junction since we're in an AND node

                left_result, steps, left_step, _, _ = apply_de_morgans_step(
                    left_branch, steps, step_number + 1, left_other, left_junctions
                )

                # Process right branch
                right_other = other_branches.copy()
                right_other.append(left_result)
                right_junctions = junctions.copy()
                right_junctions.append("AND")

                right_result, steps, right_step, _, _ = apply_de_morgans_step(
                    right_branch, steps, left_step, right_other, right_junctions
                )

                # Combine results
                final_result = And(left_result, right_result)
                for i in range(2, len(result.formulas)):
                    final_result = And(final_result, result.formulas[i])

                return final_result, steps, right_step, other_branches, junctions

            # Handle single formula case
            subformulas = []
            curr_step = step_number + 1
            for f in result.formulas:
                subf, steps, curr_step, _, _ = apply_de_morgans_step(
                    f, steps, curr_step, other_branches, junctions
                )
                subformulas.append(subf)

            return And(*subformulas), steps, curr_step, other_branches, junctions

        elif isinstance(inner, Literal):
            return formula, steps, step_number, other_branches, junctions

    elif isinstance(formula, And):
        if len(formula.formulas) >= 2:
            # Process branches separately with branch tracking
            left_branch = formula.formulas[0]
            right_branch = formula.formulas[1]

            # Process left branch
            left_other = other_branches.copy()
            left_other.append(right_branch)
            left_junctions = junctions.copy()
            left_junctions.append("AND")

            left_result, steps, left_step, _, _ = apply_de_morgans_step(
                left_branch, steps, step_number, left_other, left_junctions
            )

            # Process right branch
            right_other = other_branches.copy()
            right_other.append(left_result)
            right_junctions = junctions.copy()
            right_junctions.append("AND")

            right_result, steps, right_step, _, _ = apply_de_morgans_step(
                right_branch, steps, left_step, right_other, right_junctions
            )

            # Combine results
            result = And(left_result, right_result)
            for i in range(2, len(formula.formulas)):
                result = And(result, formula.formulas[i])

            return result, steps, right_step, other_branches, junctions

        # Handle single formula case
        subf, steps, curr_step, _, _ = apply_de_morgans_step(
            formula.formulas[0], steps, step_number, other_branches, junctions
        )
        return And(subf), steps, curr_step, other_branches, junctions

    elif isinstance(formula, Or):
        if len(formula.formulas) >= 2:
            # Process branches separately with branch tracking
            left_branch = formula.formulas[0]
            right_branch = formula.formulas[1]

            # Process left branch
            left_other = other_branches.copy()
            left_other.append(right_branch)
            left_junctions = junctions.copy()
            left_junctions.append("OR")

            left_result, steps, left_step, _, _ = apply_de_morgans_step(
                left_branch, steps, step_number, left_other, left_junctions
            )

            # Process right branch
            right_other = other_branches.copy()
            right_other.append(left_result)
            right_junctions = junctions.copy()
            right_junctions.append("OR")

            right_result, steps, right_step, _, _ = apply_de_morgans_step(
                right_branch, steps, left_step, right_other, right_junctions
            )

            # Combine results
            result = Or(left_result, right_result)
            for i in range(2, len(formula.formulas)):
                result = Or(result, formula.formulas[i])

            return result, steps, right_step, other_branches, junctions

        # Handle single formula case
        subf, steps, curr_step, _, _ = apply_de_morgans_step(
            formula.formulas[0], steps, step_number, other_branches, junctions
        )
        return Or(subf), steps, curr_step, other_branches, junctions

    return formula, steps, step_number, other_branches, junctions


def simplify_step(
    formula, steps=None, step_number=1, other_branches=None, junctions=None
):
    """Apply simplification rules with branch tracking"""
    if steps is None:
        steps = []
    if other_branches is None:
        other_branches = []
    if junctions is None:
        junctions = []

    # Apply a single simplification step
    simplified = formula.simplify()

    # If no change, return as is
    if str(simplified) == str(formula):
        return simplified, steps, step_number, other_branches, junctions

    # Determine specific simplification applied
    # ... existing logic for determining step description ...

    # Reconstruct complete formula for step recording
    full_formula = rebuild_formula(simplified, other_branches, junctions)

    # Get an appropriate step description
    if isinstance(formula, Not) and isinstance(formula.formula, Not):
        step_desc = f"Eliminate double negation: {formula} → {simplified}"
    elif isinstance(simplified, True_) or isinstance(simplified, False_):
        if isinstance(formula, And) and any(
            isinstance(f, Not) and any(f.formula == g for g in formula.formulas)
            for f in formula.formulas
        ):
            step_desc = f"Apply complement law: {formula} → {simplified}"
        else:
            step_desc = f"Apply identity/contradiction law: {formula} → {simplified}"
    else:
        step_desc = f"Apply simplification: {formula} → {simplified}"

    steps.append(
        {"step_number": step_number, "step": step_desc, "formula": str(full_formula)}
    )

    # Continue simplifying
    return simplify_step(simplified, steps, step_number + 1, other_branches, junctions)


def distribute_or_over_and_step(
    formula, steps=None, step_number=1, other_branches=None, junctions=None
):
    """Distribute OR over AND with branch tracking"""
    if steps is None:
        steps = []
    if other_branches is None:
        other_branches = []
    if junctions is None:
        junctions = []

    if (
        isinstance(formula, Literal)
        or isinstance(formula, Not)
        or isinstance(formula, True_)
        or isinstance(formula, False_)
    ):
        return formula, steps, step_number, other_branches, junctions

    # Handle AND node
    if isinstance(formula, And):
        if len(formula.formulas) >= 2:
            # Process branches separately with branch tracking
            left_branch = formula.formulas[0]
            right_branch = formula.formulas[1]

            # Process left branch
            left_other = other_branches.copy()
            left_other.append(right_branch)
            left_junctions = junctions.copy()
            left_junctions.append("AND")

            left_result, steps, left_step, _, _ = distribute_or_over_and_step(
                left_branch, steps, step_number, left_other, left_junctions
            )

            # Process right branch
            right_other = other_branches.copy()
            right_other.append(left_result)
            right_junctions = junctions.copy()
            right_junctions.append("AND")

            right_result, steps, right_step, _, _ = distribute_or_over_and_step(
                right_branch, steps, left_step, right_other, right_junctions
            )

            # Combine results
            result = And(left_result, right_result)
            for i in range(2, len(formula.formulas)):
                result = And(result, formula.formulas[i])

            return result, steps, right_step, other_branches, junctions

        # Handle single formula case
        subf, steps, curr_step, _, _ = distribute_or_over_and_step(
            formula.formulas[0], steps, step_number, other_branches, junctions
        )
        return And(subf), steps, curr_step, other_branches, junctions

    # Handle OR node
    elif isinstance(formula, Or):
        if len(formula.formulas) >= 2:
            # Process branches separately with branch tracking
            left_branch = formula.formulas[0]
            right_branch = formula.formulas[1]

            # Process left branch
            left_other = other_branches.copy()
            left_other.append(right_branch)
            left_junctions = junctions.copy()
            left_junctions.append("OR")

            left_result, steps, left_step, _, _ = distribute_or_over_and_step(
                left_branch, steps, step_number, left_other, left_junctions
            )

            # Process right branch
            right_other = other_branches.copy()
            right_other.append(left_result)
            right_junctions = junctions.copy()
            right_junctions.append("OR")

            right_result, steps, right_step, _, _ = distribute_or_over_and_step(
                right_branch, steps, left_step, right_other, right_junctions
            )

            # Combine results
            result = Or(left_result, right_result)

            # Handle additional subformulas
            for i in range(2, len(formula.formulas)):
                result = Or(result, formula.formulas[i])

            # Check if we have AND that needs distribution
            for i, fi in enumerate(result.formulas):
                if isinstance(fi, And):
                    # Distribute OR over AND
                    distributed_parts = []
                    other_terms = result.formulas[:i] + result.formulas[i + 1 :]

                    for and_term in fi.formulas:
                        new_or = Or(and_term, *other_terms)
                        distributed_parts.append(new_or)

                    dist_result = And(*distributed_parts)

                    # Reconstruct complete formula for step recording
                    full_formula = rebuild_formula(
                        dist_result, other_branches, junctions
                    )

                    steps.append(
                        {
                            "step_number": right_step,
                            "step": f"Distribute OR over AND: {result} → {dist_result}",
                            "formula": str(full_formula),
                        }
                    )

                    # Continue distributing
                    return distribute_or_over_and_step(
                        dist_result, steps, right_step + 1, other_branches, junctions
                    )

            return result, steps, right_step, other_branches, junctions

        # Handle single formula case
        subf, steps, curr_step, _, _ = distribute_or_over_and_step(
            formula.formulas[0], steps, step_number, other_branches, junctions
        )
        return Or(subf), steps, curr_step, other_branches, junctions

    return formula, steps, step_number, other_branches, junctions


def distribute_and_over_or_step(
    formula, steps=None, step_number=1, other_branches=None, junctions=None
):
    """Distribute AND over OR with branch tracking"""
    if steps is None:
        steps = []
    if other_branches is None:
        other_branches = []
    if junctions is None:
        junctions = []

    if (
        isinstance(formula, Literal)
        or isinstance(formula, Not)
        or isinstance(formula, True_)
        or isinstance(formula, False_)
    ):
        return formula, steps, step_number, other_branches, junctions

    # Handle OR node
    if isinstance(formula, Or):
        if len(formula.formulas) >= 2:
            # Process branches separately with branch tracking
            left_branch = formula.formulas[0]
            right_branch = formula.formulas[1]

            # Process left branch
            left_other = other_branches.copy()
            left_other.append(right_branch)
            left_junctions = junctions.copy()
            left_junctions.append("OR")

            left_result, steps, left_step, _, _ = distribute_and_over_or_step(
                left_branch, steps, step_number, left_other, left_junctions
            )

            # Process right branch
            right_other = other_branches.copy()
            right_other.append(left_result)
            right_junctions = junctions.copy()
            right_junctions.append("OR")

            right_result, steps, right_step, _, _ = distribute_and_over_or_step(
                right_branch, steps, left_step, right_other, right_junctions
            )

            # Combine results
            result = Or(left_result, right_result)
            for i in range(2, len(formula.formulas)):
                result = Or(result, formula.formulas[i])

            return result, steps, right_step, other_branches, junctions

        # Handle single formula case
        subf, steps, curr_step, _, _ = distribute_and_over_or_step(
            formula.formulas[0], steps, step_number, other_branches, junctions
        )
        return Or(subf), steps, curr_step, other_branches, junctions

    # Handle AND node
    elif isinstance(formula, And):
        if len(formula.formulas) >= 2:
            # Process branches separately with branch tracking
            left_branch = formula.formulas[0]
            right_branch = formula.formulas[1]

            # Process left branch
            left_other = other_branches.copy()
            left_other.append(right_branch)
            left_junctions = junctions.copy()
            left_junctions.append("AND")

            left_result, steps, left_step, _, _ = distribute_and_over_or_step(
                left_branch, steps, step_number, left_other, left_junctions
            )

            # Process right branch
            right_other = other_branches.copy()
            right_other.append(left_result)
            right_junctions = junctions.copy()
            right_junctions.append("AND")

            right_result, steps, right_step, _, _ = distribute_and_over_or_step(
                right_branch, steps, left_step, right_other, right_junctions
            )

            # Combine results
            result = And(left_result, right_result)

            # Handle additional subformulas
            for i in range(2, len(formula.formulas)):
                result = And(result, formula.formulas[i])

            # Check if we have OR that needs distribution
            for i, fi in enumerate(result.formulas):
                if isinstance(fi, Or):
                    # Distribute AND over OR
                    distributed_parts = []
                    other_terms = result.formulas[:i] + result.formulas[i + 1 :]

                    for or_term in fi.formulas:
                        new_and = And(or_term, *other_terms)
                        distributed_parts.append(new_and)

                    dist_result = Or(*distributed_parts)

                    # Reconstruct complete formula for step recording
                    full_formula = rebuild_formula(
                        dist_result, other_branches, junctions
                    )

                    steps.append(
                        {
                            "step_number": right_step,
                            "step": f"Distribute AND over OR: {result} → {dist_result}",
                            "formula": str(full_formula),
                        }
                    )

                    # Continue distributing
                    return distribute_and_over_or_step(
                        dist_result, steps, right_step + 1, other_branches, junctions
                    )

            return result, steps, right_step, other_branches, junctions

        # Handle single formula case
        subf, steps, curr_step, _, _ = distribute_and_over_or_step(
            formula.formulas[0], steps, step_number, other_branches, junctions
        )
        return And(subf), steps, curr_step, other_branches, junctions

    return formula, steps, step_number, other_branches, junctions


def is_in_cnf(formula):
    """Check if a formula is in Conjunctive Normal Form"""
    if isinstance(formula, And):
        # All clauses must be literals, negations, or disjunctions of literals
        for clause in formula.formulas:
            if isinstance(clause, And):
                return False
            if isinstance(clause, Or):
                for term in clause.formulas:
                    if not (
                        isinstance(term, Literal)
                        or (isinstance(term, Not) and isinstance(term.formula, Literal))
                    ):
                        return False
            elif not (
                isinstance(clause, Literal)
                or (isinstance(clause, Not) and isinstance(clause.formula, Literal))
            ):
                return False
        return True
    elif isinstance(formula, Or):
        # A single disjunction of literals is in CNF
        for term in formula.formulas:
            if not (
                isinstance(term, Literal)
                or (isinstance(term, Not) and isinstance(term.formula, Literal))
            ):
                return False
        return True
    elif isinstance(formula, Literal) or (
        isinstance(formula, Not) and isinstance(formula.formula, Literal)
    ):
        # A single literal or negated literal is in CNF
        return True
    return False


def is_in_dnf(formula):
    """Check if a formula is in Disjunctive Normal Form"""
    if isinstance(formula, Or):
        # All terms must be literals, negations, or conjunctions of literals
        for term in formula.formulas:
            if isinstance(term, Or):
                return False
            if isinstance(term, And):
                for clause in term.formulas:
                    if not (
                        isinstance(clause, Literal)
                        or (
                            isinstance(clause, Not)
                            and isinstance(clause.formula, Literal)
                        )
                    ):
                        return False
            elif not (
                isinstance(term, Literal)
                or (isinstance(term, Not) and isinstance(term.formula, Literal))
            ):
                return False
        return True
    elif isinstance(formula, And):
        # A single conjunction of literals is in DNF
        for clause in formula.formulas:
            if not (
                isinstance(clause, Literal)
                or (isinstance(clause, Not) and isinstance(clause.formula, Literal))
            ):
                return False
        return True
    elif isinstance(formula, Literal) or (
        isinstance(formula, Not) and isinstance(formula.formula, Literal)
    ):
        # A single literal or negated literal is in DNF
        return True
    return False


def to_cnf(formula):
    """Convert formula to CNF with complete formula tracking"""
    all_steps = []
    step_number = 1

    current_formula, current_steps, step_number, other_branches, junctions = (
        apply_de_morgans_step(formula, all_steps, step_number)
    )

    while not is_in_cnf(current_formula):
        current_formula, distribution_steps, step_number, other_branches, junctions = (
            distribute_or_over_and_step(
                current_formula, current_steps, step_number, other_branches, junctions
            )
        )

        # Simplify after each distribution
        current_formula, current_steps, step_number, other_branches, junctions = (
            simplify_step(
                current_formula,
                distribution_steps,
                step_number,
                other_branches,
                junctions,
            )
        )

        # If no changes after both steps, break to avoid infinite loop
        if not distribution_steps and not current_steps:
            break

    # Final simplification
    final_formula, final_steps, _, _, _ = simplify_step(
        current_formula, current_steps, step_number, other_branches, junctions
    )

    return str(final_formula), final_steps


def to_dnf(formula):
    """Convert formula to DNF with complete formula tracking"""
    all_steps = []
    step_number = 1

    current_formula, current_steps, step_number, other_branches, junctions = (
        apply_de_morgans_step(formula, all_steps, step_number)
    )

    while not is_in_dnf(current_formula):
        current_formula, distribution_steps, step_number, other_branches, junctions = (
            distribute_and_over_or_step(
                current_formula, current_steps, step_number, other_branches, junctions
            )
        )

        # Simplify after each distribution
        current_formula, current_steps, step_number, other_branches, junctions = (
            simplify_step(
                current_formula,
                distribution_steps,
                step_number,
                other_branches,
                junctions,
            )
        )

        # If no changes after both steps, break to avoid infinite loop
        if not distribution_steps and not current_steps:
            break

    # Final simplification
    final_formula, final_steps, _, _, _ = simplify_step(
        current_formula, current_steps, step_number, other_branches, junctions
    )

    return str(final_formula), final_steps


def generate_propositional_reduction(circuit_data):
    """
    Main function that generates propositional formula from circuit data
    and reduces it to CNF and DNF forms with detailed steps
    """
    # Build the formula AST
    formula = build_formula(circuit_data)

    # Convert to string representation (symbolic form)
    symbolic_formula = str(formula)

    # Generate CNF with detailed steps
    cnf_formula, cnf_steps = to_cnf(formula)

    # Generate DNF with detailed steps
    dnf_formula, dnf_steps = to_dnf(formula)

    # Return the results
    return {
        "formula": symbolic_formula,
        "cnfformula": cnf_formula,
        "dnfformula": dnf_formula,
        "cnfsteps": cnf_steps,
        "dnfsteps": dnf_steps,
    }


# Legacy function for backward compatibility - keep this unchanged
def generate_propositional_formula(circuit_data, node_id=None):
    """
    Legacy function for backward compatibility
    Builds a formula in string form without using AST
    """
    formula = build_formula(circuit_data, node_id)
    # Convert symbols to text for compatibility
    result = str(formula).replace("∧", "AND").replace("∨", "OR").replace("¬", "NOT ")
    return result
