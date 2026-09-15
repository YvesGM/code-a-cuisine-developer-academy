import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CUISINE_LABELS, OPTIONS } from '../../config/app.constants';
import { CUISINE_BANNERS, CUISINE_MOBILE_BANNERS } from '../../shared/cuisine-assets';
import { LibraryListComponent } from '../../shared/library-list/library-list';
/** Zeigt die paginierte Rezeptliste einer ausgewählten Küche. */
@Component({
  selector: 'app-cuisine',
  imports: [RouterLink, LibraryListComponent],
  templateUrl: './cuisine.html',
  styleUrl: './cuisine.scss',
})
export class CuisineComponent {
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  readonly labels = CUISINE_LABELS;
  readonly banners = CUISINE_BANNERS;
  readonly mobileBanners = CUISINE_MOBILE_BANNERS;
  readonly cuisine = computed(() =>
    OPTIONS.cuisines.find((cuisine) => cuisine === this.params()?.get('cuisine')),
  );
}
