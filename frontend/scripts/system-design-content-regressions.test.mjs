#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './content-paths.mjs';

const root = path.join(repoRoot, 'cdn', 'questions', 'system-design');
const sectionFiles = ['meta', 'requirements', 'architecture', 'data', 'interfaces', 'optimizations'];
const index = JSON.parse(fs.readFileSync(path.join(root, 'index.json'), 'utf8'));

function read(id, section) {
  return JSON.parse(fs.readFileSync(path.join(root, id, `${section}.json`), 'utf8'));
}

function bundleText(id) {
  return sectionFiles.map((section) => JSON.stringify(read(id, section))).join('\n');
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
assert.match(aiChat, /event: message\.delta/);
assert.match(aiChat, /data: \{\\"streamId\\"/);
assert.doesNotMatch(aiChat, /EVENT:|DATA:/);

const trainingDashboard = bundleText('model-training-progress-dashboard');
assert.match(trainingDashboard, /eventId/);
assert.match(trainingDashboard, /sequence/);
assert.match(trainingDashboard, /resumeCursor/);
assert.match(trainingDashboard, /type RunSnapshot = \{[\s\S]{0,500}contiguousSequence: number;[\s\S]{0,80}resumeCursor: string;/);
assert.match(trainingDashboard, /type MonitorState = \{[\s\S]{0,200}contiguousSequence: number;[\s\S]{0,80}resumeCursor: string \| null;/);
assert.doesNotMatch(trainingDashboard, /EVENT:|DATA:/);

const aiUx = bundleText('ai-ux-considerations');
assert.match(aiUx, /proposal/i);
assert.match(aiUx, /review/i);
assert.match(aiUx, /per-item|per item/i);
assert.match(aiUx, /outcome/i);

const autosave = bundleText('multi-step-form-autosave');
assert.match(autosave, /schemaVersion/);
assert.match(autosave, /lastLocalSavedAt/);
assert.match(autosave, /lastRemoteAcknowledgedAt/);
assert.match(autosave, /baseRevision/);

const preferences = bundleText('cross-device-preferences-sync');
assert.match(preferences, /per-key revisions|key-specific base revision/i);
assert.match(preferences, /syncCursor/);
assert.match(preferences, /baseRevision/);

const newsFeed = bundleText('news-feed-timeline');
assert.match(newsFeed, /server-authoritative/i);
assert.match(newsFeed, /rankRevision/);
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
assert.match(toast, /actionable.*critical.*messages remain persistent/i);
assert.match(toast, /role status and reserves alert for genuinely urgent information/i);
assert.match(toast, /never move focus merely because a toast appeared/i);

const imageGeneration = bundleText('ai-image-generation-mvp');
assert.match(imageGeneration, /202 Accepted/);
assert.match(imageGeneration, /progress.*indeterminate/i);
assert.match(imageGeneration, /idempotency key/i);
assert.match(imageGeneration, /cancel-complete races/i);

const flashcard = bundleText('flashcard-language-trainer');
assert.match(flashcard, /pointer, touch, Enter, and Space/);
assert.match(flashcard, /will-change only briefly and only if profiling shows a real benefit/i);
assert.match(flashcard, /Reduced-motion users receive an immediate state change/i);

console.log('System-design content regression checks passed.');
