import { Routes } from '@angular/router';
import { Login } from './features/autenticacao/login/login';
import { Privado } from './layouts/privado/privado';
import { Publico } from './layouts/publico/publico';
import { AbrirChamado } from './features/abrir-chamado/abrir-chamado';
import { Dashboard } from './features/dashboard/dashboard';
import { EditarChamado } from './features/editar-chamado/editar-chamado';
import { MeusChamados } from './features/meus-chamados/meus-chamados';
import { homeGuard } from './core/guards/home-guard';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  // Rota raiz (redireciona usando o homeGuard)
  {
    path: '',
    canActivate: [homeGuard],
    pathMatch: 'full',
    component: Publico, // Garante um ponto de entrada seguro ou apenas um dummy
  },

  // Escopo Público (Sem Guards de bloqueio)
  {
    path: 'auth', // Mudar para 'auth/login' evita colisão de caminhos vazios
    component: Publico,
    children: [
      {
        path: 'login',
        component: Login,
      },
    ],
  },

  // Escopo Privado (100% Protegido pelo authGuard)
  {
    path: '',
    component: Privado,
    canActivate: [authGuard], // Use canActivate no pai em vez de canActivateChild
    children: [
      {
        path: 'dashboard',
        component: Dashboard,
      },
      {
        path: 'chamado/novo',
        component: AbrirChamado,
      },
      {
        path: 'chamado/editar',
        component: EditarChamado,
      },
      {
        path: 'chamado/meus',
        component: MeusChamados,
      },
    ],
  },

  // Rota de fallback (Se digitar qualquer coisa errada, joga pro login)
  { path: '**', redirectTo: 'auth/login' },
];
