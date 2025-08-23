from flask import Flask, request, jsonify
from logic.truth_table import generate_truth_table
from logic.propositional_reduction import generate_propositional_reduction
from logic.formula_to_circuit import formula_to_circuit
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/compute-truth-table', methods=['POST'])
def compute_truth_table():
    data = request.get_json()
    print("Received circuit data:", data)  # Check what is being received
    try:
        result = generate_truth_table(data)
        print("Generated truth table:", result)  # Check the result
        return jsonify(result), 200
    except Exception as e:
        print("Error generating truth table:", str(e))  # Log error details
        return jsonify({"error": str(e)}), 400

@app.route('/api/compute-propositional-formula', methods=['POST'])
def compute_propositional_formula():
    data = request.get_json()
    print("Received circuit data:", data)  # Check what is being received
    try:
        # For now, just return the received data (this will simulate the propositional reduction).
        result = generate_propositional_reduction(data)
        
        print("Generated propositional formula:", result)  # Check the result
        return jsonify(result), 200
    except Exception as e:
        print("Error generating propositional formula:", str(e))  # Log error details
        return jsonify({"error": str(e)}), 400
    
@app.route('/api/create-circuit', methods=['POST'])
def create_circuit():
    try:
        formula = request.json.get('formula')
        if not formula:
            return jsonify({'error': 'Formula is required'}), 400

        circuit_data = formula_to_circuit(formula)
        print(f"Circuit Data: {circuit_data}")  # Log the response

        return jsonify(circuit_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
