import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  DecisionGraphBranch,
  DecisionGraphLanguage,
  DecisionGraphNode,
} from '../../../core/models/decision-graph.model';

export type DecisionGraphNodeOpenedEvent = {
  nodeId: string;
  lineStart: number;
  lineEnd: number;
  index: number;
};

export type DecisionGraphBranchViewedEvent = {
  nodeId: string;
  branch: DecisionGraphBranch;
  viewedCount: number;
  completionDepth: number;
};

@Component({
  selector: 'app-decision-graph-code-block',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './decision-graph-code-block.component.html',
  styleUrls: ['./decision-graph-code-block.component.css'],
})
export class DecisionGraphCodeBlockComponent implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly codeSignal = signal('');
  private readonly nodesSignal = signal<DecisionGraphNode[]>([]);
  private readonly languageSignal = signal<DecisionGraphLanguage>('javascript');
  private readonly layoutSignal = signal<'desktop' | 'mobile'>('desktop');

  private readonly seenBranches = new Map<string, Set<DecisionGraphBranch>>();

  @Input() title = 'Code Rationale';

  @Input() set code(value: string) {
    this.codeSignal.set(String(value || ''));
  }

  @Input() set nodes(value: DecisionGraphNode[] | null | undefined) {
    const normalized = Array.isArray(value)
      ? value.filter((item) => !!item && !!item.id)
      : [];

    this.nodesSignal.set(normalized);

    const selected = this.selectedNodeId();
    if (selected && !normalized.some((node) => node.id === selected)) {
      this.selectedNodeId.set(null);
    }

    const validIds = new Set(normalized.map((node) => node.id));
    const nextExpanded: Record<string, DecisionGraphBranch[]> = {};
    for (const [id, branches] of Object.entries(this.expandedBranches())) {
      if (validIds.has(id)) nextExpanded[id] = branches;
    }
    this.expandedBranches.set(nextExpanded);
  }

  @Input() set language(value: DecisionGraphLanguage | null | undefined) {
    this.languageSignal.set(value === 'typescript' ? 'typescript' : 'javascript');
  }

  @Output() nodeOpened = new EventEmitter<DecisionGraphNodeOpenedEvent>();
  @Output() branchViewed = new EventEmitter<DecisionGraphBranchViewedEvent>();

  selectedNodeId = signal<string | null>(null);
  expandedBranches = signal<Record<string, DecisionGraphBranch[]>>({});

  readonly lines = computed(() => this.codeSignal().replace(/\r\n/g, '\n').split('\n'));
  readonly isMobile = computed(() => this.layoutSignal() === 'mobile');
  readonly activeLanguageLabel = computed(() => this.languageSignal() === 'typescript' ? 'TypeScript' : 'JavaScript');

  readonly selectedNode = computed(() => {
    const nodes = this.nodesSignal();
    if (!nodes.length) return null;

    const selected = this.selectedNodeId();
    if (!selected) return nodes[0];

    return nodes.find((node) => node.id === selected) || nodes[0];
  });

  readonly selectedNodeIndex = computed(() => {
    const node = this.selectedNode();
    if (!node) return -1;
    return this.nodesSignal().findIndex((item) => item.id === node.id);
  });

  readonly selectedNodeViewedCount = computed(() => {
    const node = this.selectedNode();
    if (!node) return 0;

    const seen = this.seenBranches.get(node.id);
    return seen ? seen.size : 0;
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.syncLayoutMode();
    window.addEventListener('resize', this.syncLayoutMode, { passive: true });
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    window.removeEventListener('resize', this.syncLayoutMode);
  }

  trackByIndex(index: number): number {
    return index;
  }

  nodeForLine(lineNumber: number): DecisionGraphNode | null {
    const nodes = this.nodesSignal();
    for (const node of nodes) {
      const start = node.anchor.lineStart;
      const end = node.anchor.lineEnd ?? start;
      if (lineNumber >= start && lineNumber <= end) return node;
    }
    return null;
  }

  lineDecisionLabel(lineNumber: number): string {
    const node = this.nodeForLine(lineNumber);
    if (!node) return '';
    const idx = this.nodesSignal().findIndex((item) => item.id === node.id);
    if (idx < 0) return 'D';
    return `D${idx + 1}`;
  }

  isSelectedLine(lineNumber: number): boolean {
    const node = this.selectedNode();
    if (!node) return false;
    const start = node.anchor.lineStart;
    const end = node.anchor.lineEnd ?? start;
    return lineNumber >= start && lineNumber <= end;
  }

  selectNode(node: DecisionGraphNode): void {
    const all = this.nodesSignal();
    const index = all.findIndex((item) => item.id === node.id);
    if (index < 0) return;

    this.selectedNodeId.set(node.id);
    this.nodeOpened.emit({
      nodeId: node.id,
      lineStart: node.anchor.lineStart,
      lineEnd: node.anchor.lineEnd ?? node.anchor.lineStart,
      index,
    });
  }

  onLineSpace(event: Event, node: DecisionGraphNode): void {
    event.preventDefault();
    this.selectNode(node);
  }

  isBranchExpanded(branch: DecisionGraphBranch): boolean {
    const node = this.selectedNode();
    if (!node) return false;
    const expanded = this.expandedBranches()[node.id] || [];
    return expanded.includes(branch);
  }

  toggleBranch(branch: DecisionGraphBranch): void {
    const node = this.selectedNode();
    if (!node) return;

    const state = { ...this.expandedBranches() };
    const current = new Set<DecisionGraphBranch>(state[node.id] || []);

    const expanding = !current.has(branch);
    if (expanding) {
      current.add(branch);
    } else {
      current.delete(branch);
    }

    state[node.id] = Array.from(current);
    this.expandedBranches.set(state);

    if (expanding) {
      this.markBranchViewed(node.id, branch);
    }
  }

  onBranchSpace(event: Event, branch: DecisionGraphBranch): void {
    event.preventDefault();
    this.toggleBranch(branch);
  }

  private markBranchViewed(nodeId: string, branch: DecisionGraphBranch): void {
    let seen = this.seenBranches.get(nodeId);
    if (!seen) {
      seen = new Set<DecisionGraphBranch>();
      this.seenBranches.set(nodeId, seen);
    }

    if (seen.has(branch)) return;

    seen.add(branch);
    const completionDepth = seen.size;

    this.branchViewed.emit({
      nodeId,
      branch,
      viewedCount: completionDepth,
      completionDepth,
    });
  }

  private syncLayoutMode = (): void => {
    if (!this.isBrowser) return;
    this.layoutSignal.set(window.innerWidth < 980 ? 'mobile' : 'desktop');
  };
}
