'use client'

import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import * as React from 'react'

export default function VerifyEmailCode() {
  const { isLoaded, signIn, setActive } = useSignIn()
  const [code, setCode] = React.useState('')
  const router = useRouter()

  async function handleVerification(e: React.FormEvent) {
    e.preventDefault()

    if (!isLoaded && !signIn) return null

    try {
      const signInAttempt = await signIn.attemptFirstFactor({
        strategy: 'email_code',
        code,
      })

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.push('/')
      } else {
        console.error(signInAttempt)
      }
    } catch (err) {
      console.error('Error:', JSON.stringify(err, null, 2))
    }
  }

  return (
    <>
      <h1>Verify your email</h1>
      <form onSubmit={handleVerification}>
        <label htmlFor="code">Enter your verification code</label>
        <input
          value={code}
          id="code"
          name="code"
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="submit">Verify</button>
      </form>
    </>
  )
}
