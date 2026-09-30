import { afterNextRender, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ScrollService } from './core/services/scroll.service';
import { BRAND } from './data/site';
import { AnatomyComponent } from './sections/anatomy/anatomy.component';
import { CollectionComponent } from './sections/collection/collection.component';
import { ConfiguratorComponent } from './sections/configurator/configurator.component';
import { CraftComponent } from './sections/craft/craft.component';
import { FaqComponent } from './sections/faq/faq.component';
import { FinalCtaComponent } from './sections/final-cta/final-cta.component';
import { FooterComponent } from './sections/footer/footer.component';
import { HeroComponent } from './sections/hero/hero.component';
import { MovementComponent } from './sections/movement/movement.component';
import { NavComponent } from './sections/nav/nav.component';
import { PrecisionComponent } from './sections/precision/precision.component';
import { PreloaderComponent } from './sections/preloader/preloader.component';
import { TickerComponent } from './sections/ticker/ticker.component';
import { VoicesComponent } from './sections/voices/voices.component';
import { CustomCursorComponent } from './shared/ui/custom-cursor.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PreloaderComponent,
    CustomCursorComponent,
    NavComponent,
    HeroComponent,
    TickerComponent,
    CraftComponent,
    CollectionComponent,
    MovementComponent,
    ConfiguratorComponent,
    PrecisionComponent,
    AnatomyComponent,
    VoicesComponent,
    FaqComponent,
    FinalCtaComponent,
    FooterComponent,
  ],
  template: `
    <a class="skip-link" href="#main">{{ brand.skipLink }}</a>
    <app-preloader />
    <app-custom-cursor />
    <div class="grain" aria-hidden="true"></div>

    <app-nav />

    <main id="main" class="k-main" tabindex="-1">
      <app-hero />
      <app-ticker />
      <app-craft />
      <app-collection />
      <app-movement />
      <app-configurator />
      <app-precision />
      <app-anatomy />
      <app-voices />
      <app-faq />
      <app-final-cta />
    </main>

    <app-footer />
  `,
  styles: `
    :host {
      display: block;
    }

    .k-main {
      outline: none;
    }

    .skip-link {
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: calc(var(--z-preloader) + 1);
      padding: 0.75rem 1.25rem;
      border-radius: 999px;
      background: var(--gold);
      color: #0a0a0b;
      font-weight: 600;
      transform: translateY(-200%);
      transition: transform 0.4s var(--ease-mech);

      &:focus-visible {
        transform: none;
      }
    }

    // Subtle film grain on a fixed, non-interactive layer.
    .grain {
      position: fixed;
      inset: -50%;
      z-index: var(--z-grain);
      pointer-events: none;
      opacity: 0.05;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.9 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
      animation: grain 0.9s steps(5) infinite;
    }

    @keyframes grain {
      0% {
        transform: translate(0, 0);
      }
      20% {
        transform: translate(-3%, 2%);
      }
      40% {
        transform: translate(2%, -3%);
      }
      60% {
        transform: translate(-2%, -1%);
      }
      80% {
        transform: translate(3%, 3%);
      }
      100% {
        transform: translate(0, 0);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .grain {
        animation: none;
      }
    }
  `,
})
export class App {
  protected readonly brand = BRAND;
  private readonly scroll = inject(ScrollService);

  constructor() {
    afterNextRender(() => this.scroll.init());
  }
}
