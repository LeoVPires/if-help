import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';

interface Integrante {
  nome: string;
  funcao: string;
}

@Component({
  selector: 'app-sobre',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatButtonModule,
  ],
  templateUrl: './sobre.html',
  styleUrls: ['./sobre.scss'],
})
export class Sobre {
  professor: string = 'Anderson de Castro Lima';
  disciplina: string = 'Gestão de Projetos';

  integrantes: Integrante[] = [
    { nome: 'Elias de Almeida Sombra Neto', funcao: 'Designer / Equipe Técnica' },
    { nome: 'Geovanna Correia Castro', funcao: 'Cinegrafista / Equipe de Campo' },
    { nome: 'Ismael Sidney de Souza Silva', funcao: 'Testador / Equipe Técnica' },
    { nome: 'João Felipe Galdino de Lima', funcao: 'Entrevistador / Equipe de Campo' },
    { nome: 'Leonardo Vasconcelos Pires', funcao: 'Desenvolvedor / Equipe Técnica' },
    { nome: 'Luiz Henrique Teixeira Viana', funcao: 'Apresentador / Equipe de Campo' },
  ];
}
