import React, { useEffect, useState } from "react";
import "../style/EventosAdmin.css";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ConfirmModal from "../components/ui/ConfirmModal";
import Toast from "../components/ui/Toast";
import axios from "axios";

interface Evento {
  id_evento: number;
  titulo: string;
  descricao?: string;
  imagem_url: string;
  ordem: number;
  ativo: boolean;
  data_criacao?: string;
  data_atualizacao?: string;
}

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

  const API_URL = "http://localhost:3001/api/evento";

  useEffect(() => {
    fetchEventos();
  }, []);

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setEventos(response.data);
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
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

    const formData = new FormData();
    formData.append("imagem", selectedFile);

    try {
      // Não definir Content-Type manualmente - axios adiciona boundary automaticamente
      const response = await axios.post(`${API_URL}/upload`, formData);
      return response.data.imagem_url;
    } catch (error: unknown) {
      const msg = axios.isAxiosError(error) && error.response?.data?.error
        ? error.response.data.error
        : "Erro ao fazer upload da imagem";
      console.error("Erro ao fazer upload da imagem:", error);
      throw new Error(msg);
    }
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
      await axios.delete(`${API_URL}/${id}`);
      await fetchEventos();
      setToast("Evento excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao deletar evento:", error);
      setToast("Erro ao deletar evento");
    }
  };

  const handleToggleAtivo = async (evento: Evento) => {
    try {
      await axios.put(`${API_URL}/${evento.id_evento}`, {
        ativo: !evento.ativo,
      });
      await fetchEventos();
    } catch (error) {
      console.error("Erro ao alterar status do evento:", error);
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
      setPreviewUrl(`http://localhost:3001${evento.imagem_url}`);
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

      <main className="container eventos-admin">
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
                    src={`http://localhost:3001${evento.imagem_url}`}
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
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingEvento ? "Editar Evento" : "Novo Evento"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  placeholder="Digite o título do evento (opcional)"
                />
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  rows={3}
                  placeholder="Digite a descrição do evento (opcional)"
                />
              </div>

              <div className="form-group">
                <label>Posição no Carrossel</label>
                <input
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
