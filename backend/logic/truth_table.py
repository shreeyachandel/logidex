"""Evaluate circuit graphs and generate their complete truth tables."""

from __future__ import annotations

from collections import deque
from itertools import product


def build_graph(circuit_data):
    """Build an adjacency representation and validate connection references."""
    nodes = circuit_data["nodes"]
    graph = {
        node["id"]: {"type": node["type"], "inputs": [], "outputs": []}
        for node in nodes
    }
    if len(graph) != len(nodes):
        raise ValueError("Node identifiers must be unique.")

    for connection in circuit_data["connections"]:
        source = connection["source"]
        target = connection["target"]
        if source not in graph or target not in graph:
            raise ValueError("A connection references a missing node.")
        graph[source]["outputs"].append(target)
        graph[target]["inputs"].append(source)

    return graph


def generate_truth_table(circuit_data):
    graph = build_graph(circuit_data)
    input_ids = sorted(
        node_id for node_id, node in graph.items() if node["type"] == "INPUT"
    )
    current_values = {
        item["nodeId"]: _normalise_input_value(item.get("value"))
        for item in circuit_data.get("current_input_combination", [])
    }
    current_combo = tuple(current_values.get(node_id, 0) for node_id in input_ids)

    combinations = [current_combo]
    combinations.extend(
        combo
        for combo in product((0, 1), repeat=len(input_ids))
        if combo != current_combo
    )

    table = []
    for index, combination in enumerate(combinations):
        try:
            output = evaluate_output(graph, input_ids, combination)
        except (IndexError, TypeError, ValueError):
            output = "?"

        row = {"row": [*combination, output]}
        if index == 0:
            row["highlighted"] = True
        table.append(row)

    return {"inputs": input_ids, "table": table}


def _normalise_input_value(value):
    if isinstance(value, list):
        value = value[0] if value else 0
    return int(value)


def compute_gate_output(gate_type, inputs):
    operations = {
        "AND": lambda: inputs[0] & inputs[1],
        "OR": lambda: inputs[0] | inputs[1],
        "XOR": lambda: inputs[0] ^ inputs[1],
        "XNOR": lambda: int(not (inputs[0] ^ inputs[1])),
        "NAND": lambda: int(not (inputs[0] & inputs[1])),
        "NOR": lambda: int(not (inputs[0] | inputs[1])),
        "NOT": lambda: int(not inputs[0]),
    }
    if gate_type not in operations:
        raise ValueError(f"Unknown gate type: {gate_type}")
    return operations[gate_type]()


def evaluate_output(graph, input_id_to_name, input_combo):
    """Evaluate one input combination using dependency-aware graph traversal."""
    input_ids = list(input_id_to_name)
    if len(input_ids) != len(input_combo):
        raise ValueError("Input combination does not match the circuit inputs.")

    output_ids = [
        node_id for node_id, node in graph.items() if node["type"] == "OUTPUT"
    ]
    if len(output_ids) != 1:
        raise ValueError("A circuit must contain exactly one output node.")

    values = dict(zip(input_ids, input_combo))
    queue = deque(input_ids)

    while queue:
        current = queue.popleft()
        for target in graph[current]["outputs"]:
            inputs = graph[target]["inputs"]
            if target in values or any(source not in values for source in inputs):
                continue

            node_type = graph[target]["type"]
            if node_type == "OUTPUT":
                if len(inputs) != 1:
                    raise ValueError("The output node requires exactly one input.")
                values[target] = values[inputs[0]]
            else:
                values[target] = compute_gate_output(
                    node_type, [values[source] for source in inputs]
                )
            queue.append(target)

    output_id = output_ids[0]
    if output_id not in values:
        raise ValueError(
            "The circuit cannot be evaluated; check for missing inputs or cycles."
        )
    return values[output_id]
