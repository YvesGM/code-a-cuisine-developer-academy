import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  template: `<h1>Code-a-Cuisine</h1>
    <p>Verwerte vorhandene Lebensmittel und finde Rezeptideen aus deinen Zutaten.</p>
    <a routerLink="/generate">Get started</a>`,
})
export class LandingPage {}
