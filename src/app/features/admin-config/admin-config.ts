import { Component, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-config',
  standalone: true,
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatExpansionModule,
    FormsModule,
  ],
  templateUrl: './admin-config.html',
  styleUrl: './admin-config.scss',
})
export class AdminConfig {
  // --- Dados Mocados para Tipos de Demanda ---
  tiposDemanda = signal([
    {
      id: 1,
      icone: 'memory',
      nome: 'Tecnologia da Informação (TI)',
      descricao: 'Computadores, internet, projetores e software.',
    },
    {
      id: 2,
      icone: 'build',
      nome: 'Infraestrutura e Manutenção',
      descricao: 'Elétrica, hidráulica, ar-condicionado e civil.',
    },
    {
      id: 3,
      icone: 'cleaning_services',
      nome: 'Limpeza e Conservação',
      descricao: 'Higienização de ambientes, lixo e reposição (papel/sabão).',
    },
    {
      id: 4,
      icone: 'inventory_2',
      nome: 'Materiais de Apoio',
      descricao: 'Pincel, apagador, reagentes de laboratório.',
    },
  ]);

  // --- Dados Mocados para Locais ---
  locais = signal([
    {
      id: 1,
      icone: 'domain',
      nome: 'Bloco A (Administrativo)',
      ambientes: [
        { id: 101, nome: 'Sala 102 - Departamento Pessoal' },
        { id: 102, nome: 'Sala 103 - Direção' },
        { id: 103, nome: 'Banheiro Masculino (Térreo)' },
      ],
    },
    {
      id: 2,
      icone: 'school',
      nome: 'Bloco B (Acadêmico)',
      ambientes: [
        { id: 201, nome: 'Laboratório de Informática 01' },
        { id: 202, nome: 'Laboratório de Química' },
        { id: 203, nome: 'Sala de Aula 05' },
      ],
    },
    {
      id: 3,
      icone: 'restaurant',
      nome: 'Refeitório & Vivência',
      ambientes: [], // Exemplo de local sem ambientes ainda
    },
  ]);

  // --- Dados Mocados para Controle de Acessos ---
  termoBusca = signal('');
  usuarios = signal([
    { id: 'u1', nome: 'João Silva', email: 'joao.tecnico@ifce.edu.br', role: 'servidor' },
    { id: 'u2', nome: 'Maria Souza', email: 'maria.admin@ifce.edu.br', role: 'admin' },
    { id: 'u3', nome: 'Carlos Aluno', email: 'carlos@aluno.ifce.edu.br', role: 'publico' },
  ]);

  // Filtro simples para a barra de busca
  get usuariosFiltrados() {
    const termo = this.termoBusca().toLowerCase();
    return this.usuarios().filter(
      (u) => u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo),
    );
  }

  alterarRole(usuarioId: string, novaRole: string) {
    console.log(`Role do usuário ${usuarioId} alterada para: ${novaRole}`);
    // Futuro: Lógica de updateDoc no Firestore aqui
  }

  // Ações de botões
  abrirModalNovo(tipo: string) {
    console.log(`Abrir modal para novo: ${tipo}`);
  }

  abrirModalNovoAmbiente(localId: number) {
    console.log(`Abrir modal para novo ambiente no local ID: ${localId}`);
  }

  editarLocal(localId: number, event: Event) {
    event.stopPropagation(); // Evita que o painel abra/feche ao clicar no botão de editar
    console.log(`Editar local ID: ${localId}`);
  }

  excluirLocal(localId: number, event: Event) {
    event.stopPropagation();
    console.log(`Excluir local ID: ${localId}`);
  }
}
