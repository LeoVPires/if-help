import { Routes } from '@angular/router';
import { Login } from './features/autenticacao/login/login';
import { Privado } from './layouts/privado/privado';
import { Publico } from './layouts/publico/publico';
import { AbrirChamado } from './features/abrir-chamado/abrir-chamado';

export const routes: Routes = [
  {
    path: '',
    component: Privado,
    children: [
      {
        path: 'login',
        component: Login,
      },
    ],
  },
  {
    path: '',
    component: Publico,
    children: [{ path: 'chamados/novo', component: AbrirChamado }],
  },
];
