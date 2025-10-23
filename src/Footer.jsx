import { Box, Typography, Container } from '@mui/material';

const Footer = () => {
  return (
    <Box sx={{ backgroundColor: '#1976d2c0', backdropFilter: { xs: 'none', md: 'blur(10px)' }, py: { xs: 0.5, md: 1 }, mt: { xs: 2, md: 4 } }}>
      <Container maxWidth={{ xs: false, md: 'lg' }} sx={{ px: { xs: 0, md: 2 } }}>
        <Typography variant="body2" color="#ffffff" align="center">
          © 2025 Visual IAS.online  ©  All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
