const AnomalyRecord = ({ data }) => {
  const { stats, parameters, anomalies, requestId } = data;
  
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', padding: '1rem' }}>
      <h1>Anomaly Record</h1>
      
      {/* Stats Section */}
      <section style={{ marginBottom: '1rem' }}>
        <h2>Stats</h2>
        <ul>
          <li><strong>Total Points:</strong> {stats.totalPoints}</li>
          <li><strong>Dimensions:</strong> {stats.dimensions}</li>
          <li><strong>Clusters:</strong> {stats.numClusters}</li>
          <li><strong>Anomalies:</strong> {stats.numAnomalies}</li>
          <li><strong>Anomaly Percentage:</strong> {stats.anomalyPercentage.toFixed(2)}%</li>
        </ul>
      </section>

      {/* Parameters Section */}
      <section style={{ marginBottom: '1rem' }}>
        <h2>Parameters</h2>
        <ul>
          <li><strong>EPS:</strong> {parameters.eps}</li>
          <li><strong>minPts:</strong> {parameters.minPts}</li>
          <li>
            <strong>Scaling Range:</strong> {parameters.scalingRange.join(' - ')}
          </li>
          <li><strong>Missing Value Strategy:</strong> {parameters.missingValueStrategy}</li>
        </ul>
      </section>

      {/* Anomalies Section */}
      <section style={{ marginBottom: '1rem' }}>
        <h2>Anomalies</h2>
        {anomalies.map((anomaly) => (
          <div 
            key={anomaly.id} 
            style={{
              border: '1px solid #ccc', 
              borderRadius: '4px', 
              padding: '1rem', 
              marginBottom: '1rem'
            }}
          >
            <h3>{anomaly.title}</h3>
            {anomaly.image_url && (
              <img 
                src={anomaly.image_url} 
                alt={anomaly.title} 
                style={{ maxWidth: '100%', height: 'auto', marginBottom: '0.5rem' }} 
              />
            )}
            <p>{anomaly.content}</p>
            <p>
              <strong>Anomaly Score:</strong> {anomaly.anomaly_score}
            </p>
            <p>
              <strong>Detection Date:</strong>{' '}
              {new Date(anomaly.detection_date).toLocaleString()}
            </p>
          </div>
        ))}
      </section>

      {/* Request ID */}
      <footer>
        <small>Request ID: {requestId}</small>
      </footer>
    </div>
  );
};

export default AnomalyRecord;
