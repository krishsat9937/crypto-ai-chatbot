'use client';

import { useSignIn, useUser } from '@clerk/nextjs';
import { useEffect, useState, useRef } from 'react';

const otpGeneratedMessage = 'We’ve sent you an OTP code to your email for verification. Please check your inbox and enter the code below.';

export default function GenerateEmailCode({ email, chatId }: { email: string | undefined; chatId: string }) {
  const { isLoaded, signIn } = useSignIn();
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const hasExecuted = useRef(false);
  const { isLoaded: isClerkLoaded, isSignedIn, user } = useUser()


  email = typeof email === 'object' ? email.email! : email;

  useEffect(() => {

    console.log('useEffect triggered', { isLoaded, signInAvailable: !!signIn, email, chatId, hasExecuted: hasExecuted.current });

    const sendOtp = async () => {
      if (!isLoaded || !signIn || !email || !chatId || hasExecuted.current) {
        console.log('Conditions not met for sending OTP. Returning early.', {
          isLoaded, 
          signInAvailable: !!signIn, 
          email, 
          chatId, 
          hasExecuted: hasExecuted.current
        });
        return;
      }

      console.log('All conditions met. Setting hasExecuted to true and starting OTP process.');
      hasExecuted.current = true;

      try {
        console.log('Checking if session exists for chatId:', chatId);
        const sessionCheckResponse = await fetch('/api/check-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId }),
        });

        const sessionCheckData = await sessionCheckResponse.json();
        console.log('Session check response:', sessionCheckData);

        if (sessionCheckData.exists) {
          console.log('Session already exists. Not sending OTP again.');
          setMessage(`${otpGeneratedMessage}`);
          return;
        }

        if (isClerkLoaded && isSignedIn && user) {
          setMessage(`${otpGeneratedMessage}`);
          return;
        }

        console.log('No existing session found. Creating signIn with Clerk.');        
        const { supportedFirstFactors } = await signIn.create({
          identifier: email.trim(),
        });
        console.log('SignIn create response supportedFirstFactors:', supportedFirstFactors);

        const emailCodeFactor = supportedFirstFactors?.find((factor: any) => factor.strategy === 'email_code');
        console.log('Found email code factor:', emailCodeFactor);

        if (emailCodeFactor) {
          console.log('Preparing first factor with Clerk.');
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId,
          });

          console.log('Logging OTP event in database.');
          await fetch('/api/log-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              chatId,
              status: 'sent',
            }),
          });

          console.log('Code sent successfully.');
          setMessage(`${otpGeneratedMessage}`);
        } else {
          console.log('No email_code factor supported.');
          setError('Email code strategy is not supported.');
        }
      } catch (err) {
        console.error('Error during OTP sending:', err);
        // We do NOT reset hasExecuted here to prevent multiple attempts
        setError('Failed to send the code. Please try again.');
      }
    };

    sendOtp();
  }, [isLoaded, signIn, email, chatId]);

  if (!email) {
    console.log('Email not available yet. Showing loading message.');
    return <p>Loading email information...</p>;
  }

  console.log('Rendering component with message or error.', { message, error });

  return (
    <div>
      {message ? (
        <p>{message}</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <p>{otpGeneratedMessage}</p>
      )}
    </div>
  );
}
