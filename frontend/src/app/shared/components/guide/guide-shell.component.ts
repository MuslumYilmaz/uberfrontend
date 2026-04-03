import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { AnalyticsService } from '../../../core/services/analytics.service';

type TocItem = { id: string; text: string; level: 2 | 3 };
type LeftNav = {
  title?: string;
  sections: Array<{
    title: string;
    items: Array<{ title: string; link: any[]; active?: boolean }>;
  }>;
};
type RelatedGuideLink = { title: string; link: any[] };
type GuidePathMeta = { section: string; slug: string };
const FALLBACK_READER_PROMISE = 'This guide is part of the FrontendAtlas frontend interview preparation roadmap, focused on interview questions, practical trade-offs, and high-signal decision patterns.';
const GUIDE_SCROLL_THRESHOLDS = [25, 50, 75, 100];

@Component({
  selector: 'fa-guide-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  encapsulation: ViewEncapsulation.None,
  styles: [`
:host { display:block; color: var(--uf-text-primary); background: var(--uf-bg); }

/* layout */
.wrap{
  --left-nav-w: 320px;
  --right-toc-w: 320px;
  display:grid;
  grid-template-columns: minmax(0,1fr) var(--right-toc-w);
  gap:28px;
  align-items:start;
  padding:16px clamp(18px, 3vw, 28px) 44px;
  min-width:0;
  max-width:100%;
}
.wrap.has-left{
  grid-template-columns: var(--left-nav-w) minmax(0,1fr) var(--right-toc-w);
}
.wrap > *{
  min-width:0;
}

@media (max-width:1500px){
  .wrap.has-left{
    grid-template-columns: var(--left-nav-w) minmax(0,1fr);
  }
  .wrap.has-left .toc{ display:none; }
}

@media (max-width:1100px){
  .wrap{ grid-template-columns:1fr; }
  .wrap.has-left{ grid-template-columns:1fr; }
  .left, .toc { display:none; }
}

.wrap > .main{
  min-width:0;
  width:100%;
  max-width:920px;
  margin-inline:auto;
}

/* mobile/tablet: collapsible menu + toc */
.mobile-panels{
  display:none;
  grid-template-columns: 1fr;
  gap: 12px;
  margin: 6px 0 16px;
}
@media (max-width:1100px){
  .mobile-panels{ display:grid; }
}
.mp{
  border:1px solid var(--uf-border-subtle);
  border-radius:16px;
  background:linear-gradient(180deg, color-mix(in srgb, var(--uf-surface-alt) 94%, var(--uf-surface)), color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt)));
  box-shadow:var(--uf-card-shadow);
  overflow:hidden;
}
.mp summary{
  list-style:none;
  cursor:pointer;
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  padding:12px 14px;
  color:var(--uf-text-primary);
  font-weight:800;
}
.mp summary::-webkit-details-marker{ display:none; }
.mp .chev{ opacity:.85; transition: transform .14s ease; }
.mp[open] .chev{ transform: rotate(180deg); }
.mp-body{
  border-top:1px solid var(--uf-border-subtle);
  padding:10px 12px;
  max-height: 52vh;
  overflow:auto;
  min-width:0;
}
.mp .sec{ margin:10px 0 6px; padding:0 6px; font-size:12px; opacity:.7; }
.mp a{
  display:flex; align-items:center; gap:8px;
  padding:10px 12px; margin:6px 4px;
  border-radius:12px;
  text-decoration:none; color:inherit; opacity:.9;
  border:1px solid transparent;
  font-size:13px;
}
.mp a:hover{ opacity:1; background:color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); }
.mp a.active{ opacity:1; background:color-mix(in srgb, var(--uf-accent) 18%, var(--uf-surface)); border-color:color-mix(in srgb, var(--uf-accent) 40%, var(--uf-border-subtle)); }
.mp a.l3{ margin-left:14px; }
.mp .dot{ width:6px; height:6px; border-radius:999px; background:color-mix(in srgb, var(--uf-text-primary) 40%, transparent); }

@media (max-width:720px){
  .wrap{ padding:14px 18px 36px; }
  .wrap .title{ font-size:24px; }
  .wrap .content{ font-size:var(--uf-body-size); line-height:var(--uf-body-line); }
}

@media (max-width:520px){
  .wrap .footer-nav{ flex-direction:column; gap:10px; }
  .wrap .footer-nav span{ display:none; }
  .wrap .nav-btn{ width:100%; text-align:center; }
}

/* headings + meta — SIZE-ALIGNED with System Design */
.title{ font-size:28px; font-weight:800; letter-spacing:.2px; margin:6px 0 6px; color: var(--uf-text-primary); }
.subtitle{ color: color-mix(in srgb, var(--uf-text-secondary) 85%, transparent); margin-bottom:14px; font-size:14px; }
.meta{ display:flex; gap:8px; font-size:12px; color: color-mix(in srgb, var(--uf-text-tertiary) 80%, transparent); margin-bottom:18px; align-items:center; flex-wrap:wrap; }
.badge{ border:1px solid var(--uf-border-subtle); padding:2px 10px; border-radius:999px; font-size:11.5px; background: color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); color: var(--uf-text-secondary); }
.intent-lead{
  margin: 0 0 14px;
  padding-left: 10px;
  border-left: 2px solid color-mix(in srgb, var(--uf-accent) 36%, var(--uf-border-subtle));
  color: color-mix(in srgb, var(--uf-text-secondary) 84%, transparent);
  font-size: 13px;
  line-height: 1.55;
}

/* article body readability */
.content{
  min-width:0;
  max-width:100%;
  line-height:var(--uf-body-line);
  font-size:var(--uf-body-size);
  letter-spacing:.01em;
  color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
  overflow-wrap:anywhere;
  word-break:break-word;
}
.content > *{
  min-width:0;
  max-width: 76ch;
}
.content .code-wrap,
.content .table-scroll,
.content app-faq-section{
  width:100%;
  max-width: none;
}
.content>p:first-of-type{ font-size:var(--uf-body-size); color: color-mix(in srgb, var(--uf-text-secondary) 94%, transparent); }
.content p,
.content ul,
.content ol,
.content li,
.content blockquote,
.content h2,
.content h3,
.content h4,
.content td,
.content th{
  overflow-wrap:anywhere;
  word-break:break-word;
}
.content h2{
  font-size:var(--uf-section-title-size); font-weight:700;
  margin:34px 0 14px; padding:10px 12px;
  border:1px solid var(--uf-border-subtle);
  border-left:3px solid color-mix(in srgb, var(--uf-accent) 42%, var(--uf-border-subtle));
  border-radius:12px;
  background: color-mix(in srgb, var(--uf-surface-alt) 90%, var(--uf-surface));
  scroll-margin-top: calc(var(--app-safe-top, 64px) + 12px);
  color: var(--uf-text-primary);
}
.content h3{
  font-size:var(--uf-subsection-title-size); font-weight:700;
  margin:22px 0 9px;
  scroll-margin-top: calc(var(--app-safe-top, 64px) + 12px);
  color: color-mix(in srgb, var(--uf-text-secondary) 96%, transparent);
}
.content p, .content ul, .content ol{ margin:12px 0; }
.content ul, .content ol{ padding-left:1.3rem; }
.content li{ margin:8px 0; line-height:var(--uf-body-line); }
.content li::marker{ color:color-mix(in srgb, var(--uf-text-tertiary) 70%, transparent); }
.content strong{ font-weight:800; }
.content hr{
  border:0;
  border-top:1px solid var(--uf-border-subtle);
  margin:18px 0;
}
.content a{
  color: var(--uf-accent);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--uf-accent) 52%, transparent);
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
  transition: color .15s ease, text-decoration-color .15s ease;
  overflow-wrap:anywhere;
  word-break:break-word;
}
.content a:hover{
  color: var(--uf-accent-strong);
  text-decoration-color: color-mix(in srgb, var(--uf-accent) 88%, transparent);
}
.content a:focus-visible{
  outline: none;
  border-radius: 4px;
  box-shadow: var(--uf-focus-ring);
}
.content code{
  font-family:ui-monospace, SFMono-Regular, Menlo, monospace;
  background:color-mix(in srgb, var(--uf-text-primary) 8%, var(--uf-surface));
  border:1px solid var(--uf-border-subtle);
  padding:.5px 6px; border-radius:6px;
  color: var(--uf-text-primary);
}
.related{
  margin-top: 26px;
  padding: 18px;
  border: 1px solid var(--uf-border-subtle);
  border-radius: 18px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--uf-surface-alt) 90%, var(--uf-surface)), color-mix(in srgb, var(--uf-surface) 94%, var(--uf-surface-alt)));
  box-shadow: var(--uf-card-shadow);
}
.related > *{
  max-width: none;
}
.related h2{
  margin: 0 0 8px;
  padding: 0;
  border: 0;
  background: transparent;
}
.related p{
  margin: 0 0 14px;
}
.related-grid{
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.related-card{
  display: block;
  padding: 14px 15px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--uf-accent) 20%, var(--uf-border-subtle));
  background: color-mix(in srgb, var(--uf-surface) 82%, var(--uf-surface-alt));
  text-decoration: none;
}
.related-card:hover{
  border-color: color-mix(in srgb, var(--uf-accent) 44%, var(--uf-border-subtle));
  background: color-mix(in srgb, var(--uf-surface) 70%, var(--uf-surface-alt));
}
.related-label{
  display: inline-block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .04em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--uf-text-tertiary) 86%, transparent);
}
.related-card strong{
  display: block;
  color: var(--uf-text-primary);
  line-height: 1.45;
}
.content p code,
.content li code,
.content td code,
.content th code,
.content h2 code,
.content h3 code,
.content a code{
  white-space: break-spaces;
  overflow-wrap:anywhere;
  word-break:break-word;
}
.content img,
.content svg,
.content canvas,
.content video,
.content picture{
  display:block;
  max-width:100%;
  height:auto;
}
.content iframe{
  display:block;
  width:100%;
  max-width:100%;
}
.content app-faq-section{
  display:block;
  margin: 8px 0 14px;
}
.content .jp-layout{
  display:grid;
  grid-template-columns:minmax(0, 1fr);
  gap:18px;
  min-width:0;
}
.content .jp-layout > *{
  min-width:0;
}
.content .jp-section{
  border:1px solid var(--uf-border-subtle);
  border-radius:14px;
  padding:14px 16px 16px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--uf-surface-alt) 91%, var(--uf-surface)), color-mix(in srgb, var(--uf-surface) 88%, var(--uf-surface-alt)));
  box-shadow: var(--uf-card-shadow);
}
.content .jp-section > h2{
  margin-top:0;
}
.content .jp-section > h2::before{
  content:'';
  display:inline-block;
  width:8px;
  height:8px;
  border-radius:999px;
  margin-right:8px;
  background: color-mix(in srgb, var(--uf-accent) 72%, #fff 10%);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--uf-accent) 22%, transparent);
  vertical-align:middle;
}
.content .jp-section--2 > h3,
.content .jp-section--4 > h3,
.content .jp-section--5 > h3{
  margin: 18px 0 10px;
  padding: 9px 12px;
  border:1px solid var(--uf-border-subtle);
  border-left:3px solid color-mix(in srgb, var(--uf-accent) 36%, var(--uf-border-subtle));
  border-radius:10px;
  background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
}
.content .jp-section--2 > p > strong:first-child,
.content .jp-section--4 > p > strong:first-child,
.content .jp-section--5 > p > strong:first-child,
.content .jp-section--3 .cluster-col p > strong:first-child{
  display:inline-flex;
  align-items:center;
  gap:6px;
  font-size:12px;
  font-weight:800;
  letter-spacing:.02em;
  border:1px solid var(--uf-border-subtle);
  border-radius:999px;
  padding:3px 10px;
  color: color-mix(in srgb, var(--uf-text-secondary) 94%, transparent);
  background: color-mix(in srgb, var(--uf-text-primary) 5%, var(--uf-surface));
}
.content .jp-section--6 > h3,
.content .jp-section--7 > h3{
  margin: 20px 0 10px;
  padding: 8px 12px 8px 26px;
  border-radius:10px;
  border:1px solid var(--uf-border-subtle);
  background: color-mix(in srgb, var(--uf-surface-alt) 92%, var(--uf-surface));
  position:relative;
}
.content .jp-section--6 > h3::before,
.content .jp-section--7 > h3::before{
  content:'';
  position:absolute;
  left:10px;
  top:50%;
  width:8px;
  height:8px;
  border-radius:999px;
  transform:translateY(-50%);
  background: color-mix(in srgb, var(--uf-accent) 74%, #fff 10%);
}
.content .jp-section--6 > ul,
.content .jp-section--7 > ul{
  border:1px solid var(--uf-border-subtle);
  border-radius:10px;
  background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
  padding:10px 14px 10px 26px;
}
.content .jp-section--7{
  border-color: color-mix(in srgb, var(--uf-accent) 24%, var(--uf-border-subtle));
  background: linear-gradient(180deg, color-mix(in srgb, var(--uf-accent) 7%, var(--uf-surface-alt)), color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt)));
}
.content .jp-section--8{
  border-color: color-mix(in srgb, var(--uf-accent) 22%, var(--uf-border-subtle));
}
.content .jp-section--8 app-faq-section{
  margin-top:4px;
}
.content .jp-section--8 .faq-card{
  padding: 8px;
  border-radius: 12px;
}
.content .jp-section--8 .faq-group-title{
  padding: 6px 8px;
  font-size: 11px;
  letter-spacing: .09em;
}
.content .jp-section--8 .faq-q{
  padding: 12px 10px;
}
.content .jp-section + .jp-section{
  margin-top: 2px;
}
.content .trivia-cluster{
  border:1px solid var(--uf-border-subtle);
  border-radius:12px;
  background: color-mix(in srgb, var(--uf-surface-alt) 88%, var(--uf-surface));
  margin: 10px 0 18px;
  overflow: hidden;
}
.content .trivia-cluster > summary{
  list-style:none;
  cursor:pointer;
  padding:10px 12px;
  font-size:13px;
  font-weight:700;
  color: var(--uf-text-primary);
  background: color-mix(in srgb, var(--uf-text-primary) 4%, var(--uf-surface));
  border-bottom:1px solid transparent;
}
.content .trivia-cluster > summary::before{
  content:'▸';
  display:inline-block;
  margin-right:8px;
  opacity:.82;
  transition: transform .16s ease;
}
.content .trivia-cluster[open] > summary::before{
  transform: rotate(90deg);
}
.content .trivia-cluster > summary::-webkit-details-marker{ display:none; }
.content .trivia-cluster[open] > summary{ border-bottom-color: var(--uf-border-subtle); }
.content .trivia-cluster .cluster-grid{
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 12px;
}
.content .trivia-cluster .cluster-col p{
  margin: 0 0 6px;
  font-size: 13px;
}
.content .trivia-cluster .cluster-col ul{
  margin: 0;
  padding-left: 1.1rem;
}
.content .trivia-cluster .cluster-col li{
  margin: 6px 0;
  font-size: 14px;
  line-height: 1.58;
}
@media (max-width: 980px){
  .content .jp-section{
    padding:12px;
  }
  .content .trivia-cluster .cluster-grid{ grid-template-columns: 1fr; }
}
@media (max-width: 1100px){
  .content .jp-layout{
    gap:14px;
  }
  .content .jp-section{
    border-radius:12px;
    padding:12px 12px 14px;
  }
  .content .jp-section > h2{
    margin:0 0 10px;
    padding:8px 10px;
    font-size:18px;
  }
  .content .jp-section--2 > h3,
  .content .jp-section--4 > h3,
  .content .jp-section--5 > h3{
    margin:16px 0 9px;
    padding:8px 10px;
    font-size:15px;
  }
  .content .jp-section--6 > h3,
  .content .jp-section--7 > h3{
    margin:16px 0 9px;
    padding:7px 10px 7px 24px;
  }
}
@media (max-width: 720px){
  .content{
    font-size:14px;
    line-height:1.66;
  }
  .content > *{
    max-width: 100%;
  }
  .content .jp-layout{
    gap:12px;
  }
  .content .jp-section{
    padding:10px 10px 12px;
    border-radius:10px;
  }
  .content .jp-section > h2{
    font-size:17px;
    padding:7px 9px;
  }
  .content .jp-section--6 > ul,
  .content .jp-section--7 > ul{
    padding:9px 10px 9px 24px;
  }
  .content .trivia-cluster > summary{
    padding:9px 10px;
    font-size:12.5px;
  }
  .content .trivia-cluster .cluster-grid{
    padding:10px;
    gap:10px;
  }
  .content .trivia-cluster .cluster-col li{
    font-size:13.5px;
  }
  .table-scroll table{
    min-width:max(100%, 560px);
  }
  .table-scroll th,
  .table-scroll td{
    min-width: 12rem;
    white-space: nowrap;
    overflow-wrap: normal;
    word-break: normal;
  }
  .table-scroll td > *,
  .table-scroll th > *{
    white-space: inherit;
    overflow-wrap: normal;
    word-break: normal;
  }
}

/* code blocks */
.code-wrap{
  position:relative; margin:14px 0;
  border:1px solid var(--uf-border-subtle);
  border-radius:var(--uf-card-radius);
  background:linear-gradient(180deg, color-mix(in srgb, var(--uf-surface-alt) 92%, var(--uf-surface)), color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt)));
  overflow:hidden;
  box-shadow: var(--uf-card-shadow);
  max-width:100%;
}
.code-wrap pre{
  margin:0; padding:14px;
  overflow:auto;
  font-family:ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size:13px; line-height:1.6;
  color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
}
.code-wrap pre code{
  white-space: inherit;
  overflow-wrap: normal;
  word-break: normal;
}
.code-copy{
  position:absolute; top:8px; right:8px; cursor:pointer;
  font-size:12px; opacity:.9;
  border:1px solid var(--uf-border-subtle);
  padding:2px 10px; border-radius:999px; background: color-mix(in srgb, var(--uf-text-primary) 8%, var(--uf-surface));
  color: var(--uf-text-primary);
}
.code-copy:hover{ opacity:1; background:color-mix(in srgb, var(--uf-text-primary) 12%, var(--uf-surface)); }
.code-lang{ display:none !important; }

/* tables */
.table-scroll{
  margin:14px 0; border:1px solid var(--uf-border-subtle);
  border-radius:12px; overflow:auto; background:var(--uf-surface);
  box-shadow:var(--uf-card-shadow);
  max-width:100%;
  -webkit-overflow-scrolling: touch;
}
.table-scroll table{ width:max-content; border-collapse:collapse; min-width:max(100%, 640px); table-layout:auto; }
.table-scroll th,.table-scroll td{
  border-bottom:1px solid var(--uf-border-subtle);
  padding:12px 14px;
  text-align:left;
  color: color-mix(in srgb, var(--uf-text-secondary) 90%, transparent);
  white-space:normal;
  overflow-wrap:break-word;
  word-break:normal;
}
.table-scroll td > *,
.table-scroll th > *{
  white-space:normal;
  overflow-wrap:break-word;
  word-break:normal;
}
.table-scroll thead th{ position:sticky; top:0; background:var(--uf-surface-alt); z-index:1; color: var(--uf-text-primary); }

/* rails (left / right) */
.left, .toc { min-height:1px; }

.left-fixed, .toc-fixed{
  position: fixed;
  top: calc(var(--app-safe-top, 64px) + 12px);
  z-index: 2;
  max-height: calc(100vh - var(--app-safe-top, 64px) - 16px);
  overflow:auto;
  background:linear-gradient(180deg, color-mix(in srgb, var(--uf-surface-alt) 94%, var(--uf-surface)), color-mix(in srgb, var(--uf-surface) 90%, var(--uf-surface-alt)));
  border:1px solid var(--uf-border-subtle);
  border-radius:16px;
  padding:12px;
  box-shadow:var(--uf-card-shadow-strong);
}
.left-fixed { width: var(--left-nav-w); }
.toc-fixed  { width: var(--right-toc-w); }

/* left nav — SIZE-ALIGNED (13px items) */
.left .title-sm{ font-size:12px; opacity:.82; margin:4px 8px 8px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; }
.left .sec{ margin:10px 0 6px; padding:0 8px; font-size:12px; opacity:.7; }
.left a.item{
  display:flex; align-items:center; gap:8px;
  padding:10px 12px; margin:6px 6px; border-radius:10px;
  text-decoration:none; color:inherit; opacity:.87;
  border:1px solid transparent;
  font-size:13px;
}
.left a.item:hover{ opacity:1; background:color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); }
.left a.item.active{ opacity:1; background:color-mix(in srgb, var(--uf-accent) 18%, var(--uf-surface)); border-color:color-mix(in srgb, var(--uf-accent) 40%, var(--uf-border-subtle)); }
.left .dot{ width:6px; height:6px; border-radius:999px; background:color-mix(in srgb, var(--uf-text-primary) 40%, transparent); }

/* right toc — SIZE-ALIGNED (13px links) */
.toc .head{ font-size:12px; opacity:.82; margin:4px 8px 8px; font-weight:700; }
.toc a{
  display:block; color:inherit; opacity:.85;
  padding:8px 12px; text-decoration:none; border-radius:12px;
  border:1px solid transparent;
  font-size:13px;
}
.toc a.l3{ margin-left:10px; }
.toc a:hover{ opacity:1; background:color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); }
.toc a.active{ opacity:1; background:color-mix(in srgb, var(--uf-accent) 18%, var(--uf-surface)); border-color:color-mix(in srgb, var(--uf-accent) 40%, var(--uf-border-subtle)); color: var(--uf-text-primary); }

/* footer nav */
.footer-nav{ display:flex; justify-content:space-between; gap:8px; margin-top:28px; }
.nav-btn{
  border:1px solid var(--uf-border-subtle);
  padding:10px 12px; border-radius:12px; font-size:14px;
  background:var(--uf-surface); color:var(--uf-text-primary); text-decoration:none;
  box-shadow: var(--uf-card-shadow);
}
.nav-btn:hover{ background:color-mix(in srgb, var(--uf-text-primary) 6%, var(--uf-surface)); }

`],
  template: `
  <div #shellRoot class="wrap" [class.has-left]="leftNav">
    <aside class="left" *ngIf="leftNav">
      <div #leftAnchor></div>
      <div #leftPanel class="left-fixed">
        <div class="title-sm">{{ leftNav.title || 'Current guide' }}</div>
        <ng-container *ngFor="let s of leftNav!.sections">
          <div class="sec">{{ s.title }}</div>
          <a *ngFor="let it of s.items"
             class="item"
             [class.active]="it.active"
             data-guide-link-zone="left_nav"
             [routerLink]="it.link">
            <span class="dot"></span>
            <span>{{ it.title }}</span>
          </a>
        </ng-container>
      </div>
    </aside>

    <div class="main">
      <h1 class="title">{{title}}</h1>
      <div class="subtitle" *ngIf="subtitle">{{subtitle}}</div>
      <div class="meta">
        <span *ngIf="minutes as m" class="badge">{{m}} min</span>
        <span *ngFor="let t of (tags||[])" class="badge">{{t}}</span>
      </div>
      <p class="intent-lead">{{ readerPromise || fallbackReaderPromise }}</p>

      <div class="mobile-panels" *ngIf="leftNav || toc().length">
        <details class="mp" *ngIf="leftNav">
          <summary>
            <span>Menu</span>
            <i class="fa-solid fa-chevron-down chev" aria-hidden="true"></i>
          </summary>
          <div class="mp-body">
            <ng-container *ngFor="let s of leftNav!.sections">
              <div class="sec">{{ s.title }}</div>
              <a *ngFor="let it of s.items"
                 [class.active]="it.active"
                 data-guide-link-zone="mobile_menu"
                 [routerLink]="it.link"
                 (click)="closeNearestDetails($event)">
                <span class="dot"></span>
                <span>{{ it.title }}</span>
              </a>
            </ng-container>
          </div>
        </details>

        <details class="mp" *ngIf="toc().length">
          <summary>
            <span>On this page</span>
            <i class="fa-solid fa-chevron-down chev" aria-hidden="true"></i>
          </summary>
          <div class="mp-body">
            <a *ngFor="let it of toc()"
               [href]="'#'+it.id"
               [class.active]="activeId()===it.id"
               [class.l2]="it.level===2" [class.l3]="it.level===3"
               (click)="smoothScroll($event, it.id); closeNearestDetails($event)">{{ it.text }}</a>
          </div>
        </details>
      </div>

      <div #content class="content"><ng-content></ng-content></div>

      <section class="related" *ngIf="relatedLinks().length">
        <h2>Continue Exploring</h2>
        <p>Use these related guides to deepen the same topic and build stronger internal navigation paths across the interview roadmap.</p>
        <div class="related-grid">
          <a *ngFor="let item of relatedLinks()" [routerLink]="item.link" class="related-card" data-guide-link-zone="related">
            <span class="related-label">Related guide</span>
            <strong>{{ item.title }}</strong>
          </a>
        </div>
      </section>

      <div class="footer-nav">
        <a *ngIf="prev" [routerLink]="prev" class="nav-btn" data-guide-link-zone="footer_nav">← Prev</a>
        <span></span>
        <a *ngIf="next" [routerLink]="next" class="nav-btn" data-guide-link-zone="footer_nav">Next →</a>
      </div>
    </div>

    <aside class="toc" *ngIf="toc().length">
      <div #rightAnchor></div>
      <div #rightPanel class="toc-fixed">
        <div class="head">On this page</div>
        <nav>
          <a *ngFor="let it of toc()"
             [href]="'#'+it.id"
             [class.active]="activeId()===it.id"
             [class.l2]="it.level===2" [class.l3]="it.level===3"
             (click)="smoothScroll($event, it.id)">{{ it.text }}</a>
        </nav>
      </div>
    </aside>
  </div>
  `
})
export class GuideShellComponent implements AfterViewInit, OnDestroy {
  @Input() title!: string;
  @Input() subtitle?: string;
  @Input() minutes?: number;
  @Input() tags?: string[];
  @Input() prev?: any[] | null;
  @Input() next?: any[] | null;
  @Input() leftNav?: LeftNav;
  @Input() readerPromise?: string;

