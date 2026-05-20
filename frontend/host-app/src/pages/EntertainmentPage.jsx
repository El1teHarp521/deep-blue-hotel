import React from 'react';
import { Box, Container, Typography, CardMedia, Paper } from '@mui/material';

export default function EntertainmentPage({ t }) {
  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Typography variant="h2" align="center" sx={{ fontFamily: 'Playfair Display', mb: 10, fontWeight: 500, color: 'text.primary' }}>
          {t.entTitle}
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 6 }}>
          <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0 }}>
            <CardMedia component="img" image="/images/service-gaming-1.jpg" sx={{ height: 450, borderRadius: 0, mb: 3 }} />
            <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 600, mb: 2, color: 'text.primary' }}>
              {t.gaming1}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {t.gaming1Desc}
            </Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{t.gamingTime}</Typography>
          </Paper>

          <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0 }}>
            <CardMedia component="img" image="/images/service-gaming-2.jpg" sx={{ height: 450, borderRadius: 0, mb: 3 }} />
            <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 600, mb: 2, color: 'text.primary' }}>
              {t.gaming2}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
              {t.gaming2Desc}
            </Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{t.gamingTime}</Typography>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}