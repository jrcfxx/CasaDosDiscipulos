import React, { useEffect, useState } from "react";
import "../style/EventosAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import Toast from "../components/ui/Toast";
import { ASSETS_BASE } from "../config/api";
import {
  type Evento,
  listarEventos,
  criarEvento,
  atualizarEvento,
  excluirEvento,
  uploadImagemEvento,
} from "../services/eventoService";
import { getErrorMessage } from "../utils/errorUtils";

const EventosAdmin: React.FC = () => {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    ordem: 0,
    ativo: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [eventoToDelete, setEventoToDelete] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const data = await listarEventos();
      setEventos(data);
    } catch {
      setToast("Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) return null;
    const { imagem_url } = await uploadImagemEvento(selectedFile);
    return imagem_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imagem_url = editingEvento?.imagem_url;

      if (selectedFile) {
        const uploadedUrl = await uploadImage();
        if (uploadedUrl) {
          imagem_url = uploadedUrl;
        }
      }

      if (!imagem_url && !editingEvento) {
        setToast("É necessário selecionar uma imagem");
        return;
      }

      const eventoData = {
        ...formData,
        imagem_url,
      };

      if (editingEvento) {
        await axios.put(`${API_URL}/${editingEvento.id_evento}`, eventoData);
      } else {
        await axios.post(API_URL, eventoData);
      }

      await fetchEventos();
      closeModal();
    } catch (error) {
      console.error("Erro ao salvar evento:", error);
      const msg = error instanceof Error ? error.message : "Erro ao salvar evento";
      setToast(msg);
    }
  };

  const handleDeleteClick = (id: number) => {
    setEventoToDelete(id);
    setShowConfirmDelete(true);
  };

  const handleDeleteConfirm = async () => {
    if (eventoToDelete === null) return;
    setShowConfirmDelete(false);
    const id = eventoToDelete;
    setEventoToDelete(null);
    try {
      await excluirEvento(id);
      await fetchEventos();
      setToast("Evento excluído com sucesso.");
    } catch {
      setToast("Erro ao deletar evento");
    }
  };

  const handleToggleAtivo = async (evento: Evento) => {
    try {
      await atualizarEvento(evento.id_evento, { ativo: !evento.ativo });
      await fetchEventos();
    } catch {
      setToast("Erro ao alterar status do evento");
    }
  };

  const openModal = (evento?: Evento) => {
    if (evento) {
      setEditingEvento(evento);
      setFormData({
        titulo: evento.titulo,
        descricao: evento.descricao || "",
        ordem: evento.ordem,
        ativo: evento.ativo,
      });
      setPreviewUrl(`${ASSETS_BASE}${evento.imagem_url}`);
    } else {
      setEditingEvento(null);
      setFormData({
        titulo: "",
        descricao: "",
        ordem: 0,
        ativo: true,
      });
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvento(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({
      titulo: "",
      descricao: "",
      ordem: 0,
      ativo: true,
    });
  };

  return (
    <div className="page-with-fixed-header">
      <Header />

      <main id="main-content" className="container eventos-admin" tabIndex={-1}>
        <h1 className="page-title">Gerenciar Eventos</h1>

        <div className="eventos-actions">
          <button className="btn-criar" onClick={() => openModal()}>
            + Novo Evento
          </button>
        </div>

        {loading ? (
          <div className="loading">Carregando...</div>
        ) : (
          <div className="eventos-grid">
            {eventos.map((evento) => (
              <div key={evento.id_evento} className="evento-card">
                <div className="evento-image-wrapper">
                  <img
                    src={`${ASSETS_BASE}${evento.imagem_url}`}
                    alt={evento.titulo}
                    className="evento-image"
                  />
                  <div
                    className={`evento-status ${
                      evento.ativo ? "ativo" : "inativo"
                    }`}
                  >
                    {evento.ativo ? "Ativo" : "Inativo"}
                  </div>
                </div>
                <div className="evento-content">
                  <h3 className="evento-titulo">{evento.titulo}</h3>
                  {evento.descricao && (
                    <p className="evento-descricao">{evento.descricao}</p>
                  )}
                  <div className="evento-meta">
                    <span className="evento-ordem">Ordem: {evento.ordem}</span>
                  </div>
                  <div className="evento-actions">
                    <button
                      className="btn-editar"
                      onClick={() => openModal(evento)}
                    >
                      Editar
                    </button>
                    <button
                      className={`btn-toggle ${
                        evento.ativo ? "desativar" : "ativar"
                      }`}
                      onClick={() => handleToggleAtivo(evento)}
                    >
                      {evento.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      className="btn-deletar"
                      onClick={() => handleDeleteClick(evento.id_evento)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingEvento ? "Editar Evento" : "Novo Evento"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="evento-titulo">Título</label>
                <input
                  id="evento-titulo"
                  type="text"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  placeholder="Digite o título do evento (opcional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="evento-descricao">Descrição</label>
                <textarea
                  id="evento-descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={3}
                  placeholder="Digite a descrição do evento (opcional)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="evento-ordem">Posição no Carrossel</label>
                <input
                  id="evento-ordem"
                  type="number"
                  value={formData.ordem}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ordem: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.ativo}
                    onChange={(e) =>
                      setFormData({ ...formData, ativo: e.target.checked })
                    }
                  />
                  Evento Ativo
                </label>
              </div>

              <div className="form-group">
                <label>Imagem{!editingEvento && "*"}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required={!editingEvento}
                />
                {previewUrl && (
                  <div className="image-preview">
                    <img src={previewUrl} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-salvar">
                  {editingEvento ? "Salvar Alterações" : "Criar Evento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={showConfirmDelete}
        title="Tem certeza?"
        message="Deseja realmente excluir este evento? Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowConfirmDelete(false);
          setEventoToDelete(null);
        }}
      />
      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          variant={toast.includes("Erro") ? "error" : "success"}
        />
      )}

      <Footer />
    </div>
  );
};

export default EventosAdmin;
