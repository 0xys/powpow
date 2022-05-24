// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { Account } from '../../../connection/account_api'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Account>
) {
  const { address } = req.query
  console.log(`account api: ${address}`)

  res.status(200).json({ sequence: BigInt(123).toString(), balance: BigInt(123456).toString() })
}
