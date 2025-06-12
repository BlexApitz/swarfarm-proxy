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
        usage: 'Use /swarfarm/* to proxy requests',
        example: '/swarfarm/bestiary/'
    });
});

// Proxy Endpoint
app.get('/swarfarm/*', async (req, res) => {
    try {
        const swarfarmPath = req.path.replace('/swarfarm/', '');
        const swarfarmUrl = `https://swarfarm.com/api/v2/${swarfarmPath}`;
        const queryString = new URLSearchParams(req.query).toString();
        const fullUrl = queryString ? `${swarfarmUrl}?${queryString}` : swarfarmUrl;
        
        console.log(`Proxying to: ${fullUrl}`);
        
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
                message: error.response.data || error.message
            });
        } else {
            res.status(503).json({
                error: 'Service Unavailable',
                message: 'Could not reach SWARFARM API'
            });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
