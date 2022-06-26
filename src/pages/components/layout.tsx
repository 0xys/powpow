import Head from 'next/head';
import { ReactNode } from 'react';
import { Box, Center, Link } from '@chakra-ui/react';
import styles from '../../styles/Layout.module.css';

type Props = {
  children?: ReactNode;
};

const Layout = ({ children }: Props) => {
  return (
    <div className={styles.container}>
      <Head>
        {/* <title>Powpow</title> */}
        <meta
          name='description'
          content='Study Blockchain with interactive UI.'
        />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <header className={styles.header}>
        {/* <Center>
          <div className={styles.heading}>Powpow</div>
        </Center> */}
      </header>

      <Box className={styles.main} shadow='lg' rounded='lg'>{children}</Box>

      <footer className={styles.footer}>
        <Link
          href='https://github.com/0xys'
          target='_blank'
          rel='noopener noreferrer'
        >
          Created by 0xys
        </Link>
      </footer>
    </div>
  );
};

export default Layout;