  @ViewChild('shellRoot', { read: ElementRef }) shellRootRef!: ElementRef<HTMLElement>;
  @ViewChild('content', { read: ElementRef }) contentRef!: ElementRef<HTMLElement>;
  @ViewChild('leftAnchor', { read: ElementRef }) leftAnchor?: ElementRef<HTMLElement>;
  @ViewChild('rightAnchor', { read: ElementRef }) rightAnchor?: ElementRef<HTMLElement>;
  @ViewChild('leftPanel', { read: ElementRef }) leftPanel?: ElementRef<HTMLElement>;
  @ViewChild('rightPanel', { read: ElementRef }) rightPanel?: ElementRef<HTMLElement>;

  toc = signal<TocItem[]>([]);
  activeId = signal<string | null>(null);

  private headingEls: HTMLElement[] = [];
  /** Each range: [startY, endY, id] in document coords (scrollY space). */
  private ranges: Array<[number, number, string]> = [];

  private onResize = () => { };
  private onScroll = () => { };
  private mo?: MutationObserver;
  private imgListeners: Array<() => void> = [];
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly fallbackReaderPromise = FALLBACK_READER_PROMISE;
  private readonly analytics = inject(AnalyticsService, { optional: true });
  private guidePath: GuidePathMeta | null = null;
  private maxGuideDepthPercent = 0;
  private trackedGuideDepths = new Set<number>();
  private guideReadEngagedTracked = false;
  private visibleGuideMs = 0;
  private guideVisibleIntervalId: number | null = null;
  private shellClickCleanup: (() => void) | null = null;

