import type { NextPage } from 'next'
import styles from '../styles/Layout.module.css';
import { Heading, Textarea, VStack } from '@chakra-ui/react';

const Home: NextPage = () => {
 
  return (
    <VStack className={styles.block}>
      <Heading>Welcome to パウパウ!</Heading>
      <p>
        このサイトは、ブロックチェーンの基礎的な技術を学ぶためのサイトです。ブロックチェーンの技術は、ビットコインやイーサリアムなどの仮想通貨の基盤技術として知られていますが、それ以外にも様々な分野で活用されています。
      </p>
    </VStack>
  )
}

export default Home
