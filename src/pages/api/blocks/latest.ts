// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

import admin from'firebase-admin';
import { applicationDefault } from'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FirestoreBlockApi } from '../../../connection/firestore_block_api';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{height: number, blockHex?: string}>
) {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      credential: applicationDefault()
    })
  }
  const db = getFirestore()
  const api = new FirestoreBlockApi(db)

  const latestHeight = await api.getLatestHeight()
  const latest = await api.getLatestBlock()
  console.log(`block api 'latest'`, latestHeight, latest?.hashString())

  res.status(200).json({height: latestHeight, blockHex: latest?.encodeToHex()})
}
