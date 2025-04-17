import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import AgentWorkflowBuilderComponent from './AgentWorkflowBuilder';

export default function AgentWorkflowManager() {
    const [workflows, setWorkflows] = useState([]);
    const [agents, setAgents] = useState([]);
    const [mcps, setMcps] = useState([]);
    const [selectedWorkflow, setSelectedWorkflow] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);
    
    // Load workflows on component mount
    useEffect(() => {
        fetchWorkflows();
        fetchAgents();
        fetchMcps();
    }, []);
    
    // Fetch workflows from the server
    const fetchWorkflows = async () => {
        try {
            setIsLoading(true);
            const { data } = await api.get('/mcp/workflows');
            // Ensure data is an array before setting it
            setWorkflows(Array.isArray(data) ? data : []);
            setIsLoading(false);
        } catch (error) {
            console.error('Error fetching workflows:', error);
            setWorkflows([]); // Set to empty array on error
            setIsLoading(false);
        }
    };
    
    // Fetch agents from the server
    const fetchAgents = async () => {
        try {
            const { data } = await api.get('/mcp/agents');
            setAgents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching agents:', error);
            setAgents([]);
        }
    };
    
    // Fetch MCPs from the server
    const fetchMcps = async () => {
        try {
            const { data } = await api.get('/mcp/mcps');
            setMcps(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching MCPs:', error);
            setMcps([]);
        }
    };
    
    // Load a specific workflow
    const loadWorkflow = async (id) => {
        if (!id) {
            console.error('Invalid workflow ID');
            return;
        }
        try {
            setIsLoading(true);
            const { data } = await api.get(`/mcp/workflows/${id}`);
            // Verify data is a valid workflow object with required properties
            if (data && typeof data === 'object') {
                // Ensure required properties exist with defaults if missing
                const safeWorkflow = {
                    ...data,
                    elements: Array.isArray(data.elements) ? data.elements : [],
                    connections: Array.isArray(data.connections) ? data.connections : [],
                    mcpAttachments: data.mcpAttachments || {},
                    inputs: Array.isArray(data.inputs) ? data.inputs : [],
                    outputs: Array.isArray(data.outputs) ? data.outputs : []
                };
                setSelectedWorkflow(safeWorkflow);
            } else {
                console.error('Invalid workflow data received');
                // Create an empty workflow structure as fallback
                setSelectedWorkflow({ name: 'New Workflow', elements: [], connections: [], mcpAttachments: {}, inputs: [], outputs: [] });
            }
            setIsLoading(false);
        } catch (error) {
            console.error('Error loading workflow:', error);
            setIsLoading(false);
        }
    };
    
    // Save a workflow to the server
    const saveWorkflow = async (workflowData) => {
        try {
            // Validate workflow data before saving
            if (!workflowData || typeof workflowData !== 'object') {
                throw new Error('Invalid workflow data');
            }
            
            // Ensure required properties exist
            const safeWorkflow = {
                ...workflowData,
                name: workflowData.name || 'Untitled Workflow',
                elements: Array.isArray(workflowData.elements) ? workflowData.elements : [],
                connections: Array.isArray(workflowData.connections) ? workflowData.connections : [],
                mcpAttachments: workflowData.mcpAttachments || {},
                inputs: Array.isArray(workflowData.inputs) ? workflowData.inputs : [],
                outputs: Array.isArray(workflowData.outputs) ? workflowData.outputs : []
            };
            
            setSaveStatus({ loading: true });
            
            let response;
            if (safeWorkflow.id) {
                // Update existing workflow
                response = await api.put(`/mcp/workflows/${safeWorkflow.id}`, safeWorkflow);
            } else {
                // Create new workflow
                response = await api.post('/mcp/workflows', safeWorkflow);
            }
            
            setSaveStatus({ success: true, message: 'Workflow saved successfully!' });
            fetchWorkflows(); // Refresh the list
            
            return response.data;
        } catch (error) {
            console.error('Error saving workflow:', error);
            setSaveStatus({ error: true, message: error?.message || 'An unknown error occurred' });
            throw error;
        }
    };
    
    // Delete a workflow
    const deleteWorkflow = async (id) => {
        if (!id) {
            console.error('Invalid workflow ID for deletion');
            return;
        }
        
        if (!window.confirm('Are you sure you want to delete this workflow?')) {
            return;
        }
        
        try {
            await api.delete(`/mcp/workflows/${id}`);
            fetchWorkflows(); // Refresh the list
            if (selectedWorkflow && selectedWorkflow.id === id) {
                setSelectedWorkflow(null);
            }
        } catch (error) {
            console.error('Error deleting workflow:', error);
            alert('Failed to delete workflow. Please try again.');
        }
    };
    
    return (
        <div className="bg-gray-50 min-h-screen">
            <header className="bg-white border-b border-gray-200 shadow-sm py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-bold text-gray-900">Agent Workflow Builder</h1>
                </div>
            </header>
            
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Display save status */}
                {saveStatus && saveStatus.loading && (
                    <div className="mb-4 rounded bg-blue-50 p-3 border border-blue-200">
                        <div className="text-sm text-blue-800 flex items-center">
                            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving workflow...
                        </div>
                    </div>
                )}
                
                {saveStatus && saveStatus.success && (
                    <div className="mb-4 rounded bg-green-50 p-3 border border-green-200">
                        <div className="text-sm text-green-800">
                            <span className="font-medium">Success!</span> {saveStatus.message}
                        </div>
                    </div>
                )}
                
                {saveStatus && saveStatus.error && (
                    <div className="mb-4 rounded bg-red-50 p-3 border border-red-200">
                        <div className="text-sm text-red-800">
                            <span className="font-medium">Error!</span> {saveStatus.message}
                        </div>
                    </div>
                )}
                
                {/* Workflow selection */}
                <div className="bg-white p-4 mb-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900">Workflows</h2>
                        <button
                            onClick={() => setSelectedWorkflow({ name: 'New Workflow', elements: [], connections: [], mcpAttachments: {}, inputs: [], outputs: [] })}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            New Workflow
                        </button>
                    </div>
                    
                    {isLoading ? (
                        <div className="mt-4 text-center py-4">
                            <svg className="animate-spin h-5 w-5 mx-auto text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {workflows.length === 0 ? (
                                        <tr>
                                            <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">
                                                No workflows found. Create a new one to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        workflows.map((workflow) => (
                                            <tr key={workflow.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{workflow.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {workflow.lastModified ? new Date(workflow.lastModified).toLocaleString() : 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button
                                                        onClick={() => loadWorkflow(workflow.id)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => deleteWorkflow(workflow.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                
                {/* Render the workflow builder when a workflow is selected */}
                {selectedWorkflow && agents && mcps && (
                    <AgentWorkflowBuilderComponent
                        workflow={selectedWorkflow}
                        agents={agents}
                        mcps={mcps}
                        onSave={saveWorkflow}
                    />
                )}
            </main>
        </div>
    );
}