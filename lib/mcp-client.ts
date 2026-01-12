import { spawn } from 'child_process';
import path from 'path';

interface MCPResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Call an MCP tool from the universal integration server
 *
 * @param toolName - Name of the MCP tool to call
 * @param args - Arguments to pass to the tool
 * @returns Promise with the tool's response
 */
export async function callMCPTool(toolName: string, args: any): Promise<MCPResponse> {
  return new Promise((resolve, reject) => {
    const mcpServerPath = path.join(process.cwd(), 'mcp-universal-integration', 'dist', 'index.js');

    // Spawn the MCP server process
    const mcpProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let outputData = '';
    let errorData = '';

    // Collect stdout
    mcpProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    // Collect stderr
    mcpProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    // Handle process completion
    mcpProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('[MCP Client] Process exited with code:', code);
        console.error('[MCP Client] Error output:', errorData);
        resolve({
          success: false,
          error: `MCP server exited with code ${code}: ${errorData}`
        });
        return;
      }

      try {
        // Parse MCP server response
        const lines = outputData.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const response = JSON.parse(lastLine);

        resolve({
          success: true,
          data: response
        });
      } catch (error: any) {
        console.error('[MCP Client] Failed to parse response:', error);
        resolve({
          success: false,
          error: `Failed to parse MCP response: ${error.message}`
        });
      }
    });

    // Handle process errors
    mcpProcess.on('error', (error) => {
      console.error('[MCP Client] Process error:', error);
      resolve({
        success: false,
        error: `MCP process error: ${error.message}`
      });
    });

    // Send the tool call request to stdin
    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    });

    mcpProcess.stdin.write(request + '\n');
    mcpProcess.stdin.end();
  });
}

/**
 * List available MCP tools
 */
export async function listMCPTools(): Promise<MCPResponse> {
  return new Promise((resolve, reject) => {
    const mcpServerPath = path.join(process.cwd(), 'mcp-universal-integration', 'dist', 'index.js');

    const mcpProcess = spawn('node', [mcpServerPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let outputData = '';
    let errorData = '';

    mcpProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    mcpProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    mcpProcess.on('close', (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          error: `MCP server exited with code ${code}`
        });
        return;
      }

      try {
        const lines = outputData.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        const response = JSON.parse(lastLine);

        resolve({
          success: true,
          data: response
        });
      } catch (error: any) {
        resolve({
          success: false,
          error: `Failed to parse response: ${error.message}`
        });
      }
    });

    mcpProcess.on('error', (error) => {
      resolve({
        success: false,
        error: `Process error: ${error.message}`
      });
    });

    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/list',
      params: {}
    });

    mcpProcess.stdin.write(request + '\n');
    mcpProcess.stdin.end();
  });
}
