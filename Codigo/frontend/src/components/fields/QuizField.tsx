import React, { useEffect, useState } from "react";
import quizService, { Quiz } from "../../services/quizService";
import "../../style/tokens.css";
import "../../style/form.css";

interface QuizFieldProps {
  name: string;
  label: string;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const QuizField: React.FC<QuizFieldProps> = ({
  name,
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  className = "",
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        const data = await quizService.getActive();
        setQuizzes(data);
      } catch (err) {
        console.error("Erro ao carregar quizzes:", err);
        setLoadError("Erro ao carregar quizzes");
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
  }, []);

  const fieldId = `field-${name}`;
  const hasError = Boolean(error);

  return (
    <div
      className={`form-field ${
        hasError ? "form-field--error" : ""
      } ${className}`}
    >
      {label && (
        <label
          htmlFor={fieldId}
          className={`form-label ${required ? "form-label--required" : ""} ${
            disabled ? "form-label--disabled" : ""
          }`}
        >
          {label}
        </label>
      )}

      {loading ? (
        <div className="form-input" style={{ color: "#6c757d" }}>
          Carregando quizzes...
        </div>
      ) : loadError ? (
        <div className="form-input" style={{ color: "#dc3545" }}>
          {loadError}
        </div>
      ) : (
        <select
          id={fieldId}
          name={name}
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value) || null)}
          disabled={disabled}
          required={required}
          className="form-input"
          aria-invalid={hasError}
          aria-describedby={hasError ? `${fieldId}-error` : undefined}
        >
          <option value="">
            {placeholder || "Selecione um quiz (opcional)"}
          </option>
          {quizzes.map((q) => (
            <option key={q.id_quiz} value={q.id_quiz}>
              {q.titulo}
            </option>
          ))}
        </select>
      )}

      {error && (
        <span id={`${fieldId}-error`} className="form-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default QuizField;
