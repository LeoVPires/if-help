import { Component } from '@angular/core';
import { MenuLateral } from '../../shared/menu-lateral/menu-lateral';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-publico',
  imports: [RouterOutlet, MenuLateral],
  templateUrl: './publico.html',
  styleUrl: './publico.scss',
})
export class Publico {}
