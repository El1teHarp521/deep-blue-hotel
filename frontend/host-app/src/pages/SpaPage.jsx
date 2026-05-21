import React from 'react';
import { Box, Container, Typography, CardMedia, Button, Divider, Paper, Table, TableBody, TableCell, TableContainer, TableRow } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function SpaPage({ t }) {
  const navigate = useNavigate();

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="xl">
        <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0, mb: 10 }}>
          <CardMedia component="img" height="700" image="/images/service-spa-1.jpg" />
        </Paper>
        
        {/* БАССЕЙН */}
        <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0, mb: 10 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.2fr 1fr' }, gap: 6, alignItems: 'center' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <CardMedia component="img" image="/images/service-spa-1.jpg" height="350" sx={{ borderRadius: 0 }} />
              <CardMedia component="img" image="/images/service-spa-2.jpg" height="350" sx={{ borderRadius: 0 }} />
            </Box>
            <Box sx={{ pl: { lg: 4 } }}>
              <Typography variant="h3" sx={{ mb: 3, color: 'text.primary', fontFamily: 'Playfair Display' }}>{t.poolTitle}</Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.8 }}>
                {t.poolDesc}
              </Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)', bgcolor: 'background.default', boxShadow: 0 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold', color: 'text.primary', borderBottom: 'none', py: 2 }}>{t.workHours}</TableCell>
                      <TableCell align="right" sx={{ color: 'secondary.main', fontWeight: 'bold', borderBottom: 'none', py: 2 }}>{t.spaHours}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </Paper>

        {/* МАССАЖ */}
        <Paper sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 0, mb: 10 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1.3fr' }, alignItems: 'center' }}>
            <Box sx={{ p: { xs: 2, lg: 4 } }}>
               <Typography variant="h3" gutterBottom sx={{ fontFamily: 'Playfair Display', color: 'text.primary' }}>{t.massageTitle}</Typography>
               <Typography variant="h4" sx={{ mb: 4 }}>{t.massageSub}</Typography>
               <Typography sx={{ mb: 5, color: 'text.secondary', lineHeight: 1.8 }}>{t.massageDesc}</Typography>
               <Button variant="contained" onClick={() => navigate('/massage-booking')} sx={{ bgcolor: '#c1a37f', color: 'white', borderRadius: 0 }}>
                 {t.learnMore}
               </Button>
            </Box>
            <CardMedia component="img" image="/images/service-spa-3.jpg" height="550" sx={{ borderRadius: 0 }} />
          </Box>
        </Paper>

        <Typography variant="h4" align="center" sx={{ mb: 8, color: 'text.primary', fontFamily: 'Playfair Display' }}>{t.specialists}</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
          {t.specialistsList.map((spec, i) => (
            <Paper key={i} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
              <CardMedia component="img" image={spec.img} sx={{ height: 400, borderRadius: 0, mb: 3, objectFit: 'cover' }} />
              <Typography variant="h5" sx={{ fontFamily: 'Playfair Display', fontWeight: 600, color: 'text.primary', mb: 1 }}>{spec.name}</Typography>
              <Typography variant="body2" color="secondary" sx={{ fontWeight: 'bold', mb: 2 }}>{spec.age} | {spec.experience}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>{spec.desc}</Typography>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}