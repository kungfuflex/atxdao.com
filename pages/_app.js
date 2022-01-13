import { ChakraProvider } from '@chakra-ui/react';
import { ParallaxProvider } from 'react-scroll-parallax';
import chakraTheme from '../util/chakraTheme';

function MyApp({ Component, pageProps }) {
  return (
    <ParallaxProvider>
      <ChakraProvider theme={chakraTheme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </ParallaxProvider>
  )
}

export default MyApp
