import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Performance & Web Vitals at Scale"
      [minutes]="12"
      [tags]="['performance','web vitals','scale']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Front-end interviews often test if you can reason about
        <strong>performance at scale</strong> — not just writing fast code,
        but ensuring the app <em>feels fast for millions of users</em>.
        Companies look for engineers who can connect 
        <strong>Web Vitals</strong> to real-world trade-offs.
      </p>

      <h2>Key Web Vitals</h2>
      <ul>
        <li><strong>LCP (Largest Contentful Paint):</strong> how fast main content shows up.</li>
        <li><strong>FID (First Input Delay):</strong> how quickly the UI responds to clicks/taps.</li>
        <li><strong>CLS (Cumulative Layout Shift):</strong> visual stability as content loads.</li>
        <li><strong>TTI (Time to Interactive):</strong> when the app feels usable.</li>
      </ul>
      <p>
        <em>Interview script:</em> “I’d anchor my reasoning around Web Vitals —
        LCP for load speed, FID for responsiveness, CLS for stability — and show
        which levers improve each.”
      </p>

      <h2>Load-time levers</h2>
      <table>
        <thead>
          <tr>
            <th style="text-align:left;">Lever</th>
            <th style="text-align:left;">What it improves</th>
            <th style="text-align:left;">Trade-off</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Code splitting</strong></td>
            <td>Smaller initial JS → better LCP</td>
            <td>More requests; risk of too many bundles</td>
          </tr>
          <tr>
            <td><strong>Lazy loading routes/components</strong></td>
            <td>Delays non-critical JS</td>
            <td>First navigation into route is slower</td>
          </tr>
          <tr>
            <td><strong>Image optimization</strong></td>
            <td>Improves LCP dramatically</td>
            <td>Extra infra (responsive sizes, CDN)</td>
          </tr>
          <tr>
            <td><strong>Critical CSS inlining</strong></td>
            <td>Faster first paint</td>
            <td>Build complexity; risk of duplication</td>
          </tr>
        </tbody>
      </table>

      <h2>Runtime optimizations</h2>
      <ul>
        <li><strong>Avoid re-renders:</strong> use memoization / signals / pure pipes.</li>
        <li><strong>Virtualize lists:</strong> only render what’s visible.</li>
        <li><strong>Debounce / throttle:</strong> keep the main thread responsive.</li>
        <li><strong>Web Workers:</strong> offload heavy computation off the UI thread.</li>
      </ul>
      <blockquote>
        Example: “In a dashboard with real-time charts, I’d throttle socket updates
        and push heavy math into a Web Worker so the UI thread stays free.”
      </blockquote>
      
      <h2>Rendering speed & responsiveness</h2>
      <p>
        Once the page is loaded, the next challenge is 
        <strong>keeping the app smooth and responsive</strong> as users interact with it.
      </p>
      <ul>
        <li><strong>Don’t block the main thread:</strong> push non-urgent work to idle time so clicks and typing stay snappy.</li>
        <li><strong>Load ahead of the user:</strong> preload the next route or image before they actually click, so it feels instant.</li>
        <li><strong>Show important stuff first:</strong> make sure above-the-fold content is usable quickly, even if other parts load later.</li>
        <li><strong>Keep animations smooth:</strong> aim for fluid motion (about 60 frames per second) so scrolling and transitions don’t feel choppy.</li>
      </ul>
      <p>
        <em>Interview script:</em>  
        “I’d make sure user interactions stay smooth by deferring background work, 
        preloading likely next steps, prioritizing visible content first, 
        and keeping animations fluid so nothing feels janky.”
      </p>


      <h2>Interview framing</h2>
      <p>
        Don’t just rattle off optimizations — 
        <strong>connect them to the user experience problem they solve</strong>.
      </p>
      <ul>
        <li><strong>Page feels slow to load?</strong> → Optimize images, inline above-the-fold CSS, split bundles.</li>
        <li><strong>Clicks feel laggy?</strong> → Cut down JS size, debounce expensive handlers, move work off the main thread.</li>
        <li><strong>Layout jumps around?</strong> → Reserve space for images/ads, load fonts predictably, avoid shifting elements.</li>
        <li><strong>Scrolling feels janky?</strong> → Virtualize long lists, throttle scroll handlers, keep frames under 16ms.</li>
      </ul>
      <p>
        <em>Interview script:</em> 
        “If users complain the page loads slowly, I’d look at images and CSS.  
        If clicks feel sluggish, I’d check JS size and handlers.  
        If layouts shift, I’d reserve dimensions up front.  
        I always tie the fix back to the symptom.”
      </p>

      <h2>Takeaway</h2>
      <p>
        Performance design is about <strong>connecting tactics to user experience</strong>.
        In interviews, the winning move is to <em>pick a metric, name a lever, 
        call out the trade-off</em>. That shows you can think like a senior 
        engineer scaling an app to millions of users.
      </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignPerformanceArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
