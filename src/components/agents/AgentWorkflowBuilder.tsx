import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import { fetchAgents } from '../../api/agent';
import { api } from '../../api/client';

// Component for the entire agent workflow builder
const AgentWorkflowBuilder = ({ workflow, mcps, onSave }) => {
  // State for managing workflow name
  const [workflowName, setWorkflowName] = useState(workflow?.name || 'New Workflow');
  
  // State for workflow inputs and outputs
  const [workflowInputs, setWorkflowInputs] = useState(
    workflow?.inputs || [
      { id: 'input1', type: 'text', name: 'User Instructions', description: 'Text instructions provided by the user' }
    ]
  );
  const [workflowOutputs, setWorkflowOutputs] = useState(
    workflow?.outputs || [
      { id: 'output1', type: 'text', name: 'Final Response', description: 'Text response returned to the user' }
    ]
  );
  
  // State for managing agents
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [agentsPerPage] = useState(5); // Number of agents to display per page
  const [loadedFlows, setLoadedFlows] = useState([]);
  
  // State for available MCPs
  const [availableMcps, setAvailableMcps] = useState(mcps || []);
  
  // State for tracking canvas elements (positioned agents)
  const [canvasElements, setCanvasElements] = useState(workflow?.elements || []);
  
  // State for tracking connections between agents
  const [connections, setConnections] = useState(workflow?.connections || []);
  
  // State for tracking MCP attachments
  const [mcpAttachments, setMcpAttachments] = useState(workflow?.mcpAttachments || {});
  
  // State for connection drawing
  const [drawingConnection, setDrawingConnection] = useState(null);
  
  // State for selected element
  const [selectedElement, setSelectedElement] = useState(null);
  
  // State for context menu
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    elementId: null,
    type: null // 'link' or 'mcp'
  });
  
  // State for MCP configuration modal
  const [mcpConfigOpen, setMcpConfigOpen] = useState(false);
  const [currentMcpConfig, setCurrentMcpConfig] = useState({
    elementId: null,
    name: '',
    priority: 'medium',
    parameters: {
      responseTime: '1000',
      maxTokens: '2048',
      temperature: '0.7'
    }
  });
  
  // State for managing input/output config modals
  const [inputConfigOpen, setInputConfigOpen] = useState(false);
  const [outputConfigOpen, setOutputConfigOpen] = useState(false);
  const [currentInputOutput, setCurrentInputOutput] = useState({
    id: null,
    type: 'text',
    name: '',
    description: '',
    isInput: true, // flag to determine if we're editing an input or output
    isNew: true    // flag to determine if we're creating new or editing existing
  });
  
  // Ref for canvas
  const canvasRef = useRef(null);
  
  // Fetch agents and MCPs from server
  useEffect(() => {
    // Real API calls
    const fetchData = async () => {
      try {
        // Fetch agents using the existing API
        const agentData = await fetchAgents();
        
        // Transform agents to the format needed by the builder
        const formattedAgents = agentData.map(agent => ({
          id: agent.id,
          name: agent.id, // Use actual ID without "Agent " prefix
          avatar: '👨‍💼',
          attributes: {
            description: agent.description || 'No description provided',
            behaviorInstructions: agent.behaviorInstructions || 'No behavior instructions provided',
            functionalDirectives: agent.functionalDirectives || 'No functional directives provided',
            knowledgeConstraints: agent.knowledgeConstraints || 'No knowledge constraints provided',
            ethicalGuidelines: agent.ethicalGuidelines || 'No ethical guidelines provided'
          }
        }));
        
        setAgents(formattedAgents);
        setFilteredAgents(formattedAgents);
        
        // For MCPs, if they weren't passed as props, fetch them
        if (!mcps || mcps.length === 0) {
          try {
            const { data: mcpData } = await api.get('/api/mcps');
            setAvailableMcps(mcpData);
          } catch (error) {
            console.error('Error fetching MCPs:', error);
            // Set default MCPs if the API fails
            setAvailableMcps([
              {
                id: 'mcp1',
                name: 'Email Sender',
                description: 'Sends emails to specified recipients',
                category: 'Communication',
                parameters: [
                  { name: 'recipient', type: 'string', required: true },
                  { name: 'subject', type: 'string', required: true },
                  { name: 'body', type: 'string', required: true },
                  { name: 'cc', type: 'string', required: false }
                ]
              },
              {
                id: 'mcp2',
                name: 'Database Query',
                description: 'Executes SQL queries on connected databases',
                category: 'Data',
                parameters: [
                  { name: 'database', type: 'string', required: true },
                  { name: 'query', type: 'string', required: true },
                  { name: 'timeout', type: 'number', required: false }
                ]
              }
            ]);
          }
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };
    
    fetchData();
  }, [mcps]);
  
  // Filter agents when search term changes
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredAgents(agents);
    } else {
      const filtered = agents.filter(agent => 
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.attributes.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAgents(filtered);
    }
    // Reset to first page when filtering
    setCurrentPage(1);
  }, [searchTerm, agents]);
  
  // Fetch saved flows
  const fetchSavedFlows = async () => {
    try {
      const { data } = await api.get('/api/workflows');
      setLoadedFlows(data || []);
    } catch (error) {
      console.error('Error fetching saved workflows:', error);
      setLoadedFlows([]);
    }
  };
  
  useEffect(() => {
    fetchSavedFlows();
  }, []);
  
  // Load a specific flow
  const loadFlow = async (flowId) => {
    try {
      const { data } = await api.get(`/api/workflows/${flowId}`);
      
      if (data) {
        setWorkflowName(data.name || 'Unnamed Workflow');
        setCanvasElements(data.elements || []);
        setConnections(data.connections || []);
        setMcpAttachments(data.mcpAttachments || {});
        
        // Load inputs and outputs if they exist
        if (data.inputs) {
          setWorkflowInputs(data.inputs);
        }
        
        if (data.outputs) {
          setWorkflowOutputs(data.outputs);
        }
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
    }
  };
  
  // Add a new input or output
  const addNewInputOutput = (isInput) => {
    setCurrentInputOutput({
      id: `${isInput ? 'input' : 'output'}-${Date.now()}`,
      type: 'text',
      name: isInput ? 'New Input' : 'New Output',
      description: '',
      isInput,
      isNew: true
    });
    
    if (isInput) {
      setInputConfigOpen(true);
    } else {
      setOutputConfigOpen(true);
    }
  };
  
  // Edit existing input or output
  const editInputOutput = (item, isInput) => {
    setCurrentInputOutput({
      ...item,
      isInput,
      isNew: false
    });
    
    if (isInput) {
      setInputConfigOpen(true);
    } else {
      setOutputConfigOpen(true);
    }
  };
  
  // Delete input or output
  const deleteInputOutput = (id, isInput) => {
    if (isInput) {
      setWorkflowInputs(workflowInputs.filter(input => input.id !== id));
    } else {
      setWorkflowOutputs(workflowOutputs.filter(output => output.id !== id));
    }
  };
  
  // Save input or output configuration
  const saveInputOutputConfig = () => {
    if (currentInputOutput.isInput) {
      if (currentInputOutput.isNew) {
        setWorkflowInputs([...workflowInputs, {
          id: currentInputOutput.id,
          type: currentInputOutput.type,
          name: currentInputOutput.name,
          description: currentInputOutput.description
        }]);
      } else {
        setWorkflowInputs(workflowInputs.map(input => 
          input.id === currentInputOutput.id ? {
            ...input,
            type: currentInputOutput.type,
            name: currentInputOutput.name,
            description: currentInputOutput.description
          } : input
        ));
      }
      setInputConfigOpen(false);
    } else {
      if (currentInputOutput.isNew) {
        setWorkflowOutputs([...workflowOutputs, {
          id: currentInputOutput.id,
          type: currentInputOutput.type,
          name: currentInputOutput.name,
          description: currentInputOutput.description
        }]);
      } else {
        setWorkflowOutputs(workflowOutputs.map(output => 
          output.id === currentInputOutput.id ? {
            ...output,
            type: currentInputOutput.type,
            name: currentInputOutput.name,
            description: currentInputOutput.description
          } : output
        ));
      }
      setOutputConfigOpen(false);
    }
  };
  
  // Handle drag start from agent list
  const handleDragStart = (e, agent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(agent));
  };
  
  // Handle drop on canvas
  const handleDrop = (e) => {
    e.preventDefault();
    
    const agentData = JSON.parse(e.dataTransfer.getData('application/json'));
    
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - canvasRect.left;
    const y = e.clientY - canvasRect.top;
    
    // Create new canvas element
    const newElement = {
      id: `element-${Date.now()}`,
      x,
      y,
      agentId: agentData.id
    };
    
    setCanvasElements([...canvasElements, newElement]);
  };
  
  // Allow drop
  const allowDrop = (e) => {
    e.preventDefault();
  };
  
  // Start drawing connection
  const startConnection = (elementId) => {
    setDrawingConnection({ from: elementId });
  };
  
  // Complete connection
  const completeConnection = (elementId) => {
    if (drawingConnection && drawingConnection.from !== elementId) {
      const newConnection = {
        id: `conn-${Date.now()}`,
        from: drawingConnection.from,
        to: elementId
      };
      
      setConnections([...connections, newConnection]);
      setDrawingConnection(null);
    }
  };
  
  // Toggle MCP attachment and open configuration modal
  const toggleMCP = (elementId, mcpId = null) => {
    // Check if this element already has an MCP attached
    if (!mcpAttachments[elementId]) {
      // If a specific MCP was selected from the context menu
      if (mcpId) {
        const selectedMcp = availableMcps.find(mcp => mcp.id === mcpId);
        if (selectedMcp) {
          // Create default parameter values based on MCP definition
          const paramValues = {};
          selectedMcp.parameters.forEach(param => {
            paramValues[param.name] = param.required ? 
              (param.type === 'string' ? '' : 
               param.type === 'number' ? 0 : 
               param.type === 'datetime' ? new Date().toISOString() : 
               param.type === 'array' ? [] : null) : null;
          });
          
          setCurrentMcpConfig({
            elementId,
            mcpId: selectedMcp.id,
            name: selectedMcp.name,
            description: selectedMcp.description,
            category: selectedMcp.category,
            priority: 'medium',
            parameters: paramValues
          });
        } else {
          // Fallback to default config if MCP not found
          setCurrentMcpConfig({
            elementId,
            name: 'Default MCP',
            priority: 'medium',
            parameters: {
              responseTime: '1000',
              maxTokens: '2048',
              temperature: '0.7'
            }
          });
        }
      } else {
        // Opening MCP config for the first time with default values
        setCurrentMcpConfig({
          elementId,
          name: 'Default MCP',
          priority: 'medium',
          parameters: {
            responseTime: '1000',
            maxTokens: '2048',
            temperature: '0.7'
          }
        });
      }
      setMcpConfigOpen(true);
    } else {
      // Simply removing an existing MCP
      const newMcpAttachments = {...mcpAttachments};
      delete newMcpAttachments[elementId];
      setMcpAttachments(newMcpAttachments);
    }
  };
  
  // Save MCP configuration
  const saveMcpConfig = () => {
    if (currentMcpConfig.elementId) {
      // Ensure we're storing the full configuration object
      const updatedConfig = {
        ...currentMcpConfig,
        parameters: currentMcpConfig.parameters || {
          responseTime: '1000',
          maxTokens: '2048',
          temperature: '0.7'
        }
      };
      
      setMcpAttachments({
        ...mcpAttachments,
        [currentMcpConfig.elementId]: updatedConfig
      });
      setMcpConfigOpen(false);
    }
  };
  
  // Save workflow
  const saveWorkflow = async () => {
    const workflowData = {
      ...(workflow?.id ? { id: workflow.id } : {}),
      name: workflowName,
      created: workflow?.created || new Date().toISOString(),
      lastModified: new Date().toISOString(),
      elements: canvasElements,
      connections,
      mcpAttachments,
      inputs: workflowInputs,
      outputs: workflowOutputs,
      metadata: {
        description: `Workflow for ${workflowName}`,
        version: "1.0",
        tags: [],
        createdBy: "current_user"
      }
    };
    
    try {
      // Use the onSave prop to save the workflow
      if (onSave) {
        await onSave(workflowData);
      } else {
        // Fallback direct API call if onSave is not provided
        if (workflow?.id) {
          await api.put(`/api/workflows/${workflow.id}`, workflowData);
        } else {
          await api.post('/api/workflows', workflowData);
        }
        alert('Workflow saved successfully!');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert(`Error saving workflow: ${error.message}`);
    }
  };
  
  // Handle selection of an element
  const selectElement = (element) => {
    setSelectedElement(element);
  };
  
  // Handle click outside to close context menu
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu]);
  
  // Render agent details panel when an agent is selected
  const renderAgentDetails = () => {
    if (!selectedElement) return null;
    
    const element = canvasElements.find(el => el.id === selectedElement);
    if (!element) return null;
    
    const agent = agents.find(a => a.id === element.agentId);
    if (!agent) return null;
    
    return (
      <div className="p-4 bg-white rounded shadow-md">
        <h3 className="text-lg font-semibold mb-2">{agent.name} Details</h3>
        <div className="mb-2">
          <h4 className="font-medium">Description</h4>
          <p className="text-sm">{agent.attributes.description}</p>
        </div>
        <div className="mb-2">
          <h4 className="font-medium">Behavior Instructions</h4>
          <p className="text-sm">{agent.attributes.behaviorInstructions}</p>
        </div>
        <div className="mb-2">
          <h4 className="font-medium">Functional Directives</h4>
          <p className="text-sm">{agent.attributes.functionalDirectives}</p>
        </div>
        <div className="mb-2">
          <h4 className="font-medium">Knowledge Constraints</h4>
          <p className="text-sm">{agent.attributes.knowledgeConstraints}</p>
        </div>
        <div className="mb-2">
          <h4 className="font-medium">Ethical Guidelines</h4>
          <p className="text-sm">{agent.attributes.ethicalGuidelines}</p>
        </div>
        <div className="mt-4 flex justify-between">
          <button 
            className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
            onClick={() => toggleMCP(selectedElement)}
          >
            {mcpAttachments[selectedElement] ? 'Remove MCP' : 'Attach MCP'}
          </button>
          <button 
            className="bg-red-500 text-white px-2 py-1 rounded text-sm"
            onClick={() => {
              setCanvasElements(canvasElements.filter(el => el.id !== selectedElement));
              setConnections(connections.filter(conn => conn.from !== selectedElement && conn.to !== selectedElement));
              setSelectedElement(null);
            }}
          >
            Remove
          </button>
        </div>
      </div>
    );
  };
  
  // Input/Output Configuration Modal
  const renderInputOutputConfigModal = (isInput) => {
    const isOpen = isInput ? inputConfigOpen : outputConfigOpen;
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
        <div className="bg-white rounded-lg shadow-lg p-6 w-96">
          <h3 className="text-xl font-semibold mb-4">
            {currentInputOutput.isNew ? 
              `Add New ${isInput ? 'Input' : 'Output'}` : 
              `Edit ${isInput ? 'Input' : 'Output'}`}
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={currentInputOutput.name}
              onChange={(e) => setCurrentInputOutput({
                ...currentInputOutput,
                name: e.target.value
              })}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full p-2 border rounded"
              value={currentInputOutput.type}
              onChange={(e) => setCurrentInputOutput({
                ...currentInputOutput,
                type: e.target.value
              })}
            >
              <option value="text">Text Input</option>
              <option value="webhook">Webhook</option>
              <option value="email">Email</option>
              <option value="file">File Upload</option>
              <option value="database">Database</option>
              <option value="api">External API</option>
              {isInput ? null : (
                <>
                  <option value="notification">Notification</option>
                  <option value="action">System Action</option>
                </>
              )}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              className="w-full p-2 border rounded"
              rows="3"
              value={currentInputOutput.description}
              onChange={(e) => setCurrentInputOutput({
                ...currentInputOutput,
                description: e.target.value
              })}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 border rounded"
              onClick={() => isInput ? setInputConfigOpen(false) : setOutputConfigOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={saveInputOutputConfig}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // MCP Configuration Modal
  const renderMcpConfigModal = () => {
    if (!mcpConfigOpen) return null;
    
    // Determine if we're configuring a standard MCP or a specific tool MCP
    const isToolMcp = currentMcpConfig.mcpId && availableMcps.find(mcp => mcp.id === currentMcpConfig.mcpId);
    const selectedMcp = isToolMcp ? availableMcps.find(mcp => mcp.id === currentMcpConfig.mcpId) : null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
        <div className="bg-white rounded-lg shadow-lg p-6 w-96 max-h-screen overflow-y-auto">
          <h3 className="text-xl font-semibold mb-4">
            {isToolMcp ? `Configure ${selectedMcp.name} MCP` : 'Configure MCP'}
          </h3>
          
          {isToolMcp && (
            <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
              <p className="font-medium">Description:</p>
              <p>{selectedMcp.description}</p>
              <p className="mt-1 text-xs text-gray-600">Category: {selectedMcp.category}</p>
            </div>
          )}
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">MCP Name</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={currentMcpConfig.name}
              onChange={(e) => setCurrentMcpConfig({
                ...currentMcpConfig,
                name: e.target.value
              })}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              className="w-full p-2 border rounded"
              value={currentMcpConfig.priority}
              onChange={(e) => setCurrentMcpConfig({
                ...currentMcpConfig,
                priority: e.target.value
              })}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Parameters</label>
            
            <div className="space-y-2">
              {isToolMcp ? (
                // Tool-specific parameters
                selectedMcp.parameters.map((param, index) => (
                  <div key={index} className="flex flex-col mb-2">
                    <div className="flex items-center">
                      <span className="w-32 text-sm font-medium">
                        {param.name}
                        {param.required && <span className="text-red-500">*</span>}:
                      </span>
                      <input
                        type={param.type === 'number' ? 'number' : 'text'}
                        className="flex-1 p-1 border rounded"
                        placeholder={`Enter ${param.name}...`}
                        value={currentMcpConfig.parameters[param.name] || ''}
                        onChange={(e) => setCurrentMcpConfig({
                          ...currentMcpConfig,
                          parameters: {
                            ...currentMcpConfig.parameters,
                            [param.name]: e.target.value
                          }
                        })}
                      />
                    </div>
                    <div className="ml-32 text-xs text-gray-500">
                      {param.type} {param.required ? '(required)' : '(optional)'}
                    </div>
                  </div>
                ))
              ) : (
                // Default parameters
                <>
                  <div className="flex items-center">
                    <span className="w-32 text-sm">Response Time (ms):</span>
                    <input
                      type="text"
                      className="flex-1 p-1 border rounded"
                      value={currentMcpConfig.parameters.responseTime || ''}
                      onChange={(e) => setCurrentMcpConfig({
                        ...currentMcpConfig,
                        parameters: {
                          ...currentMcpConfig.parameters,
                          responseTime: e.target.value
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <span className="w-32 text-sm">Max Tokens:</span>
                    <input
                      type="text"
                      className="flex-1 p-1 border rounded"
                      value={currentMcpConfig.parameters.maxTokens || ''}
                      onChange={(e) => setCurrentMcpConfig({
                        ...currentMcpConfig,
                        parameters: {
                          ...currentMcpConfig.parameters,
                          maxTokens: e.target.value
                        }
                      })}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <span className="w-32 text-sm">Temperature:</span>
                    <input
                      type="text"
                      className="flex-1 p-1 border rounded"
                      value={currentMcpConfig.parameters.temperature || ''}
                      onChange={(e) => setCurrentMcpConfig({
                        ...currentMcpConfig,
                        parameters: {
                          ...currentMcpConfig.parameters,
                          temperature: e.target.value
                        }
                      })}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 border rounded"
              onClick={() => setMcpConfigOpen(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={saveMcpConfig}
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Context Menu
  const renderContextMenu = () => {
    if (!contextMenu.visible) return null;
    
    // Group MCPs by category for better organization
    const mcpsByCategory = _.groupBy(availableMcps, 'category');
    
    return (
      <div 
        className="fixed bg-white shadow-lg rounded-md p-2 z-20 w-64"
        style={{ 
          left: `${contextMenu.x}px`, 
          top: `${contextMenu.y}px` 
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 py-1 text-sm font-bold border-b mb-1">
          Actions
        </div>
        
        {/* Link to other agent option */}
        <div
          className="px-2 py-1 hover:bg-blue-100 rounded cursor-pointer flex items-center text-sm"
          onClick={() => {
            setContextMenu({ ...contextMenu, visible: false });
            startConnection(contextMenu.elementId);
          }}
        >
          <span className="mr-2">🔗</span> Link to another agent
        </div>
        
        {/* Remove agent option */}
        <div
          className="px-2 py-1 hover:bg-blue-100 rounded cursor-pointer flex items-center text-sm"
          onClick={() => {
            setContextMenu({ ...contextMenu, visible: false });
            setCanvasElements(canvasElements.filter(el => el.id !== contextMenu.elementId));
            setConnections(connections.filter(conn => 
              conn.from !== contextMenu.elementId && conn.to !== contextMenu.elementId
            ));
            if (selectedElement === contextMenu.elementId) {
              setSelectedElement(null);
            }
          }}
        >
          <span className="mr-2">🗑️</span> Remove agent
        </div>
        
        {/* MCPs section */}
        <div className="px-2 py-1 text-sm font-bold border-b mt-2 mb-1">
          Attach MCP
        </div>
        
        {/* If MCP already attached, show option to remove */}
        {mcpAttachments[contextMenu.elementId] && (
          <div
            className="px-2 py-1 hover:bg-red-100 rounded cursor-pointer flex items-center text-sm text-red-600"
            onClick={() => {
              setContextMenu({ ...contextMenu, visible: false });
              toggleMCP(contextMenu.elementId);
            }}
          >
            <span className="mr-2">❌</span> Remove current MCP
          </div>
        )}
        
        {/* Default MCP option */}
        <div
          className="px-2 py-1 hover:bg-blue-100 rounded cursor-pointer flex items-center text-sm"
          onClick={() => {
            setContextMenu({ ...contextMenu, visible: false });
            toggleMCP(contextMenu.elementId);
          }}
        >
          <span className="mr-2">⚙️</span> Custom MCP
        </div>
        
        {/* List available MCPs by category */}
        <div className="max-h-64 overflow-y-auto">
          {Object.entries(mcpsByCategory).map(([category, mcps]) => (
            <div key={category}>
              <div className="px-2 py-1 text-xs font-semibold bg-gray-100 mt-1">
                {category}
              </div>
              {mcps.map(mcp => (
                <div
                  key={mcp.id}
                  className="px-2 py-1 hover:bg-blue-100 rounded cursor-pointer flex items-center text-sm ml-2"
                  onClick={() => {
                    setContextMenu({ ...contextMenu, visible: false });
                    toggleMCP(contextMenu.elementId, mcp.id);
                  }}
                >
                  <span className="mr-2">🔌</span> {mcp.name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Get current agents for pagination
  const indexOfLastAgent = currentPage * agentsPerPage;
  const indexOfFirstAgent = indexOfLastAgent - agentsPerPage;
  const currentAgents = filteredAgents.slice(indexOfFirstAgent, indexOfLastAgent);
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / agentsPerPage));
  
  // Change page
  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* MCP Configuration Modal */}
      {renderMcpConfigModal()}
      
      {/* Input/Output Configuration Modals */}
      {renderInputOutputConfigModal(true)}
      {renderInputOutputConfigModal(false)}
      
      {/* Context Menu */}
      {renderContextMenu()}
      
      {/* Header */}
      <div className="bg-gray-800 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="bg-gray-700 text-white p-2 rounded"
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="bg-gray-700 text-white p-2 rounded"
              onChange={(e) => {
                if (e.target.value) {
                  loadFlow(e.target.value);
                }
              }}
            >
              <option value="">Load Workflow</option>
              {loadedFlows.map(flow => (
                <option key={flow.id} value={flow.id}>{flow.name}</option>
              ))}
            </select>
            <button 
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={saveWorkflow}
            >
              Save
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Agent list with search and pagination */}
        <div className="w-64 bg-gray-100 p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-2">Agents</h2>
          
          {/* Search bar */}
          <div className="mb-3">
            <input
              type="text"
              placeholder="Search agents..."
              className="w-full p-2 border rounded text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Agent categories */}
          <div className="mb-3 flex gap-1">
            <button 
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
              onClick={() => setSearchTerm('')}
            >
              All
            </button>
            <button 
              className="px-2 py-1 bg-gray-300 rounded text-xs"
              onClick={() => setSearchTerm('custom')}
            >
              Custom
            </button>
            <button 
              className="px-2 py-1 bg-gray-300 rounded text-xs"
              onClick={() => setSearchTerm('default')}
            >
              Default
            </button>
          </div>
          
          {/* Scrollable agent list */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-3 min-h-0">
              {currentAgents.map(agent => (
                <div 
                  key={agent.id}
                  className="bg-white p-3 rounded shadow cursor-move flex items-center"
                  draggable
                  onDragStart={(e) => handleDragStart(e, agent)}
                >
                  <div className="text-2xl mr-3">{agent.avatar}</div>
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-xs text-gray-600">{agent.attributes.description}</div>
                  </div>
                </div>
              ))}
              
              {currentAgents.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <p>No agents found.</p>
                  {searchTerm ? (
                    <p className="text-sm">Try a different search term.</p>
                  ) : (
                    <p className="text-sm">Add agents in the Agent Profiles section.</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Pagination controls */}
          <div className="mt-3 flex justify-between items-center text-sm">
            <button 
              className={`px-2 py-1 rounded ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 cursor-pointer'}`}
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
              className={`px-2 py-1 rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 hover:bg-gray-300 cursor-pointer'}`}
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
        
        {/* Right panel - Canvas and details */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Canvas */}
          <div 
            ref={canvasRef}
            className="flex-1 bg-white border-l border-gray-300 relative overflow-auto"
            onDragOver={allowDrop}
            onDrop={handleDrop}
          >
            {/* Render connections */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {connections.map(conn => {
                const fromElement = canvasElements.find(el => el.id === conn.from);
                const toElement = canvasElements.find(el => el.id === conn.to);
                
                if (!fromElement || !toElement) return null;
                
                return (
                  <line
                    key={conn.id}
                    x1={fromElement.x + 50}
                    y1={fromElement.y + 50}
                    x2={toElement.x + 50}
                    y2={toElement.y + 50}
                    stroke="black"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              
              {/* Drawing connection line */}
              {drawingConnection && drawingConnection.mouseX && (
                <line
                  x1={drawingConnection.startX}
                  y1={drawingConnection.startY}
                  x2={drawingConnection.mouseX}
                  y2={drawingConnection.mouseY}
                  stroke="black"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              )}
              
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" />
                </marker>
              </defs>
            </svg>
            
            {/* Render canvas elements */}
            {canvasElements.map(element => {
              const agent = agents.find(a => a.id === element.agentId);
              if (!agent) return null;
              
              return (
                <div
                  key={element.id}
                  className={`absolute w-24 h-24 flex flex-col items-center justify-center 
                    bg-white rounded-lg shadow-lg cursor-pointer border-2
                    ${selectedElement === element.id ? 'border-blue-500' : 'border-gray-200'}`}
                  style={{ 
                    left: `${element.x}px`, 
                    top: `${element.y}px` 
                  }}
                  onClick={() => selectElement(element.id)}
                  onDoubleClick={() => startConnection(element.id)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    
                    // If we're in the middle of drawing a connection, complete it
                    if (drawingConnection) {
                      completeConnection(element.id);
                      return;
                    }
                    
                    // Otherwise show the context menu
                    setContextMenu({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      elementId: element.id
                    });
                  }}
                >
                  <div className="text-3xl mb-1">{agent.avatar}</div>
                  <div className="text-xs text-center font-medium">{agent.name}</div>
                  {mcpAttachments[element.id] && (
                    <div 
                      className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs px-1 rounded-full cursor-pointer flex items-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Check if mcpAttachments[element.id] is an object with configuration
                        const mcpConfig = typeof mcpAttachments[element.id] === 'object' ? 
                          mcpAttachments[element.id] : 
                          { name: 'MCP', priority: 'medium' };
                        
                        setCurrentMcpConfig({
                          elementId: element.id,
                          ...mcpConfig
                        });
                        setMcpConfigOpen(true);
                      }}
                    >
                      <span>
                        {typeof mcpAttachments[element.id] === 'object' && mcpAttachments[element.id].name 
                          ? mcpAttachments[element.id].name 
                          : 'MCP'}
                      </span>
                      {typeof mcpAttachments[element.id] === 'object' && mcpAttachments[element.id].priority && (
                        <span className="ml-1 text-xs">
                          {mcpAttachments[element.id].priority.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Details panel */}
          <div className="h-64 bg-gray-100 p-4 overflow-y-auto border-t border-gray-300">
            {selectedElement ? renderAgentDetails() : (
              <div className="text-center text-gray-500 py-6">
                <p>Select an agent to view details</p>
                <p className="text-sm mt-2">
                  Drag agents from the left panel to the canvas<br />
                  Double-click to start a connection<br />
                  Right-click to complete a connection
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Workflow Configuration Panel */}
      <div className="bg-gray-100 p-4 border-t border-gray-300">
        <div className="flex flex-wrap gap-4">
          {/* Inputs Section */}
          <div className="flex-1 min-w-64 bg-white p-3 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Workflow Inputs</h3>
              <button 
                className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                onClick={() => addNewInputOutput(true)}
              >
                Add Input
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {workflowInputs.map(input => (
                <div key={input.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{input.name}</div>
                    <div className="text-xs text-gray-600">Type: {input.type}</div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => editInputOutput(input, true)}
                    >
                      Edit
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteInputOutput(input.id, true)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Outputs Section */}
          <div className="flex-1 min-w-64 bg-white p-3 rounded shadow">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Workflow Outputs</h3>
              <button 
                className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                onClick={() => addNewInputOutput(false)}
              >
                Add Output
              </button>
            </div>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {workflowOutputs.map(output => (
                <div key={output.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{output.name}</div>
                    <div className="text-xs text-gray-600">Type: {output.type}</div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      className="text-blue-500 hover:text-blue-700"
                      onClick={() => editInputOutput(output, false)}
                    >
                      Edit
                    </button>
                    <button 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteInputOutput(output.id, false)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentWorkflowBuilder;