import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth'; // Ajuste o caminho do seu AuthService
import { map, take, filter } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Usamos o usuarioPerfil$ que criamos juntos
  return authService.usuarioPerfil$.pipe(
    // take(1) garante que o guard feche o fluxo após a primeira resposta válida
    take(1),
    map((perfil) => {
      // Se existe o perfil e o e-mail é do IFCE, libera o acesso
      if (perfil && perfil.email.endsWith('ifce.edu.br')) {
        return true;
      }

      // Caso contrário, barra e joga pro login
      return router.createUrlTree(['/login']);
    }),
  );
};
