import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FlowState } from '../core/flow-state';
@Component({
  selector: 'app-generating',
  imports: [RouterLink],
  template: `
    <h1>Rezeptgenerierung</h1>
    @if (state.status() === 'generating') {
      <p role="status" aria-live="polite">Generating...</p>
    }
    @if (state.error()) {
      <p role="alert">{{ state.error() }}</p>
      <button type="button" (click)="retry()">Retry</button>
    }
    <a routerLink="/preferences">Zurück zu Preferences</a>
  `,
})
export class GeneratingPage {
  readonly state = inject(FlowState);
  private readonly router = inject(Router);
  /** Ersetzt die Loading-Route nach erfolgreicher Generierung und Repository-Speicherung. */
  constructor() {
    effect(() => {
      if (this.state.status() === 'success')
        void this.router.navigateByUrl('/results', { replaceUrl: true });
    });
  }
  /** Startet nach einem kontrollierten Fehler einen neuen Request über denselben Owner. */
  retry(): void {
    void this.state.generate();
  }
}
