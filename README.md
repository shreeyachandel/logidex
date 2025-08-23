
# Logic Gates Project

This is a web application for simulating and interacting with logic gates. It allows users to create circuits, visualize logic gate behavior, and interact with a propositional formula system.

## Requirements

- Python 3.x
- Node.js
- npm (Node Package Manager)

## Setup Instructions

Follow the steps below to set up and run the project.

### 1. **Backend Setup**

1. Open a terminal window.
2. Navigate to the project directory.
3. Navigate to the `backend` folder:

   ```bash
   cd backend
   ```

4. Create a virtual environment:

   ```bash
   virtualenv venv
   ```

5. Activate the virtual environment:

   - On macOS/Linux:

     ```bash
     source venv/bin/activate
     ```

   - On Windows:

     ```bash
     .\venv\Scripts\activate
     ```

6. Install the required dependencies:

   ```bash
   pip3 install -r requirements.txt
   ```

7. To run the backend server, execute:

   ```bash
   python app.py
   ```

8. To run tests for the backend, use:

   ```bash
   python run_tests.py
   ```

### 2. **Frontend Setup**

1. Open a new terminal window.
2. Navigate to the `frontend` folder:

   ```bash
   cd frontend
   ```

3. Install the frontend dependencies:

   ```bash
   npm install --legacy-peer-deps
   ```

4. Install the required versions of `ajv` and `ajv-keywords`:

   ```bash
   npm install ajv@6.12.6 --legacy-peer-deps
   npm install ajv-keywords@3.1.0 --legacy-peer-deps
   ```

5. To start the frontend application, execute:

   ```bash
   npm start
   ```

### 3. **Access the Application**

- Once both the backend server and the frontend app are running, open your web browser (preferably Chrome).
- Navigate to `http://localhost:3000` to view the app and interact with the functionality.
