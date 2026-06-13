export interface Servidor {
  id?: string;
  email: string;
  nome: string;
  funcao: string;
  role: 'aluno' | 'servidor' | 'admin';
}
