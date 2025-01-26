'use client';

import { useSignIn, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const otpVerifiedMessage = 'Sign in successful! Do you have a turnkey account or would you like to create a new account?';

export default function VerifyEmailCode({ otp, chatId }: { otp: string; chatId: string }) {
  const { isLoaded, signIn, setActive } = useSignIn();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const hasExecuted = useRef(false); // Track execution state
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser()


  otp = typeof otp === 'object' ? otp.otp! : otp; // Extract the OTP from the props

  useEffect(() => {
    const checkOtpAndVerify = async () => {

      if (!isLoaded || !signIn || !otp || !chatId || hasExecuted.current) return;

      hasExecuted.current = true; // Prevent re-execution
      setMessage(`${otpVerifiedMessage}`);
      setError(null);

      try {
        // Check if the OTP is already verified for the chatId
        const otpCheckResponse = await fetch('/api/check-otp-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp, chatId }),
        });

        const otpCheckData = await otpCheckResponse.json();
        console.log('OTP Check response:', otpCheckData);

        if (otpCheckData.verified) {
          setMessage(`${otpVerifiedMessage}`);
          return;
        }

        if (isClerkLoaded && isSignedIn && user) {
          setMessage(`${otpVerifiedMessage}`);
          return;
        }

        if (otp) {
          // if otp  is object destructured from the props          
          // Verify OTP with Clerk          
          const signInAttempt = await signIn.attemptFirstFactor({
            strategy: 'email_code',
            code: otp,
          });
          console.log('signInAttempt:', signInAttempt);

          if (signInAttempt.status === 'complete') {
            const sessionId = signInAttempt.createdSessionId;

            await setActive({ session: sessionId });

            // Log the verified session to the backend
            const verifiedResponse =  await fetch('/api/log-verified-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: signInAttempt.identifier, // Use the Clerk-provided email
                otp,
                chatId,
                sessionId,
              }),
            });

            const verifiedData = await verifiedResponse.json();
            console.log('Verified response:', verifiedData);

            setMessage(`${otpVerifiedMessage}`);
            // router.push(`/chat/${chatId}`);
          }
        } else {
          setError('Verification failed. Please try again.');
        }
      } catch (err) {
        console.log('Error:', JSON.stringify(err, null, 2));                
      }
    };

    checkOtpAndVerify();
  }, [isLoaded, signIn, otp, chatId]);

  return (
    <div>
      {message ? (
        <p>{message}</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <p>{otpVerifiedMessage}</p>
      )}
    </div>
  );
}
