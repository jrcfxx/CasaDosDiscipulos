import React, { useEffect, useState, useRef } from "react";
import "../style/Perfil.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Toast from "../components/ui/Toast";
import perfilDefault from "../assets/perfil-preto.png";
import {
  getUserProfile,
  updateUserProfile,
  uploadUserPhoto,
} from "../services/usuario";
import { showAllNiveis } from "../services/nivel";
import celulaService from "../services/celulaService";
import usuarioCelulaService from "../services/usuarioCelulaService";
import { ASSETS_BASE } from "../config/api";
import { formatarTelefoneInput, normalizarTelefoneParaEnvio } from "../utils/telefoneUtils";

function buildFotoUrl(foto: string | undefined): string | null {
  if (!foto) return null;
  return foto.startsWith("http") ? foto : `${ASSETS_BASE}${foto}`;
}

interface Nivel {
  id_nivel: number;
  nome: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
}

interface CelulaPrincipal {
  id_celula: number;
  nome_celula?: string;
}

interface PerfilData {
  nome: string;
  email: string;
  telefone?: string;
  tipo: string;
  id_nivel?: number | null;
  nivel_escola?: number | null;
  pontuacao: number;
  foto?: string;
  celula_principal?: CelulaPrincipal | null;
}

export default function Perfil() {
  const [perfil, setPerfil] = useState<PerfilData>({
    nome: "",
    email: "",
    tipo: "",
    id_nivel: null,
    pontuacao: 0,
    foto: undefined,
  });
  const [niveis, setNiveis] = useState<Nivel[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<"success" | "error" | "info">("info");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [celulas, setCelulas] = useState<Array<{ id_celula: number; nome: string }>>([]);
  const [celulaPrincipalId, setCelulaPrincipalId] = useState<number | "">("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const tipoLabels: Record<string, string> = {
    lider: "Líder",
    administrador: "Administrador",
    membro: "Membro",
  };

  useEffect(() => {
    async function fetchPerfil() {
      try {
        setLoading(true);
        const data = await getUserProfile();
        if (data) {
          setPerfil(data);
          setNome(data.nome);
          setEmail(data.email);
          setTelefone(formatarTelefoneInput(data.telefone ?? ""));
          setCelulaPrincipalId(
            data.celula_principal?.id_celula ?? ""
          );
          setFotoPreview(buildFotoUrl(data.foto) ?? null);
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        showToast("Erro ao carregar perfil", "error");
      } finally {
        setLoading(false);
      }
    }

    async function fetchNiveis() {
      try {
        const data = await showAllNiveis();
        if (Array.isArray(data)) {
          setNiveis(data);
        }
      } catch (err) {
        console.error("Erro ao carregar níveis:", err);
      }
    }

    async function fetchCelulas() {
      try {
        const c = await celulaService.getAtivas();
        setCelulas(c || []);
      } catch {
        setCelulas([]);
      }
    }
    fetchPerfil();
    fetchNiveis();
    fetchCelulas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string, variant: "success" | "error" | "info" = "info") => {
    setToast(msg);
    setToastVariant(variant);
  };

  const fetchPerfilAtualizado = async () => {
    try {
      const data = await getUserProfile();
      if (data) {
        setPerfil(data);
        setNome(data.nome);
        setEmail(data.email);
        setTelefone(formatarTelefoneInput(data.telefone ?? ""));
        setCelulaPrincipalId(data.celula_principal?.id_celula ?? "");
        setFotoPreview(buildFotoUrl(data.foto) ?? null);
      }
    } catch (err) {
      console.error("Erro ao carregar perfil:", err);
    }
  };

  const handleChoosePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      showToast("Por favor, selecione uma imagem válida");
      return;
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("A imagem deve ter no máximo 5MB");
      return;
    }

    setFotoFile(file);

    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setFotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    // Resetar campos
    setNome(perfil.nome);
    setEmail(perfil.email);
    setTelefone(formatarTelefoneInput(perfil.telefone ?? ""));
    setCelulaPrincipalId(perfil.celula_principal?.id_celula ?? "");
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setFotoPreview(buildFotoUrl(perfil.foto) ?? null);
    setFotoFile(null);
    showToast("Alterações canceladas", "info");
  };

  const handleSave = async () => {
    // Validações
    if (!nome || nome.trim().length < 3) {
      showToast("Nome deve ter no mínimo 3 caracteres");
      return;
    }

    if (!email || !email.includes("@")) {
      showToast("Email inválido");
      return;
    }

    const telefoneNorm = normalizarTelefoneParaEnvio(telefone);
    if (telefone.trim() && !telefoneNorm) {
      showToast("Telefone inválido. Use apenas números com DDD (ex: 11999999999)");
      return;
    }

    // Se está tentando alterar senha
    if (novaSenha || confirmarSenha) {
      if (!senhaAtual) {
        showToast("Informe a senha atual para alterar a senha");
        return;
      }

      if (novaSenha.length < 6) {
        showToast("A nova senha deve ter no mínimo 6 caracteres");
        return;
      }

      if (novaSenha !== confirmarSenha) {
        showToast("As senhas não coincidem");
        return;
      }
    }

    try {
      setSalvando(true);

      const updateData: any = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefoneNorm,
      };

      // Adiciona senha apenas se foi alterada
      if (novaSenha) {
        updateData.senha = novaSenha;
      }

      // Fazer upload da foto primeiro, se houver
      if (fotoFile) {
        try {
          const uploadResult = await uploadUserPhoto(fotoFile);
          if (uploadResult?.foto) {
            // A foto foi enviada com sucesso, o backend já atualizou
            showToast("Foto atualizada com sucesso!", "success");
          }
        } catch (uploadErr) {
          console.error("Erro ao enviar foto:", uploadErr);
          showToast("Erro ao enviar foto", "error");
        }
      }

      // Atualizar outros dados do perfil
      await updateUserProfile(updateData);

      // Célula principal (membros e líderes)
      if (perfil.tipo === "membro" || perfil.tipo === "lider") {
        try {
          const idAntigo = perfil.celula_principal?.id_celula;
          if (celulaPrincipalId) {
            await usuarioCelulaService.setCelulaPrincipal(Number(celulaPrincipalId));
          } else if (idAntigo) {
            await usuarioCelulaService.removeCelula(idAntigo);
          }
        } catch (err) {
          console.error("Erro ao atualizar célula principal:", err);
          showToast("Perfil salvo, mas não foi possível atualizar a célula.", "info");
        }
      }

      showToast("Perfil atualizado com sucesso!", "success");

      // Limpar campos de senha
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
      setFotoFile(null);

      // Recarregar perfil
      await fetchPerfilAtualizado();
    } catch (err: any) {
      console.error("Erro ao salvar perfil:", err);
      const msg = err?.response?.data?.error || "Erro ao salvar perfil";
      showToast(msg, "error");
    } finally {
      setSalvando(false);
    }
  };

  const nivelId = perfil.nivel_escola ?? perfil.id_nivel;
  const nivelAtual = nivelId
    ? niveis.find((n) => n.id_nivel === nivelId)
    : null;

  if (loading) {
    return (
      <div className="perfil-page page-with-fixed-header">
        <Header />
        <main id="main-content" className="perfil-main" tabIndex={-1}>
          <div className="perfil-loading">Carregando perfil...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="perfil-page page-with-fixed-header">
      <Header />

      <main id="main-content" className="perfil-main" tabIndex={-1}>
        <h1 className="perfil-title">Meu Perfil</h1>

        <div className="perfil-card">
          {/* Seção de Avatar */}
          <div className="avatar-section">
            <div className="avatar-container">
              <img
                src={fotoPreview || perfilDefault}
                alt="Foto de perfil"
                className="avatar"
              />
            </div>
            <button
              type="button"
              onClick={handleChoosePhoto}
              className="btn-upload"
              aria-label="Alterar foto de perfil"
            >
              Alterar Foto
            </button>
            <input
              type="file"
              id="foto-perfil-input"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="file-input-hidden"
              aria-hidden
            />
          </div>

          {/* Cards de Informação */}
          <div className="info-cards">
            <div className="info-card">
              <div className="info-label">Nível Atual</div>
              <div className="info-value">
                {nivelAtual ? (
                  <span className="badge-nivel">{nivelAtual.nome}</span>
                ) : (
                  <span className="info-value-empty">Sem nível</span>
                )}
              </div>
            </div>

            <div className="info-card">
              <div className="info-label">Pontuação</div>
              <div className="info-value">
                <span className="badge-pontuacao">{perfil.pontuacao}</span>
              </div>
            </div>
          </div>

          {/* Formulário */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="perfil-nome" className="form-label">Nome Completo</label>
              <input
                id="perfil-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="form-input"
                placeholder="Digite seu nome completo"
              />
            </div>

            <div className="form-group">
              <label htmlFor="perfil-email" className="form-label">Email</label>
              <input
                id="perfil-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Digite seu email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="perfil-telefone" className="form-label">Telefone / WhatsApp</label>
              <input
                id="perfil-telefone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                value={telefone}
                onChange={(e) => setTelefone(formatarTelefoneInput(e.target.value))}
                className="form-input"
                placeholder="11999999999 (apenas números)"
              />
              <p className="password-hint">
                Opcional. Para receber notificações no WhatsApp (escalação, lembretes de módulos).
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="perfil-tipo" className="form-label">Tipo de Usuário</label>
              <input
                id="perfil-tipo"
                type="text"
                value={tipoLabels[perfil.tipo] || perfil.tipo}
                className="form-input"
                disabled
              />
            </div>

            {(perfil.tipo === "membro" || perfil.tipo === "lider") && (
              <div className="form-group">
                <label htmlFor="perfil-celula" className="form-label">Célula Principal</label>
                <select
                  id="perfil-celula"
                  value={celulaPrincipalId}
                  onChange={(e) =>
                    setCelulaPrincipalId(
                      e.target.value ? Number(e.target.value) : ""
                    )
                  }
                  className="form-input"
                >
                  <option value="">Nenhuma selecionada</option>
                  {celulas.map((c) => (
                    <option key={c.id_celula} value={c.id_celula}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                <p className="password-hint">
                  Opcional. Vincule-se a uma célula para facilitar o acompanhamento.
                </p>
              </div>
            )}

            {/* Seção de Senha */}
            <div className="password-section">
              <div className="form-group">
                <label htmlFor="perfil-senha-atual" className="form-label">Senha Atual</label>
                <input
                  id="perfil-senha-atual"
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  className="form-input"
                  placeholder="Digite sua senha atual"
                />
                <p className="password-hint">
                  Preencha apenas se desejar alterar a senha
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="perfil-nova-senha" className="form-label">Nova Senha</label>
                <input
                  id="perfil-nova-senha"
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="form-group">
                <label htmlFor="perfil-confirmar-senha" className="form-label">Confirmar Nova Senha</label>
                <input
                  id="perfil-confirmar-senha"
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  className="form-input"
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="form-actions">
              <button className="btn-cancel" onClick={handleCancel}>
                Cancelar
              </button>
              <button
                className="btn-save"
                onClick={handleSave}
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast(null)}
          variant={toastVariant}
        />
      )}

      <Footer />
    </div>
  );
}