  constructor(private r: Renderer2) { }

  ngAfterViewInit(): void {
    const el = this.contentRef.nativeElement;

    this.buildToc(el);
    this.enhanceCodeBlocks(el);
    this.enhanceTables(el);
    if (!this.isBrowser) return;

    this.guidePath = this.readGuidePathMeta();
    this.buildRanges();          // compute ranges once content is laid out
    this.positionFixedPanels();
    this.attachGuideLinkTracking();
    this.startGuideVisibilityTimer();

    // Keep ranges fresh
    this.onResize = () => {
      this.positionFixedPanels();
      this.buildRanges();
      this.handleViewportSignals();
    };
    this.onScroll = () => this.handleViewportSignals();

    window.addEventListener('resize', this.onResize, { passive: true });
    window.addEventListener('scroll', this.onScroll, { passive: true });

    // MutationObserver (DOM changes inside content)
    if (typeof MutationObserver !== 'undefined') {
      this.mo = new MutationObserver(() => {
        // schedule on next frame to allow layout to settle
        requestAnimationFrame(() => { this.buildRanges(); this.handleViewportSignals(); });
      });
      this.mo.observe(el, { childList: true, subtree: true, attributes: true });
    }

    // Recalc when images load
    for (const img of Array.from(el.querySelectorAll('img'))) {
      const handler = () => this.onResize();
      img.addEventListener('load', handler, { once: true });
      this.imgListeners.push(() => img.removeEventListener('load', handler));
    }

    this.handleViewportSignals(); // first paint
  }

