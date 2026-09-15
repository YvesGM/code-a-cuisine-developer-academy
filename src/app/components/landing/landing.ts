import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
/** Zeigt die Landingpage und führt in den Rezept-Generierungsflow. */
@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
})
export class LandingComponent {}
