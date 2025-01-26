'use client'

import { useSignIn } from '@clerk/nextjs'
import * as React from 'react'

export default function GenerateEmailCode({ onVerify }: { onVerify: () => void }) {
  const { isLoaded, signIn } = useSignIn()
  const [email, setEmail] = React.useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isLoaded && !signIn) return null

    try {
      const { supportedFirstFactors } = await signIn.create({
        identifier: email,
      })

      const isEmailCodeFactor = (factor: any): factor is any => {
        return factor.strategy === 'email_code'
      }
      const emailCodeFactor = supportedFirstFactors?.find(isEmailCodeFactor)

      if (emailCodeFactor) {
        const { emailAddressId } = emailCodeFactor
        await signIn.prepareFirstFactor({
          strategy: 'email_code',
          emailAddressId,
        })

        onVerify()
      }
    } catch (err) {
      console.error('Error:', JSON.stringify(err, null, 2))
    }
  }

  return (
    <>
      <h1>Sign in</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Enter email address</label>
        <input
          value={email}
          id="email"
          name="email"
          type="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Continue</button>
      </form>
    </>
  )
}
