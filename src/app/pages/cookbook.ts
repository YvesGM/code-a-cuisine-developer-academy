import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CUISINE_LABELS } from '../core/config';
import { Cuisine, Recipe } from '../core/models';
import { RECIPE_REPOSITORY } from '../core/recipe-repository';
import { CUISINE_ASSETS, CUISINE_COOKBOOK_ICONS } from '../shared/cuisine-assets';

const COOKBOOK_CUISINES: readonly Cuisine[] = [
  'italian',
  'german',
  'japanese',
  'gourmet',
  'indian',
  'fusion',
];

@Component({
  selector: 'app-cookbook',
  imports: [RouterLink],
  templateUrl: './cookbook.html',
  styleUrl: './cookbook.scss',
})
export class CookbookPage {
  readonly images = CUISINE_ASSETS;
  readonly cuisines = COOKBOOK_CUISINES;
  readonly labels = CUISINE_LABELS;
  readonly icons = CUISINE_COOKBOOK_ICONS;
  readonly mostLiked = signal<readonly Recipe[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly repository = inject(RECIPE_REPOSITORY);
  private dragStartX = 0;
  private dragStartScroll = 0;
  private dragging = false;
  private dragMoved = false;

  /** Lädt die sechs serverseitig über alle gespeicherten Rezepte ermittelten Favoriten. */
  private async loadMostLiked(): Promise<void> {
    try {
      const result = await this.repository.list({ page: 1 });
      this.mostLiked.set(result.topLiked ?? []);
    } catch {
      this.error.set('Most liked recipes could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Startet Desktop-Drag-Scrolling ohne die native Touch-Geste zu ersetzen. */
  startDrag(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    const track = event.currentTarget as HTMLElement;
    this.dragStartX = event.clientX;
    this.dragStartScroll = track.scrollLeft;
    this.dragging = true;
    this.dragMoved = false;
    track.setPointerCapture(event.pointerId);
  }

  /** Verschiebt den Most-Liked-Track proportional zur gedrückt gehaltenen Mausbewegung. */
  moveDrag(event: PointerEvent): void {
    if (!this.dragging) return;
    const track = event.currentTarget as HTMLElement;
    const distance = event.clientX - this.dragStartX;
    this.dragMoved ||= Math.abs(distance) > 4;
    track.scrollLeft = this.dragStartScroll - distance;
  }

  /** Beendet Desktop-Drag-Scrolling und gibt den Pointer wieder frei. */
  endDrag(event: PointerEvent): void {
    if (!this.dragging) return;
    const track = event.currentTarget as HTMLElement;
    this.dragging = false;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
  }

  /** Verhindert nur den Link-Klick, der unmittelbar aus einer Drag-Geste entsteht. */
  protectLikedClick(event: MouseEvent): void {
    if (!this.dragMoved) return;
    event.preventDefault();
    this.dragMoved = false;
  }

  /** Lädt die Most-Liked-Auswahl genau einmal beim Erzeugen der Cookbook-Seite. */
  constructor() {
    void this.loadMostLiked();
  }
}
