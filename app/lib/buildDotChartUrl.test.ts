import { describe, expect, it } from 'vitest';
import { buildDotChartUrl, type CheckinDataPoint } from './buildDotChartUrl';

describe('buildDotChartUrl', () => {
  it('returns a quickchart.io URL', () => {
    const url = buildDotChartUrl([{ week: 1, response: 'yes' }]);
    expect(url).toMatch(/^https:\/\/quickchart\.io\/chart\?/);
  });

  it('includes w=400, h=80, bkg=white, version=4 params', () => {
    const url = buildDotChartUrl([{ week: 1, response: 'yes' }]);
    expect(url).toContain('w=400');
    expect(url).toContain('h=80');
    expect(url).toContain('bkg=white');
    expect(url).toContain('version=4');
  });

  it('embeds a URL-encoded JSON config in the c= param', () => {
    const url = buildDotChartUrl([{ week: 1, response: 'yes' }]);
    const raw = new URL(url).searchParams.get('c');
    expect(raw).not.toBeNull();
    const config = JSON.parse(decodeURIComponent(raw!));
    expect(config.type).toBe('scatter');
    expect(Array.isArray(config.data.datasets)).toBe(true);
  });

  it('uses Chart.js v3+ options shape (requires version=4 on QuickChart)', () => {
    const url = buildDotChartUrl([
      { week: 1, response: 'yes' },
      { week: 2, response: null },
    ]);
    const config = JSON.parse(new URL(url).searchParams.get('c')!);

    // v2 used options.legend / options.scales.xAxes — QuickChart ignores these
    // unless version=4 is set. Lock the contract we depend on.
    expect(config.options.plugins.legend).toEqual({ display: false });
    expect(config.options.scales.x.display).toBe(false);
    expect(config.options.scales.y.display).toBe(false);
    expect(config.options.legend).toBeUndefined();
    expect(config.options.scales.xAxes).toBeUndefined();
  });

  it('encodes yes color #22C55E', () => {
    const url = buildDotChartUrl([{ week: 1, response: 'yes' }]);
    expect(decodeURIComponent(url)).toContain('#22C55E');
  });

  it('encodes partially color #F59E0B', () => {
    const url = buildDotChartUrl([{ week: 2, response: 'partially' }]);
    expect(decodeURIComponent(url)).toContain('#F59E0B');
  });

  it('encodes not color #9CA3AF', () => {
    const url = buildDotChartUrl([{ week: 3, response: 'not' }]);
    expect(decodeURIComponent(url)).toContain('#9CA3AF');
  });

  it('encodes null response as transparent (hollow dot)', () => {
    const url = buildDotChartUrl([{ week: 4, response: null }]);
    expect(decodeURIComponent(url)).toContain('transparent');
  });

  it('places each point at the correct x (week) value', () => {
    const points: CheckinDataPoint[] = [
      { week: 1, response: 'yes' },
      { week: 3, response: 'not' },
    ];
    const url = buildDotChartUrl(points);
    // URLSearchParams.get() decodes the value for us
    const raw = new URL(url).searchParams.get('c')!;
    const config = JSON.parse(raw);
    const allData = config.data.datasets.flatMap((d: { data: { x: number }[] }) => d.data);
    const xs = allData.map((p: { x: number }) => p.x).sort((a: number, b: number) => a - b);
    expect(xs).toEqual([1, 3]);
  });

  it('accepts an empty array', () => {
    expect(() => buildDotChartUrl([])).not.toThrow();
  });

  it('accepts exactly 13 weeks', () => {
    const points: CheckinDataPoint[] = Array.from({ length: 13 }, (_, i) => ({
      week: i + 1,
      response: 'yes',
    }));
    expect(() => buildDotChartUrl(points)).not.toThrow();
  });

  it('throws if more than 13 weeks are supplied', () => {
    const points: CheckinDataPoint[] = Array.from({ length: 14 }, (_, i) => ({
      week: i + 1,
      response: 'yes',
    }));
    expect(() => buildDotChartUrl(points)).toThrow('13 weeks');
  });
});
