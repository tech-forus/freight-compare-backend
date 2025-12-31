// backend/routes/newsRoute.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * GET /api/news/business
 * Proxy endpoint to fetch Indian business news from GNews API
 * Bypasses CORS restrictions by making server-side request
 */
router.get('/business', async (req, res) => {
    try {
        const apiKey = process.env.GNEWS_API_KEY; // Changed from NEWS_API_KEY

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: 'GNEWS_API_KEY not configured on server',
            });
        }

        console.log('[News Proxy] Fetching Indian business news from GNews API...');

        // GNews API endpoint - using /search with query (free tier compatible)
        // Free tier doesn't support 'country' parameter, so we use search query instead
        const response = await axios.get(
            `https://gnews.io/api/v4/search`,
            {
                params: {
                    q: 'India business OR Indian economy OR Mumbai stocks OR Sensex', // Search query for India-related business news
                    lang: 'en',
                    max: 10,
                    apikey: apiKey,
                },
                timeout: 10000,
            }
        );


        console.log('[News Proxy] Status:', response.status);
        console.log('[News Proxy] Total results from GNews:', response.data.totalArticles);
        console.log('[News Proxy] Articles count:', response.data.articles?.length);

        const articles = (response.data.articles || []).map(article => ({
            source: { id: null, name: article.source.name },
            title: article.title,
            description: article.description,
            url: article.url,
            urlToImage: article.image,
            publishedAt: article.publishedAt,
        }));

        console.log('[News Proxy] Successfully returning', articles.length, 'articles');

        // Return in NewsAPI-compatible format for frontend
        res.json({
            status: 'ok',
            totalResults: articles.length,
            articles: articles
        });
    } catch (error) {
        console.error('[News Proxy] Error fetching news:', error.message);

        if (error.response) {
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data.errors?.[0] || 'GNews API error',
            });
        } else if (error.code === 'ECONNABORTED') {
            return res.status(504).json({
                success: false,
                message: 'Request timeout while fetching news',
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to fetch news from GNews API',
            });
        }
    }
});

export default router;
