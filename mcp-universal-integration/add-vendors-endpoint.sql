-- Add vendors endpoint to MaintainX platform configuration

UPDATE integration_platforms
SET endpoints = endpoints || jsonb_build_object(
  'vendors', jsonb_build_object(
    'list', jsonb_build_object(
      'method', 'GET',
      'path', '/vendors',
      'description', 'List all vendors with custom fields'
    ),
    'get', jsonb_build_object(
      'method', 'GET',
      'path', '/vendors/{id}',
      'description', 'Get single vendor details'
    )
  )
)
WHERE name = 'maintainx';

-- Verify the update
SELECT name, display_name, endpoints->'vendors' as vendors_endpoint
FROM integration_platforms
WHERE name = 'maintainx';
