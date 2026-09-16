import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CUISINE_LABELS } from '../../config/app.constants';
import { Cuisine, Recipe } from '../../models/app.models';
import { RecipeService } from '../../services/recipe.service';
import { CUISINE_ASSETS, CUISINE_COOKBOOK_ICONS } from '../../shared/cuisine-assets';

const COOKBOOK_CUISINES: readonly Cuisine[] = [
  'italian',
  'german',
  'japanese',
  'gourmet',
  'indian',
  'fusion',
];

/** Displays cookbook categories and the six most-liked recipes. */
@Component({
  selector: 'app-cookbook',
  imports: [RouterLink],
  templateUrl: './cookbook.html',
  styleUrl: './cookbook.scss',
})
export class CookbookComponent {
  readonly images = CUISINE_ASSETS;
  readonly cuisines = COOKBOOK_CUISINES;
  readonly labels = CUISINE_LABELS;
  readonly icons = CUISINE_COOKBOOK_ICONS;
  readonly mostLiked = signal<readonly Recipe[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  private readonly recipes = inject(RecipeService);
  private dragStartX = 0;
  private dragStartScroll = 0;
  private dragging = false;
  private dragMoved = false;

  /**
   * Loads the six most-liked recipes calculated server-side across all stored recipes.
   *
   * @returns {Promise<void>} A promise that resolves after the most-liked recipes finish loading.
   */
  private async loadMostLiked(): Promise<void> {
    try {
      const result = await this.recipes.list({ page: 1 });
      this.mostLiked.set(result.topLiked ?? []);
    } catch {
      this.error.set('Most liked recipes could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Starts desktop drag scrolling without replacing the native touch gesture.
   *
   * @param {PointerEvent} event - The browser event that triggered the action.
   * @returns {void} No value is returned.
   */
  startDrag(event: PointerEvent): void {
    if (event.pointerType !== 'mouse') return;
    const track = event.currentTarget as HTMLElement;
    this.dragStartX = event.clientX;
    this.dragStartScroll = track.scrollLeft;
    this.dragging = true;
    this.dragMoved = false;
    track.setPointerCapture(event.pointerId);
  }

  /**
   * Moves the most-liked track proportionally to the active pointer movement.
   *
   * @param {PointerEvent} event - The browser event that triggered the action.
   * @returns {void} No value is returned.
   */
  moveDrag(event: PointerEvent): void {
    if (!this.dragging) return;
    const track = event.currentTarget as HTMLElement;
    const distance = event.clientX - this.dragStartX;
    this.dragMoved ||= Math.abs(distance) > 4;
    track.scrollLeft = this.dragStartScroll - distance;
  }

  /**
   * Ends desktop drag scrolling and releases the pointer.
   *
   * @param {PointerEvent} event - The browser event that triggered the action.
   * @returns {void} No value is returned.
   */
  endDrag(event: PointerEvent): void {
    if (!this.dragging) return;
    const track = event.currentTarget as HTMLElement;
    this.dragging = false;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
  }

  /**
   * Prevents only the link click that directly follows a drag gesture.
   *
   * @param {MouseEvent} event - The browser event that triggered the action.
   * @returns {void} No value is returned.
   */
  protectLikedClick(event: MouseEvent): void {
    if (!this.dragMoved) return;
    event.preventDefault();
    this.dragMoved = false;
  }

  /**
   * Loads the most-liked selection exactly once when the cookbook page is created.
   */
  constructor() {
    void this.loadMostLiked();
  }
}
