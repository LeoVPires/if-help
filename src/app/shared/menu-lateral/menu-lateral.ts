import { Component, inject, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth'; // Ajuste o caminho

interface MenuLateralItem {
  label: string;
  icon: string;
  route: string;
  roles: ('admin' | 'servidor' | 'aluno')[];
}

@Component({
  selector: 'app-menu-lateral',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatIconModule, MatButtonModule, AsyncPipe],
  templateUrl: './menu-lateral.html',
  styleUrl: './menu-lateral.scss',
})
export class MenuLateral {
  public authService = inject(AuthService);

  // Lista base de itens do menu usando a tipagem correta
  private menuItems = signal<MenuLateralItem[]>([
    {
      label: 'Chamados',
      icon: 'dashboard',
      route: '/dashboard',
      roles: ['admin', 'servidor', 'aluno'], // Todo mundo vê o seu próprio painel
    },
    {
      label: 'Abrir Chamado',
      icon: 'add_circle',
      route: '/chamado/novo',
      roles: ['admin', 'servidor', 'aluno'],
    },
    {
      label: 'Meus Chamados',
      icon: 'dashboard_2_edit',
      route: '/chamado/meus',
      roles: ['aluno', 'servidor'], // Apenas usuários públicos precisam dessa aba dedicada
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
      roles: ['admin', 'servidor', 'aluno'],
    },
  ]);

  // Função auxiliar para gerar a sigla do avatar (Ex: "João Silva" -> "JS")
  getAvatarInitials(nome: string): string {
    if (!nome) return 'IF';
    const partes = nome.trim().split(' ');
    if (partes.length > 1) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return partes[0][0].toUpperCase();
  }

  // Mapeamento visual estético para exibir as tags de roles de forma amigável
  getRoleLabel(role: 'admin' | 'servidor' | 'aluno'): string {
    const labels = {
      admin: 'Administrador',
      servidor: 'Técnico / Servidor',
      aluno: 'Aluno / Usuário',
    };
    return labels[role] || 'Usuário';
  }

  // Filtra os itens com base na role ativa do usuário logado
  filtrarItemsPorRole(role: 'admin' | 'servidor' | 'aluno') {
    return this.menuItems().filter((item) => item.roles.includes(role));
  }

  async efetuarLogout() {
    if (confirm('Deseja realmente sair do sistema?')) {
      await this.authService.logout();
    }
  }
}
