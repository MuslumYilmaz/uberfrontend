import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { SHOWCASE_STATS } from '../../generated/content-metadata';

type HubLink = {
  label: string;
  description: string;
  route: any[];
  queryParams?: Record<string, string | number | boolean>;
  path: string;
};

type HubStat = {
  value: string;
  label: string;
};

@Component({
  standalone: true,
  selector: 'app-machine-coding-hub',
  imports: [CommonModule, RouterModule],
  templateUrl: './machine-coding-hub.component.html',
  styleUrls: ['./machine-coding-hub.component.css'],
})
export class MachineCodingHubComponent implements OnInit {
  private readonly seo = inject(SeoService);

  readonly stats: HubStat[] = [
    { value: String(SHOWCASE_STATS.totalQuestions), label: 'practice questions' },
    { value: '3', label: 'guided plans' },
    { value: 'May 2026', label: 'updated' },
    { value: 'Live', label: 'editor + checks' },
  ];

  readonly practiceFormats = [
    {
      title: 'Widgets and product slices',
      detail: 'Autocomplete, tabs, counters, forms, transfer lists, tables, pagination, and interaction-heavy UI prompts.',
    },
    {
      title: 'Async and stateful UI',
      detail: 'Debounce, stale responses, loading/error/empty states, optimistic UI, cancellation, and data-flow boundaries.',
    },
    {
      title: 'Framework implementation rounds',
      detail: 'React, Angular, and Vue variants where interviewers score state ownership, rendering, forms, and component contracts.',
    },
    {
      title: 'Review signals',
      detail: 'Accessible states, testability, edge cases, performance tradeoffs, and the explanation you give after the code works.',
    },
  ];

  readonly focusLinks: HubLink[] = [
    {
      label: 'JavaScript utility rounds',
      description: 'Debounce, throttle, Promise utilities, deep clone, currying, and async reasoning.',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'js-fn', reset: 1 },
      path: '/coding',
    },
    {
      label: 'React machine coding',
      description: 'Timed React UI prompts for hooks, state, lists, forms, and component boundaries.',
      route: ['/react/interview-questions'],
      path: '/react/interview-questions',
    },
    {
      label: 'Angular machine coding',
      description: 'Component, forms, RxJS, service, and template-state prompts for Angular interviews.',
      route: ['/angular/interview-questions'],
      path: '/angular/interview-questions',
    },
    {
      label: 'Vue machine coding',
      description: 'Composition API, reactivity, forms, events, and component communication practice.',
      route: ['/vue/interview-questions'],
      path: '/vue/interview-questions',
    },
    {
      label: 'HTML/CSS UI coding',
      description: 'Layout, semantics, responsive UI, accessibility, and visual-state implementation prompts.',
      route: ['/coding'],
      queryParams: { view: 'formats', category: 'html-css', reset: 1 },
      path: '/coding',
    },
    {
      label: 'System design follow-up',
      description: 'Move from working UI into architecture, state, caching, performance, and tradeoffs.',
      route: ['/system-design'],
      path: '/system-design',
    },
    {
      label: '30-day guided plan',
      description: 'Use the full prep sequence when you need daily practice instead of random prompt browsing.',
      route: ['/tracks', 'foundations-30d', 'preview'],
      path: '/tracks/foundations-30d/preview',
    },
    {
      label: 'Company prep',
      description: 'Add company-specific round structure after your implementation baseline is stable.',
      route: ['/companies'],
      path: '/companies',
    },
  ];

  readonly sequence = [
    {
      step: '1',
      title: 'Pick the round format',
      detail: 'Start with UI coding if the interview asks for widgets, or JavaScript utilities if the round is function-first.',
    },
    {
      step: '2',
      title: 'Build the smallest correct UI',
      detail: 'Render the required states first, then add edge cases, keyboard behavior, and failure handling.',
    },
    {
      step: '3',
      title: 'Run checks and explain tradeoffs',
      detail: 'Use tests or preview behavior to verify the solution, then explain state ownership and performance decisions.',
    },
    {
      step: '4',
      title: 'Move into a guided plan',
      detail: 'When misses repeat, stop browsing and use the 7-day or 30-day plan to rebuild the weak area.',
    },
  ];

  ngOnInit(): void {
    const canonicalPath = '/machine-coding';
    const canonicalUrl = this.seo.buildCanonicalUrl(canonicalPath);
    this.seo.updateTags({
      title: 'Frontend Machine Coding Interview Questions',
      description:
        'Practice frontend machine coding and UI coding interview questions for widgets, async UI, React, Angular, Vue, HTML/CSS, tests, and guided study plans.',
      canonical: canonicalPath,
      jsonLd: [
        {
          '@type': 'CollectionPage',
          '@id': canonicalUrl,
          url: canonicalUrl,
          name: 'Frontend Machine Coding Interview Questions',
          description:
            'Frontend machine coding and UI coding interview hub with format-first practice links and guided plan entry points.',
          inLanguage: 'en',
          about: [
            { '@type': 'Thing', name: 'frontend machine coding questions' },
            { '@type': 'Thing', name: 'frontend UI coding interview questions' },
            { '@type': 'Thing', name: 'frontend coding interview practice' },
          ],
          mentions: this.focusLinks.map((link) => ({
            '@type': 'WebPage',
            name: link.label,
            url: this.seo.buildCanonicalUrl(link.path),
          })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'FrontendAtlas',
              item: this.seo.buildCanonicalUrl('/'),
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Frontend Machine Coding Interview Questions',
              item: canonicalUrl,
            },
          ],
        },
      ],
    });
  }
}
