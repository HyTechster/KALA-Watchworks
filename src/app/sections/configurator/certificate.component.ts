import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
} from '@angular/core';
import { registerGsap } from '../../core/gsap';
import { ConfiguratorStore } from '../../core/services/configurator.store';
import { MotionService } from '../../core/services/motion.service';
import { CONFIGURATOR_COPY } from '../../data/configurator-options';
import { BRAND } from '../../data/site';
import { OdometerComponent } from '../../shared/ui/odometer.component';

/** Certificate-style summary card that draws its frame and reveals its rows on entry. */
@Component({
  selector: 'app-certificate',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [OdometerComponent],
  template: `
    <article class="certificate" aria-labelledby="certificate-title">
      <svg class="frame" viewBox="0 0 400 520" preserveAspectRatio="none" aria-hidden="true">
        <rect class="line" x="6" y="6" width="388" height="508" rx="18" />
        <rect class="line thin" x="16" y="16" width="368" height="488" rx="12" />
        <circle class="line thin" cx="200" cy="96" r="44" />
        <circle class="line thin" cx="200" cy="96" r="36" />
      </svg>
      <div class="content">
        <p class="t-label brand">{{ brand.full }}</p>
        <h4 id="certificate-title" class="title">{{ copy.certificateTitle }}</h4>
        <p class="serial t-mono">
          <span class="sr-only">{{ copy.certificateSerial }}: </span>{{ store.serial() }}
        </p>
        <dl class="rows">
          <div class="row">
            <dt class="t-label">{{ copy.certificateModel }}</dt>
            <dd>{{ store.modelOption().name }}</dd>
          </div>
          <div class="row">
            <dt class="t-label">{{ copy.certificateCase }}</dt>
            <dd>{{ store.caseOption().name }}</dd>
          </div>
          <div class="row">
            <dt class="t-label">{{ copy.certificateDial }}</dt>
            <dd>{{ store.dialOption().name }}</dd>
          </div>
          <div class="row">
            <dt class="t-label">{{ copy.certificateStrap }}</dt>
            <dd>{{ store.strapOption().name }}</dd>
          </div>
          <div class="row">
            <dt class="t-label">{{ copy.certificateEngraving }}</dt>
            <dd class="engraving">{{ store.engraving() || copy.certificateNoEngraving }}</dd>
          </div>
        </dl>
        <div class="total">
          <span class="t-label">{{ copy.priceLabel }}</span>
          <app-odometer class="total-value" prefix="$" [value]="store.price()" />
        </div>
        <p class="signed">{{ copy.certificateSigned }}</p>
      </div>
    </article>
  `,
  styles: `
    :host {
      display: block;
    }

    .certificate {
      position: relative;
      padding: 2.25rem 2rem 2rem;
      border-radius: 1.25rem;
      background:
        radial-gradient(80% 50% at 50% 0%, rgba(201, 169, 110, 0.12), transparent 70%),
        repeating-radial-gradient(circle at 50% 18%, rgba(201, 169, 110, 0.05) 0 1px, transparent 1px 7px),
        #121214;
      overflow: hidden;
    }

    .frame {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .line {
      fill: none;
      stroke: rgba(201, 169, 110, 0.7);
      stroke-width: 1;
      vector-effect: non-scaling-stroke;
    }

    .line.thin {
      stroke: rgba(201, 169, 110, 0.3);
    }

    .content {
      position: relative;
      display: grid;
      gap: 0.9rem;
      text-align: center;
    }

    .brand {
      margin: 3.25rem 0 0;
      color: var(--gold);
    }

    .title {
      font-size: 1.5rem;
    }

    .serial {
      margin: 0;
      font-size: 1.05rem;
      letter-spacing: 0.14em;
      color: var(--gold-light);
    }

    .rows {
      display: grid;
      margin: 0.5rem 0 0;
      text-align: left;
    }

    .row {
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.7rem 0;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.1);

      dt {
        color: var(--text-muted);
      }

      dd {
        margin: 0;
        font-size: 0.9375rem;
        text-align: right;
      }
    }

    .engraving {
      font-family: var(--font-display);
      font-style: italic;
      color: var(--gold-light);
    }

    .total {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding-top: 0.5rem;
    }

    .total-value {
      font-size: 1.5rem;
      color: var(--gold-light);
    }

    .signed {
      margin: 0.5rem 0 0;
      font-family: var(--font-display);
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
  `,
})
export class CertificateComponent {
  protected readonly store = inject(ConfiguratorStore);
  protected readonly copy = CONFIGURATOR_COPY;
  protected readonly brand = BRAND;
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly motion = inject(MotionService);

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (this.motion.reduced()) return;
      const gsap = registerGsap();
      const host = this.el.nativeElement;
      const ctx = gsap.context(() => {
        gsap
          .timeline()
          .from(host.querySelectorAll('.line'), { drawSVG: '0%', duration: 1.4, ease: 'expo.inOut', stagger: 0.12 })
          .from(
            host.querySelectorAll('.content > *, .row'),
            { y: 14, autoAlpha: 0, duration: 0.7, ease: 'expo.out', stagger: 0.05 },
            0.35,
          );
      }, host);
      destroyRef.onDestroy(() => ctx.revert());
    });
  }
}
