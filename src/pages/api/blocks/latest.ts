// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Block } from '../../../types/blockchain/block'
import { api } from '../socket'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{height: number, block?: Block}>
) {

  const latestHeight = await api.getLatestHeight()
  const latest = await api.getLatestBlock()
  console.log(`block api 'latest'`, latestHeight)

  res.status(200).json({height: latestHeight, block: latest})
}
