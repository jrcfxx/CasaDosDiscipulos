import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/CriarFormulariosSecretariaCelulasAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

// Components de campos
import TextField from "../components/fields/TextField";
import NumberField from "../components/fields/NumberField";
import DateField from "../components/fields/DateField";
import LinkField from "../components/fields/LinkField";
import UploadField from "../components/fields/UploadField";
import VideoField from "../components/fields/VideoField";

const API = "http://localhost:3001/api/formulario";
const API_CAMPOS = "http://localhost:3001/api/campo";

type CampoLocal = {
  uid: number;
  id_campo: number;
  tipo: string;
  label: string;
  conteudo: any;
};

type Formulario = {
  titulo: string;
  descricao: string;
  liberado_para_alunos: boolean;
  arquivo: File | null;
};

export default function CriarFormulariosSecretariaCelulasAdmin() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const isEdit = Boolean(params.id);

  const nameRef = useRef<HTMLInputElement | null>(null);

  const [formulario, setFormulario] = useState<Formulario>({
    titulo: "",
    descricao: "",
    liberado_para_alunos: false,
    arquivo: null,
  });

  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [fields, setFields] = useState<CampoLocal[]>([]);

  const fieldOptions = [
    { label: "Texto", tipo: "texto", component: TextField },
    { label: "Número", tipo: "numero", component: NumberField },
    { label: "Data", tipo: "data", component: DateField },
    { label: "Link", tipo: "link", component: LinkField },
    { label: "Upload", tipo: "upload", component: UploadField },
    { label: "Vídeo", tipo: "video", component: VideoField },
  ];

  // Buscar campos disponíveis do backend
  useEffect(() => {
    axios
      .get(API_CAMPOS)
      .then((res) => setAvailableFields(res.data || []))
      .catch((err) => {
        console.error("Erro ao buscar campos:", err);
        alert("Erro ao buscar tipos de campo.");
      });
  }, []);

  // Carregar formulário se for edição
  useEffect(() => {
    if (!isEdit || !availableFields.length) return;

    axios
      .get(`${API}/${params.id}`)
      .then((res) => {
        const f = res.data;
        setFormulario({
          titulo: f.titulo,
          descricao: f.descricao,
          liberado_para_alunos: f.liberado_para_alunos,
          arquivo: null,
        });

        const incomingCampos = (f.campos ?? []).map((c: any, idx: number) => ({
          uid: Date.now() + idx,
          id_campo: c.id_campo,
          tipo:
            availableFields.find((af) => af.id_campo === c.id_campo)
              ?.tipo_campo ?? "texto",
          label: c.label ?? `Campo ${idx + 1}`,
          conteudo: c.conteudo ?? "",
        }));

        setFields(incomingCampos);
      })
      .catch((err) => {
        console.error("Erro ao carregar formulário:", err);
        alert("Erro ao carregar formulário.");
      });
  }, [params.id, isEdit, availableFields]);

  const createLocalField = (
    id_campo: number,
    tipo: string,
    label = "",
    conteudo: any = ""
  ): CampoLocal => ({
    uid: Date.now() + Math.floor(Math.random() * 10000),
    id_campo,
    tipo,
    label,
    conteudo,
  });

  const addField = (tipo: string) => {
    const label = window.prompt("Digite o label do campo:");
    if (!label) return;

    const campo = availableFields.find(
      (c) => String(c.tipo_campo).toLowerCase() === tipo.toLowerCase()
    );
    if (!campo) {
      alert(`Nenhum campo disponível para o tipo ${tipo}`);
      return;
    }

    setFields((prev) => [
      ...prev,
      createLocalField(campo.id_campo, tipo, label),
    ]);
  };

  const removeField = (uid: number) => {
    setFields((prev) => prev.filter((f) => f.uid !== uid));
  };

  const updateFieldContent = (uid: number, valor: any) => {
    setFields((prev) =>
      prev.map((f) => (f.uid === uid ? { ...f, conteudo: valor } : f))
    );
  };

  const renderFieldComponent = (f: CampoLocal) => {
    const opt = fieldOptions.find((o) => o.tipo === f.tipo);
    if (!opt) return null;
    const FieldComponent = opt.component;
    return (
      <div key={f.uid} className="field-wrapper">
        <div className="dynamic-field-row">
          <FieldComponent
            id={String(f.uid)}
            name={`campo_${f.uid}`}
            label={f.label}
            value={f.conteudo}
            onChange={(val: any) => updateFieldContent(f.uid, val)}
          />
          <button
            type="button"
            className="field-remove-btn"
            onClick={() => removeField(f.uid)}
            title="Remover campo"
          >
            ✕
          </button>
        </div>
      </div>
    );
  };

  const salvarFormulario = async () => {
    if (!formulario.titulo.trim()) return alert("O título é obrigatório.");

    const payload: any = {
      titulo: formulario.titulo,
      descricao: formulario.descricao,
      ativo: formulario.liberado_para_alunos ? 1 : 0,
      campos: fields.map((f) => ({
        id: f.uid < 10000 ? undefined : f.uid,
        id_formulario: params.id ? Number(params.id) : null,
        id_campo: f.id_campo,
        label: f.label,
        conteudo: f.conteudo ?? "",
      })),
    };

    try {
      if (isEdit) {
        await axios.put(`${API}/${params.id}`, payload);
        alert("Formulário atualizado!");
      } else {
        await axios.post(API, payload);
        alert("Formulário criado!");
      }
      navigate("/admin/formularios");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar formulário.");
    }
  };

  const excluirFormulario = async () => {
    if (!isEdit) return;
    try {
      await axios.delete(`${API}/${params.id}`);
      alert("Formulário excluído.");
      navigate("/admin/formularios");
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir formulário.");
    }
  };

  return (
    <div className="page-with-fixed-header">
      <Header />
      <main className="cf-main container-centered">
        <h1 className="cf-title">{formulario.titulo || "Novo Formulário"}</h1>

        <input
          className="cf-input-title"
          ref={nameRef}
          placeholder="Título do formulário"
          value={formulario.titulo}
          onChange={(e) =>
            setFormulario({ ...formulario, titulo: e.target.value })
          }
        />

        <div className="cf-grid">
          {/* Card principal */}
          <section className="cf-card cf-left">
            <div className="cf-card-inner">
              <div className="cf-label-row">Descrição</div>
              <textarea
                className="cf-textarea"
                placeholder="Digite a descrição do formulário"
                value={formulario.descricao}
                onChange={(e) =>
                  setFormulario({ ...formulario, descricao: e.target.value })
                }
              />

              <div className="cf-label-row">Campos</div>
              <div className="cf-add-field-row">
                {fieldOptions.map((opt) => (
                  <button
                    key={opt.tipo}
                    type="button"
                    className="cf-add"
                    onClick={() => addField(opt.tipo)}
                  >
                    + {opt.label}
                  </button>
                ))}
              </div>

              <div className="cf-dynamic-fields">
                {fields.length === 0 && (
                  <p className="cf-placeholder">Nenhum campo adicionado.</p>
                )}
                {fields.map((f) => renderFieldComponent(f))}
              </div>

              <div className="cf-actions">
                <button className="cf-save" onClick={salvarFormulario}>
                  Salvar
                </button>
                {isEdit && (
                  <button className="cf-delete" onClick={excluirFormulario}>
                    Excluir
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Card lateral */}
          <aside className="cf-card cf-right">
            <div className="cf-card-inner">
              <label className="cf-right-inner">
                <input
                  type="checkbox"
                  checked={formulario.liberado_para_alunos}
                  onChange={() =>
                    setFormulario({
                      ...formulario,
                      liberado_para_alunos: !formulario.liberado_para_alunos,
                    })
                  }
                />
                Liberar para alunos
              </label>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