  ngOnDestroy(): void {
    if (this.isBrowser) {
      window.removeEventListener('resize', this.onResize);
      window.removeEventListener('scroll', this.onScroll);
    }
    if (this.guideVisibleIntervalId !== null) {
      window.clearInterval(this.guideVisibleIntervalId);
      this.guideVisibleIntervalId = null;
    }
    this.shellClickCleanup?.();
    this.mo?.disconnect();
    this.imgListeners.forEach(off => off());
  }

  /* ---------- layout helpers ---------- */
  private positionFixedPanels() {
    if (!this.isBrowser) return;
    if (window.matchMedia('(max-width: 1100px)').matches) return;
    const setLeft = (anchor?: ElementRef<HTMLElement>, panel?: ElementRef<HTMLElement>) => {
      if (!anchor?.nativeElement || !panel?.nativeElement) return;
      const rect = anchor.nativeElement.getBoundingClientRect();
      panel.nativeElement.style.left = `${rect.left}px`;
    };
    setLeft(this.leftAnchor, this.leftPanel);
    setLeft(this.rightAnchor, this.rightPanel);
  }

  private headerOffset(): number {
    if (!this.isBrowser) return 76;
    return (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--app-safe-top')) || 64) + 12;
  }

  /* ---------- ToC & ranges ---------- */
  private buildToc(root: HTMLElement) {
    const heads = Array.from(root.querySelectorAll('h2, h3')) as HTMLHeadingElement[];
    const items: TocItem[] = [];
    for (const h of heads) {
      if (!h.id) h.id = this.slug(h.textContent || '');
      items.push({ id: h.id, text: h.textContent || '', level: h.tagName === 'H2' ? 2 : 3 });
    }
    this.toc.set(items);
    this.headingEls = heads;
  }

  private buildRanges() {
    if (!this.isBrowser) {
      this.ranges = [];
      return;
    }
    const off = this.headerOffset();
    const tops = this.headingEls.map(h => h.getBoundingClientRect().top + window.scrollY - off);
    this.ranges = tops.map((t, i) => [
      t,
      i < tops.length - 1 ? tops[i + 1] : Number.POSITIVE_INFINITY,
      this.headingEls[i].id
    ]);
  }

  private slug(s: string) {
    return s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60);
  }

