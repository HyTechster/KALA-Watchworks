import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import type { EChartsCoreOption } from 'echarts/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { MotionService } from '../../core/services/motion.service';
import { ScrollService } from '../../core/services/scroll.service';
import { DAILY_DEVIATION, POWER_RESERVE, PRECISION_COPY } from '../../data/precision';
import { ButtonComponent } from '../../shared/ui/button.component';
import { DarkCardComponent } from '../../shared/ui/dark-card.component';

/** Loads only the ECharts pieces we use, in their own lazy chunk. */
export async function loadEcharts() {
  const [core, charts, components, renderers] = await Promise.all([
    import('echarts/core'),
    import('echarts/charts'),
    import('echarts/components'),
    import('echarts/renderers'),
  ]);
  core.use([
    charts.LineChart,
    charts.GaugeChart,
    components.GridComponent,
    components.TooltipComponent,
    components.MarkAreaComponent,
    components.MarkLineComponent,
    renderers.CanvasRenderer,
  ]);
  return core;
}

const GOLD = '#C9A96E';
const GOLD_LIGHT = '#E6D3A3';
const STEEL_GRID = 'rgba(184, 190, 198, 0.1)';
const MUTED = '#A19D96';
const MONO = 'JetBrains Mono, monospace';

@Component({
  selector: 'app-precision-charts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgxEchartsDirective, DarkCardComponent, ButtonComponent],
  providers: [provideEchartsCore({ echarts: loadEcharts })],
  template: `
    <div class="charts">
      <app-dark-card class="card card--line">
        <div class="card-head">
          <div>
            <h3 class="card-title">{{ copy.accuracyTitle }}</h3>
            <p class="card-body">{{ copy.accuracyBody }}</p>
          </div>
          <span class="legend t-label"><span class="band" aria-hidden="true"></span>{{ copy.accuracyBand }}</span>
        </div>
        <div class="chart chart--line" echarts [options]="lineOptions" [autoResize]="true" role="img" [attr.aria-label]="copy.chartDescription"></div>
      </app-dark-card>

      <app-dark-card class="card card--gauge">
        <div class="card-head">
          <div>
            <h3 class="card-title">{{ copy.reserveTitle }}</h3>
            <p class="card-body">{{ copy.reserveBody }}</p>
          </div>
        </div>
        <div
          class="chart chart--gauge"
          echarts
          [options]="gaugeOptions"
          [merge]="gaugeMerge()"
          [autoResize]="true"
          (chartClick)="rewind()"
          role="img"
          [attr.aria-label]="copy.gaugeDescription + ' ' + reserveLabel()"
        ></div>
        <button type="button" appButton size="sm" variant="ghost" class="wind" (click)="rewind()" [attr.aria-disabled]="winding()">
          {{ winding() ? copy.reserveWinding : copy.reserveWind }}
        </button>
      </app-dark-card>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .charts {
      display: grid;
      gap: 1rem;
    }

    .card-head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
    }

    .card-title {
      font-size: 1.375rem;
    }

    .card-body {
      margin: 0.5rem 0 0;
      max-width: 36ch;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .legend {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--text-muted);
    }

    .band {
      width: 1.5rem;
      height: 0.75rem;
      border-radius: 3px;
      background: rgba(201, 169, 110, 0.18);
      border-block: 1px dashed rgba(201, 169, 110, 0.7);
    }

    .chart {
      width: 100%;
    }

    .chart--line {
      height: clamp(16rem, 32vw, 22rem);
      margin-top: 1rem;
    }

    .chart--gauge {
      height: 16rem;
      cursor: pointer;
    }

    .card--gauge {
      ::ng-deep .card-core {
        display: flex;
        flex-direction: column;
      }
    }

    .wind {
      align-self: center;
    }

    @media (min-width: 1024px) {
      .charts {
        grid-template-columns: 2fr 1fr;
      }
    }
  `,
})
export class PrecisionChartsComponent {
  protected readonly copy = PRECISION_COPY;
  private readonly motion = inject(MotionService);
  private readonly scroll = inject(ScrollService);

  protected readonly reserve = signal<number>(POWER_RESERVE.start);
  protected readonly winding = signal(false);
  protected readonly reserveLabel = computed(() => `${this.reserve().toFixed(1)} ${this.copy.reserveUnit}`);

