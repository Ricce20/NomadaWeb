import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface LineChartProps {
    labels: string[];
    data: number[];
    label: string;
    borderColor?: string;
    backgroundColor?: string;
}

export function LineChart({ 
    labels, 
    data, 
    label,
    borderColor = 'rgb(59, 130, 246)',
    backgroundColor = 'rgba(59, 130, 246, 0.1)'
}: LineChartProps) {
    const chartData = {
        labels,
        datasets: [
            {
                label,
                data,
                borderColor,
                backgroundColor,
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += '$' + context.parsed.y.toLocaleString('es-MX', { minimumFractionDigits: 2 });
                        }
                        return label;
                    }
                }
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value: any) {
                        return '$' + value.toLocaleString('es-MX');
                    }
                }
            },
            x: {
                grid: {
                    display: false,
                }
            }
        },
    };

    return <Line data={chartData} options={options} />;
}
