import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { GuideShellComponent } from '../../../shared/components/guide/guide-shell.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, GuideShellComponent],
  template: `
    <fa-guide-shell
      title="Front-End System Design: What It Really Tests"
      [minutes]="8"
      [tags]="['system design','overview']"
      [prev]="prev"
      [next]="next"
      [leftNav]="leftNav">

      <p>
        Front-end system design interviews aren’t about trick questions or drawing 
        boxes for the sake of it. They’re meant to see how you <strong>handle complexity, 
        make trade-offs, and think like a senior engineer</strong>. The good news: 
        once you know the signals interviewers care about, these interviews become 
        much less intimidating. 
      </p>

      <p>
        In this guide, we’ll unpack why companies use system design interviews, 
        what makes the front-end version unique, and how you can approach them 
        with clarity and confidence. Think of it less as “getting the right answer” 
        and more as <em>teaching the interviewer how you reason through a real problem</em>.
      </p>

      <h2>Why companies ask these questions</h2>
      <p>
        Front-end system design interviews exist because companies want to see 
        how you think beyond code snippets. They simulate the kind of decisions 
        senior engineers make every week. Here’s what’s being tested:
      </p>
      <ul>
        <li>
          <strong>Handling complexity:</strong> Can you take a vague problem—like 
          “design a dashboard with real-time updates”—and break it into logical 
          parts (layout, data fetching, live updates, error handling)?
        </li>
        <li>
          <strong>Making trade-offs:</strong> Do you understand the pros and cons 
          of different approaches? For example, choosing SSR for SEO and faster 
          first paint vs CSR for simpler deployment.
        </li>
        <li>
          <strong>User focus:</strong> Are you thinking about how the app feels for 
          real users? That means performance on slow devices, accessibility for 
          screen readers, or handling flaky networks gracefully.
        </li>
        <li>
          <strong>Communication:</strong> Can you explain your reasoning clearly, 
          so your teammates (or interviewers) know why you chose one path over another?
        </li>
      </ul>

      <h2>What makes front-end system design unique</h2>
      <p>
        Most system design guides focus on backend topics—databases, queues, load balancers. 
        But front-end design challenges are different: they’re about <em>scaling complexity 
        for users and developers</em>. In interviews, expect to dive into areas like:
      </p>
      <ul>
        <li>
          <strong>Rendering strategies:</strong> Should this be a 
          Single-Page App for snappy navigation, Server-Side Rendered for SEO, or 
          a hybrid (static pages with islands) for the best of both worlds?
        </li>
        <li>
          <strong>State management:</strong> When does local state in a component 
          suffice, and when do you need global state or even server-side caching? 
          Think of designing a chat app vs a static product page.
        </li>
        <li>
          <strong>Performance levers:</strong> How do you keep load times fast? 
          Code splitting, lazy loading routes, compressing images, or prefetching 
          critical data can all be on the table.
        </li>
        <li>
          <strong>Cross-cutting concerns:</strong> Accessibility, internationalization, 
          and offline-first support often make the difference between a good design 
          and a great one—especially at scale.
        </li>
      </ul>

      <h2>Signals interviewers look for</h2>
      <p>
        In a system design interview, the “right answer” matters less than the signals 
        you send about how you think. Here are the qualities interviewers watch for:
      </p>
      <ol>
        <li>
          <strong>Clarity of thought:</strong> Do you pause to confirm what problem 
          you’re solving before drawing boxes? For example, asking 
          “Do we need offline support?” shows you care about real-world context.
        </li>
        <li>
          <strong>Structure:</strong> Is your answer organized, or just a brain dump? 
          Walking through requirements → architecture → trade-offs tells them 
          you can guide a team through messy discussions.
        </li>
        <li>
          <strong>Depth in trade-offs:</strong> Can you explain <em>why</em> you’d pick 
          one option? Saying “SSR improves SEO but adds server complexity” is much 
          stronger than simply naming “SSR.”
        </li>
        <li>
          <strong>User awareness:</strong> Do you remember the people using the app? 
          Mentioning accessibility for screen readers, or performance on 3G networks, 
          signals that you’re user-first, not just code-first.
        </li>
        <li>
          <strong>Prioritization:</strong> Can you separate “must-haves” from “nice-to-haves”? 
          For example: “For v1 we’ll keep images static; at scale, we’d add a CDN.” 
          That shows you balance speed of delivery with long-term vision.
        </li>
      </ol>


      <h2>A lightweight structure to follow</h2>
      <p>
        When you’re under time pressure, it helps to have a simple roadmap in your head. 
        Here’s a five-step flow you can apply to almost any front-end system design question:
      </p>
      <ol>
        <li>
          <strong>Clarify:</strong> Start by making sure you know the problem. 
          Ask questions like “Who are the users? Do we need SEO? Should it work offline?” 
          This shows you care about context, not just code.
        </li>
        <li>
          <strong>Break down:</strong> Split the feature into logical parts. 
          For a news feed, that might be the composer, feed list, and notifications. 
          This makes a big problem feel manageable.
        </li>
        <li>
          <strong>Choose an architecture:</strong> Decide how it should render. 
          CSR for simplicity, SSR for SEO and first paint, or a hybrid model for scale. 
          Don’t just name one—explain why it fits the scenario.
        </li>
        <li>
          <strong>Address cross-cutting concerns:</strong> Call out performance, accessibility, 
          internationalization, and testing. These are the details senior engineers never forget.
        </li>
        <li>
          <strong>Summarize trade-offs:</strong> Wrap up with what you’d ship for v1 
          and what you’d improve later. Example: “We’ll start with CSR to move fast, 
          then add SSR if SEO becomes a priority.”
        </li>
      </ol>

      <h2>The mindset shift</h2>
      <p>
        System design interviews aren’t about memorizing buzzwords or 
        rattling off every pattern you know. They’re about showing how you 
        <strong>reason like a senior engineer</strong>—balancing user needs, 
        team constraints, and technical trade-offs.
      </p>
      <p>
        Think of it less as a test and more as a conversation. 
        Your goal is to <em>walk the interviewer through your thinking</em>: 
        what you’d clarify, how you’d structure the problem, and why you’d 
        make certain choices. Even if your design isn’t perfect, 
        this teaching mindset makes you stand out.
      </p>
      <p>
        The shift is simple: you’re not there to prove you know everything. 
        You’re there to prove you can guide a team through messy, real-world 
        decisions with clarity and empathy. That’s what companies are hiring for.
      </p>
    </fa-guide-shell>
  `,
})
export class SystemDesignIntroArticle {
  @Input() prev: any[] | null = null;
  @Input() next: any[] | null = null;
  @Input() leftNav: any;
}
