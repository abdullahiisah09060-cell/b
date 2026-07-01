/**
 * === BluePay Data Visualization Utilities ===
 * Built on Canvas API for high performance.
 */

/**
 * Draws a lightweight investment maturity ring
 */
export function renderMaturityRing(canvasId, percent, color = "#1a56db") {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    const radius = (canvas.width / 2) - 8;
    const end = (Math.PI * 2 * (percent / 100)) - (Math.PI / 2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Track
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 6;
    ctx.stroke();

    // Fill
    ctx.beginPath();
    ctx.arc(x, y, radius, -Math.PI / 2, end);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.font = "bold 14px Inter";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${Math.round(percent)}%`, x, y);
}

/**
 * Renders a mini sparkline chart for history views
 */
export function renderSparkline(canvasId, dataPoints) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !dataPoints.length) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const max = Math.max(...dataPoints);
    const min = Math.min(...dataPoints);
    const range = max - min || 1;

    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";

    dataPoints.forEach((val, i) => {
        const x = (i / (dataPoints.length - 1)) * w;
        const y = h - ((val - min) / range * h);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();
}
