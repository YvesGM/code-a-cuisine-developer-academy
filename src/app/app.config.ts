import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';

/** Configures application-wide Angular providers. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideRouter(routes, withViewTransitions()),
  ],
};
