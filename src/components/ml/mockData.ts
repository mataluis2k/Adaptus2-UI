// Mock data for testing ML visualizations

export const mockRecommendationData = {
  clusters: [
    {
      id: 1,
      size: 25,
      average_similarity: 0.85,
      sample_items: [
        { id: 101, name: "Product A", category: "Electronics" },
        { id: 102, name: "Product B", category: "Electronics" },
        { id: 103, name: "Product C", category: "Electronics" }
      ]
    },
    {
      id: 2,
      size: 15,
      average_similarity: 0.78,
      sample_items: [
        { id: 201, name: "Product X", category: "Home" },
        { id: 202, name: "Product Y", category: "Home" },
        { id: 203, name: "Product Z", category: "Home" }
      ]
    },
    {
      id: 3,
      size: 10,
      average_similarity: 0.92,
      sample_items: [
        { id: 301, name: "Product M", category: "Clothing" },
        { id: 302, name: "Product N", category: "Clothing" },
        { id: 303, name: "Product O", category: "Clothing" }
      ]
    }
  ],
  stats: {
    total_items: 50,
    total_clusters: 3,
    average_cluster_size: 16.67,
    average_similarity: 0.85
  }
};

export const mockAnomalyData = {
  stats: {
    totalPoints: 1000,
    dimensions: 5,
    numClusters: 8,
    numAnomalies: 12,
    anomalyPercentage: 1.2
  },
  parameters: {
    eps: 0.5,
    minPts: 5,
    scalingRange: [0, 1],
    missingValueStrategy: "mean"
  },
  anomalies: [
    {
      id: 1,
      title: "Unusual Price Spike",
      content: "This product shows an unusual price increase compared to similar items.",
      image_url: "https://example.com/anomaly1.png",
      anomaly_score: 0.92,
      detection_date: "2025-03-01T12:00:00Z"
    },
    {
      id: 2,
      title: "Inventory Discrepancy",
      content: "Inventory levels for this product don't match expected patterns.",
      image_url: "https://example.com/anomaly2.png",
      anomaly_score: 0.87,
      detection_date: "2025-03-02T14:30:00Z"
    },
    {
      id: 3,
      title: "Unusual Review Pattern",
      content: "This product has received an unusual pattern of reviews.",
      image_url: "https://example.com/anomaly3.png",
      anomaly_score: 0.78,
      detection_date: "2025-03-03T09:15:00Z"
    }
  ],
  requestId: "anomaly-123456"
};

export const mockSentimentData = {
  overall_sentiment: {
    positive: 65,
    neutral: 25,
    negative: 10
  },
  sentiment_over_time: [
    { date: "2025-01", positive: 60, neutral: 30, negative: 10 },
    { date: "2025-02", positive: 65, neutral: 25, negative: 10 },
    { date: "2025-03", positive: 70, neutral: 20, negative: 10 }
  ],
  top_positive_keywords: ["excellent", "great", "love", "perfect", "awesome"],
  top_negative_keywords: ["poor", "bad", "disappointing", "broken", "expensive"],
  sample_comments: [
    {
      text: "This product exceeded my expectations. Highly recommended!",
      sentiment: "positive",
      score: 0.92
    },
    {
      text: "It's okay, but not worth the price.",
      sentiment: "neutral",
      score: 0.45
    },
    {
      text: "Broke after just two weeks of use. Very disappointed.",
      sentiment: "negative",
      score: 0.12
    }
  ]
};