  relatedLinks(): RelatedGuideLink[] {
    const navItems = this.flattenNavItems();
    const links: RelatedGuideLink[] = [];
    const seen = new Set<string>();

    const add = (item?: { title: string; link: any[]; active?: boolean } | null) => {
      if (!item || item.active || !Array.isArray(item.link)) return;
      const title = String(item.title || '').trim();
      if (!title) return;
      const key = JSON.stringify(item.link);
      if (seen.has(key)) return;
      seen.add(key);
      links.push({ title, link: item.link });
    };

    const activeIndex = navItems.findIndex((item) => item.active);
    if (activeIndex >= 0) {
      add(navItems[activeIndex - 1]);
      add(navItems[activeIndex + 1]);
    }

    add(navItems.find((item) => this.sameLink(item.link, this.prev)));
    add(navItems.find((item) => this.sameLink(item.link, this.next)));
    navItems.forEach(add);

    return links.slice(0, 4);
  }

  private flattenNavItems(): Array<{ title: string; link: any[]; active?: boolean }> {
    if (!this.leftNav?.sections?.length) return [];
    return this.leftNav.sections.flatMap((section) => section.items || []);
  }

  private sameLink(a: any[] | null | undefined, b: any[] | null | undefined): boolean {
    return JSON.stringify(a || null) === JSON.stringify(b || null);
  }

