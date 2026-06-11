import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuLateral } from '../../shared/menu-lateral/menu-lateral';

@Component({
  selector: 'app-privado',
  imports: [RouterOutlet, MenuLateral],
  templateUrl: './privado.html',
  styleUrl: './privado.scss',
})
export class Privado {}
