import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth'; // Ajuste seu caminho
import { map, take } from 'rxjs/operators';

export const homeGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.usuarioPerfil$.pipe(
    take(1), // CRUCIAL: Faz o guard receber o dado e fechar o fluxo na hora!
    map((perfil) => {
      // Se o cara tá logado e o e-mail é válido, joga direto pro Dashboard
      if (perfil && perfil.email.endsWith('ifce.edu.br')) {
        return router.createUrlTree(['/dashboard']);
      }

      // Se não tá logado, manda pra tela de login pública
      return router.createUrlTree(['/login']);
    }),
  );
};
