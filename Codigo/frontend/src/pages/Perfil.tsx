import React, { useEffect, useState, useRef } from "react";
import "../style/Perfil.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import perfilDefault from "../assets/perfil-preto.png";
import {
  getUserProfile,
  updateUserProfile,
  uploadUserPhoto,
} from "../services/usuario";
import { showAllNiveis } from "../services/nivel";

interface Nivel {
  id_nivel: number;
  nome: string;
  descricao?: string;
  ordem: number;
  ativo: boolean;
}

interface PerfilData {
  nome: string;
  email: string;
  tipo: string;
  id_nivel?: number | null;
  pontuacao: number;
  foto?: string;
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
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

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
          if (data.foto) {
            // Adiciona o base URL da API se a foto for um caminho relativo
            const fotoUrl = data.foto.startsWith("http")
              ? data.foto
              : `http://localhost:3001${data.foto}`;
            console.log("Foto do banco:", data.foto);
            console.log("URL da foto:", fotoUrl);
            setFotoPreview(fotoUrl);
          } else {
            setFotoPreview(null);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar perfil:", err);
        showToast("Erro ao carregar perfil");
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

    fetchPerfil();
    fetchNiveis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const fetchPerfilAtualizado = async () => {
    try {
      const data = await getUserProfile();
      if (data) {
        setPerfil(data);
        setNome(data.nome);
        setEmail(data.email);
        if (data.foto) {
          // Adiciona o base URL da API se a foto for um caminho relativo
          const fotoUrl = data.foto.startsWith("http")
            ? data.foto
            : `http://localhost:3001${data.foto}`;
          console.log("Foto atualizada do banco:", data.foto);
          console.log("URL atualizada da foto:", fotoUrl);
          setFotoPreview(fotoUrl);
        } else {
          setFotoPreview(null);
        }
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
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmarSenha("");
    setFotoPreview(perfil.foto || null);
    setFotoFile(null);
    showToast("Alterações canceladas");
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
            showToast("Foto atualizada com sucesso!");
          }
        } catch (uploadErr) {
          console.error("Erro ao enviar foto:", uploadErr);
          showToast("Erro ao enviar foto");
        }
      }

      // Atualizar outros dados do perfil
      await updateUserProfile(updateData);
      showToast("Perfil atualizado com sucesso!");

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
      showToast(msg);
    } finally {
      setSalvando(false);
    }
  };

  const nivelAtual = perfil.id_nivel
    ? niveis.find((n) => n.id_nivel === perfil.id_nivel)
    : null;

  if (loading) {
    return (
      <div className="perfil-container">
        <Header />
        <main className="perfil-main">
          <div className="loading-message">Carregando perfil...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="perfil-container">
      <Header />

      <main className="perfil-main">
        <h1>MEU PERFIL</h1>

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
            >
              Alterar Foto
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="file-input-hidden"
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
                  <span style={{ color: "rgba(255,255,255,0.4)" }}>
                    Sem nível
                  </span>
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
              <label className="form-label">Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="form-input"
                placeholder="Digite seu nome completo"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="Digite seu email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Usuário</label>
              <input
                type="text"
                value={tipoLabels[perfil.tipo] || perfil.tipo}
                className="form-input"
                disabled
              />
            </div>

            {/* Seção de Senha */}
            <div className="password-section">
              <div className="form-group">
                <label className="form-label">Senha Atual</label>
                <input
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
                <label className="form-label">Nova Senha</label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Nova Senha</label>
                <input
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

      {toast && <div className="toast">{toast}</div>}

      <Footer />
    </div>
  );
}
