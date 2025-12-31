import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SafeHtmlPipe } from '../../core/pipes/safe-html.pipe';

type FaqItem = { q: string; a: string; id?: string };
type FaqGroup = { title: string; items: FaqItem[]; id?: string };

@Component({
  standalone: true,
  selector: 'app-faq-section',
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './faq-section.component.html',
  styleUrls: ['./faq-section.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqSectionComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() eyebrow?: string;
  @Input() items: FaqItem[] = [];
  @Input() groups: FaqGroup[] = [];
  @Input() initialOpenId?: string;
  @Input() singleOpen = true;

  openId: string | null = null;
  openSet = new Set<string>();

  ngOnInit() {
    if (this.initialOpenId) {
      this.setOpen(this.initialOpenId);
    }
  }

  trackById = (index: number, item: FaqItem) => item.id || `faq-${index}`;
  trackByGroup = (index: number, group: FaqGroup) => group.id || `faq-group-${index}`;

  getId(item: FaqItem, index: number, groupKey?: string): string {
    return item.id || (groupKey ? `faq-${groupKey}-${index}` : `faq-${index}`);
  }

  getGroupKey(group: FaqGroup, index: number): string {
    return group.id || `group-${index}`;
  }

  toggle(id: string) {
    if (this.singleOpen) {
      this.openId = this.openId === id ? null : id;
    } else {
      if (this.openSet.has(id)) {
        this.openSet.delete(id);
      } else {
        this.openSet.add(id);
      }
    }
  }

  isOpen(id: string): boolean {
    return this.singleOpen ? this.openId === id : this.openSet.has(id);
  }

  private setOpen(id: string) {
    if (this.singleOpen) {
      this.openId = id;
    } else {
      this.openSet.add(id);
    }
  }
}