  protected readonly lineOptions: EChartsCoreOption = {
    backgroundColor: 'transparent',
    animationDuration: 2400,
    animationEasing: 'cubicOut',
    grid: { left: 36, right: 12, top: 16, bottom: 28 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#18181b',
      borderColor: 'rgba(201,169,110,0.4)',
      textStyle: { color: '#F2EFE9', fontFamily: MONO, fontSize: 11 },
      valueFormatter: (v: unknown) => `${Number(v) > 0 ? '+' : ''}${Number(v).toFixed(1)} ${PRECISION_COPY.accuracyUnit}`,
    },
    xAxis: {
      type: 'category',
      data: DAILY_DEVIATION.map((_, i) => `${PRECISION_COPY.accuracyDayLabel} ${i + 1}`),
      boundaryGap: false,
      axisLine: { lineStyle: { color: STEEL_GRID } },
      axisTick: { show: false },
      axisLabel: {
        color: MUTED,
        fontFamily: MONO,
        fontSize: 10,
        interval: 4,
        formatter: (v: string) => v.replace(`${PRECISION_COPY.accuracyDayLabel} `, 'D'),
      },
    },
    yAxis: {
      type: 'value',
      min: -3,
      max: 3,
      interval: 1,
      splitLine: { lineStyle: { color: STEEL_GRID } },
      axisLabel: { color: MUTED, fontFamily: MONO, fontSize: 10, formatter: (v: number) => (v > 0 ? `+${v}` : `${v}`) },
    },
    series: [
      {
        type: 'line',
        data: [...DAILY_DEVIATION],
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: false,
        lineStyle: { color: GOLD, width: 2 },
        itemStyle: { color: GOLD_LIGHT },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(201,169,110,0.22)' },
              { offset: 1, color: 'rgba(201,169,110,0)' },
            ],
          },
          origin: 'start',
        },
        markArea: {
          silent: true,
          itemStyle: { color: 'rgba(201,169,110,0.07)' },
          data: [[{ yAxis: -2 }, { yAxis: 2 }]],
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: 'rgba(201,169,110,0.55)', type: 'dashed', width: 1 },
          label: { color: GOLD, fontFamily: MONO, fontSize: 10, formatter: (p: { value: number }) => `${p.value > 0 ? '+' : ''}${p.value} s` },
          data: [{ yAxis: 2 }, { yAxis: -2 }],
        },
      },
    ],
  };

  protected readonly gaugeOptions: EChartsCoreOption = {
    backgroundColor: 'transparent',
    animationDurationUpdate: 1000,
    animationEasingUpdate: 'linear',
    series: [
      {
        type: 'gauge',
        min: 0,
        max: POWER_RESERVE.max,
        startAngle: 220,
        endAngle: -40,
        splitNumber: 6,
        radius: '92%',
        center: ['50%', '58%'],
        progress: { show: true, width: 4, itemStyle: { color: GOLD } },
        axisLine: { lineStyle: { width: 4, color: [[1, 'rgba(255,255,255,0.08)']] } },
        axisTick: { distance: -14, length: 4, splitNumber: 4, lineStyle: { color: 'rgba(184,190,198,0.35)', width: 1 } },
        splitLine: { distance: -18, length: 10, lineStyle: { color: 'rgba(184,190,198,0.6)', width: 1 } },
        axisLabel: { distance: 4, color: MUTED, fontFamily: MONO, fontSize: 10 },
        pointer: { length: '70%', width: 2, itemStyle: { color: GOLD_LIGHT } },
        anchor: { show: true, size: 10, itemStyle: { color: '#0A0A0B', borderColor: GOLD, borderWidth: 2 } },
        title: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '42%'],
          fontFamily: MONO,
          fontSize: 22,
          color: '#F2EFE9',
          formatter: (v: number) => `${v.toFixed(1)} h`,
        },
        data: [{ value: POWER_RESERVE.start }],
      },
    ],
  };

  protected readonly gaugeMerge = computed<EChartsCoreOption>(() => ({
    series: [{ data: [{ value: Number(this.reserve().toFixed(2)) }] }],
  }));

  private drainTimer: ReturnType<typeof setInterval> | undefined;
  private windTimer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    afterNextRender(() => {
      this.scroll.requestRefresh();
      if (this.motion.reduced()) return;
      // The needle drains slowly in real time.
      this.drainTimer = setInterval(() => {
        if (this.winding()) return;
        this.reserve.update((v) => Math.max(0, v - POWER_RESERVE.drainPerSecond));
      }, 1000);
    });

    inject(DestroyRef).onDestroy(() => {
      clearInterval(this.drainTimer);
      clearTimeout(this.windTimer);
    });
  }

  /** Winds the mainspring: the needle sweeps back to a full 72 h. */
  protected rewind(): void {
    if (this.winding()) return;
    this.winding.set(true);
    this.reserve.set(POWER_RESERVE.max);
    clearTimeout(this.windTimer);
    this.windTimer = setTimeout(() => this.winding.set(false), 1200);
  }
}
