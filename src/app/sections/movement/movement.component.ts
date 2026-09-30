import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { LucideX } from '@lucide/angular';
import { MOVEMENT_COPY, MOVEMENT_PARTS, PartId } from '../../data/parts';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { SectionHeadingComponent } from '../../shared/ui/section-heading.component';
import { MovementStageComponent } from './movement-stage.component';

/**
 * Movement Explorer. The selected part is one shared signal: the parts list, the 3D
 * hotspots and the info panel all read and write it.
 */
@Component({
  selector: 'app-movement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SectionHeadingComponent, MovementStageComponent, RevealDirective, LucideX],
  templateUrl: './movement.component.html',
  styleUrl: './movement.component.scss',
})
export class MovementComponent {
  protected readonly copy = MOVEMENT_COPY;
  protected readonly parts = MOVEMENT_PARTS;

  protected readonly selected = signal<PartId | null>(null);
  protected readonly explode = signal(0);
  protected readonly selectedPart = computed(() => this.parts.find((p) => p.id === this.selected()) ?? null);

  protected toggle(id: PartId): void {
    this.selected.set(this.selected() === id ? null : id);
  }

  protected clear(): void {
    this.selected.set(null);
  }
}
