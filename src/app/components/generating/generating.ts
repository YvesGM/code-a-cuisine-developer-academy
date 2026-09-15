import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppStateService } from '../../services/app-state.service';
/** Zeigt den Generierungsstatus und leitet erfolgreiche Requests zu Results weiter. */
@Component({
  selector: 'app-generating',
  imports: [RouterLink],
  templateUrl: './generating.html',
  styleUrl: './generating.scss',
})
export class GeneratingComponent {
  readonly state = inject(AppStateService);
  private readonly router = inject(Router);
  /** Ersetzt die Loading-Route nach erfolgreicher Generierung und Service-Speicherung. */
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