  closeNearestDetails(ev: Event) {
    const el = ev.currentTarget as HTMLElement | null;
    const details = el?.closest?.('details') as HTMLDetailsElement | null;
    if (details) details.open = false;
  }

  private handleViewportSignals() {
    this.recalcActiveFromScroll();
    this.updateGuideScrollDepth();
  }

  smoothScroll(ev: Event, id: string) {
    if (!this.isBrowser) return;
    ev.preventDefault();
    this.activeId.set(id); // immediate feedback
    const t = document.getElementById(id);
    if (!t) return;
    const y = t.getBoundingClientRect().top + window.scrollY - (this.headerOffset() - 2);
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  private readGuidePathMeta(): GuidePathMeta | null {
    if (!this.isBrowser) return null;
    const match = window.location.pathname.match(/^\/guides\/([^/]+)\/([^/?#]+)\/?$/);
    if (!match) return null;
    return { section: match[1], slug: match[2] };
  }

  private guideAnalyticsContext() {
    if (!this.isBrowser || !this.analytics || !this.guidePath) return null;
    return {
      guide_section: this.guidePath.section,
      guide_slug: this.guidePath.slug,
      guide_title: this.title,
    };
  }

  private startGuideVisibilityTimer() {
    if (!this.guideAnalyticsContext() || this.guideVisibleIntervalId !== null) return;
    this.guideVisibleIntervalId = window.setInterval(() => {
      if (document.hidden) return;
      this.visibleGuideMs += 1000;
      this.maybeTrackGuideReadEngaged();
    }, 1000);
  }

  private updateGuideScrollDepth() {
    const context = this.guideAnalyticsContext();
    if (!context) return;

    const depthPercent = this.computeGuideScrollDepth();
    if (depthPercent > this.maxGuideDepthPercent) {
      this.maxGuideDepthPercent = depthPercent;
      GUIDE_SCROLL_THRESHOLDS.forEach((threshold) => {
        if (depthPercent < threshold || this.trackedGuideDepths.has(threshold)) return;
        this.trackedGuideDepths.add(threshold);
        this.analytics?.track('guide_scroll_depth', {
          ...context,
          depth_percent: threshold,
        });
      });
    }

    this.maybeTrackGuideReadEngaged();
  }

  private computeGuideScrollDepth(): number {
    if (!this.isBrowser || !this.contentRef?.nativeElement) return 0;
    const contentEl = this.contentRef.nativeElement;
    const rect = contentEl.getBoundingClientRect();
    const contentHeight = Math.max(contentEl.scrollHeight, contentEl.offsetHeight, Math.round(rect.height), 1);
    const contentTop = window.scrollY + rect.top;
    const viewportBottom = window.scrollY + window.innerHeight;
    const reached = Math.min(contentHeight, Math.max(0, viewportBottom - contentTop));
    return Math.max(0, Math.min(100, Math.round((reached / contentHeight) * 100)));
  }

  private maybeTrackGuideReadEngaged() {
    if (this.guideReadEngagedTracked) return;
    const context = this.guideAnalyticsContext();
    if (!context) return;
    if (this.maxGuideDepthPercent < 50) return;
    if (this.visibleGuideMs < 45_000) return;

    this.guideReadEngagedTracked = true;
    this.analytics?.track('guide_read_engaged', {
      ...context,
      seconds_visible: Math.floor(this.visibleGuideMs / 1000),
      max_depth_percent: this.maxGuideDepthPercent,
    });
  }

  private attachGuideLinkTracking() {
    const context = this.guideAnalyticsContext();
    if (!context || !this.shellRootRef?.nativeElement) return;

    this.shellClickCleanup = this.r.listen(this.shellRootRef.nativeElement, 'click', (event: Event) => {
      const target = event.target as Element | null;
      const anchor = target?.closest?.('a') as HTMLAnchorElement | null;
      if (!anchor) return;

      const targetPath = this.normalizeTrackedInternalPath(anchor);
      if (!targetPath) return;

      const location = this.classifyGuideLinkLocation(anchor);
      if (!location) return;

      this.analytics?.track('guide_internal_link_clicked', {
        ...context,
        location,
        target_path: targetPath,
      });
    });
  }

  private normalizeTrackedInternalPath(anchor: HTMLAnchorElement): string | null {
    if (!this.isBrowser) return null;
    const rawHref = String(anchor.getAttribute('href') || anchor.href || '').trim();
    if (!rawHref || rawHref.startsWith('#')) return null;

    try {
      const url = new URL(rawHref, window.location.origin);
      if (url.origin !== window.location.origin) return null;
      const targetPath = `${url.pathname}${url.search}${url.hash}`;
      const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (url.pathname === window.location.pathname && url.hash) return null;
      if (targetPath === currentPath) return null;
      return targetPath;
    } catch {
      return null;
    }
  }

  private classifyGuideLinkLocation(anchor: HTMLAnchorElement): string | null {
    const explicitZone = anchor.getAttribute('data-guide-link-zone');
    if (explicitZone) return explicitZone;
    if (anchor.closest('.content')) return 'body';
    return null;
  }

  /** Range-based selection — no “near-bottom” hacks, so it won’t skip on direction changes. */
  private recalcActiveFromScroll() {
    if (!this.isBrowser) return;
    if (!this.ranges.length) return;

    const y = window.scrollY + 1; // tiny nudge to avoid boundary flicker

    // binary search by startY
    let lo = 0, hi = this.ranges.length - 1, idx = 0;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.ranges[mid][0] <= y) { idx = mid; lo = mid + 1; }
      else { hi = mid - 1; }
    }

    // ensure y < end; if we moved upward across a boundary,
    // idx computed above already points to the correct range.
    if (idx < this.ranges.length - 1 && y >= this.ranges[idx][1]) idx++;

    this.activeId.set(this.ranges[idx][2]);
  }

  /* ---------- content enhancers ---------- */
  private enhanceCodeBlocks(root: HTMLElement) {
    const blocks = Array.from(root.querySelectorAll('pre > code')) as HTMLElement[];
    for (const code of blocks) {
      const pre = code.parentElement as HTMLElement;
      if (!pre) continue;

      const wrap = this.r.createElement('div');
      this.r.addClass(wrap, 'code-wrap');
      pre.replaceWith(wrap);
      this.r.appendChild(wrap, pre);

      const btn = this.r.createElement('button');
      this.r.addClass(btn, 'code-copy');
      btn.textContent = 'Copy';
      this.r.listen(btn, 'click', () => {
        (async () => {
          try {
            await navigator.clipboard.writeText(code.innerText);
            const old = btn.textContent; btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = old, 950);
          } catch { }
        })();
      });
      this.r.appendChild(wrap, btn);
    }
  }

  private enhanceTables(root: HTMLElement) {
    const tables = Array.from(root.querySelectorAll('table')) as HTMLTableElement[];
    for (const t of tables) {
      if (t.parentElement?.classList.contains('table-scroll')) continue;
      const wrap = this.r.createElement('div');
      this.r.addClass(wrap, 'table-scroll');
      t.replaceWith(wrap);
      this.r.appendChild(wrap, t);
    }
  }
}
