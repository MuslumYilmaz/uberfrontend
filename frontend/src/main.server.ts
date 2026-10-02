import { mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { appConfigServer } from './app/app.config.server';
import { AppComponent } from './app/app.component';

const config = mergeApplicationConfig(appConfig, appConfigServer);

export default (context: BootstrapContext) => bootstrapApplication(AppComponent, config, context);
