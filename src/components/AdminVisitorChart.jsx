import { useMemo } from 'react'
import {
    Gridline,
    GridlineSeries,
    Line,
    LineChart,
    LineSeries,
    LinearXAxis,
    LinearXAxisTickLabel,
    LinearXAxisTickSeries,
    LinearYAxis,
    LinearYAxisTickSeries,
} from 'reaviz'

const COLORS = ['#1B3A8C', '#F97316']
const RANGE_LABELS = { '7d': '7 hari', '1m': '1 bulan', '6m': '6 bulan', '1y': '1 tahun' }

export default function AdminVisitorChart({ series, range }) {
    const data = useMemo(() => [
        {
            key: 'Kunjungan',
            data: series.map((point) => ({ key: new Date(`${point.date}T00:00:00`), data: point.visits })),
        },
        {
            key: 'Pengunjung unik',
            data: series.map((point) => ({ key: new Date(`${point.date}T00:00:00`), data: point.unique })),
        },
    ], [series])

    const formatDate = (value) => {
        const date = new Date(value)
        if (range === '7d') return date.toLocaleDateString('id-ID', { weekday: 'short' })
        if (range === '1m') return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
        return date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' })
    }

    return (
        <div
            className="h-[300px] w-full"
            style={{ fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif" }}
            role="img"
            aria-label={`Line chart kunjungan dan pengunjung unik untuk periode ${RANGE_LABELS[range]}`}
        >
            <LineChart
                id={`admin-visitor-chart-${range}`}
                height={300}
                data={data}
                xAxis={
                    <LinearXAxis
                        type="time"
                        tickSeries={
                            <LinearXAxisTickSeries
                                tickSize={10}
                                label={<LinearXAxisTickLabel format={formatDate} fill="#6B7280" />}
                            />
                        }
                    />
                }
                yAxis={
                    <LinearYAxis
                        axisLine={null}
                        tickSeries={<LinearYAxisTickSeries line={null} label={null} tickSize={10} />}
                    />
                }
                series={
                    <LineSeries
                        type="grouped"
                        colorScheme={COLORS}
                        line={<Line strokeWidth={3} glow={{ blur: 6 }} />}
                    />
                }
                gridlines={<GridlineSeries line={<Gridline strokeColor="#D8D5CC" />} />}
            />
        </div>
    )
}
