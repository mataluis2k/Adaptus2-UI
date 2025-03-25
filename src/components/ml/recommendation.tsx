import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const ClusteringGraph = ({ payload }) => {
  const svgRef = useRef(null);

  useEffect(() => {
    // Only run if payload is provided.
    if (!payload || !payload.clusters) return;

    const clusters = payload.clusters;
    const width = 600;
    const height = 400;

    // Create the SVG container.
    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("border", "1px solid #ccc");

    // Map clusters to nodes with a radius based on the cluster size.
    const nodes = clusters.map(cluster => ({
      id: cluster.id,
      size: cluster.size,
      radius: Math.sqrt(cluster.size) * 10, // Adjust scaling factor as needed
      averageSimilarity: cluster.average_similarity,
      sampleItems: cluster.sample_items
    }));

    // Set up a force simulation to position nodes.
    const simulation = d3.forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(50))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(d => d.radius + 10))
      .on("tick", ticked);

    function ticked() {
      // Bind nodes data to groups.
      const u = svg.selectAll('g.node')
        .data(nodes, d => d.id);

      // Enter new nodes.
      const nodeEnter = u.enter()
        .append('g')
        .attr('class', 'node');

      // Append a circle for each node.
      nodeEnter.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', (d, i) => d3.schemeCategory10[i % 10])
        .attr('stroke', '#333')
        .attr('stroke-width', 1);

      // Append text labels for each node.
      nodeEnter.append('text')
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text(d => `Cluster ${d.id}`);

      // Update node positions.
      u.merge(nodeEnter)
        .attr('transform', d => `translate(${d.x}, ${d.y})`);
    }

    // Cleanup simulation on component unmount.
    return () => simulation.stop();
  }, [payload]);

  return (
    <div>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default ClusteringGraph;