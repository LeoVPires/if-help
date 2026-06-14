// ============================================================================
// 1. TIPOS E ENUMS DO FLUXO DE CHAMADOS
// ============================================================================
export type StatusChamado = 'Aberto' | 'Em Execução' | 'Fechado' | 'Cancelado';

export type PrioridadeChamado = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

// ============================================================================
// 2. ESTRUTURAS DE CONFIGURAÇÃO (GERENCIADAS PELO ADMIN)
// ============================================================================

/** Representa a categoria/tipo do problema (Ex: TI, Infraestrutura, Limpeza) */
export interface TipoDemanda {
  id?: string;
  nome: string;
  descricao: string;
  icone: string;
}

/** Representa o ponto físico macro do campus (Ex: Bloco A, Refeitório, Biblioteca) */
export interface LocalCampus {
  id?: string;
  nome: string;
  icone: string;
  ambientes?: AmbienteLocal[]; // Preenchido dinamicamente para os Expansion Panels
}

/** Representa o sub-espaço de um local (Ex: Sala 102, Banheiro, Laboratório de Química) */
export interface AmbienteLocal {
  id?: string;
  nome: string;
}

// ============================================================================
// 3. ENTIDADE PRINCIPAL
// ============================================================================
export interface Chamado {
  id?: string;

  // Alinhados com as configurações do Admin (geralmente salvamos o 'nome' ou o 'id' como string)
  localCampus: string; // Origem: LocalCampus.nome
  ambienteLocal: string; // Origem: AmbienteLocal.nome
  tipoDemanda: string; // Origem: TipoDemanda.nome

  descricao: string;
  canalAbertura: 'formulario' | 'qrcode';
  status: StatusChamado;
  prioridade: PrioridadeChamado;

  // Controle de Usuários e Auditoria
  criadoPor: string; // UID do usuário comum/aluno
  criadoEm: string; // Timestamp ISO String
  atribuidoPara: string; // UID do Técnico/Servidor que vai resolver
  idGrupo: string; // ID do setor responsável (ex: ID da TI ou ID da Infra)
}
