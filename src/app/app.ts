import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { N8N_PUBLIC_CONFIG } from '../environments/runtime-config';
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects.split('?')[0]),
      startWith(this.router.url),
    ),
  );
  readonly dark = computed(() => ['/', '/generating', '/results'].includes(this.url() ?? '/'));
  readonly landing = computed(() => (this.url() ?? '/') === '/');
  readonly mockMode = !N8N_PUBLIC_CONFIG.webhookBaseUrl;
}
