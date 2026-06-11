import { Component, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

// Importações dos nossos novos serviços e interfaces
import { ChamadosService } from '../../core/services/chamados';
import { AuthService } from '../../core/services/auth';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-abrir-chamado',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './abrir-chamado.html',
  styleUrl: './abrir-chamado.scss',
})
export class AbrirChamado implements OnInit, OnDestroy {
  @Input() role: 'admin' | 'aluno' = 'aluno';

  private fb = inject(FormBuilder);
  private chamadosService = inject(ChamadosService);
  private authService = inject(AuthService);

  private userSub!: Subscription;
  usuarioLogadoEmail = '';

  form = this.fb.nonNullable.group({
    lugar: ['', Validators.required],
    ambiente: ['', Validators.required],
    tipoProblema: ['', Validators.required],
    descricao: ['', [Validators.required, Validators.minLength(10)]],
    prioridade: ['media'],
    responsavelId: [''],
  });

  lugar = [
    'Bloco Adm',
    'Bloco 1',
    'Bloco 2',
    'Bloco 3',
    'Quadra',
    'Refeitório',
    'Cantina',
    'Estacionameto',
  ];
  problemas = [
    'Elétrica',
    'Hidráulica',
    'Limpeza',
    'TI',
    'Internet',
    'Ar Condicionado',
    'Estrutural',
    'Outros',
  ];
  servidores = ['João Silva', 'Maria Santos', 'Pedro Oliveira'];

  ngOnInit() {
    // Captura o email do aluno/servidor que está logado no momento
    this.userSub = this.authService.user$.subscribe((user) => {
      if (user?.email) {
        this.usuarioLogadoEmail = user.email;
      }
    });
  }

  async salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValues = this.form.getRawValue();

    // Mapeamento das prioridades do formulário para o padrão solicitado no JSON (Capitalizado)
    const mapaPrioridades: Record<string, 'Baixa' | 'Média' | 'Alta'> = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      critica: 'Alta', // Adaptado para caber na sua interface original
    };

    // Montando o idGrupo (ex: bloco_adm_sala_10_eletrica)
    const stringTratada = (txt: string) =>
      txt
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');
    const idGrupoGerado = `${stringTratada(formValues.lugar)}_${stringTratada(formValues.ambiente)}_${stringTratada(formValues.tipoProblema)}`;

    // Monta o objeto idêntico à estrutura exigida pelo seu Firebase
    const novoChamado = {
      bloco: formValues.lugar,
      sala: formValues.ambiente,
      categoria: formValues.tipoProblema,
      descricao: formValues.descricao,
      canalAbertura: 'formulario' as const,
      status: 'Aberto' as const,
      prioridade: mapaPrioridades[formValues.prioridade] || 'Média',
      criadoPor: this.usuarioLogadoEmail || 'usuario.desconhecido@ifce.edu.br',
      criadoEm: new Date().toISOString(),
      atribuidoPara: formValues.responsavelId || '',
      idGrupo: idGrupoGerado,
    };

    try {
      await this.chamadosService.addChamado(novoChamado);
      alert('Chamado registrado com sucesso no Firebase!');
      this.form.reset({
        prioridade: 'media',
        lugar: '',
        ambiente: '',
        tipoProblema: '',
        descricao: '',
        responsavelId: '',
      });
    } catch (error) {
      console.error('Erro ao salvar o chamado:', error);
      alert('Houve um erro técnico ao tentar salvar o chamado.');
    }
  }

  ngOnDestroy() {
    if (this.userSub) this.userSub.unsubscribe();
  }
}
