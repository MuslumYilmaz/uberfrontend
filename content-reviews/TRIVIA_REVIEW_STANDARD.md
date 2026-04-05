# Trivia Competitor Review Standard

Use this standard when writing AI-drafted or editor-written trivia competitor reviews.

## Default posture

- Start from `tie`, not `ours`.
- Only use `ours` when the advantage is clear, material, and specific to the criterion being scored.
- Compare the shipped page as it exists today. Do not count future edits or ideas.
- If the comparison is close or uncertain, keep `tie`.

## Evidence rules

- Read the relevant explanation section on the competitor page, not just the title or intro.
- Keep competitor notes short and paraphrased. Do not paste long quotes.
- Use shipped-trivia snippets only when they actually prove the claimed advantage.
- Do not reuse one strong point as an automatic win across all three criteria.
- If we claim `2/3` or better against a competitor, add a short `winReason` that explains why the win is still fair.

## Verdict rules

- `realWorldUseCases`: reward pages that connect the concept to realistic debugging, production, UX, performance, or architecture situations.
- `actionableExamples`: reward pages that include concrete examples, worked scenarios, or immediately reusable patterns.
- `followUpConfusion`: reward pages that answer the likely next question, trap, or misunderstanding instead of stopping at the first definition.
- Do not turn one strong example into three automatic wins.

## Competitor selection

- Use the natural query for the shipped trivia, not an easier manipulated search phrase.
- FrontendAtlas pages never count as competitors.
- If GreatFrontEnd has directly relevant content for the same topic or interview intent, include one `greatfrontend.com` page in the three-competitor set.
- If GreatFrontEnd is not directly relevant, say so explicitly in `selection.greatFrontendReasonIfOmitted`.
- Use at least two competitor categories across the set:
  - `canonical_docs`
  - `interview_prep`
  - `tutorial_reference`
  - `community_qna`
- Favor stronger competitors over weaker filler pages.

## Next actions

- Every `tie` or `theirs` verdict must include a concrete `nextActions` item.
- Avoid vague actions like `improve intro`.
- Say exactly what is missing: a specific use case, example, trap, or follow-up clarification.

## Approval check

- No placeholder URLs
- No inflated wins
- No generic `theirEvidence`
- No `ours` verdict without shipped-text support
- No unexplained omission of relevant GreatFrontEnd pages
- No 3/3 sweep against MDN, GreatFrontEnd, or javascript.info unless the evidence is unusually strong
