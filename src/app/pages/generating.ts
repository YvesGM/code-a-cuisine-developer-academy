import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FlowState } from '../core/flow-state';
@Component({
  selector: 'app-generating',
  imports: [RouterLink],
  templateUrl: './generating.html',
  styleUrl: './generating.scss',
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
