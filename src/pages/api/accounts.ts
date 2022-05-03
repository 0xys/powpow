// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

type Account = {
    sequence: bigint,
    balance: bigint,
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Account>
) {
  res.status(200).json({ sequence: BigInt(0), balance: BigInt(0) })
}
