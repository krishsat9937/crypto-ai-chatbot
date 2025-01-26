import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Define public routes, including the specific API route for testing
const isPublicRoute = createRouteMatcher([
  '/api/vote', // Public API route
  '/(.*)', // Keep other routes public (for testing only)
]);

export default clerkMiddleware(async (auth, request) => {
  console.log('Middleware triggered for request:', request.url);

  if (!isPublicRoute(request)) {
    console.log('Protected route accessed:', request.url);
    try {
      await auth.protect();
      console.log('Authentication successful for:', request.url);
    } catch (error) {
      console.error('Authentication failed:', error.message);
      throw new Error('Unauthorized access');
    }
  } else {
    console.log('Public route accessed:', request.url);
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)', // Ensure API routes are processed by the middleware
  ],
};
