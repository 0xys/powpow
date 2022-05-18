// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import admin from'firebase-admin';
import { applicationDefault } from'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FirestoreBlockApi } from '../../../connection/firestore_block_api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{height: number, block?: Buffer}>
) {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: applicationDefault()
    })
  }
  const db = getFirestore()
  const api = new FirestoreBlockApi(db)

  const { hash } = req.query
  if (typeof hash === 'string') {
    const block = await api.getBlockByHash(hash)
    console.log(`get block[${hash}]:`, block)

    res.status(200).json({height: Number(block?.getHeight()), block: block?.encode()})
  }else{
    const block = await api.getBlockByHash(hash[0]) // first item
    console.log(`get block[${hash[0]}]:`, block)

    res.status(200).json({height: Number(block?.getHeight()), block: block?.encode()})
  }
}
