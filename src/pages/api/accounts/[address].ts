// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { useRouter } from 'next/router'

export type Account = {
    sequence: bigint,
    balance: bigint,
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Account>
) {
  const router = useRouter()
  const { address } = router.query
  console.log(`account api: ${address}`)

  res.status(200).json({ sequence: BigInt(123), balance: BigInt(123456) })
}
