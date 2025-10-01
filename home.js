import React, { useState, lazy, Suspense } from 'react';
import {
  Container,
  Box,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Grid,
  Skeleton,
  Button,
  Collapse,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const LazyImage = ({ src, alt, height }) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <Box sx={{ position: 'relative', width: '100%', height }}>
      {!loaded && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height="100%"
          animation="wave"
        />
      )}
      <CardMedia
        component="img"
        image={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        sx={{
          display: loaded ? 'block' : 'none',
          objectFit: 'cover',
          height: '100%'
        }}
      />
    </Box>
  );
};

const ArticleCard = ({ article }) => {
  const theme = useTheme();
  
  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8]
        }
      }}
    >
      {article.image && (
        <LazyImage src={article.image} alt={article.title} height={200} />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" gutterBottom>
          {article.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {article.description}
        </Typography>
        {article.tags && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
            {article.tags.map((tag, idx) => (
              <Chip key={idx} label={tag} size="small" />
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const ItemComponent = ({ item, index }) => {
  const [expanded, setExpanded] = useState(index === 0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const articlesPerRow = isMobile ? 1 : isTablet ? 2 : 3;
  const initialArticles = articlesPerRow * 2;
  const hasMoreArticles = item.articles.length > initialArticles;

  return (
    <Box
      sx={{
        mb: 6,
        pb: 4,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}
    >
      <Typography variant="h4" component="h2" gutterBottom sx={{ mb: 3 }}>
        {item.title}
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <LazyImage src={item.banner1} alt={`${item.title} Banner 1`} height={300} />
        </Grid>
        <Grid item xs={12} md={6}>
          <LazyImage src={item.banner2} alt={`${item.title} Banner 2`} height={300} />
        </Grid>
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {item.articles.slice(0, expanded ? undefined : initialArticles).map((article, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <ArticleCard article={article} />
            </Grid>
          ))}
        </Grid>

        {hasMoreArticles && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              endIcon={expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded
                ? 'Show Less'
                : `Show ${item.articles.length - initialArticles} More Articles`}
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const HomePage = () => {
  const items = [
    {
      title: 'Technology Trends 2025',
      banner1: 'https://via.placeholder.com/800x300/1976d2/ffffff?text=Tech+Banner+1',
      banner2: 'https://via.placeholder.com/800x300/1565c0/ffffff?text=Tech+Banner+2',
      articles: [
        {
          title: 'AI Revolution',
          description: 'Exploring the latest developments in artificial intelligence and machine learning.',
          image: 'https://via.placeholder.com/400x200/42a5f5/ffffff?text=AI',
          tags: ['AI', 'Technology']
        },
        {
          title: 'Quantum Computing',
          description: 'The future of computing is here with quantum processors.',
          image: 'https://via.placeholder.com/400x200/42a5f5/ffffff?text=Quantum',
          tags: ['Quantum', 'Computing']
        },
        {
          title: 'Blockchain Innovation',
          description: 'How blockchain is transforming industries beyond cryptocurrency.',
          image: 'https://via.placeholder.com/400x200/42a5f5/ffffff?text=Blockchain',
          tags: ['Blockchain', 'Finance']
        }
      ]
    },
    {
      title: 'Sustainable Living',
      banner1: 'https://via.placeholder.com/800x300/388e3c/ffffff?text=Green+Banner+1',
      banner2: 'https://via.placeholder.com/800x300/2e7d32/ffffff?text=Green+Banner+2',
      articles: [
        {
          title: 'Eco-Friendly Homes',
          description: 'Building sustainable homes for a better tomorrow.',
          image: 'https://via.placeholder.com/400x200/66bb6a/ffffff?text=Homes',
          tags: ['Sustainability', 'Architecture']
        },
        {
          title: 'Renewable Energy',
          description: 'Solar and wind power leading the clean energy revolution.',
          image: 'https://via.placeholder.com/400x200/66bb6a/ffffff?text=Energy',
          tags: ['Energy', 'Environment']
        },
        {
          title: 'Zero Waste Living',
          description: 'Practical tips for reducing your environmental footprint.',
          image: 'https://via.placeholder.com/400x200/66bb6a/ffffff?text=Zero+Waste',
          tags: ['Lifestyle', 'Environment']
        },
        {
          title: 'Urban Gardening',
          description: 'Growing your own food in small urban spaces.',
          image: 'https://via.placeholder.com/400x200/66bb6a/ffffff?text=Garden',
          tags: ['Gardening', 'Urban']
        },
        {
          title: 'Green Transportation',
          description: 'Electric vehicles and sustainable transport solutions.',
          image: 'https://via.placeholder.com/400x200/66bb6a/ffffff?text=Transport',
          tags: ['Transport', 'EV']
        },
        {
          title: 'Recycling Innovation',
          description: 'New technologies making recycling more efficient.',
          image: 'https://via.placeholder.com/400x200/66bb6a/ffffff?text=Recycle',
          tags: ['Recycling', 'Innovation']
        },
        {
          title: 'Sustainable Fashion',
          description: 'Ethical clothing brands and circular fashion economy.',
          image: 'https://via.placeholder.com/400x200/66bb6a/ffffff?text=Fashion',
          tags: ['Fashion', 'Ethics']
        }
      ]
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 4 }}>
        Featured Collections
      </Typography>
      {items.map((item, index) => (
        <ItemComponent key={index} item={item} index={index} />
      ))}
    </Container>
  );
};

export default HomePage;
