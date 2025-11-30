import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface BarChartProps {
    labels: string[];
    data: number[];
    label: string;
    backgroundColor?: string;
    borderColor?: string;
}

export function BarChart({ 
    labels, 
    data, 
    label,
    backgroundColor = 'rgba(59, 130, 246, 0.8)',
    borderColor = 'rgb(59, 130, 246)'
}: BarChartProps) {
    const chartData = {
        labels,
        datasets: [
            {
                label,
                data,
                backgroundColor,
                borderColor,
                borderWidth: 1,
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
                callbacks: {
                    label: function(context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += context.parsed.y.toLocaleString();
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
                    precision: 0
                }
            },
            x: {
                grid: {
                    display: false,
                }
            }
        },
    };

    return <Bar data={chartData} options={options} />;
}
