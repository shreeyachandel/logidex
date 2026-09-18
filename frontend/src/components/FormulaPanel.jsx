import { Button } from '@mui/material';

export default function FormulaPanel({ error, formula, onChange, onSubmit }) {
  return (
    <section className="formula-section">
      <h3>Create a circuit from a formula</h3>
      <textarea
        aria-label="Propositional formula"
        className="formula-textarea"
        maxLength={400}
        onChange={(event) => onChange(event.target.value)}
        placeholder={'Enter a propositional formula\n(e.g. A AND (B OR C))'}
        rows="9"
        value={formula}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '1.5rem 0' }}>
        <Button
          className="formula-submit-button"
          disabled={!formula.trim()}
          onClick={onSubmit}
          variant="outlined"
        >
          Create Circuit
        </Button>
      </div>
      {error && <div className="error-box" role="alert">{error}</div>}
    </section>
  );
}
