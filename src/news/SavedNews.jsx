import { useState, useEffect } from 'react';
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
import { useAuth } from '../auth/AuthContext';

const SavedNews = () => {
  const [savedArticles, setSavedArticles] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { user } = useAuth();

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/saved-articles`);
        if (response.ok) {
          const data = await response.json();
          setSavedArticles(data.articles || []);
        }
      } catch (err) {
        console.error('Fetch saved error:', err);
      }
    };
    fetchSaved();
  }, []);

  const truncateDescription = (desc, maxLength = 300) => {
    if (!desc) return 'No description available.';
    if (desc.length <= maxLength) return desc;
    return desc.substring(0, maxLength) + '...';
  };

  const deleteArticle = async (articleId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/saved-articles/${articleId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setSavedArticles(prev => prev.filter(a => a.article_id !== articleId));
        setSnackbar({ open: true, message: 'Article deleted!', severity: 'success' });
      } else {
        setSnackbar({ open: true, message: 'Failed to delete article.', severity: 'error' });
      }
    } catch (err) {
      console.error('Delete error:', err);
      setSnackbar({ open: true, message: 'Error deleting article.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (savedArticles.length === 0) return <Typography variant="body1">No saved articles.</Typography>;

  const getGridSpan = (index) => {
    const spans = [8, 4, 6, 6, 4, 8, 6, 6];
    return { xs: 12, sm: 6, md: spans[index % spans.length] };
  };

  return (
    <Box>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, maxWidth: 1200 }}>
        <Grid container spacing={1}>
          {savedArticles.map((article, index) => {
            const span = getGridSpan(index);
            return (
              <Grid item {...span} key={article.article_id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                  {article.image_url && (
                    <CardMedia component="img" height="200" image={article.image_url} alt={article.title} sx={{ objectFit: 'cover', maxHeight: 200 }} />
                  )}
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Typography variant="h6" gutterBottom title={article.title} sx={{ color: '#1976d2' }}>
                      {article.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {truncateDescription(article.description)}
                    </Typography>
                    {article.category && <Chip label={article.category} size="small" sx={{ mb: 1, mt: 1 }} />}
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
                      {new Date(article.pubDate).toLocaleDateString()} | {article.source_id}
                    </Typography>
                  </CardContent>
                  <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" component="a" href={article.link} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      Read more
                    </Typography>
                    {user && (
                      <Button onClick={() => deleteArticle(article.article_id)} size="small" variant="outlined" color="error" sx={{ ml: 1 }}>
                        Delete
                      </Button>
                    )}
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
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

      <Footer />
    </Box>
  );
};

export default SavedNews;
