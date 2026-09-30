import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VOICES_COPY, VOICES_ROW_A, VOICES_ROW_B } from '../../data/voices';
import { MarqueeComponent } from '../../shared/ui/marquee.component';
import { SectionHeadingComponent } from '../../shared/ui/section-heading.component';

/** Two opposing marquee rows of owner quotes that pause on hover. */
@Component({
  selector: 'app-voices',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeadingComponent, MarqueeComponent],
  template: `
    <section id="voices" class="k-section voices" aria-labelledby="voices-title" tabindex="-1">
      <div class="k-container">
        <app-section-heading headingId="voices-title" [eyebrow]="copy.eyebrow" [title]="copy.title" [intro]="copy.intro" />
      </div>

      <div class="rows">
        <app-marquee [speed]="38" direction="left" [pauseOnHover]="true">
          <ng-template>
            @for (v of rowA; track v.id) {
              <figure class="quote k-shell">
                <div class="quote-core k-core">
                  <span class="mark" aria-hidden="true">“</span>
                  <blockquote class="text">{{ v.quote }}</blockquote>
                  <figcaption class="who">
                    <span class="avatar" aria-hidden="true">{{ v.name.charAt(0) }}</span>
                    <span class="who-text">
                      <span class="name">{{ v.name }}</span>
                      <span class="meta t-label">{{ v.city }} · {{ copy.owns }} {{ v.model }}</span>
                    </span>
                  </figcaption>
                </div>
              </figure>
            }
          </ng-template>
        </app-marquee>

        <app-marquee [speed]="32" direction="right" [pauseOnHover]="true">
          <ng-template>
            @for (v of rowB; track v.id) {
              <figure class="quote k-shell">
                <div class="quote-core k-core">
                  <span class="mark" aria-hidden="true">“</span>
                  <blockquote class="text">{{ v.quote }}</blockquote>
                  <figcaption class="who">
                    <span class="avatar" aria-hidden="true">{{ v.name.charAt(0) }}</span>
                    <span class="who-text">
                      <span class="name">{{ v.name }}</span>
                      <span class="meta t-label">{{ v.city }} · {{ copy.owns }} {{ v.model }}</span>
                    </span>
                  </figcaption>
                </div>
              </figure>
            }
          </ng-template>
        </app-marquee>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .voices {
      outline: none;
      overflow: hidden;
    }

    .rows {
      display: grid;
      gap: 1rem;
      mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
    }

    .quote {
      width: clamp(18rem, 30vw, 24rem);
      margin: 0 0.5rem;
      flex: none;
    }

    .quote-core {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      height: 100%;
      padding: 1.75rem;
    }

    .mark {
      font-family: var(--font-display);
      font-size: 3.5rem;
      line-height: 0.6;
      height: 1.5rem;
      color: var(--gold);
    }

    .text {
      margin: 0;
      font-size: 1.0625rem;
      line-height: 1.55;
      color: var(--text);
      white-space: normal;
    }

    .who {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      margin-top: auto;
      padding-top: 1rem;
      border-top: 1px solid var(--line);
    }

    .avatar {
      display: grid;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: 50%;
      border: 1px solid rgba(201, 169, 110, 0.5);
      font-family: var(--font-display);
      font-weight: 600;
      color: var(--gold-light);
      flex: none;
    }

    .who-text {
      display: grid;
      gap: 0.15rem;
    }

    .name {
      font-weight: 500;
    }

    .meta {
      font-size: 0.5625rem;
      color: var(--text-muted);
    }
  `,
})
export class VoicesComponent {
  protected readonly copy = VOICES_COPY;
  protected readonly rowA = VOICES_ROW_A;
  protected readonly rowB = VOICES_ROW_B;
}
