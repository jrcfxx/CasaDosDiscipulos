import React from "react";
import { FieldType, Campo } from "../../types";
import TextField from "./TextField";
import NumberField from "./NumberField";
import DateField from "./DateField";
import LinkField from "./LinkField";
import UploadField from "./UploadField";
import MultipleChoiceField from "./MultipleChoiceField";
import TrueFalseField from "./TrueFalseField";
import EssayField from "./EssayField";

interface FieldRendererProps {
  campo: Campo;
  value: any;
  onChange: (value: any) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * FieldRenderer Component
 * Renderiza dinamicamente o campo correto baseado no tipo
 * Sincronizado com os 8 FIELD_TYPES do backend (constants.js)
 */
const FieldRenderer: React.FC<FieldRendererProps> = ({
  campo,
  value,
  onChange,
  error,
  disabled = false,
}) => {
  const commonProps = {
    name: `campo-${campo.id_campo}`,
    label: campo.label || "",
    value,
    onChange,
    error,
    disabled,
    required: campo.obrigatorio || false,
  };

  switch (campo.tipo_campo) {
    // Campos gerais
    case FieldType.TEXT:
      return <TextField {...commonProps} placeholder={campo.placeholder} />;

    case FieldType.NUMBER:
      return (
        <NumberField
          {...commonProps}
          min={campo.min_valor}
          max={campo.max_valor}
          step={campo.step}
        />
      );

    case FieldType.DATE:
      return (
        <DateField
          {...commonProps}
          min={campo.data_minima}
          max={campo.data_maxima}
        />
      );

    case FieldType.LINK:
      return <LinkField {...commonProps} placeholder="https://exemplo.com" />;

    case FieldType.UPLOAD:
      return (
        <UploadField
          {...commonProps}
          accept={campo.tipos_aceitos}
          maxSize={campo.tamanho_maximo}
        />
      );

    // Campos específicos para quiz
    case FieldType.MULTIPLE_CHOICE:
      const options =
        campo.opcoes?.map((opt) => ({ value: opt, label: opt })) || [];
      return <MultipleChoiceField {...commonProps} options={options} />;

    case FieldType.TRUE_FALSE:
      const trueFalseOptions = [
        { value: "true", label: "Verdadeiro" },
        { value: "false", label: "Falso" },
      ];
      return <TrueFalseField {...commonProps} options={trueFalseOptions} />;

    case FieldType.ESSAY:
      return (
        <EssayField
          {...commonProps}
          maxLength={campo.max_caracteres || 1000}
          placeholder={campo.placeholder || "Digite sua resposta..."}
        />
      );

    default:
      console.warn(`Tipo de campo não suportado: ${campo.tipo_campo}`);
      return <TextField {...commonProps} />;
  }
};

export default FieldRenderer;
