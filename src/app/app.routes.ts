import { Routes } from '@angular/router';
import { Login } from './features/autenticacao/login/login';
import { Privado } from './layouts/privado/privado';
import { Publico } from './layouts/publico/publico';

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
];
