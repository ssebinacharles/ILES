function PerformanceTrendChart({
  evaluations = [],
  title = "Performance Trend",
}) {
  function toNumber(value) {
    if (value === null || value === undefined || value === "") {
      return null;
    }

    const numberValue = Number(value);

    if (Number.isNaN(numberValue)) {
      return null;
    }

    return numberValue;
  }

  const chartData = evaluations
    .map((item) => ({
      ...item,
      week: Number(item.week_number || item.week || 0),
      score: toNumber(item.average_score ?? item.score),
    }))
    .filter((item) => item.score !== null && item.week > 0)
    .sort((a, b) => a.week - b.week);

  if (chartData.length === 0) {
    return (
      <div style={chartBoxStyle}>
        <h2>{title}</h2>

        <p>
          The performance trend graph will appear after weekly logs are fully
          assessed by both supervisors.
        </p>
      </div>
    );
  }

  const width = 720;
  const height = 260;
  const padding = 45;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  function getX(index) {
    if (chartData.length === 1) {
      return padding + chartWidth / 2;
    }

    return padding + (index * chartWidth) / (chartData.length - 1);
  }

  function getY(score) {
    const safeScore = Math.max(0, Math.min(100, score));
    return padding + ((100 - safeScore) / 100) * chartHeight;
  }

  const points = chartData
    .map((item, index) => `${getX(index)},${getY(item.score)}`)
    .join(" ");

  const yLabels = [100, 75, 50, 25, 0];

  return (
    <div style={chartBoxStyle}>
      <h2>{title}</h2>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={svgStyle}
      >
        {yLabels.map((label) => {
          const y = getY(label);

          return (
            <g key={label}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
              />

              <text x={10} y={y + 5} fontSize="12" fill="#555">
                {label}%
              </text>
            </g>
          );
        })}

        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#333"
        />

        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#333"
        />

        <polyline
          points={points}
          fill="none"
          stroke="#1d4ed8"
          strokeWidth="3"
        />

        {chartData.map((item, index) => {
          const x = getX(index);
          const y = getY(item.score);

          return (
            <g key={item.id || `${item.week}-${index}`}>
              <circle cx={x} cy={y} r="6" fill="#1d4ed8" />

              <text
                x={x}
                y={y - 12}
                textAnchor="middle"
                fontSize="12"
                fill="#111"
              >
                {Number(item.score).toFixed(2)}%
              </text>

              <text
                x={x}
                y={height - 15}
                textAnchor="middle"
                fontSize="12"
                fill="#111"
              >
                Week {item.week}
              </text>
            </g>
          );
        })}
      </svg>

      <p style={descriptionStyle}>
        This graph shows weekly performance using the average of the academic
        supervisor score and workplace supervisor score.
      </p>
    </div>
  );
}

const chartBoxStyle = {
  border: "1px solid #ddd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "18px",
  backgroundColor: "#fff",
};

const svgStyle = {
  width: "100%",
  maxWidth: "850px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  background: "white",
};

const descriptionStyle = {
  marginTop: "10px",
};

export default PerformanceTrendChart;