import { Injectable, inject } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user } from '@angular/fire/auth';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);

  // Observable que monitora o estado do usuário (logado ou deslogado)
  user$ = user(this.auth);

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    // Força o Google a sempre pedir para selecionar a conta
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      const resultado = await signInWithPopup(this.auth, provider);
      const email = resultado.user.email;

      // Validação crucial do domínio IFCE
      if (email && email.endsWith('ifce.edu.br')) {
        this.router.navigate(['/dashboard']); // ajuste para sua rota interna
      } else {
        // Se não for IFCE, desloga imediatamente e gera erro
        await this.logout();
        throw new Error('Acesso permitido apenas para e-mails ifce.edu.br');
      }
    } catch (error: any) {
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }
}
