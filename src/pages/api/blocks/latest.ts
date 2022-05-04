// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

type Block = {
    height: string,
    hash: string,
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Block>
) {
  const { hash } = req.query
  console.log(`block api: ${hash}`)

  res.status(200).json({ height: BigInt(123).toString(), hash: "hash" })
}
