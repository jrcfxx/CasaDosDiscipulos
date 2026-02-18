export interface Campo {
  id_campo: number;
  tipo_campo: string;
  label: string;
  conteudo?: string | number | boolean | null;
}

export interface Modulo {
  id_modulo: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
  campos?: Campo[];
}

export async function getAllModulos(): Promise<Modulo[]> {
  const response = await fetch("http://localhost:3001/api/modulos");
  const data = await response.json();
  console.log(data);
  return data;
}
