import { Component, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Chamado, StatusChamado, PrioridadeChamado } from '../../core/modals/chamado';

interface NotaInterna {
  id: string;
  autor: string;
  texto: string;
  criadoEm: string;
}

interface HistoricoAtividade {
  id: string;
  titulo: string;
  descricao: string;
  tempo: string;
  classe: string;
}

@Component({
  selector: 'app-editar-chamado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatSnackBarModule,
  ],
  templateUrl: './editar-chamado.html',
  styleUrl: './editar-chamado.scss',
})
export class EditarChamado implements OnInit {
  chamadoId!: string;
  chamadoForm!: FormGroup;
  isEditing = false;

  // Mock de dados internos que seriam carregados do seu Firebase Service
  chamadoAtual!: Chamado;
  notasInternas: NotaInterna[] = [
    {
      id: '1',
      autor: 'Técnico Carlos',
      texto:
        'Necessário verificar se o gás do ar-condicionado precisa de reposição ou se é um problema no capacitor.',
      criadoEm: '10:45',
    },
  ];

  historico: HistoricoAtividade[] = [
    {
      id: '1',
      titulo: 'Status alterado para Execução',
      descricao: 'Técnico Carlos iniciou a verificação do compressor.',
      tempo: 'Há 2 horas',
      classe: 'status-change',
    },
    {
      id: '2',
      titulo: 'Prioridade alterada para Alta',
      descricao: 'Ajustado por Admin devido a aula em laboratório.',
      tempo: 'Há 3 horas',
      classe: 'priority-change',
    },
    {
      id: '3',
      titulo: 'Chamado aberto',
      descricao: 'Solicitação via QR Code da Sala 102.',
      tempo: 'Hoje, 09:15',
      classe: 'creation',
    },
  ];

  statusOpcoes: StatusChamado[] = ['Aberto', 'Em Execução', 'Fechado'];
  prioridadeOpcoes: PrioridadeChamado[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private location: Location,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit() {
    this.chamadoId = this.route.snapshot.paramMap.get('id') || '';
    this.carregarChamado();
    this.inicializarFormulario();
  }

  carregarChamado() {
    // Aqui você chamaria seu ChamadosService usando o id
    // Mockando um retorno:
    this.chamadoAtual = {
      id: this.chamadoId,
      localCampus: 'Bloco A',
      ambienteLocal: 'Sala 102',
      tipoDemanda: 'Infraestrutura / Elétrica',
      descricao:
        'O ar-condicionado central da ambienteLocal 102 não está gelando corretamente. Começou a apresentar um ruído estranho e parou de resfriar por volta das 08:30. A ambienteLocal está sendo usada para aula prática e o calor está excessivo.',
      canalAbertura: 'qrcode',
      status: 'Em Execução',
      prioridade: 'Alta',
      criadoPor: 'ricardo.c@ifce.edu.br',
      criadoEm: '2026-05-29T09:15:00Z',
      atribuidoPara: 'Técnico Carlos',
      idGrupo: 'localCampus_a_ambienteLocal_102_infraestrutura',
    };
  }

  inicializarFormulario() {
    this.chamadoForm = this.fb.group({
      localCampus: [{ value: this.chamadoAtual.localCampus, disabled: true }, Validators.required],
      ambienteLocal: [
        { value: this.chamadoAtual.ambienteLocal, disabled: true },
        Validators.required,
      ],
      tipoDemanda: [{ value: this.chamadoAtual.tipoDemanda, disabled: true }, Validators.required],
      prioridade: [{ value: this.chamadoAtual.prioridade, disabled: true }, Validators.required],
      status: [{ value: this.chamadoAtual.status, disabled: true }, Validators.required],
      descricao: [{ value: this.chamadoAtual.descricao, disabled: true }, Validators.required],
      novaNota: [''], // Campo de anotação
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;

    if (this.isEditing) {
      // Habilita apenas os campos que o admin pode alterar na edição comum
      this.chamadoForm.get('status')?.enable();
      this.chamadoForm.get('prioridade')?.enable();
      this.chamadoForm.get('localCampus')?.enable();
      this.chamadoForm.get('ambienteLocal')?.enable();

      // Torna a nota obrigatória para justificar a edição
      this.chamadoForm.get('novaNota')?.setValidators([Validators.required]);
    } else {
      this.cancelarEdicao();
    }
    this.chamadoForm.get('novaNota')?.updateValueAndValidity();
  }

  cancelarEdicao() {
    this.isEditing = false;
    this.chamadoForm.reset({
      localCampus: this.chamadoAtual.localCampus,
      ambienteLocal: this.chamadoAtual.ambienteLocal,
      tipoDemanda: this.chamadoAtual.tipoDemanda,
      prioridade: this.chamadoAtual.prioridade,
      status: this.chamadoAtual.status,
      descricao: this.chamadoAtual.descricao,
      novaNota: '',
    });
    this.chamadoForm.disable();
    this.chamadoForm.get('novaNota')?.clearValidators();
    this.chamadoForm.get('novaNota')?.updateValueAndValidity();
  }

  fecharChamado() {
    // Força o status para Concluído e exige nota justificando
    this.chamadoForm.get('status')?.setValue('Concluído');
    this.chamadoForm.get('novaNota')?.setValidators([Validators.required]);
    this.chamadoForm.get('novaNota')?.updateValueAndValidity();

    if (this.chamadoForm.get('novaNota')?.invalid) {
      this.snackBar.open(
        'Adicione uma nota interna obrigatória para poder fechar o chamado.',
        'OK',
        { duration: 4000 },
      );
      return;
    }

    this.salvarAlteracoes('Chamado encerrado com sucesso!');
  }

  adicionarNotaAvulsa() {
    const notaTexto = this.chamadoForm.get('novaNota')?.value;
    if (!notaTexto || notaTexto.trim() === '') {
      this.snackBar.open('Escreva algo no campo de anotações primeiro.', 'OK', { duration: 3000 });
      return;
    }

    this.notasInternas.push({
      id: '1',
      autor: 'Admin Logado', // Substituir pelo auth real
      texto: notaTexto,
      criadoEm: 'Agora',
    });

    this.chamadoForm.get('novaNota')?.setValue('');
    this.snackBar.open('Nota interna adicionada!', 'OK', { duration: 2000 });
  }

  salvarAlteracoes(mensagemSucesso = 'Alterações salvas com sucesso!') {
    if (this.chamadoForm.invalid) {
      this.snackBar.open('Por favor, preencha todos os campos obrigatórios.', 'OK', {
        duration: 3000,
      });
      return;
    }

    // Aqui você extrai os dados e envia pro Firebase Update
    const dadosAtualizados = this.chamadoForm.getRawValue();
    console.log('Enviando dados ao Firebase:', dadosAtualizados);

    this.snackBar.open(mensagemSucesso, 'OK', { duration: 3000 });
    this.voltar();
  }

  voltar() {
    this.location.back();
  }
}
