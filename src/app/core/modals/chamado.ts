export type StatusChamado = 'Aberto' | 'Em Execução' | 'Fechado' | 'Cancelado';

export type PrioridadeChamado = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export interface Chamado {
  id: string;
  bloco: string;
  sala: string;
  categoria: string;
  descricao: string;
  canalAbertura: 'formulario' | 'qrcode';
  status: StatusChamado;
  prioridade: PrioridadeChamado;
  criadoPor: string;
  criadoEm: string;
  atribuidoPara: string;
  idGrupo: string;
}
