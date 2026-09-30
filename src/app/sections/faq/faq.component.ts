import { CdkAccordionModule } from '@angular/cdk/accordion';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { LucidePlus } from '@lucide/angular';
import { FAQ_COPY, FAQ_ITEMS } from '../../data/faq';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { SectionHeadingComponent } from '../../shared/ui/section-heading.component';

/** Single-open accessible accordion (CDK) with smooth height and a plus that turns to ×. */
@Component({
  selector: 'app-faq',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkAccordionModule, SectionHeadingComponent, RevealDirective, LucidePlus],
  template: `
    <section id="faq" class="k-section faq" aria-labelledby="faq-title" tabindex="-1">
      <div class="k-container layout">
        <app-section-heading headingId="faq-title" align="start" [eyebrow]="copy.eyebrow" [title]="copy.title" [intro]="copy.intro" />

        <cdk-accordion class="accordion" appReveal="children">
          @for (item of items; track item.id) {
            <cdk-accordion-item
              #acc="cdkAccordionItem"
              class="item"
              [expanded]="open() === item.id"
              [class.is-open]="open() === item.id"
              (expandedChange)="onExpanded(item.id, $event)"
            >
              <h3 class="item-heading">
                <button
                  type="button"
                  class="trigger"
                  [id]="'faq-trigger-' + item.id"
                  [attr.aria-expanded]="open() === item.id"
                  [attr.aria-controls]="'faq-panel-' + item.id"
                  (click)="acc.toggle()"
                >
                  <span class="question">{{ item.question }}</span>
                  <span class="icon" aria-hidden="true">
                    <svg lucidePlus [size]="18" [strokeWidth]="1.25"></svg>
                  </span>
                </button>
              </h3>
              <div
                class="panel"
                role="region"
                [id]="'faq-panel-' + item.id"
                [attr.aria-labelledby]="'faq-trigger-' + item.id"
                [attr.inert]="open() === item.id ? null : ''"
              >
                <div class="panel-inner">
                  <p class="answer">{{ item.answer }}</p>
                </div>
              </div>
            </cdk-accordion-item>
          }
        </cdk-accordion>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .faq {
      outline: none;
    }

    .layout {
      display: grid;
      gap: 1rem;
    }

    .accordion {
      display: block;
      border-top: 1px solid var(--line);
    }

    .item {
      display: block;
      border-bottom: 1px solid var(--line);
    }

    .item-heading {
      margin: 0;
      font: inherit;
    }

    .trigger {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      width: 100%;
      padding: 1.5rem 0.25rem;
      border: 0;
      background: none;
      text-align: left;
      cursor: pointer;
    }

    .question {
      font-family: var(--font-display);
      font-size: clamp(1.125rem, 1.8vw, 1.5rem);
      font-weight: 600;
      letter-spacing: -0.02em;
      transition: color 0.4s var(--ease-mech);
    }

    .trigger:hover .question,
    .is-open .question {
      color: var(--gold-light);
    }

    .icon {
      display: grid;
      place-items: center;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      border: 1px solid var(--line);
      color: var(--gold);
      flex: none;
      transition:
        transform 0.6s var(--ease-mech),
        border-color 0.4s var(--ease-mech),
        background-color 0.4s var(--ease-mech);
    }

    .is-open .icon {
      transform: rotate(135deg);
      border-color: rgba(201, 169, 110, 0.6);
      background: rgba(201, 169, 110, 0.08);
    }

    .panel {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.7s var(--ease-mech);
    }

    .is-open .panel {
      grid-template-rows: 1fr;
    }

    .panel-inner {
      overflow: hidden;
    }

    .answer {
      margin: 0;
      padding: 0 3.5rem 1.75rem 0.25rem;
      max-width: 62ch;
      color: var(--text-muted);
      line-height: 1.7;
      opacity: 0;
      transform: translateY(-6px);
      transition:
        opacity 0.5s var(--ease-mech),
        transform 0.6s var(--ease-mech);
    }

    .is-open .answer {
      opacity: 1;
      transform: none;
      transition-delay: 0.12s;
    }

    @media (min-width: 1024px) {
      .layout {
        grid-template-columns: 0.9fr 1.3fr;
        gap: 4rem;
        align-items: start;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .panel,
      .answer,
      .icon {
        transition: none;
      }
    }
  `,
})
export class FaqComponent {
  protected readonly copy = FAQ_COPY;
  protected readonly items = FAQ_ITEMS;
  /** Only one item is open at a time; the first starts open. */
  protected readonly open = signal<string | null>(FAQ_ITEMS[0]?.id ?? null);

  protected onExpanded(id: string, expanded: boolean): void {
    if (expanded) {
      this.open.set(id);
    } else if (this.open() === id) {
      this.open.set(null);
    }
  }
}
