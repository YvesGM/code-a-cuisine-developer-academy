import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
/** Displays the landing page and starts the recipe generation flow. */
@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent { }
