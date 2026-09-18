"""Flask application and production frontend server for LogiDex."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Callable

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from backend.logic.formula_to_circuit import formula_to_circuit
from backend.logic.propositional_reduction import generate_propositional_reduction
from backend.logic.truth_table import generate_truth_table


FRONTEND_BUILD_DIR = Path(__file__).resolve().parents[1] / "frontend" / "dist"


def create_app() -> Flask:
    app = Flask(__name__, static_folder=None)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    def run_computation(operation: Callable[[dict], dict]):
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "A JSON circuit payload is required."}), 400

        try:
            return jsonify(operation(payload)), 200
        except (KeyError, TypeError, ValueError) as error:
            app.logger.info("Invalid computation request: %s", error)
            return jsonify({"error": str(error)}), 400

    @app.get("/api/health")
    def health_check():
        return jsonify({"status": "ok"}), 200

    @app.post("/api/compute-truth-table")
    def compute_truth_table():
        return run_computation(generate_truth_table)

    @app.post("/api/compute-propositional-formula")
    def compute_propositional_formula():
        return run_computation(generate_propositional_reduction)

    @app.post("/api/create-circuit")
    def create_circuit():
        payload = request.get_json(silent=True)
        formula = (
            payload.get("formula", "").strip() if isinstance(payload, dict) else ""
        )
        if not formula:
            return jsonify({"error": "Formula is required."}), 400

        try:
            return jsonify(formula_to_circuit(formula)), 200
        except ValueError as error:
            return jsonify({"error": str(error)}), 400

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path: str):
        """Serve the compiled React application, including client-side routes."""
        if path.startswith("api/"):
            return jsonify({"error": "API route not found."}), 404

        requested_file = FRONTEND_BUILD_DIR / path
        if path and requested_file.is_file():
            return send_from_directory(FRONTEND_BUILD_DIR, path)

        index_file = FRONTEND_BUILD_DIR / "index.html"
        if index_file.is_file():
            return send_from_directory(FRONTEND_BUILD_DIR, "index.html")

        return (
            jsonify(
                {
                    "error": "Frontend build not found. Run `npm run build` from the repository root."
                }
            ),
            404,
        )

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", "5050")),
        debug=os.environ.get("FLASK_DEBUG") == "1",
    )
