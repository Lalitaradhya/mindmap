import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import Footer from '../Footer';

const News = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [page, setPage] = useState(1);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const truncateDescription = (desc, maxLength = 500) => {
    if (!desc) return 'No description available.';
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength) + '...';
  };

  const saveArticle = async (article) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/save-article`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(article),
      });
      if (response.ok) {
        setSnackbar({ open: true, message: 'Article saved!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to save article.', severity: 'error' });
      }
    } catch (err) {
      console.error('Save error:', err);
      setSnackbar({ open: true, message: 'Error saving article.', severity: 'error' });
    }
  };

  const fetchNews = async (pageNum = 1) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/news?page=${pageNum}&size=10`);
      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      const newArticles = (data.articles || []).map((art, idx) => ({ ...art, uniqueId: `page${pageNum}-idx${idx}` }));
      if (pageNum === 1) {
        setArticles(newArticles);
      } else {
        setArticles(prev => [...prev, ...newArticles]);
      }
    } catch (err) {
      setError(err.message);
      console.error('News fetch error:', err);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  };

  useEffect(() => {
    if (hasFetched) return;
    fetchNews(1);
  }, [hasFetched]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchNews(nextPage);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) return <Typography variant="h6" sx={{ color: '#1976d2' }}>Loading news...</Typography>;
  if (error) return <Typography color="error" variant="body1">{error}</Typography>;
  if (articles.length === 0) return <Typography variant="body1">No articles found. Try refreshing.</Typography>;

  // Predefine bento spans for variety (adjust for more articles)
  const getGridSpan = (index) => {
    const spans = [8, 4, 6, 6, 4, 8, 6, 6]; // e.g., full hero, pairs, uneven
    return { xs: 12, sm: 6, md: spans[index % spans.length] };
  };

  return (
    <Box>
      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, maxWidth: 1200 }}>
        <Grid container spacing={1}>
          {articles.map((article, index) => {
            const span = getGridSpan(index);
            return (
              <Grid item {...span} key={article.uniqueId}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'box-shadow 0.3s', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}
                      onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)'} // Hover effect for UX
                      onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}>
                  {article.image_url && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={article.image_url}
                      alt={article.title}
                      sx={{ objectFit: 'cover', maxHeight: 200 }}
                    />
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography variant="h6" gutterBottom title={article.title} sx={{ color: '#1976d2' }}> {/* Truncate with title tooltip */}
                      {article.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph sx={{ display: '-webkit-box', WebkitLineClamp: 3, overflow: 'hidden' }}>
                      {truncateDescription(article.description)}
                    </Typography>
                    <Box sx={{ display: 'flex',  alignItems: 'center', mt: 1 }}>
                      {article.category && <Chip label={article.category} size="small" />}
                      <Typography variant="caption" color="text.secondary">
                        {new Date(article.pubDate).toLocaleDateString()} | {article.source_id}
                      </Typography>
                    </Box>
                  </CardContent>
                  {/* Optional: Add button to read more */}
                  <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography
                      variant="body2"
                      component="a"
                      href={article.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                    >
                      Read more
                    </Typography>
                    <Button onClick={() => saveArticle(article)} size="small" variant="outlined" sx={{ color: '#1976d2', borderColor: '#1976d2', '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' } }}>
                      Save
                    </Button>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button onClick={loadMore} variant="contained" sx={{ backgroundColor: '#1976d2' }}>
            Load More
          </Button>
        </Box>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default News;
