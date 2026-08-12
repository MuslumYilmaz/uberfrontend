#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './content-paths.mjs';

const root = path.join(repoRoot, 'cdn', 'questions', 'system-design');
const sectionFiles = ['meta', 'requirements', 'architecture', 'data', 'interfaces', 'optimizations'];
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));
const practiceRegistry = JSON.parse(fs.readFileSync(path.join(repoRoot, 'cdn', 'practice', 'registry.json'), 'utf8'));

function read(id, section) {
  return JSON.parse(fs.readFileSync(path.join(root, id, `${section}.json`), 'utf8'));
}

function bundleText(id) {
  return sectionFiles.map((section) => JSON.stringify(read(id, section))).join('\n');
}

function wordCount(value) {
  const normalized = String(value || '')
    .replace(/[^\p{L}\p{N}\s'-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized ? normalized.split(/\s+/).length : 0;
}

function visibleBlockText(block) {
  const values = [];
  const add = (value) => typeof value === 'string' && values.push(value);
  if (block.type === 'text' || block.type === 'heading') add(block.text);
  if (block.type === 'code') add(block.code);
  if (block.type === 'image') {
    add(block.alt);
    add(block.caption);
    add(block.fallbackText);
  }
  if (block.type === 'checklist') {
    add(block.title);
    (block.items || []).forEach(add);
  }
  if (block.type === 'callout') {
    add(block.title);
    add(block.text);
  }
  if (block.type === 'links') {
    add(block.title);
    (block.items || []).forEach((item) => {
      add(item.label);
      add(item.description);
    });
  }
  if (block.type === 'table') {
    add(block.title);
    (block.columns || []).forEach(add);
    (block.rows || []).flat().forEach(add);
  }
  if (block.type === 'stats') {
    (block.items || []).forEach((item) => {
      add(item.label);
      add(item.value);
      add(item.helperText);
    });
  }
  if (block.type === 'steps') {
    add(block.title);
    (block.steps || []).forEach((step) => {
      add(step.title);
      add(step.text);
    });
  }
  if (block.type === 'columns') {
    (block.columns || []).flatMap((column) => column.blocks || []).forEach((child) => {
      values.push(...visibleBlockText(child));
    });
  }
  return values;
}

const pilotExpectations = {
  'notification-toast-system': { targetLevel: 'junior', timeboxMinutes: 10, guidedMock: true },
  'ai-chat-textarea-design': { targetLevel: 'mid', timeboxMinutes: 15, guidedMock: true },
  'ai-ux-considerations': { targetLevel: 'mid', timeboxMinutes: 15, guidedMock: false },
  'resilient-checkout-payment-flow': { targetLevel: 'mid', timeboxMinutes: 15, guidedMock: true },
};

for (const [id, expected] of Object.entries(pilotExpectations)) {
  const entry = index.find((item) => item.id === id);
  const meta = read(id, 'meta');
  assert.equal(entry.contentSchemaVersion, 2, `${id}: index must opt into V2`);
  assert.equal(meta.contentSchemaVersion, 2, `${id}: meta must opt into V2`);
  assert.deepEqual(entry.practice, meta.practice, `${id}: V2 practice metadata must have exact parity`);
  assert.equal(meta.practice.targetLevel, expected.targetLevel);
  assert.equal(meta.practice.timeboxMinutes, expected.timeboxMinutes);
  assert.equal(meta.practice.guidedMock, expected.guidedMock);
  assert.ok(wordCount(meta.practice.candidatePrompt) >= 60 && wordCount(meta.practice.candidatePrompt) <= 110);
  String(meta.practice.candidatePrompt).split(/(?<=[.!?])\s+/).forEach((sentence) => {
    assert.ok(wordCount(sentence) <= 30, `${id}: candidate prompt sentences must not exceed 30 words`);
  });
  assert.ok(meta.practice.constraints.length >= 2 && meta.practice.constraints.length <= 4);
  assert.equal(meta.practice.expectedDecisions.length, 3);
  assert.ok(meta.practice.prerequisites.length >= 2 && meta.practice.prerequisites.length <= 4);
  assert.ok(meta.practice.coreSkills.length >= 2 && meta.practice.coreSkills.length <= 4);
  assert.deepEqual(Object.keys(meta.practice.evaluationSpine).sort(), [
    'expertStretch',
    'mustCover',
    'redFlag',
    'strongSignals',
  ]);
  assert.equal(meta.practice.evaluationSpine.mustCover.length, 2);
  assert.equal(meta.practice.evaluationSpine.strongSignals.length, 2);
  assert.ok(meta.practice.evaluationSpine.expertStretch);
  assert.ok(meta.practice.evaluationSpine.redFlag);
  const firstScreenWords = wordCount([
    meta.practice.candidatePrompt,
    ...meta.practice.constraints,
    ...meta.practice.prerequisites,
    ...meta.practice.evaluationSpine.mustCover,
    ...meta.practice.evaluationSpine.strongSignals,
    meta.practice.evaluationSpine.expertStretch,
    meta.practice.evaluationSpine.redFlag,
  ].join(' '));
  assert.ok(firstScreenWords <= 160, `${id}: first-screen metadata must fit 160 words`);

  const sectionBundles = ['requirements', 'architecture', 'data', 'interfaces', 'optimizations']
    .map((section) => read(id, section));
  const visibleWords = sectionBundles.flatMap((section) => section.blocks.flatMap(visibleBlockText));
  assert.ok(
    wordCount(visibleWords.join(' ')) >= 1500 && wordCount(visibleWords.join(' ')) <= 2100,
    `${id}: V2 answer must remain within the visible word budget`,
  );
  const firstAnswer = sectionBundles[0].blocks[0];
  assert.equal(firstAnswer.type, 'steps', `${id}: first Requirements block must use steps`);
  assert.equal(firstAnswer.editorialRole, 'timeboxed-answer');
  assert.equal(firstAnswer.steps.length, 5);
  assert.ok(wordCount(visibleBlockText(firstAnswer).join(' ')) >= 250);
  assert.ok(wordCount(visibleBlockText(firstAnswer).join(' ')) <= 400);
  assert.equal(
    sectionBundles.flatMap((section) => section.blocks).filter((block) => block.editorialRole === 'answer-checkpoint').length,
    0,
    `${id}: V2 rubric must live only in evaluationSpine`,
  );

  const images = ['requirements', 'architecture', 'data', 'interfaces', 'optimizations']
    .flatMap((section) => read(id, section).blocks)
    .filter((block) => block.type === 'image');
  assert.equal(images.length, 2, `${id}: V2 pilots require two diagrams`);
  images.forEach((block) => {
    assert.ok(block.alt && block.caption && block.fallbackText && block.width > 0 && block.height > 0);
    const assetPath = path.join(repoRoot, 'cdn', block.src);
    assert.ok(fs.existsSync(assetPath), `${id}: missing ${block.src}`);
    const svg = fs.readFileSync(assetPath, 'utf8');
    assert.doesNotMatch(svg, /<\s*(?:script|foreignObject|animate|animateMotion|animateTransform|set|image)\b/i);
    assert.doesNotMatch(svg, /\son[a-z]+\s*=|\b(?:href|xlink:href)\s*=\s*["'](?!#)/i);
  });

  const registryEntry = practiceRegistry.find((item) => item.tech === 'system-design' && item.id === id);
  assert.equal(registryEntry?.estimatedMinutes, expected.timeboxMinutes, `${id}: practice registry must use V2 timebox`);
}

const topicRubricIds = [
  'ai-image-generation-mvp',
  'component-design-system-architecture',
  'cross-device-preferences-sync',
  'dashboard-widgets-draggable-resizable',
  'endless-short-video-feed',
  'flashcard-language-trainer',
  'image-upload-preview',
  'live-chart-high-frequency-updates',
  'live-comments-global-stream',
  'model-training-progress-dashboard',
  'multi-step-form-autosave',
  'news-feed-timeline',
  'realtime-search-debounce-cache',
  'scalable-notifications-feed',
];
const rubricSignatures = new Set();
for (const id of topicRubricIds) {
  const checkpoint = read(id, 'optimizations').blocks.find((block) => block.editorialRole === 'answer-checkpoint');
  assert.equal(checkpoint?.type, 'checklist', `${id}: generic checkpoint must become a rubric`);
  assert.equal(checkpoint.items.length, 6, `${id}: rubric must contain six signals`);
  assert.equal(checkpoint.items.filter((item) => /^Must\s+[—-]\s+/.test(item)).length, 2);
  assert.equal(checkpoint.items.filter((item) => /^Strong signal\s+[—-]\s+/.test(item)).length, 2);
  assert.equal(checkpoint.items.filter((item) => /^Expert stretch\s+[—-]\s+/.test(item)).length, 1);
  assert.equal(checkpoint.items.filter((item) => /^Red flag\s+[—-]\s+/.test(item)).length, 1);
  const signature = checkpoint.items.join('\n');
  assert.ok(!rubricSignatures.has(signature), `${id}: rubric must be topic-specific`);
  rubricSignatures.add(signature);
}

for (const item of index) {
  const content = bundleText(item.id);
  assert.doesNotMatch(
    content,
    /\bRADIO\b.{0,180}\b(?:Reflect|Assumptions|Diagram|Decide|Implement|Outcome|Operations)\b/i,
    `${item.id}: RADIO must use Requirements, Architecture, Data, Interface, Optimizations`,
  );
  assert.doesNotMatch(
    content,
    /(?:^|\\n)(?:EVENT|DATA|ID|RETRY):/,
    `${item.id}: SSE field names are case-sensitive and must be lowercase`,
  );
  assert.doesNotMatch(
    content,
    /\b(?:The answer (?:think|care|have|need|show|describe)|At a high level, Use|Start by (?:ship|batch)|JSON\.stringifys)\b/i,
    `${item.id}: mechanical editorial prose must not ship`,
  );
  assert.doesNotMatch(
    content,
    /\bThe backend remains an abstract service contract and is out of scope\b/i,
    `${item.id}: repeated backend-boundary boilerplate must be rewritten contextually`,
  );
  assert.doesNotMatch(
    content,
    /\b(?:drop|discard)(?:s|ed|ing)?\s+(?:low-priority\s+)?(?:events?|notifications?|comments?)\b/i,
    `${item.id}: authoritative domain records must not be silently dropped`,
  );
}

const agentInspector = bundleText('ai-agent-run-inspector');
assert.match(agentInspector, /run\.snapshot/);
assert.match(agentInspector, /run\.stopped/);
assert.match(agentInspector, /waiting_approval/);
assert.match(agentInspector, /server version wins/i);

const offlineEmailMeta = read('offline-email-client', 'meta');
const offlineEmail = bundleText('offline-email-client');
const offlineEmailDataCode = read('offline-email-client', 'data').blocks
  .filter((block) => block.type === 'code')
  .map((block) => block.code)
  .join('\n');
const offlineEmailInterfaceCode = read('offline-email-client', 'interfaces').blocks
  .filter((block) => block.type === 'code')
  .map((block) => block.code)
  .join('\n');
const offlineEmailContractCode = `${offlineEmailDataCode}\n${offlineEmailInterfaceCode}`;
assert.equal(offlineEmailMeta.title, 'Gmail-Style Offline Email Client Frontend System Design');
assert.equal(offlineEmailMeta.seo.title, 'Gmail Frontend System Design: Offline Email Client');
assert.equal('companies' in offlineEmailMeta, false);
assert.deepEqual(offlineEmailMeta.editorial.companyEvidence, []);
assert.match(offlineEmail, /not (?:a )?confirmed.{0,80}Google interview question/i);
assert.match(offlineEmail, /syncCursor/);
assert.match(offlineEmail, /expired cursor|cursor expiry/i);
assert.match(offlineEmail, /full (?:sync|snapshot)[\s\S]{0,400}(?:draft|outbox)|(?:draft|outbox)[\s\S]{0,400}full (?:sync|snapshot)/i);
assert.match(offlineEmail, /clientCommandId/);
assert.match(offlineEmail, /idempotencyKey/);
assert.match(offlineEmail, /one logical send creates one Sent message|creates no duplicate Sent row|one command creates at most one message/i);
assert.match(offlineEmail, /saniti[sz]/i);
assert.match(offlineEmail, /remote images?/i);
assert.match(offlineEmail, /privacy proxy|click-to-load|click to load/i);
const draftAttachmentContract = offlineEmailDataCode
  .match(/type DraftAttachment\s*=[\s\S]*?\n\ntype DraftContent/)?.[0];
assert.ok(draftAttachmentContract, 'Offline email must define DraftAttachment');
for (const state of ['selected', 'uploading', 'processing', 'ready', 'failed', 'blocked', 'canceled']) {
  assert.match(draftAttachmentContract, new RegExp(`'${state}'`));
}
assert.match(offlineEmailDataCode, /uploadSessionId: string/);
assert.match(offlineEmailDataCode, /uploadedBytes: number/);
assert.match(offlineEmailDataCode, /assetId: string/);
assert.match(offlineEmailDataCode, /attachmentAssetIds: readonly string\[\]/);
assert.match(offlineEmailDataCode, /type MailboxProjection\s*=\s*\{[\s\S]*remoteDraftsById/);
assert.match(offlineEmailDataCode, /type LocalIntentState\s*=\s*\{[\s\S]*attachmentsById/);
assert.doesNotMatch(offlineEmailContractCode, /\btype MailboxDocument\s*=/);
assert.match(offlineEmailInterfaceCode, /reconcileRemoteDraft/);
assert.match(offlineEmail, /newer local (?:content remains intact|edits remain intact)/i);
assert.match(offlineEmail, /never assigns remote draft content over a newer local document/i);
for (const method of [
  'createAttachmentUpload',
  'uploadAttachmentBytes',
  'finalizeAttachmentUpload',
  'cancelAttachmentUpload',
  'createAttachmentDownload',
]) {
  assert.match(offlineEmailInterfaceCode, new RegExp(`\\b${method}\\b`));
}
assert.match(offlineEmail, /Background Sync is only a progressive enhancement/i);
assert.match(offlineEmail, /next eligible foreground or reconnect opportunity/i);
assert.match(offlineEmail, /never promises background delivery/i);

const infinite = bundleText('infinite-scroll-list');
assert.match(infinite, /interface PageLoader/);
assert.match(infinite, /queryKey/);
assert.match(infinite, /signal: AbortSignal/);

const endlessVideo = bundleText('endless-short-video-feed');
assert.match(endlessVideo, /MediaSelector/);
assert.match(endlessVideo, /manifest|rendition/i);
assert.doesNotMatch(endlessVideo, /RADIO means Reflect/i);

const notifications = bundleText('scalable-notifications-feed');
assert.match(notifications, /eventId/);
assert.match(notifications, /contiguousSequence/);
assert.match(notifications, /resumeCursor/);
assert.match(notifications, /ReadMarker/);
assert.match(notifications, /type: 'notification\.removed';[\s\S]{0,100}notificationId: string/);

const comments = bundleText('live-comments-global-stream');
assert.match(comments, /moderation: ModerationState/);
assert.match(comments, /moderation.{0,100}revision/);
assert.doesNotMatch(comments, /moderationRevision/);
assert.match(comments, /contiguousSequence/);
assert.match(comments, /resumeCursor/);

const dashboard = bundleText('dashboard-widgets-draggable-resizable');
assert.match(dashboard, /schemaVersion/);
assert.match(dashboard, /revision/);
assert.doesNotMatch(dashboard, /type LayoutVersion = 1 \| 2/);

const aiChat = bundleText('ai-chat-textarea-design');
assert.equal(
  read('ai-chat-textarea-design', 'meta').title,
  'Design an AI Chat Composer and Streaming Turn',
);
const aiChatDataCode = read('ai-chat-textarea-design', 'data').blocks
  .filter((block) => block.type === 'code')
  .map((block) => block.code)
  .join('\n');
const aiChatInterfaceCode = read('ai-chat-textarea-design', 'interfaces').blocks
  .filter((block) => block.type === 'code')
  .map((block) => block.code)
  .join('\n');
const composerDraftContract = aiChatDataCode.match(/interface ComposerDraft\s*\{[^}]*\}/)?.[0];
assert.ok(composerDraftContract, 'AI chat must define ComposerDraft');
assert.doesNotMatch(composerDraftContract, /\bisComposing\b/);
assert.match(aiChatDataCode, /interface ComposerInteractionState\s*\{[^}]*isComposing: boolean/);
assert.match(aiChatInterfaceCode, /interface StopCommand\s*\{[^}]*stopCommandId: string/);
assert.match(aiChatInterfaceCode, /interface OpenTurnEventsInput\s*\{[^}]*afterSequence: number/);
assert.match(aiChatInterfaceCode, /interface ChatTurnClient\s*\{[\s\S]*openEvents\([^)]*OpenTurnEventsInput[^)]*\): AsyncIterable<TurnEvent>/);
assert.match(aiChatInterfaceCode, /getTurnSnapshot\([^)]*\{[\s\S]*streamId: string[\s\S]*\}\): Promise<TurnSnapshot>/);
assert.match(aiChat, /event: message\.delta/);
assert.match(aiChat, /data: \{\\"conversationId\\":\\"c_123\\",\\"streamId\\"/);
assert.match(aiChat, /one stopCommandId per user intent and reuse it after a lost response/i);
assert.match(aiChat, /user may edit a new draft while a reply streams, but Send becomes Stop/i);
assert.match(aiChat, /retransmit the same commandId; transport retry is not new intent/i);
assert.match(aiChat, /local abort is not authoritative server Stop/i);
assert.match(aiChat, /Retry or Regenerate creates a fresh commandId and new streamId/i);
for (const identity of ['commandId', 'clientMessageId', 'messageId', 'streamId']) {
  assert.match(aiChat, new RegExp(identity), `AI chat must explain ${identity}`);
}
assert.match(aiChat, /account switch[\s\S]{0,500}logout/i);
assert.match(aiChat, /Browser storage is not a confidentiality boundary/i);
assert.match(aiChat, /Treat assistant content as untrusted/i);
assert.match(aiChat, /never pass streamed or completed assistant HTML directly to innerHTML/i);
assert.doesNotMatch(aiChat, /DraftStore owns unsent text and composition state/i);
assert.doesNotMatch(aiChat, /EVENT:|DATA:/);

const trainingDashboard = bundleText('model-training-progress-dashboard');
assert.match(trainingDashboard, /eventId/);
assert.match(trainingDashboard, /sequence/);
assert.match(trainingDashboard, /resumeCursor/);
assert.match(trainingDashboard, /type RunSnapshot = \{[\s\S]{0,500}contiguousSequence: number;[\s\S]{0,80}resumeCursor: string;/);
assert.match(trainingDashboard, /type MonitorState = \{[\s\S]{0,200}contiguousSequence: number;[\s\S]{0,80}resumeCursor: string \| null;/);
assert.doesNotMatch(trainingDashboard, /EVENT:|DATA:/);

const aiUx = bundleText('ai-ux-considerations');
assert.equal(
  read('ai-ux-considerations', 'meta').title,
  'Design an AI-Assisted Bulk Edit Review Flow',
);
const aiUxDataCode = read('ai-ux-considerations', 'data').blocks
  .filter((block) => block.type === 'code')
  .map((block) => block.code)
  .join('\n');
assert.match(aiUx, /proposal/i);
assert.match(aiUx, /review/i);
assert.match(aiUx, /per-item|per item/i);
assert.match(aiUx, /outcome/i);
for (const contract of [
  'GeneratedProposalContent',
  'ActionEligibility',
  'ProposalEnvelope',
  'ReviewState',
  'ApprovalCommand',
  'ActionOutcome',
]) {
  assert.match(aiUxDataCode, new RegExp(`interface ${contract}\\s*\\{`));
}
const generatedProposalContract = aiUxDataCode.match(/interface GeneratedProposalContent\s*\{[^}]*\}/)?.[0];
assert.ok(generatedProposalContract, 'AI proposal must define generated proposal content');
assert.doesNotMatch(generatedProposalContract, /\bcapabilities\b/);
assert.match(aiUx, /Cancel stays pending intent|Cancel is pending intent/i);
assert.match(aiUx, /rollback (?:is|uses) a separate compensating/i);

const checkout = bundleText('resilient-checkout-payment-flow');
const checkoutDataCode = read('resilient-checkout-payment-flow', 'data').blocks
  .filter((block) => block.type === 'code')
  .map((block) => block.code)
  .join('\n');
const checkoutInterfaceCode = read('resilient-checkout-payment-flow', 'interfaces').blocks
  .filter((block) => block.type === 'code')
  .map((block) => block.code)
  .join('\n');
const checkoutContractCode = `${checkoutDataCode}\n${checkoutInterfaceCode}`;
assert.match(
  checkout,
  /server returns CheckoutQuote.{0,80}quoteId.{0,40}quoteVersion/i,
);
assert.match(checkout, /CheckoutQuote.{0,100}not a client calculation/i);
assert.match(checkout, /one clientAttemptId and idempotencyKey.{0,120}(?:across|for) retransmission/i);
assert.match(checkout, /clientAttemptId.{0,120}Reuse while recovering the same Pay intent/i);
assert.match(checkout, /idempotencyKey.{0,100}Reuse with the identical attempt payload/i);
assert.match(
  checkout,
  /redirect parameters.{0,80}(?:provider )?SDK callbacks.{0,80}hints.{0,40}never (?:payment )?proof/i,
);
assert.match(
  checkout,
  /(?:bank return|return route).{0,180}(?:ask|read).{0,120}attempt (?:and order )?state/i,
);
assert.match(checkout, /hosted(?: or embedded)? (?:provider )?fields/i);
assert.match(
  checkout,
  /PAN and CVC.{0,80}outside application state.{0,60}logs.{0,80}(?:browser )?storage/i,
);
assert.match(
  checkout,
  /Validation (?:identifies|describes).{0,60}problems? in text.{0,60}links? (?:each )?(?:problem|summary item|field)/i,
);
assert.match(checkout, /preserves correctable input/i);
assert.match(checkout, /BroadcastChannel/);
assert.match(checkout, /advisory/i);
assert.match(checkout, /never copy a sender's phase into confirmed UI/i);
assert.match(checkout, /server remains the (?:correctness|concurrency) boundary/i);
for (const contract of [
  'CheckoutQuote',
  'CheckoutAttempt',
  'CheckoutPhase',
  'CheckoutGateway',
  'CrossTabCheckoutEvent',
]) {
  assert.match(
    checkoutContractCode,
    new RegExp(`(?:interface|type)\\s+${contract}\\b`),
    `Checkout must define ${contract}`,
  );
}
for (const phase of [
  'quoting',
  'ready',
  'submitting',
  'requires-action',
  'processing',
  'succeeded',
  'failed',
  'canceled',
  'quote-conflict',
]) {
  assert.match(
    checkoutContractCode,
    new RegExp(`['"]${phase}['"]`),
    `CheckoutPhase must include ${phase}`,
  );
}
assert.match(checkoutContractCode, /(?:interface|type)\s+CheckoutQuote\b[\s\S]*?quoteVersion/);
assert.match(checkoutContractCode, /(?:interface|type)\s+CheckoutAttempt\b[\s\S]*?clientAttemptId/);
assert.match(checkoutContractCode, /(?:interface|type)\s+CheckoutAttempt\b[\s\S]*?idempotencyKey/);
const checkoutAttemptBody = checkoutContractCode.match(
  /interface CheckoutAttempt\s*\{([\s\S]*?)\}/,
)?.[1] || '';
assert.doesNotMatch(checkoutAttemptBody, /providerActionToken/);
assert.match(
  checkoutContractCode,
  /interface AttemptStatusResponse\s*\{[\s\S]*?providerActionToken/,
);
assert.match(
  checkout,
  /new identity.{0,160}merchant status.{0,140}failed.{0,40}canceled.{0,40}quote-conflict/i,
);
assert.match(checkoutContractCode, /(?:interface|type)\s+CrossTabCheckoutEvent\b[\s\S]*?clientAttemptId/);
assert.match(
  checkoutContractCode,
  /interface CheckoutGateway\s*\{[\s\S]*?getQuote[\s\S]*?createAttempt[\s\S]*?getAttempt[\s\S]*?cancelAttempt[\s\S]*?getOrder/,
);

const autosave = bundleText('multi-step-form-autosave');
assert.match(autosave, /schemaVersion/);
assert.match(autosave, /lastLocalSavedAt/);
assert.match(autosave, /lastRemoteAcknowledgedAt/);
assert.match(autosave, /baseRevision/);

const preferences = bundleText('cross-device-preferences-sync');
assert.match(preferences, /per-key revisions|key-specific base revision/i);
assert.match(preferences, /syncCursor/);
assert.match(preferences, /baseRevision/);
assert.match(preferences, /changes theme again on another device/i);
assert.match(preferences, /unrelated language or notifications update would not conflict/i);

const newsFeed = bundleText('news-feed-timeline');
const newsFeedRequirements = JSON.stringify(read('news-feed-timeline', 'requirements'));
assert.match(newsFeed, /server-authoritative/i);
assert.match(newsFeed, /rankRevision/);
assert.match(newsFeedRequirements, /Bounded rendering work and DOM growth/i);
assert.doesNotMatch(newsFeedRequirements, /Bounded DOM size via virtualization/i);
assert.doesNotMatch(JSON.stringify(read('news-feed-timeline', 'architecture')), /VirtualizedList/);
assert.doesNotMatch(newsFeed, /sort ranked (?:items|posts) by createdAt/i);

const netflix = bundleText('netflix-scale-expansion');
assert.equal(read('netflix-scale-expansion', 'meta').title, 'Netflix Continue Watching Frontend System Design');
assert.match(netflix, /Representative product scenario/);
assert.match(netflix, /progress 43% rev 8/);
assert.match(netflix, /progress 51% rev 9/);
assert.match(netflix, /optimistic removal/i);
assert.match(netflix, /server revision wins while spatial context remains meaningful/i);
assert.match(netflix, /focus moves to it or a clear recovery message/i);
assert.doesNotMatch(netflix, /\b(?:moderation actions?|timestamp buffer|drop low-priority events?)\b/i);

const mock = bundleText('ui-component-state-from-mock');
assert.equal(read('ui-component-state-from-mock', 'meta').title, 'UI Component and State Design From a Mock');
assert.match(mock, /SupportInboxRoute/);
assert.match(mock, /URL state → QueryController/);
assert.match(mock, /local draft 1842/);
assert.match(mock, /Background version 18 changes assignee/);
assert.match(mock, /Server changes cannot erase a local draft/);
assert.match(mock, /move focus to the message only when the action requires correction/i);
assert.doesNotMatch(mock, /\b(?:two-way binding is bad|virtualize after 100 items|fixed 16ms)\b/i);

const upload = bundleText('image-upload-preview');
assert.equal(index.find((item) => item.id === 'image-upload-preview')?.difficulty, 'intermediate');
assert.match(upload, /createSession/);
assert.match(upload, /onProgress/);
assert.match(upload, /idempotencyKey/);
assert.match(upload, /attemptId, file, previewUrl, status, progress, session, asset, error/);
assert.match(JSON.stringify(read('image-upload-preview', 'architecture')), /"value":"8"/);
assert.doesNotMatch(upload, /fakeUploadMs|simulated upload|fake progress/i);

const search = bundleText('realtime-search-debounce-cache');
assert.match(search, /signal: AbortSignal/);
assert.match(search, /active generation and key check/i);
assert.match(search, /cancellation may race with resolution/i);

const chart = bundleText('live-chart-high-frequency-updates');
assert.match(chart, /at most one pending requestAnimationFrame/i);
assert.match(chart, /if \(this\.renderState\.dirty\) this\.scheduleRender\(\)/);
assert.match(chart, /Renderer choice follows profiling/i);
assert.doesNotMatch(chart, /function\s+renderLoop|requestAnimationFrame\(renderLoop\)/);

const toast = bundleText('notification-toast-system');
assert.match(toast, /actionable and critical messages (?:are|remain) persistent/i);
assert.match(toast, /(?:status announcement|role status)[\s\S]{0,160}(?:alert|urgent)/i);
assert.match(toast, /(?:never steals focus|never move focus)/i);
assert.match(toast, /store owns normalized records[\s\S]{0,180}lifecycle coordinator owns every expiry handle/i);
assert.match(toast, /manual dismiss and timeout both request remove/i);
assert.doesNotMatch(toast, /ToastRecord[\s\S]{0,300}\bannounced\??:/i);

const imageGeneration = bundleText('ai-image-generation-mvp');
assert.match(imageGeneration, /202 Accepted/);
assert.match(imageGeneration, /progress.*indeterminate/i);
assert.match(imageGeneration, /idempotency key/i);
assert.match(imageGeneration, /cancel-complete races/i);
assert.match(imageGeneration, /POST \/api\/images\/generations/);
assert.match(imageGeneration, /(?:GET|POST) \/api\/images\/jobs\//);
assert.doesNotMatch(imageGeneration, /POST \/(?:generate|generations)\b/);
assert.doesNotMatch(imageGeneration, /(?:GET|POST) \/jobs\//);

const flashcard = bundleText('flashcard-language-trainer');
assert.match(flashcard, /pointer, touch, Enter, and Space/);
assert.match(flashcard, /will-change only briefly and only if profiling shows a real benefit/i);
assert.match(flashcard, /Reduced-motion users receive an immediate state change/i);

console.log('System-design content regression checks passed.');
