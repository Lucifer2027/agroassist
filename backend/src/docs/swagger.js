const swaggerUi = require('swagger-ui-express');

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'AgroAssist Pro Backend REST API',
    version: '1.0.0',
    description: `Production-ready backend for AgroAssist Pro — an AI-powered agricultural assistant designed for smallholder farmers.
    
    Integrated Capabilities:
    - MySQL Operational Transactional Database
    - Snowflake Data Warehouse Analytical Historical Engine
    - Cloudinary Media Storage & 800x600 Image Optimization
    - Google Gemini AI Disease Diagnosis & Recommendation Engine
    - OpenWeatherMap API Micro-Climate Integration
    - Deterministic Agricultural Risk Calculation Engine
    - Server-Side PDFKit Printable Health Report Generator
    `
  },
  servers: [
    {
      url: '/api',
      description: 'Primary AgroAssist Pro API Gateway'
    }
  ],
  security: [
    {
      bearerAuth: []
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT token in Authorization header: Bearer <token>'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found' },
          errorCode: { type: 'string', example: 'RESOURCE_NOT_FOUND' },
          errors: { type: 'array', items: { type: 'object' } }
        }
      },
      Farm: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          farm_name: { type: 'string', example: 'Punjab Wheat Farm' },
          location: { type: 'string', example: 'Ludhiana, Punjab' },
          latitude: { type: 'number', example: 30.901 },
          longitude: { type: 'number', example: 75.8573 },
          area: { type: 'number', example: 5.5 },
          area_unit: { type: 'string', example: 'acres' },
          soil_type: { type: 'string', example: 'Loam' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      Crop: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          farm_id: { type: 'string', format: 'uuid' },
          crop_name: { type: 'string', example: 'Wheat' },
          crop_variety: { type: 'string', example: 'HD-2967' },
          planting_date: { type: 'string', format: 'date' },
          growth_stage: { type: 'string', example: 'Tillering' },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      UploadSignature: {
        type: 'object',
        properties: {
          signature: { type: 'string', example: 'a1b2c3d4e5f6...' },
          timestamp: { type: 'integer', example: 1725488400 },
          apiKey: { type: 'string', example: '1234567890' },
          cloudName: { type: 'string', example: 'agroassist-cloud' },
          folder: { type: 'string', example: 'agroassist/farmers/u1/farms/f1/crops/c1' },
          eager: { type: 'string', example: 'c_fit,h_600,w_800/e_sharpen:50/e_auto_contrast/f_auto/q_auto' },
          allowedFormats: { type: 'array', items: { type: 'string' } },
          maxFileSize: { type: 'integer', example: 10485760 }
        }
      },
      DiseaseAnalysis: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          diseaseName: { type: 'string', example: 'Late Blight' },
          confidenceScore: { type: 'number', example: 94.5 },
          severity: { type: 'string', example: 'high' },
          environmentalRiskLevel: { type: 'string', example: 'high' },
          symptoms: { type: 'array', items: { type: 'string' } },
          recommendations: { type: 'array', items: { type: 'string' } },
          preventionSteps: { type: 'array', items: { type: 'string' } },
          treatmentSuggestions: { type: 'array', items: { type: 'string' } },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Weather: {
        type: 'object',
        properties: {
          temperature: { type: 'number', example: 28.5 },
          humidity: { type: 'number', example: 78.0 },
          rainfall: { type: 'number', example: 12.4 },
          windSpeed: { type: 'number', example: 3.5 },
          weatherCondition: { type: 'string', example: 'Rain' },
          rainProbability: { type: 'number', example: 85.0 }
        }
      },
      RiskAssessment: {
        type: 'object',
        properties: {
          riskScore: { type: 'number', example: 78.5 },
          riskLevel: { type: 'string', example: 'high' },
          riskFactors: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  tags: [
    { name: 'Health', description: 'System health check endpoints' },
    { name: 'Farms', description: 'Farm management endpoints' },
    { name: 'Crops', description: 'Crop management endpoints' },
    { name: 'Uploads', description: 'Cloudinary signed upload and media management endpoints' },
    { name: 'Disease Analysis', description: 'Gemini AI crop disease diagnosis endpoints' },
    { name: 'Weather', description: 'OpenWeatherMap micro-climate endpoints' },
    { name: 'Risk Engine', description: 'Agricultural risk assessment endpoints' },
    { name: 'Recommendations', description: 'Actionable agricultural recommendation endpoints' },
    { name: 'Data Warehouse Analytics', description: 'Snowflake analytics endpoints for farmers' },
    { name: 'PDF Reports', description: 'Printable AI crop health PDF report generation' },
    { name: 'Admin Analytics', description: 'Snowflake analytical warehouse endpoints for admin role' }
  ],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'System Health Check',
        security: [],
        responses: {
          '200': { description: 'System healthy and operational' }
        }
      }
    },
    '/farms': {
      post: {
        tags: ['Farms'],
        summary: 'Create a new farm',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['farm_name'],
                properties: {
                  farm_name: { type: 'string' },
                  location: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  area: { type: 'number' },
                  area_unit: { type: 'string', enum: ['acres', 'hectares', 'sq_meters'] },
                  soil_type: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Farm created successfully' },
          '400': { $ref: '#/components/schemas/ErrorResponse' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '422': { $ref: '#/components/schemas/ErrorResponse' }
        }
      },
      get: {
        tags: ['Farms'],
        summary: 'List farmer farms with pagination',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: {
          '200': { description: 'Farms retrieved successfully' },
          '401': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/farms/{farmId}': {
      get: {
        tags: ['Farms'],
        summary: 'Get farm details by ID',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Farm details retrieved' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' },
          '404': { $ref: '#/components/schemas/ErrorResponse' }
        }
      },
      put: {
        tags: ['Farms'],
        summary: 'Update farm details',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  farm_name: { type: 'string' },
                  location: { type: 'string' },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  area: { type: 'number' },
                  area_unit: { type: 'string' },
                  soil_type: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Farm updated' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' },
          '404': { $ref: '#/components/schemas/ErrorResponse' }
        }
      },
      delete: {
        tags: ['Farms'],
        summary: 'Delete farm by ID',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Farm deleted' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' },
          '404': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/farms/{farmId}/crops': {
      post: {
        tags: ['Crops'],
        summary: 'Create a crop in a farm',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['crop_name'],
                properties: {
                  crop_name: { type: 'string' },
                  crop_variety: { type: 'string' },
                  planting_date: { type: 'string', format: 'date' },
                  growth_stage: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Crop created' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      },
      get: {
        tags: ['Crops'],
        summary: 'List crops in a farm',
        parameters: [
          { name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: {
          '200': { description: 'Crops listed' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/crops/{cropId}': {
      get: {
        tags: ['Crops'],
        summary: 'Get crop details by ID',
        parameters: [{ name: 'cropId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Crop details' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' },
          '404': { $ref: '#/components/schemas/ErrorResponse' }
        }
      },
      put: {
        tags: ['Crops'],
        summary: 'Update crop details',
        parameters: [{ name: 'cropId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  crop_name: { type: 'string' },
                  crop_variety: { type: 'string' },
                  planting_date: { type: 'string', format: 'date' },
                  growth_stage: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Crop updated' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      },
      delete: {
        tags: ['Crops'],
        summary: 'Delete crop',
        parameters: [{ name: 'cropId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Crop deleted' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/crops/{cropId}/analysis-history': {
      get: {
        tags: ['Crops'],
        summary: 'Get crop disease analysis history',
        parameters: [{ name: 'cropId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Crop analysis history' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/uploads/signature': {
      post: {
        tags: ['Uploads'],
        summary: 'Generate Cloudinary upload signature',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['farmId', 'cropId'],
                properties: {
                  farmId: { type: 'string', format: 'uuid' },
                  cropId: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Signature generated' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/uploads/metadata': {
      post: {
        tags: ['Uploads'],
        summary: 'Register Cloudinary asset metadata',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['public_id', 'original_url'],
                properties: {
                  farm_id: { type: 'string', format: 'uuid' },
                  crop_id: { type: 'string', format: 'uuid' },
                  public_id: { type: 'string' },
                  original_url: { type: 'string' },
                  width: { type: 'number' },
                  height: { type: 'number' },
                  format: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '201': { description: 'Asset registered' },
          '401': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/uploads/{assetId}': {
      get: {
        tags: ['Uploads'],
        summary: 'Get Cloudinary asset metadata by ID',
        parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Asset metadata' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' },
          '404': { $ref: '#/components/schemas/ErrorResponse' }
        }
      },
      delete: {
        tags: ['Uploads'],
        summary: 'Delete Cloudinary asset from CDN & DB',
        parameters: [{ name: 'assetId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Asset deleted' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/analysis': {
      post: {
        tags: ['Disease Analysis'],
        summary: 'Master 14-step disease analysis pipeline',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['farmId', 'cropId', 'cloudinaryAssetId'],
                properties: {
                  farmId: { type: 'string', format: 'uuid' },
                  cropId: { type: 'string', format: 'uuid' },
                  cloudinaryAssetId: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Analysis pipeline completed successfully' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' },
          '422': { $ref: '#/components/schemas/ErrorResponse' },
          '500': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/analysis/disease': {
      post: {
        tags: ['Disease Analysis'],
        summary: 'Specific Gemini disease diagnosis endpoint',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['farmId', 'cropId', 'cloudinaryAssetId'],
                properties: {
                  farmId: { type: 'string', format: 'uuid' },
                  cropId: { type: 'string', format: 'uuid' },
                  cloudinaryAssetId: { type: 'string', format: 'uuid' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Disease diagnosis completed' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' },
          '422': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/analysis/history/{farmId}': {
      get: {
        tags: ['Disease Analysis'],
        summary: 'Query farm analysis history with filtering and pagination',
        parameters: [
          { name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['created_at', 'confidence_score', 'severity', 'disease_name'] } },
          { name: 'order', in: 'query', schema: { type: 'string', enum: ['ASC', 'DESC'] } },
          { name: 'disease', in: 'query', schema: { type: 'string' } },
          { name: 'severity', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high'] } },
          { name: 'riskLevel', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } }
        ],
        responses: {
          '200': { description: 'Farm analysis history retrieved' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/analysis/{analysisId}': {
      get: {
        tags: ['Disease Analysis'],
        summary: 'Get disease analysis details by ID',
        parameters: [{ name: 'analysisId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Analysis details retrieved' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' },
          '404': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/weather/current/{farmId}': {
      get: {
        tags: ['Weather'],
        summary: 'Get current weather for farm',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Current weather observation' },
          '400': { $ref: '#/components/schemas/ErrorResponse' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/weather/forecast/{farmId}': {
      get: {
        tags: ['Weather'],
        summary: 'Get 5-day weather forecast for farm',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Weather forecast list' },
          '400': { $ref: '#/components/schemas/ErrorResponse' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/risk/crop/{cropId}': {
      get: {
        tags: ['Risk Engine'],
        summary: 'Calculate & retrieve crop risk assessment',
        parameters: [{ name: 'cropId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Crop risk assessment' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/risk/farm/{farmId}': {
      get: {
        tags: ['Risk Engine'],
        summary: 'Retrieve farm-wide risk metrics',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Farm risk metrics' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/recommendations': {
      post: {
        tags: ['Recommendations'],
        summary: 'Generate actionable AI recommendations',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['farmId', 'cropId', 'diseaseAnalysisId'],
                properties: {
                  farmId: { type: 'string', format: 'uuid' },
                  cropId: { type: 'string', format: 'uuid' },
                  diseaseAnalysisId: { type: 'string', format: 'uuid' },
                  language: { type: 'string', default: 'en' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Recommendations generated' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/recommendations/{analysisId}': {
      get: {
        tags: ['Recommendations'],
        summary: 'Get recommendations by analysis ID',
        parameters: [{ name: 'analysisId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Recommendations retrieved' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' },
          '404': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/analytics/farm/{farmId}': {
      get: {
        tags: ['Data Warehouse Analytics'],
        summary: 'Get farm analytics from Snowflake DW',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Farm analytics' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/analytics/crop/{cropId}': {
      get: {
        tags: ['Data Warehouse Analytics'],
        summary: 'Get crop analytics from Snowflake DW',
        parameters: [{ name: 'cropId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Crop analytics' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/analytics/disease-trends/{farmId}': {
      get: {
        tags: ['Data Warehouse Analytics'],
        summary: 'Get disease trends for farm from Snowflake DW',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Disease trends' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/analytics/risk/{farmId}': {
      get: {
        tags: ['Data Warehouse Analytics'],
        summary: 'Get risk evolution for farm from Snowflake DW',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Risk evolution' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/analytics/weather-correlation/{farmId}': {
      get: {
        tags: ['Data Warehouse Analytics'],
        summary: 'Get weather-disease correlation for farm from Snowflake DW',
        parameters: [{ name: 'farmId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Weather-disease correlation' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/reports/analysis/{analysisId}/pdf': {
      get: {
        tags: ['PDF Reports'],
        summary: 'Generate and download printable AI crop health PDF report',
        parameters: [{ name: 'analysisId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          '200': { description: 'Binary PDF file download stream (application/pdf)' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' },
          '404': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/admin/analytics/overview': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Get system-wide overview metrics (Admin only)',
        responses: {
          '200': { description: 'System overview metrics' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/admin/analytics/diseases': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Get system-wide disease analytics (Admin only)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'disease', in: 'query', schema: { type: 'string' } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }
        ],
        responses: {
          '200': { description: 'System disease analytics' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/admin/analytics/risk': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Get system-wide risk analytics (Admin only)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'riskLevel', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } },
          { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date-time' } }
        ],
        responses: {
          '200': { description: 'System risk analytics' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/admin/analytics/weather': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Get system-wide weather analytics & correlations (Admin only)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'farmId', in: 'query', schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          '200': { description: 'System weather analytics' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    },
    '/admin/analytics/crops': {
      get: {
        tags: ['Admin Analytics'],
        summary: 'Get system-wide crop disease trends (Admin only)',
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'cropName', in: 'query', schema: { type: 'string' } }
        ],
        responses: {
          '200': { description: 'System crop analytics' },
          '401': { $ref: '#/components/schemas/ErrorResponse' },
          '403': { $ref: '#/components/schemas/ErrorResponse' }
        }
      }
    }
  }
};

const setupSwagger = (app) => {
  // Serve raw JSON spec at /api/docs/json
  app.get('/api/docs/json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(openApiSpec);
  });

  // Serve Interactive Swagger UI at /api/docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
};

module.exports = {
  openApiSpec,
  setupSwagger
};
