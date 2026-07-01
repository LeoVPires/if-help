import { Routes } from '@angular/router';
import { Login } from './features/autenticacao/login/login';
import { Privado } from './layouts/privado/privado';
import { Publico } from './layouts/publico/publico';
import { AbrirChamado } from './features/abrir-chamado/abrir-chamado';
import { Dashboard } from './features/dashboard/dashboard';
import { EditarChamado } from './features/editar-chamado/editar-chamado';
import { EditarAgrupamento } from './features/editar-agrupamento/editar-agrupamento';
import { MeusChamados } from './features/meus-chamados/meus-chamados';
import { homeGuard } from './core/guards/home-guard';
import { authGuard } from './core/guards/auth-guard';
import { AdminConfig } from './features/admin-config/admin-config';
import { Sobre } from './features/sobre/sobre';

export const routes: Routes = [
  // Rota raiz (redireciona usando o homeGuard)
  {
    path: '',
    canActivate: [homeGuard],
    pathMatch: 'full',
    component: Publico,
  },

  // Escopo Público (Sem Guards de bloqueio)
  {
    path: 'auth',
    component: Publico,
    children: [
      {
        path: 'login',
        component: Login,
      },
    ],
  },

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
        path: 'chamado/novo/qrcode/:local/:ambiente',
        component: AbrirChamado,
      },
      {
        path: 'chamado/editar/:id',
        component: EditarChamado,
      },
      {
        path: 'agrupamento/editar/:id',
        component: EditarAgrupamento,
      },
      {
        path: 'chamado/meus',
        component: MeusChamados,
      },
      {
        path: 'admin/configuracoes',
        component: AdminConfig,
      },
      {
        path: 'sobre',
        component: Sobre,
      },
    ],
  },

  // Rota de fallback (Se digitar qualquer coisa errada, joga pro login)
  { path: '**', redirectTo: 'auth/login' },
];
