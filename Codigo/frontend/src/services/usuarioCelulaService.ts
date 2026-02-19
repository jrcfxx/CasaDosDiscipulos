import apiClient from "./apiClient";

export interface CelulaPrincipal {
  id_usuario_celula: number;
  id_usuario: number;
  id_celula: number;
  principal: boolean;
  nome_celula?: string;
  endereco?: string;
  dia_reuniao?: string;
  horario_reuniao?: string;
}

const usuarioCelulaService = {
  async setCelulaPrincipal(idCelula: number): Promise<CelulaPrincipal> {
    const response = await apiClient.put("/usuario-celula/perfil", {
      id_celula: idCelula,
    });
    return response.data;
  },

  async removeCelula(idCelula: number): Promise<void> {
    await apiClient.delete(`/usuario-celula/perfil/${idCelula}`);
  },
};

export default usuarioCelulaService;
