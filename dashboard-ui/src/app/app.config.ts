import { ApplicationConfig, importProvidersFrom } from '@angular/core'
import { provideRouter } from '@angular/router'

import { routes } from './app.routes'
import { provideClientHydration } from '@angular/platform-browser'
import { provideHttpClient } from '@angular/common/http'
import { SimpleNotificationsModule } from 'angular2-notifications'
import { provideAnimations } from '@angular/platform-browser/animations'

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(SimpleNotificationsModule.forRoot({
      position: ['bottom', 'left'],
      timeOut: 5000,
    }))
  ]
}
  