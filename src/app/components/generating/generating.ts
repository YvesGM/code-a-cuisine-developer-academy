import { Component, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AppStateService } from '../../services/app-state.service';
/** Displays the generation status and forwards successful requests to results. */
@Component({
  selector: 'app-generating',
  imports: [RouterLink],
  templateUrl: './generating.html',
  styleUrl: './generating.scss',
})
export class GeneratingComponent {
  readonly state = inject(AppStateService);
  private readonly router = inject(Router);
  /**
   * Replaces the loading route after successful generation and service persistence.
   */
  constructor() {
    effect(() => {
      if (this.state.status() === 'success')
        void this.router.navigateByUrl('/results', { replaceUrl: true });
    });
  }
  /**
   * Starts a new request through the same owner after a controlled error.
   *
   * @returns {void} No value is returned.
   */
  retry(): void {
    void this.state.generate();
  }
}
