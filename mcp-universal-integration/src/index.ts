#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import path from "path";

// Import tools
import { discoverIntegration } from "./tools/discover.js";
import { connectIntegration } from "./tools/connect.js";
import { importTechnicians } from "./tools/import-technicians.js";
import { importVendors } from "./tools/import-vendors.js";
import { analyzeIntegration } from "./tools/analyze.js";
import { mapSchema } from "./tools/map-schema.js";

// Load environment variables
// Try current working directory first, then fallback to relative path
dotenv.config();
dotenv.config({ path: path.join(__dirname, "../.env") });

//=============================================================================
// MCP Server Setup
//=============================================================================

const server = new Server(
  {
    name: "universal-cmms-integration",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

//=============================================================================
// Tool Definitions
//=============================================================================

const TOOLS: Tool[] = [
  {
    name: "integration_discover",
    description:
      "Discover how to connect to a CMMS platform by analyzing its API documentation. " +
      "Given a platform name, URL, or API docs link, this tool will automatically figure out " +
      "the authentication method, base URL, and available endpoints.",
    inputSchema: {
      type: "object",
      properties: {
        platform_hint: {
          type: "string",
          description: 'Platform name or hint (e.g., "MaintainX", "Corrigo", "ServiceTitan")',
        },
        api_docs_url: {
          type: "string",
          description: "URL to API documentation (optional)",
        },
        company_website: {
          type: "string",
          description: "Company website URL (optional)",
        },
      },
      required: [],
    },
  },
  {
    name: "integration_analyze",
    description:
      "Analyze a connected CMMS platform to detect what vendor data is available. " +
      "This tool scans vendor records to detect custom fields (like address, trade, etc.) " +
      "and returns statistics on how many vendors have complete data vs missing data. " +
      "Run this BEFORE importing to understand data quality.",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "Supabase user ID",
        },
        platform_name: {
          type: "string",
          description: 'Platform name (e.g., "maintainx")',
        },
      },
      required: ["user_id", "platform_name"],
    },
  },
  {
    name: "integration_connect",
    description:
      "Execute the connection flow for a discovered CMMS platform. " +
      "This tool handles OAuth flows, API key setup, or basic authentication " +
      "depending on what the platform requires.",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "Supabase user ID",
        },
        platform_name: {
          type: "string",
          description: 'Platform name (e.g., "maintainx")',
        },
        credentials: {
          type: "object",
          description: "Platform credentials (API key, OAuth tokens, etc.)",
        },
      },
      required: ["user_id", "platform_name", "credentials"],
    },
  },
  {
    name: "integration_import_technicians",
    description:
      "Import internal users/employees from a connected CMMS platform. " +
      "This tool fetches users (not vendors) and imports them as technicians. " +
      "Note: Most CMMS platforms don't store addresses for internal users.",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "Supabase user ID",
        },
        platform_name: {
          type: "string",
          description: 'Platform name (e.g., "maintainx")',
        },
      },
      required: ["user_id", "platform_name"],
    },
  },
  {
    name: "integration_import_vendors",
    description:
      "Import vendors/contractors from a connected CMMS platform with smart address detection. " +
      "This tool fetches vendors, detects address custom fields (regardless of field naming), " +
      "geocodes addresses automatically, and marks vendors as 'warm' for dispatch. " +
      "Use this instead of import_technicians when importing external contractors.",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "string",
          description: "Supabase user ID",
        },
        platform_name: {
          type: "string",
          description: 'Platform name (e.g., "maintainx")',
        },
        geocode_addresses: {
          type: "boolean",
          description: "Auto-geocode addresses using Google Maps API (default: true)",
        },
        mark_as_warm: {
          type: "boolean",
          description: "Mark imported vendors as 'warm' for dispatch (default: true)",
        },
      },
      required: ["user_id", "platform_name"],
    },
  },
  {
    name: "integration_map_schema",
    description:
      "Automatically map CMMS data fields to Raven's database schema. " +
      "Analyzes sample data and intelligently suggests field mappings with confidence scores.",
    inputSchema: {
      type: "object",
      properties: {
        platform_name: {
          type: "string",
          description: 'Platform name (e.g., "maintainx")',
        },
        sample_data: {
          type: "object",
          description: "Example object from the CMMS (technician or work order)",
        },
        target_schema: {
          type: "string",
          enum: ["technician", "work_order"],
          description: "Target Raven schema to map to",
        },
      },
      required: ["platform_name", "sample_data", "target_schema"],
    },
  },
];

//=============================================================================
// Tool Handlers
//=============================================================================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: TOOLS,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "integration_discover":
        return await discoverIntegration(args as any);

      case "integration_analyze":
        return await analyzeIntegration(args as any);

      case "integration_connect":
        return await connectIntegration(args as any);

      case "integration_import_technicians":
        return await importTechnicians(args as any);

      case "integration_import_vendors":
        return await importVendors(args as any);

      case "integration_map_schema":
        return await mapSchema(args as any);

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

//=============================================================================
// Server Startup
//=============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error("🚀 Universal CMMS Integration MCP Server running");
  console.error("📦 Tools available:", TOOLS.map(t => t.name).join(", "));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
