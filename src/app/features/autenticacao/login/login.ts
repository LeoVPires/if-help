import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  constructor() {}

  loginWithGoogle() {
    console.log('Iniciando fluxo Firebase com Google Auth...');
    // Aqui você chamará o seu AuthService
    // Lembre-se de validar o .endsWith('@ifce.edu.br') no retorno
  }
}
