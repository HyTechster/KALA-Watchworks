import { ChangeDetectionStrategy, Component } from '@angular/core';
import { COLLECTION_COPY } from '../../data/collection';
import { GuideLinesComponent } from '../../shared/ui/guide-lines.component';
import { SectionHeadingComponent } from '../../shared/ui/section-heading.component';
import { CollectionGridComponent } from './collection-grid.component';

@Component({
  selector: 'app-collection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeadingComponent, CollectionGridComponent, GuideLinesComponent],
  template: `
    <section id="collection" class="k-section collection" aria-labelledby="collection-title" tabindex="-1">
      <app-guide-lines layout="frame" />
      <div class="k-container">
        <app-section-heading
          headingId="collection-title"
          [eyebrow]="copy.eyebrow"
          [title]="copy.title"
          [intro]="copy.intro"
        />
        @defer (on viewport; prefetch on idle) {
          <app-collection-grid />
        } @placeholder {
          <div class="skeleton" aria-hidden="true">
            <div class="skeleton-chips">
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <span class="k-skeleton chip"></span>
              }
            </div>
            <div class="skeleton-grid">
              @for (i of [1, 2, 3, 4, 5, 6, 7, 8]; track i) {
                <div class="k-skeleton card" [class.is-feature]="i === 1"></div>
              }
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .collection {
      outline: none;
    }

    .skeleton-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 2.5rem;
    }

    .chip {
      width: 6.5rem;
      height: 2.5rem;
      border-radius: 999px;
    }

    .skeleton-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr;
    }

    .card {
      aspect-ratio: 4 / 5;
      border-radius: 2rem;
    }

    @media (min-width: 640px) {
      .skeleton-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .card.is-feature {
        grid-column: span 2;
        aspect-ratio: 16 / 10;
      }
    }

    @media (min-width: 1024px) {
      .skeleton-grid {
        grid-template-columns: repeat(4, 1fr);
      }

      .card.is-feature {
        grid-row: span 2;
        aspect-ratio: auto;
      }
    }
  `,
})
export class CollectionComponent {
  protected readonly copy = COLLECTION_COPY;
}
