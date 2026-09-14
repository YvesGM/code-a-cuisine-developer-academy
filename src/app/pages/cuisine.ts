import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CUISINE_LABELS, OPTIONS } from '../core/config';
import { CUISINE_BANNERS, CUISINE_MOBILE_BANNERS } from '../shared/cuisine-assets';
import { LibraryList } from '../shared/library-list';
@Component({
  selector: 'app-cuisine',
  imports: [RouterLink, LibraryList],
  templateUrl: './cuisine.html',
  styleUrl: './cuisine.scss',
})
export class CuisinePage {
  private readonly params = toSignal(inject(ActivatedRoute).paramMap);
  readonly labels = CUISINE_LABELS;
  readonly banners = CUISINE_BANNERS;
  readonly mobileBanners = CUISINE_MOBILE_BANNERS;
  readonly cuisine = computed(() =>
    OPTIONS.cuisines.find((cuisine) => cuisine === this.params()?.get('cuisine')),
  );
}
