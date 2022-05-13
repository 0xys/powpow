// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { DefaultBlockApi } from '../../../connection/block_api'

const api = new DefaultBlockApi()

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{height: number, block?: Buffer}>
) {
  const { hash } = req.query
  if (typeof hash === 'string') {
    const block = await api.getBlockByHash(hash)
    console.log(`get block[${hash}]:`, block)
    res.status(200).json({height: Number(block?.getHeight()), block: block?.encode()})
  }else{
    const block = await api.getBlockByHash(hash[0])
    console.log(`get block[${hash[0]}]:`, block)
    res.status(200).json({height: Number(block?.getHeight()), block: block?.encode()})
  }
}
