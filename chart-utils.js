/* 
 * BluePay Charting Utilities
 * Professional Data Visualization
 */

export function createPerformanceChart(ctx, labels, data) {
    if (!ctx) return;
    
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Earnings (₦)',
                data: data,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#06080f',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#8896aa', font: { size: 10 } }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#8896aa', font: { size: 10 } }
                }
            }
        }
    });
}
