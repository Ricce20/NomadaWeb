import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DoughnutChartProps {
    labels: string[];
    data: number[];
    colors?: string[];
}

export function DoughnutChart({ 
    labels, 
    data,
    colors = [
        'rgb(59, 130, 246)',   // blue
        'rgb(16, 185, 129)',   // green
        'rgb(245, 158, 11)',   // amber
        'rgb(239, 68, 68)',    // red
        'rgb(139, 92, 246)',   // purple
        'rgb(236, 72, 153)',   // pink
    ]
}: DoughnutChartProps) {
    const chartData = {
        labels,
        datasets: [
            {
                data,
                backgroundColor: colors,
                borderColor: colors.map(color => color.replace('rgb', 'rgba').replace(')', ', 1)')),
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 15,
                    usePointStyle: true,
                }
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    return <Doughnut data={chartData} options={options} />;
}
