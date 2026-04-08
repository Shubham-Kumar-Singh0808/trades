import { Box } from '@mui/material';
import logoVideo from '../assets/images/Logo.mp4';

export default function SplashScreen() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #eef6f6 0%, #f8fbff 100%)',
      }}
    >
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          maxWidth: '200px',
          maxHeight: '200px',
          objectFit: 'contain',
        }}
      >
        <source src={logoVideo} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </Box>
  );
}
