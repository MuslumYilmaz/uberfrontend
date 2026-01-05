import { mergeApplicationConfig } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { appConfigServer } from './app/app.config.server';
import { AppComponent } from './app/app.component';

const config = mergeApplicationConfig(appConfig, appConfigServer);

export default () => bootstrapApplication(AppComponent, config);
