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
  @Input() role: 'admin' | 'aluno' = 'aluno';

  // role = this.authService.currentUser()?.role; quando ligar com o firebase..

  private menuItems = signal<MenuLateralItem[]>([
    {
      label: 'Dashboard Público',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['admin', 'aluno'],
    },
    {
      label: 'Abrir Chamado',
      icon: 'add_circle',
      route: '/chamados/novo',
      roles: ['admin', 'aluno'],
    },

    {
      label: 'Gerenciar Chamados',
      icon: 'engineering',
      route: '/admin/chamados',
      roles: ['admin'],
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

  items = computed(() => this.menuItems().filter((item) => item.roles.includes(this.role)));
}
