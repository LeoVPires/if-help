export interface Servidor {
  id?: string;
  email: string;
  nome: string;
  role: 'aluno' | 'servidor' | 'admin';
}
