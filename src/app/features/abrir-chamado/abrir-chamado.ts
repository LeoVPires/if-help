import { Component, Input, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

import { ChamadosService } from '../../core/services/chamados';
import { AuthService, UserPerfil } from '../../core/services/auth';
import { ConfigurarLocaisService } from '../../core/services/configurar-locais';

import { LocalCampus, TipoDemanda, Chamado } from '../../core/modals/chamado';

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
  @Input() role: 'admin' | 'aluno' | 'servidor' = 'aluno';

  private fb = inject(FormBuilder);
  private chamadosService = inject(ChamadosService);
  private authService = inject(AuthService);
  private configurarLocaisService = inject(ConfigurarLocaisService);

  private subscriptions = new Subscription();

  usuarioLogadoEmail = '';

  locais: LocalCampus[] = [];
  ambientes: string[] = [];
  tiposDemanda: TipoDemanda[] = [];
  responsaveis: UserPerfil[] = [];

  form = this.fb.nonNullable.group({
    lugar: ['', Validators.required],
    ambiente: ['', Validators.required],
    tipoProblema: ['', Validators.required],
    descricao: ['', [Validators.required, Validators.minLength(10)]],
    prioridade: ['media'],
    responsavelId: [''],
  });

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.usuarioPerfil$.subscribe((perfil: UserPerfil | null) => {
        if (!perfil) return;

        this.usuarioLogadoEmail = perfil.email;
        this.role = perfil.role;
      }),
    );

    this.subscriptions.add(
      this.configurarLocaisService.getLocaisComAmbientes().subscribe((locais) => {
        this.locais = locais;
      }),
    );

    this.subscriptions.add(
      this.configurarLocaisService.getTiposDemanda().subscribe((tipos) => {
        this.tiposDemanda = tipos;
      }),
    );

    this.subscriptions.add(
      this.form.controls.lugar.valueChanges.subscribe((nomeLocal) => {
        const localSelecionado = this.locais.find((local) => local.nome === nomeLocal);

        this.ambientes = localSelecionado?.ambientes?.map((amb) => amb.nome) ?? [];

        this.form.patchValue({
          ambiente: '',
        });
      }),
    );

    this.subscriptions.add(
      this.configurarLocaisService
        .buscarUsuariosPorRoles(['admin', 'servidor'])
        .subscribe((usuarios) => {
          this.responsaveis = usuarios;
        }),
    );
  }

  async salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formValues = this.form.getRawValue();

    const mapaPrioridades: Record<string, 'Baixa' | 'Média' | 'Alta' | 'Crítica'> = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta',
      critica: 'Crítica',
    };

    const stringTratada = (txt: string) =>
      txt
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '_');

    const idGrupoGerado =
      `${stringTratada(formValues.lugar)}_` +
      `${stringTratada(formValues.ambiente)}_` +
      `${stringTratada(formValues.tipoProblema)}`;

    const responsavelSelecionado = this.responsaveis.find(
      (usuario) => usuario.uid === formValues.responsavelId,
    );

    const novoChamado: Chamado = {
      localCampus: formValues.lugar,
      ambienteLocal: formValues.ambiente,
      tipoDemanda: formValues.tipoProblema,
      descricao: formValues.descricao,

      canalAbertura: 'formulario',
      status: 'Aberto',

      prioridade: mapaPrioridades[formValues.prioridade] ?? 'Média',

      criadoPor: this.usuarioLogadoEmail || 'usuario.desconhecido@ifce.edu.br',

      criadoEm: new Date().toISOString(),

      atribuidoPara: formValues.responsavelId || '',
      atribuidoParaNome: responsavelSelecionado?.nome || '',

      idGrupo: idGrupoGerado,
    };

    try {
      await this.chamadosService.addChamado(novoChamado);

      alert('Chamado registrado com sucesso!');

      this.form.reset({
        lugar: '',
        ambiente: '',
        tipoProblema: '',
        descricao: '',
        prioridade: 'media',
        responsavelId: '',
      });

      this.ambientes = [];
    } catch (error) {
      console.error('Erro ao salvar chamado:', error);
      alert('Erro ao registrar chamado.');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
