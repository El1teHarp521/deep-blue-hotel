import React from 'react';
import { Box, Container, Typography, Paper, Divider, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function TermsPage({ lang = 'RU' }) {
  const navigate = useNavigate();

  return (
    <Box sx={{ pt: 22, pb: 10 }}>
      <Container maxWidth="md">
        <Button onClick={() => navigate(-1)} sx={{ mb: 4, color: 'text.secondary', fontWeight: 'bold' }}>
          {lang === 'RU' ? '← ВЕРНУТЬСЯ К ОФОРМЛЕНИЮ' : '← BACK TO CHECKOUT'}
        </Button>

        <Paper sx={{ p: 6, borderRadius: 0, border: '1px solid rgba(128,128,128,0.2)', bgcolor: 'background.paper' }}>
          <Typography variant="h3" sx={{ fontFamily: 'Playfair Display', mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
            {lang === 'RU' ? 'Пользовательское соглашение' : 'User Terms & Conditions'}
          </Typography>
          <Typography variant="caption" display="block" align="center" sx={{ mb: 4, color: 'text.secondary', letterSpacing: 1.5 }}>
            {lang === 'RU' ? 'ОФЕРТА ПРЕДОСТАВЛЕНИЯ ГОСТИНИЧНЫХ УСЛУГ DEEPBLUE RESORT' : 'DEEPBLUE RESORT HOTEL SERVICES AGREEMENT'}
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, color: 'text.primary', lineHeight: 1.8 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {lang === 'RU' ? '1. Общие положения' : '1. General Provisions'}
            </Typography>
            <Typography variant="body2">
              {lang === 'RU' 
                ? 'Настоящее Соглашение определяет условия бронирования номеров и предоставления дополнительных услуг в гостиничном комплексе DeepBlue. Оплачивая бронирование или резервируя номер, Пользователь полностью и безоговорочно соглашается со всеми условиями настоящего договора.'
                : 'This Agreement defines the terms of room booking and additional services at the DeepBlue Resort. By paying for or reserving a room, the User fully and unconditionally agrees to all the terms of this contract.'}
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {lang === 'RU' ? '2. Правила бронирования и аннулирования' : '2. Booking & Cancellation Rules'}
            </Typography>
            <Typography variant="body2">
              {lang === 'RU'
                ? 'Бронирование считается подтвержденным после получения системой оплаты или создания официального резерва. Отмена бронирования и выселение гостей осуществляются через администрацию отеля. Оплата за проживание списывается в соответствии с выбранным тарифом.'
                : 'Bookings are considered confirmed once payment is received or a formal reservation is created. Cancellation and checkout of guests are managed by the hotel administration. Stay fees are charged based on the selected rate.'}
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {lang === 'RU' ? '3. Права и обязанности сторон' : '3. Rights & Liabilities'}
            </Typography>
            <Typography variant="body2">
              {lang === 'RU'
                ? 'Отель обязуется предоставить номер выбранной категории в надлежащем санитарно-техническом состоянии. Постоялец обязуется соблюдать правила проживания в отеле, пожарную безопасность, а также нести материальную ответственность за порчу имущества гостиничного комплекса.'
                : 'The hotel undertakes to provide a room of the selected category in proper sanitary and technical condition. The guest agrees to comply with hotel rules, fire safety, and bear material responsibility for any damage to the hotel property.'}
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {lang === 'RU' ? '4. Конфиденциальность данных' : '4. Data Privacy'}
            </Typography>
            <Typography variant="body2">
              {lang === 'RU'
                ? 'Предоставляя свои персональные данные (Имя, Фамилия, Номер телефона, Страна) при регистрации, Пользователь дает согласие на их обработку гостиничным комплексом в целях обеспечения проживания и предоставления сервисных услуг.'
                : 'By providing personal data (First Name, Last Name, Phone, Country) during registration, the User consents to its processing by the hotel for reservation and hospitality services purposes.'}
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Button 
            variant="contained" 
            fullWidth 
            onClick={() => navigate(-1)} 
            sx={{ bgcolor: '#c1a37f', color: 'white', py: 2, fontWeight: 'bold', borderRadius: 0, '&:hover': { bgcolor: '#a68a64' } }}
          >
            {lang === 'RU' ? 'Я ОЗНАКОМИЛСЯ И ХОЧУ ПРОДОЛЖИТЬ' : 'I UNDERSTAND AND WANT TO CONTINUE'}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}