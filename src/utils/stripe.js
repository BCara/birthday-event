import { loadStripe } from '@stripe/stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// Initialize Stripe with your publishable key.
// In production, use your live publishable key.
export const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder');

/**
 * Creates a Stripe Checkout Session for a specific pricing tier.
 * @param {string} tierId - The ID of the pricing tier (e.g., 'essential', 'premium').
 * @param {string} eventId - Optional: The ID of the event this upgrade is tied to.
 * @returns {Promise<string>} The session ID to redirect to.
 */
export const createCheckoutSession = async (tierId, eventId = null) => {
  try {
    // This expects a Cloud Function named 'createStripeCheckoutSession'
    const createSession = httpsCallable(functions, 'createStripeCheckoutSession');
    
    const response = await createSession({
      tierId,
      eventId,
      successUrl: `${window.location.origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/dashboard/billing`,
    });
    
    return response.data.sessionId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};
