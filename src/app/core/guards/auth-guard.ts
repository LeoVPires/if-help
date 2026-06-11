import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, authState } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  // Verifica o estado atual de login do usuário no Firebase
  return authState(auth).pipe(
    take(1),
    map((user) => {
      if (user && user.email?.endsWith('ifce.edu.br')) {
        return true; // Acesso liberado
      }

      // Se não for e-mail do IFCE ou não estiver logado, redireciona
      router.navigate(['/login']);
      return false;
    }),
  );
};
