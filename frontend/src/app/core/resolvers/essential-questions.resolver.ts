import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { EssentialQuestionsResolved } from '../models/essential-questions.model';
import { EssentialQuestionsService } from '../services/essential-questions.service';

export const essentialQuestionsResolver: ResolveFn<EssentialQuestionsResolved> = () => {
  return inject(EssentialQuestionsService).loadResolvedCollection();
};
