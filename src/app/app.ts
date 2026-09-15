import { Component, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
/** Stellt den globalen App-Rahmen mit Navigation, Footer und Router-Outlet bereit. */
@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
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
  readonly footerVisible = computed(() => {
    const url = this.url() ?? '/';
    const hidden = ['/', '/generate', '/preferences', '/generating', '/results'].includes(url);
    return !hidden && !url.startsWith('/recipe/') && !url.startsWith('/cookbook');
  });
  readonly mockMode = false;
}
