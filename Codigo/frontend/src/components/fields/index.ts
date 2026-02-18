/**
 * Fields - Componentes de Formulário
 * Exportação centralizada de todos os campos alinhados com o backend
 *
 * 9 Tipos de Campo (sincronizados com backend/constants.js):
 * - texto (TextField)
 * - numero (NumberField)
 * - data (DateField)
 * - link (LinkField)
 * - upload (UploadField)
 * - video (VideoField)
 * - multipla_escolha (MultipleChoiceField)
 * - verdadeiro_falso (TrueFalseField)
 * - discursiva (EssayField)
 */

// Componentes principais (9 tipos do backend)
export { default as TextField } from "./TextField";
export { default as NumberField } from "./NumberField";
export { default as DateField } from "./DateField";
export { default as LinkField } from "./LinkField";
export { default as UploadField } from "./UploadField";
export { default as VideoField } from "./VideoField";
export { default as MultipleChoiceField } from "./MultipleChoiceField";
export { default as TrueFalseField } from "./TrueFalseField";
export { default as EssayField } from "./EssayField";

// Componentes auxiliares/genéricos
export { default as SelectField } from "./SelectField";
export { default as TextareaField } from "./TextareaField";
export { default as CheckboxField } from "./CheckboxField";

// Utilitários
export { default as FieldRenderer } from "./FieldRenderer";

// Compatibilidade retroativa (deprecated - remover após migração completa)
export { default as QuizField } from "./QuizField";
