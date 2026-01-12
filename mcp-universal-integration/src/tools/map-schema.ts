interface MapSchemaArgs {
  platform_name: string;
  sample_data: Record<string, any>;
  target_schema: "technician" | "work_order";
}

interface FieldMapping {
  mapping: Record<string, string>;
  confidence: Record<string, number>;
  unmapped_fields: string[];
  suggested_mapping_complete: boolean;
}

export async function mapSchema(args: MapSchemaArgs): Promise<any> {
  const { platform_name, sample_data, target_schema } = args;

  // Define target schemas
  const schemas = {
    technician: {
      required: ["name", "email", "phone"],
      optional: ["company", "trades", "hourly_rate", "license_number"],
    },
    work_order: {
      required: ["title", "description", "location", "trade_type"],
      optional: ["scheduled_date", "urgency", "estimated_duration"],
    },
  };

  const targetFields = schemas[target_schema];
  const sampleFields = Object.keys(sample_data);

  // Simple intelligent mapping based on field name similarity
  const mapping: Record<string, string> = {};
  const confidence: Record<string, number> = {};
  const unmapped: string[] = [];

  // Common field name mappings
  const fieldMappings: Record<string, string[]> = {
    // Technician mappings
    name: ["name", "fullname", "full_name", "technician_name", "firstName", "lastname"],
    email: ["email", "email_address", "contact_email"],
    phone: ["phone", "phonenumber", "phone_number", "mobile", "contact_phone"],
    company: ["company", "company_name", "organization"],

    // Work order mappings
    title: ["title", "subject", "name", "work_order_title"],
    description: ["description", "details", "notes", "work_description"],
    location: ["location", "address", "site", "property"],
    trade_type: ["trade", "trade_type", "category", "service_type"],
  };

  for (const sampleField of sampleFields) {
    const lowerField = sampleField.toLowerCase();
    let matched = false;

    for (const [targetField, aliases] of Object.entries(fieldMappings)) {
      if (aliases.some(alias => lowerField.includes(alias.toLowerCase()))) {
        mapping[sampleField] = targetField;
        // Calculate confidence based on exactness of match
        const exactMatch = aliases.some(alias => lowerField === alias.toLowerCase());
        confidence[sampleField] = exactMatch ? 100 : 80;
        matched = true;
        break;
      }
    }

    if (!matched) {
      unmapped.push(sampleField);
    }
  }

  // Check if all required fields are mapped
  const allRequiredMapped = targetFields.required.every(req =>
    Object.values(mapping).includes(req)
  );

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            platform_name,
            target_schema,
            mapping,
            confidence,
            unmapped_fields: unmapped,
            suggested_mapping_complete: allRequiredMapped,
            required_fields_status: targetFields.required.map(field => ({
              field,
              mapped: Object.values(mapping).includes(field),
            })),
          },
          null,
          2
        ),
      },
    ],
  };
}
