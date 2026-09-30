import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CONFIGURATOR_COPY } from '../../data/configurator-options';
import { SectionHeadingComponent } from '../../shared/ui/section-heading.component';
import { ConfiguratorPanelComponent } from './configurator-panel.component';

@Component({
  selector: 'app-configurator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeadingComponent, ConfiguratorPanelComponent],
  template: `
    <section id="configurator" class="k-section configurator" aria-labelledby="configurator-title" tabindex="-1">
      <div class="k-container">
        <app-section-heading
          headingId="configurator-title"
          [eyebrow]="copy.eyebrow"
          [title]="copy.title"
          [intro]="copy.intro"
        />
        @defer (on viewport; prefetch on idle) {
          <app-configurator-panel />
        } @placeholder {
          <div class="placeholder" aria-hidden="true">
            <div class="k-skeleton preview"></div>
            <div class="steps">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div class="k-skeleton step"></div>
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

    .configurator {
      outline: none;
    }

    .placeholder {
      display: grid;
      gap: 2rem;
    }

    .preview {
      aspect-ratio: 1;
      max-height: 64vh;
      border-radius: var(--radius-shell);
    }

    .steps {
      display: grid;
      gap: 0.75rem;
      align-content: start;
    }

    .step {
      height: 4rem;
      border-radius: 1rem;
    }

    @media (min-width: 1024px) {
      .placeholder {
        grid-template-columns: 1.1fr 1fr;
      }
    }
  `,
})
export class ConfiguratorComponent {
  protected readonly copy = CONFIGURATOR_COPY;
}
