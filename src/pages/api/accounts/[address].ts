// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'

export type Account = {
    sequence: string,
    balance: string,
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Account>
) {
  const { address } = req.query
  console.log(`account api: ${address}`)

  res.status(200).json({ sequence: BigInt(123).toString(), balance: BigInt(123456).toString() })
}
