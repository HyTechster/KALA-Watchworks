import { StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonToggleChange, MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { LucideCheck } from '@lucide/angular';
import { ConfiguratorStore } from '../../core/services/configurator.store';
import { ScrollService } from '../../core/services/scroll.service';
import {
  CASE_OPTIONS,
  CaseId,
  CONFIGURATOR_COPY,
  DIAL_OPTIONS,
  ENGRAVING,
  MODEL_OPTIONS,
  STRAP_OPTIONS,
  STRAP_SIZE_OPTIONS,
  StrapSize,
} from '../../data/configurator-options';
import { personNameValidator, strapSizeValidator, strictEmailValidator } from '../../shared/validators/kala-validators';
import { ButtonComponent } from '../../shared/ui/button.component';
import { OdometerComponent } from '../../shared/ui/odometer.component';
import { CertificateComponent } from './certificate.component';
import { ConfiguratorPreviewComponent } from './configurator-preview.component';

type FieldName = 'name' | 'email' | 'strapSize';
const SUBMIT_DELAY_MS = 1400;

/** Six-step configurator with a live 3D preview, odometer price and interest form. */
@Component({
  selector: 'app-configurator-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatStepperModule,
    MatButtonToggleModule,
    ReactiveFormsModule,
    ButtonComponent,
    OdometerComponent,
    CertificateComponent,
    ConfiguratorPreviewComponent,
    LucideCheck,
  ],
  templateUrl: './configurator-panel.component.html',
  styleUrl: './configurator-panel.component.scss',
})
export class ConfiguratorPanelComponent {
  protected readonly store = inject(ConfiguratorStore);
  protected readonly copy = CONFIGURATOR_COPY;
  protected readonly models = MODEL_OPTIONS;
  protected readonly cases = CASE_OPTIONS;
  protected readonly dials = DIAL_OPTIONS;
  protected readonly straps = STRAP_OPTIONS;
  protected readonly sizes = STRAP_SIZE_OPTIONS;
  protected readonly engraving = ENGRAVING;

  private readonly snackBar = inject(MatSnackBar);
  private readonly scroll = inject(ScrollService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    name: this.fb.control('', [Validators.required, personNameValidator()]),
    email: this.fb.control('', [Validators.required, strictEmailValidator()]),
    strapSize: this.fb.control<StrapSize | ''>('', [
      Validators.required,
      strapSizeValidator(STRAP_SIZE_OPTIONS.map((s) => s.id)),
    ]),
  });

  protected readonly status = signal<'idle' | 'submitting' | 'success'>('idle');
  private submitTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => this.scroll.requestRefresh());
    inject(DestroyRef).onDestroy(() => clearTimeout(this.submitTimer));
  }

  protected onStep(event: StepperSelectionEvent): void {
    this.store.step.set(event.selectedIndex);
  }

  protected onCase(event: MatButtonToggleChange): void {
    if (event.value) this.store.caseMaterial.set(event.value as CaseId);
  }

  protected onEngraving(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.store.setEngraving(input.value);
    if (input.value !== this.store.engraving()) input.value = this.store.engraving();
  }

  protected error(field: FieldName): string | null {
    const control = this.form.controls[field];
    if (!control.invalid || !(control.touched || control.dirty) || this.status() === 'success') return null;
    const e = this.copy.errors;
    if (control.hasError('required')) {
      return field === 'name' ? e.nameRequired : field === 'email' ? e.emailRequired : e.strapRequired;
    }
    if (control.hasError('personName')) return e.nameInvalid;
    if (control.hasError('strictEmail')) return e.emailInvalid;
    if (control.hasError('strapSize')) return e.strapRequired;
    return null;
  }

  protected submit(): void {
    if (this.status() === 'submitting') return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const firstInvalid = this.host.nativeElement.querySelector<HTMLElement>('form .ng-invalid');
      firstInvalid?.focus();
      return;
    }
    this.status.set('submitting');
    // No network call: simulate the request, then play the winding success state.
    this.submitTimer = setTimeout(() => {
      this.status.set('success');
      this.store.wind();
      this.snackBar.open(`${this.copy.snackbar} ${this.store.serial()}`, this.copy.snackbarAction, {
        duration: 6000,
        horizontalPosition: 'center',
        verticalPosition: 'bottom',
      });
    }, SUBMIT_DELAY_MS);
  }
}
