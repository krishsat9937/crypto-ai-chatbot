import { sendMail } from './send-email';

/**
 * Paginate through the Clerk user list to find a user by email
 * @param {string} email - The email address to search for
 * @returns {Promise<string>} - The user ID if found
 */
export async function findUserIdByEmail(email: string) {
    const limit = 100; // Maximum number of users per page
    let offset = 0;
    
    console.log('Fetching user list... using secret key:', process.env.CLERK_SECRET_KEY, 'and email:', email);
    while (true) {
      const response = await fetch(
        `https://api.clerk.dev/v1/users?limit=${limit}&offset=${offset}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch user list:', errorText);
        throw new Error('Failed to fetch user list.');
      }
  
      const users = await response.json();
  
      // Search for the user with the matching email
      const user = users.find((user:any) =>
        user.email_addresses.some(
          (emailAddress:any) => emailAddress.email_address === email
        )
      );
  
      if (user) {
        return user.id;
      }
  
      // If no users are found, exit the loop
      if (users.length < limit) break;
  
      offset += limit; // Move to the next page
    }
  
    return null;
  }
  
  /**
   * Generate a sign-in token for a user ID
   * @param {string} userId - The user ID
   * @returns {Promise<string>} - The sign-in token
   */
  async function generateSignInToken(userId:string) {
    console.log('Generating sign-in token for user ID:', userId, 'using API key:', process.env.CLERK_API_KEY);
    const response = await fetch('https://api.clerk.dev/v1/sign_in_tokens', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id: userId }),
    });
  
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to generate sign-in token:', errorText);
      throw new Error('Failed to generate sign-in token.');
    }
  
    const { token } = await response.json();
    return token;
  }
  
  /**
   * Main function to get the sign-in token for a user email
   * @param {string} email - The email address to search for
   * @returns {Promise<string>} - The sign-in token
   */
  export async function SendSignInLinkToEmail(email:string) {
    console.log('Fetching user ID for email:', email);
    try {
      const userId = await findUserIdByEmail(email);
      console.log('User ID:', userId);
      const token = await generateSignInToken(userId);
      console.log('Generated token:', token);

        // Send the token to the user's email
        const subject = 'Sign in to your account';
        const url = `http://localhost:3000/accept-token?token=${token}`;
        const text = `Click the link to sign in: ${url}`;
        await sendMail({
            email: process.env.SMTP_SERVER_USERNAME,
            sendTo: email,
            subject,
            text,
        });
    
    return "Done";

    } catch (error) {
      console.error('Error in getSignInTokenForEmail:', error.message);
      throw error;
    }
  }
  

  export async function createClerkUserWithSkipPassword(email: string) {
    const url = 'https://api.clerk.com/v1/users';    
  
    const headers = {
      'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',      
    };
  
    const body = {
      email_address: [email],
      skip_password_requirement: true,
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });
  
      if (!response.ok) {
        const errorResponse = await response.json();
  
        // Handle specific 422 status errors
        if (response.status === 422) {
          const { errors } = errorResponse;
          const firstError = errors?.[0];
          if (firstError) {
            console.error(`Error: ${firstError.message}`);
            throw new Error(firstError.message); // Throw specific error for 422
          }
        }
  
        // General error handling
        throw new Error(`Error: ${errorResponse.message || 'Unknown error occurred.'}`);
      }
  
      const data = await response.json();
      console.log('User created successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to create user:', error.message);
      return null
    }
  }
  