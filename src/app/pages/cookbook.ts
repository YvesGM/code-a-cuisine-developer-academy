import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CUISINE_LABELS, OPTIONS } from '../core/config';
import { LibraryList } from '../shared/library-list';
import { CUISINE_ASSETS } from '../shared/cuisine-assets';
@Component({
  selector: 'app-cookbook',
  imports: [RouterLink, LibraryList],
  templateUrl: './cookbook.html',
  styleUrl: './cookbook.scss',
})
export class CookbookPage {
  readonly images = CUISINE_ASSETS;
  readonly cuisines = OPTIONS.cuisines;
  readonly labels = CUISINE_LABELS;
}
