# Content Draft Workflow

`content-drafts/` is an authoring area for AI-assisted writing. Files in this directory are not imported at runtime and are not a source of truth for shipped content.

Shipped content stays in the existing production formats:

- Playbooks and guide articles stay in Angular component files under `frontend/src/app/features/guides/playbook/`.
- System design, trivia, incidents, and tradeoff battles stay in the current `cdn/` JSON structures.

Do not build a `.md -> JSON/TS` generator yet. Keep conversion manual until at least 10-20 pieces have been written and the structure has proven stable.

Run the draft linter before treating a piece as publish-ready:

```bash
cd frontend
npm run lint:content-drafts
```

## Directory Map

- `playbooks/`: guide and playbook drafts that will later be converted into Angular guide components.
- `system-design/`: front-end system design drafts that will later be converted into `cdn/questions/system-design/<slug>/...` JSON files plus `index.json`.
- `trivia/`: short explanatory drafts that will later be converted into the relevant `cdn/questions/<tech>/trivia.json` entries.
- `tradeoff-battles/`: interview tradeoff drafts that will later be converted into `cdn/tradeoff-battles/<slug>/scenario.json` plus `index.json`.
- `incidents/`: debugging incident drafts that will later be converted into `cdn/incidents/<slug>/scenario.json` plus `index.json`.

## Required Frontmatter

Every draft file must begin with YAML frontmatter containing these fields:

```yaml
---
title: ""
slug: ""
family: ""
tech: ""
audience: ""
intent: ""
target_words: 0
primary_keyword: ""
status: ""
notes_for_conversion:
  - ""
search_intent: ""
reader_promise: ""
unique_angle: ""
what_this_adds_beyond_basics: ""
competitor_query: ""
competitor_takeaways:
  - ""
competitor_gaps:
  - ""
sources:
  - "https://..."
last_fact_checked_at: ""
reviewed_by: ""
confidence: ""
---
```

Field intent:

- `title`: working title for the draft.
- `slug`: final or proposed slug.
- `family`: one of `playbook`, `system-design`, `trivia`, `tradeoff-battle`, `incident`.
- `tech`: framework or domain, such as `javascript`, `react`, `angular`, `vue`, or `frontend`.
- `audience`: who the piece is for.
- `intent`: what the piece should help the reader do.
- `target_words`: rough word-count target for the draft.
- `primary_keyword`: main SEO phrase or search intent.
- `status`: recommended flow is `brief`, `outline`, `drafting`, `editing`, `approved`, `converted`.
- `notes_for_conversion`: manual reminders for production conversion.
- `search_intent`: exact reader job or search intent the piece must answer.
- `reader_promise`: one sentence describing what the reader will be able to do after reading.
- `unique_angle`: what makes this piece different from generic coverage.
- `what_this_adds_beyond_basics`: what this piece adds that beginner-level articles usually miss.
- `competitor_query`: the manual SERP query used for competitor review.
- `competitor_takeaways`: what current competing pages do well.
- `competitor_gaps`: what current competing pages miss or flatten.
- `sources`: public URLs used for factual review.
- `last_fact_checked_at`: fact-check date in `YYYY-MM-DD`.
- `reviewed_by`: editor or reviewer responsible for the quality pass.
- `confidence`: one of `low`, `medium`, `high`.

## Writing Workflow

1. Copy the relevant family template into a new file inside the matching family folder.
2. Fill the frontmatter before asking AI to write anything.
3. Start with a short brief, not a full-article prompt.
4. Ask AI for outline only.
5. After the outline is approved, draft section by section.
6. Add the manual competitor brief before the editor pass.
7. Run an editor pass before conversion.
8. Fact-check non-trivial claims and fill `sources`, `last_fact_checked_at`, `reviewed_by`, and `confidence`.
9. Convert manually into the production JSON or Angular format.

Lint behavior:

- Template files are skipped.
- `brief` drafts only need the base authoring fields.
- `outline`, `drafting`, `editing`, `approved`, and `converted` drafts must include search-intent and originality metadata.
- `editing` drafts can surface warnings for thin sections, weak competitor notes, missing fact-review metadata, unresolved `VERIFY:` markers, or missing keyword coverage.
- `approved` and `converted` drafts fail if they are still thin, placeholder-heavy, missing competitor/fact-review metadata, or contain unresolved `VERIFY:` markers.

### Brief Template

Use a short prompt like this first:

```text
You are writing content for FrontendAtlas.

Audience: <who this is for>
Content type: <playbook | system design | trivia | tradeoff battle | incident>
Goal: <what the reader should be able to do after reading>
Tone: clear, direct, senior-but-teachable
Target words: <number>
Must include internal links: <list>
Avoid: generic filler, vague claims, empty adjectives, framework folklore
Search intent: <exact reader job/query>
Reader promise: <one sentence>
Unique angle: <what this piece adds that generic competitors miss>

Use the structure in the matching file below:

- `content-drafts/playbooks/playbook.md`
- `content-drafts/system-design/system-design.md`
- `content-drafts/trivia/trivia.md`
- `content-drafts/tradeoff-battles/tradeoff-battle.md`
- `content-drafts/incidents/incident.md`

Return only an outline with section bullets.
```

### Section Draft Prompt

After the outline is approved:

```text
Use the approved outline and write only these sections:
<section names>

Keep the tone concrete and interview-aware.
Do not write the full piece yet.
If you are unsure about a factual claim, prefix it with VERIFY:.
```

### Editor Pass Prompt

When the full draft exists:

```text
Act as a strict editor.

- Cut repetition.
- Remove generic sentences.
- Remove empty adjectives.
- Mark weak logic jumps.
- Leave VERIFY: on any factual claim that still needs confirmation.
- Keep the reader promise visible.
- Keep the unique angle from collapsing into generic coverage.

Return the revised draft in the same structure.
```

### Research And Fact-Check Prompt

Before treating a piece as `approved`, run a manual review like this:

```text
Review the draft like an editor who cares about factual accuracy and originality.

- Summarize what current competing pages do well.
- List what those pages still miss.
- Confirm whether this draft has a distinct angle.
- Mark any factual claims that still need verification with VERIFY:.
- Suggest 1-3 public sources that should stay in the draft metadata.

Return short bullets only.
```

## Manual Conversion Targets

- Playbooks: convert into the relevant Angular article component under `frontend/src/app/features/guides/playbook/`.
- System design: convert into `cdn/questions/system-design/<slug>/meta.json`, `requirements.json`, `architecture.json`, `interfaces.json`, `data.json`, `optimizations.json`, plus `cdn/questions/system-design/index.json`.
- Trivia: convert into the appropriate `cdn/questions/<tech>/trivia.json` entry and update any required registries or metadata files.
- Tradeoff battles: convert into `cdn/tradeoff-battles/<slug>/scenario.json` plus `cdn/tradeoff-battles/index.json`.
- Incidents: convert into `cdn/incidents/<slug>/scenario.json` plus `cdn/incidents/index.json`.

## Quality Rules

- Start from product or interview behavior, not framework slogans.
- Prefer sharp examples over abstract explanation.
- Keep scope narrow enough that one piece answers one real search intent.
- Use `VERIFY:` for claims that need fact-checking before ship.
- Do not approve a piece until the competitor brief and fact-check metadata are filled in.
- Do not import or render files from `content-drafts/` in the app.
