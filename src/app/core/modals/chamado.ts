export type StatusChamado = 'Aberto' | 'Em Execução' | 'Fechado' | 'Cancelado';

export type PrioridadeChamado = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export interface TipoDemanda {
  id?: string;
  nome: string;
  descricao: string;
  icone: string;
}

export interface LocalCampus {
  id?: string;
  nome: string;
  icone: string;
  ambientes?: AmbienteLocal[];
}

export interface AmbienteLocal {
  icone: string;
  id?: string;
  nome: string;
}

export interface Chamado {
  id?: string;
  localCampus: string;
  ambienteLocal: string;
  tipoDemanda: string;
  descricao: string;
  canalAbertura: 'formulario' | 'qrcode';
  status: StatusChamado;
  prioridade: PrioridadeChamado;
  criadoPor: string;
  criadoPorNome: string;
  criadoEm: string;
  atribuidoPara: string;
  atribuidoParaNome: string;
  idGrupo: string;

  agrupamentoId: string | null;
}

export interface Nota {
  id?: string;
  autorNome: string;
  autorFuncao: string;
  texto: string;
  criadoEm: string;
}

export interface ChamadoSnapshot {
  chamadoId: string;
  idGrupo: string;
  localCampus: string;
  ambienteLocal: string;
  tipoDemanda: string;
  descricao: string;
  canalAbertura: 'formulario' | 'qrcode';
  status: StatusChamado;
  prioridade: PrioridadeChamado;
  criadoPor: string;
  criadoPorNome: string;
  criadoEm: string;
  atribuidoPara: string;
  atribuidoParaNome: string;
}

export interface Agrupamento {
  id?: string;

  idGrupo: string;

  localCampus: string;
  ambienteLocal: string;

  status: StatusChamado;
  prioridade: PrioridadeChamado;

  atribuidoPara: string;
  atribuidoParaNome: string;

  chamadosIds: string[];

  membros: ChamadoSnapshot[];

  tipoDemanda: string;
  descricoes: string[];

  criadoEm: string;
  atualizadoEm: string;
  ativo: boolean;
}

export type DashboardItem =
  | {
      kind: 'chamado';
      chamado: Chamado;
    }
  | {
      kind: 'agrupamento';
      agrupamento: Agrupamento;
    };

export interface AgrupamentoDialogData {
  chamadoBase?: Chamado;
  agrupamento?: Agrupamento;
  chamadosParaAgrupar: Chamado[];
  modo?: 'criar' | 'adicionar';
}
