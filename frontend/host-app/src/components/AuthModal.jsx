import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, Box, Typography, 
  TextField, Button, Stack, Divider, IconButton, Alert, MenuItem
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import GoogleIcon from '@mui/icons-material/Google';
import axios from 'axios';

export default function AuthModal({ open, onClose, t }) {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState(null);
  
  const isRu = t && t.signInBtn && (t.signInBtn.includes('Войти') || t.signInBtn.includes('Вход') || t.signInBtn.includes('войти'));

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    country: 'Россия',
    phone: '',
    email: '',
    password: '',
    loginInput: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      if (isLogin) {
        // логика входа
        const response = await axios.post('http://localhost:3003/api/auth/login', {
          loginInput: formData.loginInput,
          password: formData.password
        });
        
        if (response.data.success) {
          window.location.reload();
          onClose();
        }
      } else {
        // логика регистрации
        const response = await axios.post('http://localhost:3003/api/auth/register', {
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          country: formData.country
        });

        if (response.data.success) {
          window.location.reload();
          onClose();
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Произошла ошибка. Проверьте введенные данные.');
    }
  };

  // инициализация входа через GOOGLE
  const handleGoogleAuth = async () => {
    try {
      const response = await axios.get('http://localhost:3003/api/auth/google/url');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Ошибка получения OAuth ссылки:', error);
      setError('Сервис авторизации Google временно недоступен');
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 0,
          p: 3,
          bgcolor: 'background.paper',
          border: '1px solid rgba(128,128,128,0.2)',
          position: 'relative'
        }
      }}
    >
      {/* Кнопка закрытия */}
      <IconButton 
        onClick={onClose} 
        aria-label={isRu ? 'Закрыть модальное окно' : 'Close authentication dialog'}
        sx={{ position: 'absolute', right: 15, top: 15, color: 'text.secondary', borderRadius: 0 }}
      >
        <CloseIcon />
      </IconButton>

      <DialogTitle sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.8rem', fontFamily: 'Playfair Display', pb: 1, color: 'text.primary' }}>
        {isLogin ? t.loginTitle : t.registerTitle}
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {isLogin ? (
            //  поля для входа
            <Stack spacing={2.5}>
              <TextField
                required
                fullWidth
                label={t.emailOrPhone}
                name="loginInput"
                variant="outlined"
                value={formData.loginInput}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: 0 } }}
              />
              <TextField
                required
                fullWidth
                label={t.password}
                name="password"
                type="password"
                variant="outlined"
                value={formData.password}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: 0 } }}
              />
            </Stack>
          ) : (
            // поля для регистрации
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField
                  required
                  fullWidth
                  label={t.firstName}
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  InputProps={{ sx: { borderRadius: 0 } }}
                />
                <TextField
                  required
                  fullWidth
                  label={t.lastName}
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  InputProps={{ sx: { borderRadius: 0 } }}
                />
              </Stack>

              {/*  выпадающи список выбора страны */}
              <TextField
                select
                required
                fullWidth
                label={t.country}
                name="country"
                value={formData.country}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: 0 } }}
                SelectProps={{
                  inputProps: { 'aria-label': isRu ? 'Выбрать страну проживания' : 'Select country of residence' }
                }}
              >
                <MenuItem value="Россия">{isRu ? 'Россия' : 'Russia'}</MenuItem>
                <MenuItem value="Беларусь">{isRu ? 'Беларусь' : 'Belarus'}</MenuItem>
                <MenuItem value="Казахстан">{isRu ? 'Казахстан' : 'Kazakhstan'}</MenuItem>
                <MenuItem value="ОАЭ">{isRu ? 'ОАЭ' : 'UAE'}</MenuItem>
                <MenuItem value="Турция">{isRu ? 'Турция' : 'Turkey'}</MenuItem>
                <MenuItem value="Китай">{isRu ? 'Китай' : 'China'}</MenuItem>
                <MenuItem value="Другая">{isRu ? 'Другая страна' : 'Other Country'}</MenuItem>
              </TextField>

              <TextField
                required
                fullWidth
                label={t.phone}
                name="phone"
                placeholder="+7..."
                value={formData.phone}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: 0 } }}
              />
              <TextField
                required
                fullWidth
                label={t.email}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: 0 } }}
              />
              <TextField
                required
                fullWidth
                label={t.password}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                InputProps={{ sx: { borderRadius: 0 } }}
              />
            </Stack>
          )}

          {/* Кнопка отправки формы */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 4, py: 1.8, bgcolor: '#c1a37f', color: 'white', fontWeight: 'bold', borderRadius: 0, '&:hover': { bgcolor: '#a68a64' } }}
          >
            {isLogin ? t.signInBtn : t.createAccount}
          </Button>

          <Divider sx={{ my: 3, color: 'text.secondary', fontSize: '0.8rem' }}>OR</Divider>

          {/* Кнопка Google */}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleGoogleAuth}
            startIcon={<GoogleIcon />}
            sx={{ 
              py: 1.5, 
              borderRadius: 0, 
              borderColor: 'rgba(128,128,128,0.3)', 
              color: 'text.primary',
              fontWeight: 'bold',
              '&:hover': { borderColor: 'text.primary', bgcolor: 'rgba(0,0,0,0.02)' }
            }}
          >
            {isLogin ? t.googleSignIn : t.googleSignUp}
          </Button>

          {/* Переключение между Входом и Регистрацией */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', display: 'inline-block', mr: 1 }}>
              {isLogin ? t.noAccount : t.haveAccount}
            </Typography>
            <Typography 
              variant="body2" 
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              sx={{ 
                color: 'secondary.main', 
                fontWeight: 'bold', 
                display: 'inline-block', 
                cursor: 'pointer',
                borderBottom: '1px solid transparent',
                '&:hover': { borderBottom: '1px solid' }
              }}
            >
              {isLogin ? t.createAccount : t.signInBtn}
            </Typography>
          </Box>

        </Box>
      </DialogContent>
    </Dialog>
  );
}