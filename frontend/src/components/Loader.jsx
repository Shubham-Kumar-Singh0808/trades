import { Box, Backdrop } from '@mui/material';
import { keyframes } from '@mui/system';
import { useLoader } from '../context/LoaderContext';
import loaderLogo from '../assets/images/logo_loder.png';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export default function Loader() {
  const { isLoading } = useLoader();

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      }}
      open={isLoading}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          component="img"
          src={loaderLogo}
          alt="Loading..."
          sx={{
            width: '80px',
            height: '80px',
            animation: `${spin} 1.5s linear infinite`,
          }}
        />
      </Box>
    </Backdrop>
  );
}
