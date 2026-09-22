import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { CompanyIndexResolved, CompanyPreviewResolved } from '../models/company-public.model';
import { CompanyPublicDataService } from '../services/company-public-data.service';

export const companyIndexResolver: ResolveFn<CompanyIndexResolved> = () =>
  inject(CompanyPublicDataService).loadIndex();

export const companyPreviewResolver: ResolveFn<CompanyPreviewResolved> = (route) =>
  inject(CompanyPublicDataService).loadPreview(route.paramMap.get('slug') || '');
