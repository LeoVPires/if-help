import { Routes } from '@angular/router';
import { Login } from './features/autenticacao/login/login';
import { Privado } from './layouts/privado/privado';
import { Publico } from './layouts/publico/publico';
import { AbrirChamado } from './features/abrir-chamado/abrir-chamado';
import { Dashboard } from './features/dashboard/dashboard';

export const routes: Routes = [
  {
    path: '',
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
    children: [
      {
        path: 'chamados/novo',
        component: AbrirChamado,
      },
      {
        path: 'dashboard',
        component: Dashboard,
      },
    ],
  },
];
