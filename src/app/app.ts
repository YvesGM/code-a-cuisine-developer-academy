import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { N8N_PUBLIC_CONFIG } from '../environments/runtime-config';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly mockMode = !N8N_PUBLIC_CONFIG.webhookBaseUrl;
}
