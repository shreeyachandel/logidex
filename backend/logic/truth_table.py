from itertools import product
from collections import deque

def generate_truth_table(circuit_data):
    nodes = circuit_data["nodes"]
    connections = circuit_data["connections"]
    current_input_combination = circuit_data["current_input_combination"]

    # Step 1: Identify input nodes
    input_nodes = [node for node in nodes if node["type"] == "INPUT"]
    input_ids = sorted([node["id"] for node in input_nodes])

    # Assign names: A, B, C...
    input_names = (input_ids)
    input_id_to_name = {id_: id_ for id_ in input_ids}

    # Step 2: Generate all combinations of input values
    input_combos = list(product([0, 1], repeat=len(input_ids)))

    # Step 3: Build the graph
    graph = {node["id"]: {
        "type": node["type"],
        "inputs": [],
        "outputs": [],
        "value": None
    } for node in nodes}

    for conn in connections:
        graph[conn["source"]]["outputs"].append(conn["target"])
        graph[conn["target"]]["inputs"].append(conn["source"])

    # Find the output node
    output_node = next((node["id"] for node in nodes if node["type"] == "OUTPUT"), None)

    # Step 4: Loop through input combos and evaluate
    table = []

    current_input_values = {
    input["nodeId"]: int(input["value"][0]) if isinstance(input["value"], list) else int(input["value"])
    for input in current_input_combination
}

    # We generate rows starting from the 'start' index, for 10 rows
    try:
        current_combo = [current_input_values.get(input_id, 0) for input_id in input_ids]
        current_output_value = evaluate_output(graph, input_id_to_name, current_combo)
        current_row = {
        "row": current_combo + [current_output_value],
        "highlighted": True
        }
        table.append(current_row)
    except Exception as e:
        print(f"⚠️ Evaluation error for current input combination: {e}")
        current_combo = [current_input_values.get(input_id, 0) for input_id in input_ids]
        row = {
        "row": current_combo + ["?"]
        }
        table.append(row)

    # Convert current combo to a tuple so we can compare easily
    current_combo_tuple = tuple(current_input_values.get(input_id, 0) for input_id in input_ids)

    for combo in input_combos:
        if combo == current_combo_tuple:
            continue  # Skip duplicate evaluation of current input combo

        input_values = dict(zip(input_ids, combo))
        try:
            output_value = evaluate_output(graph, input_id_to_name, combo)
            row = {
            "row": list(combo) + [output_value]
            }
            table.append(row)
        except Exception as e:
            print(f"⚠️ Evaluation error for combo {combo}: {e}")
            row = {
                "row": list(combo) + ["?"]
            }
            table.append(row)

    return {
        "inputs": input_names,
        "table": table
    }


def compute_gate_output(gate_type, inputs):
    if gate_type == "AND":
        return inputs[0] & inputs[1]
    elif gate_type == "OR":
        return inputs[0] | inputs[1]
    elif gate_type == "XOR":
        return inputs[0] ^ inputs[1]
    elif gate_type == "XNOR":
        return int(not (inputs[0] ^ inputs[1]))
    elif gate_type == "NAND":
        return int(not (inputs[0] & inputs[1]))
    elif gate_type == "NOR":
        return int(not (inputs[0] | inputs[1]))
    elif gate_type == "NOT":
        return int(not inputs[0])
    else:
        raise ValueError(f"Unknown gate type: {gate_type}")


def evaluate_output(graph, input_id_to_name, input_combo):
    # Assign input values
    for i, input_id in enumerate(input_id_to_name):
        graph[input_id]['value'] = input_combo[i]

    # Topological sort: process gates in input-to-output order
    visited = set()
    queue = deque([node_id for node_id in graph if graph[node_id]["type"] == "INPUT"])

    while queue:
        current = queue.popleft()
        node = graph[current]

        for out in node["outputs"]:
            if graph[out]["type"] == "OUTPUT":
                # We only process OUTPUT if all inputs are ready
                ready_inputs = [graph[inp]["value"] for inp in graph[out]["inputs"]]
                if None not in ready_inputs:
                    graph[out]["value"] = ready_inputs[0]  # OUTPUT just takes input's value
            else:
                input_vals = [graph[inp]["value"] for inp in graph[out]["inputs"]]
                if None not in input_vals:
                    gate_type = graph[out]["type"]
                    graph[out]["value"] = compute_gate_output(gate_type, input_vals)
                    queue.append(out)

    # Find the output node and return its value
    for node_id, node_data in graph.items():
        if node_data["type"] == "OUTPUT":
            return node_data["value"]

    return None
