const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS für alle Origins erlauben
app.use(cors());
app.use(express.json());

// Logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Health Check
app.get('/', (req, res) => {
    res.json({ 
        status: 'SWARFARM Proxy Server is running!',
        usage: 'Use /swarfarm/* to proxy requests to SWARFARM API v2',
        example: '/swarfarm/bestiary/',
        api_base: 'https://swarfarm.com/api/v2/'
    });
});

// Test Endpoint - zeigt verfügbare API Endpoints
app.get('/test', async (req, res) => {
    try {
        const response = await axios.get('https://swarfarm.com/api/v2/', {
            headers: {
                'User-Agent': 'SummonersWardle-Proxy/1.0',
                'Accept': 'application/json'
            }
        });
        res.json({
            message: 'SWARFARM API v2 is reachable',
            available_endpoints: response.data
        });
    } catch (error) {
        res.status(500).json({ error: 'Cannot reach SWARFARM API' });
    }
});

// Proxy Endpoint - WICHTIG: /api/v2/ hinzugefügt!
app.get('/swarfarm/*', async (req, res) => {
    try {
        // Entferne /swarfarm/ vom Path
        const apiPath = req.path.replace('/swarfarm/', '');
        
        // WICHTIG: Baue die korrekte API URL mit /api/v2/
        const swarfarmUrl = `https://swarfarm.com/api/v2/${apiPath}`;
        
        // Query Parameter hinzufügen
        const queryString = new URLSearchParams(req.query).toString();
        const fullUrl = queryString ? `${swarfarmUrl}?${queryString}` : swarfarmUrl;
        
        console.log(`Proxying to SWARFARM API v2: ${fullUrl}`);
        
        const response = await axios.get(fullUrl, {
            headers: {
                'User-Agent': 'SummonersWardle-Proxy/1.0',
                'Accept': 'application/json'
            },
            timeout: 30000
        });
        
        res.json(response.data);
        
    } catch (error) {
        console.error('Proxy error:', error.message);
        
        if (error.response) {
            res.status(error.response.status).json({
                error: 'SWARFARM API Error',
                message: error.response.data || error.message,
                attempted_url: error.config?.url
            });
        } else {
            res.status(503).json({
                error: 'Service Unavailable',
                message: 'Could not reach SWARFARM API',
                details: error.message
            });
        }
    }
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'Endpoint not found. Use /swarfarm/* to proxy SWARFARM API v2 calls.',
        examples: [
            '/swarfarm/bestiary/',
            '/swarfarm/bestiary/?page=2',
            '/swarfarm/skills/',
            '/test'
        ]
    });
});

app.listen(PORT, () => {
    console.log(`SWARFARM Proxy Server running on port ${PORT}`);
    console.log(`API v2 Base: https://swarfarm.com/api/v2/`);
    console.log(`Test the proxy: http://localhost:${PORT}/test`);
});
