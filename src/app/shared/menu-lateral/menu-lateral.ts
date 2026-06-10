import { Component, Input, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface MenuLateralItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule],
  templateUrl: './menu-lateral.html',
  styleUrl: './menu-lateral.scss',
})
export class MenuLateral {
  @Input() role: 'admin' | 'aluno' = 'admin';

  // role = this.authService.currentUser()?.role; quando ligar com o firebase..

  private menuItems = signal<MenuLateralItem[]>([
    {
      label: 'Chamados',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['admin', 'aluno'],
    },
    {
      label: 'Abrir Chamado',
      icon: 'add_circle',
      route: '/chamado/novo',
      roles: ['admin', 'aluno'],
    },

    {
      label: 'Gerenciar Chamados',
      icon: 'dashboard_2_gear',
      route: '/chamado/editar',
      roles: ['admin'],
    },
    {
      label: 'Meus Chamados',
      icon: 'dashboard_2_edit',
      route: '/chamado/meus',
      roles: ['admin', 'aluno'],
    },
    {
      label: 'Configurações',
      icon: 'group',
      route: '/admin/configuracoes',
      roles: ['admin'],
    },
    {
      label: 'Sobre o Sistema',
      icon: 'info',
      route: '/sobre',
      roles: ['admin', 'aluno'],
    },
  ]);

  get items() {
    return this.menuItems().filter((item) => item.roles.includes(this.role));
  }
}
