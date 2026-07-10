export type CheckinDataPoint = {
  week: number;
  response: 'yes' | 'partially' | 'not' | null;
};

const COLOR = {
  yes: '#22C55E',
  partially: '#F59E0B',
  not: '#9CA3AF',
} as const;

export function buildDotChartUrl(points: CheckinDataPoint[]): string {
  if (points.length > 13) throw new Error('Dot chart supports at most 13 weeks');

  const solidDatasets = (['yes', 'partially', 'not'] as const).map((type) => ({
    backgroundColor: COLOR[type],
    borderColor: COLOR[type],
    pointRadius: 9,
    pointHoverRadius: 9,
    data: points
      .filter((p) => p.response === type)
      .map((p) => ({ x: p.week, y: 0 })),
  }));

  const hollowDataset = {
    backgroundColor: 'transparent',
    borderColor: '#9CA3AF',
    borderWidth: 2,
    pointRadius: 9,
    pointHoverRadius: 9,
    data: points.filter((p) => p.response === null).map((p) => ({ x: p.week, y: 0 })),
  };

  const config = {
    type: 'scatter',
    data: {
      datasets: [...solidDatasets, hollowDataset],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          display: false,
          min: 0,
          max: 14,
        },
        y: {
          display: false,
          min: -1,
          max: 1,
        },
      },
      layout: {
        padding: { left: 8, right: 8, top: 12, bottom: 12 },
      },
    },
  };

  const encoded = encodeURIComponent(JSON.stringify(config));
  return `https://quickchart.io/chart?c=${encoded}&w=400&h=80&bkg=white&version=4`;
}
