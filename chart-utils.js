/**
 * === BluePay Visualization Utilities ===
 * Responsibility: Investment Progress Rings, History Charts.
 */

export function renderProgressRing(canvasId, percent, color = "#1a56db") {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    const radius = (canvas.width / 2) - 8;
    const endAngle = (Math.PI * 2 * (percent / 100)) - (Math.PI / 2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Background Circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // 2. Progress Arc
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.stroke();

    // 3. Text in Center
    ctx.font = "bold 14px Inter";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(percent)}%`, x, y);
}

export function initGrowthChart(canvasId, labels, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    return new Chart(canvas, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                borderColor: '#d4af37',
                backgroundColor: 'rgba(212,175,55,0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            }
        }
    });
}
