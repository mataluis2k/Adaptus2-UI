import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

// Register required components for Chart.js
Chart.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

const AnomalyGraph = ({ data }) => {
  // Bar chart: Use each anomaly's id and anomaly_score
  const barLabels = data.anomalies.map(anomaly => `ID: ${anomaly.id}`);
  const barDataValues = data.anomalies.map(anomaly => anomaly.anomaly_score);

  const barChartData = {
    labels: barLabels,
    datasets: [{
      label: 'Anomaly Score',
      data: barDataValues,
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
    }],
  };

  const barOptions = {
    scales: {
      y: {
        beginAtZero: true,
        max: Math.max(...barDataValues) + 1,
      },
    },
  };

  // Pie chart: Compare normal points (total points minus anomalies) with anomalies
  const normalPoints = data.stats.totalPoints - data.stats.numAnomalies;
  const pieChartData = {
    labels: ['Normal Points', 'Anomalies'],
    datasets: [{
      data: [normalPoints, data.stats.numAnomalies],
      backgroundColor: [
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 99, 132, 0.6)',
      ],
    }],
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '1rem' }}>
      <h1>Graphical Representation of Anomaly Data</h1>
      
      <section style={{ marginBottom: '2rem' }}>
        <h2>Anomaly Scores</h2>
        <Bar data={barChartData} options={barOptions} />
      </section>
      
      <section>
        <h2>Data Distribution</h2>
        <Pie data={pieChartData} />
      </section>
    </div>
  );
};

export default AnomalyGraph;
