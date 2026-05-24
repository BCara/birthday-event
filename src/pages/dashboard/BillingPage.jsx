import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Zap, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { createCheckoutSession, stripePromise } from '../../utils/stripe';
import './BillingPage.css';

const BillingPage = () => {
  const [loadingTier, setLoadingTier] = useState(null);

  const handleUpgrade = async (tierId) => {
    setLoadingTier(tierId);
    try {
      const sessionId = await createCheckoutSession(tierId);
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe failed to initialize.");
      }

      // Redirect to Stripe Checkout
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to initiate checkout. Please try again.');
      setLoadingTier(null);
    }
  };

  return (
    <div className="billing-page-container">
      <div className="billing-header">
        <h1>Upgrade Your Event</h1>
        <p>Unlock premium features to make your event unforgettable.</p>
      </div>

      <div className="pricing-cards">
        {/* Basic / Free Tier */}
        <motion.div 
          className="pricing-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="card-header">
            <h3>Basic</h3>
            <div className="price">Free</div>
            <p className="description">Perfect for small, intimate gatherings.</p>
          </div>
          <ul className="features-list">
            <li><Check size={18} /> Up to 50 guests</li>
            <li><Check size={18} /> Standard RSVP forms</li>
            <li><Check size={18} /> Basic theme customization</li>
            <li className="disabled"><Check size={18} color="transparent" /> Custom domain</li>
            <li className="disabled"><Check size={18} color="transparent" /> No watermark</li>
          </ul>
          <button className="current-plan-btn" disabled>Current Plan</button>
        </motion.div>

        {/* Essential Tier */}
        <motion.div 
          className="pricing-card popular"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="popular-badge"><Zap size={14} /> Most Popular</div>
          <div className="card-header">
            <h3>Essential</h3>
            <div className="price">$49<span>/event</span></div>
            <p className="description">Everything you need for a stunning event.</p>
          </div>
          <ul className="features-list">
            <li><Check size={18} /> Up to 200 guests</li>
            <li><Check size={18} /> Advanced RSVP & Plus Ones</li>
            <li><Check size={18} /> Premium themes</li>
            <li><Check size={18} /> No watermark</li>
            <li className="disabled"><Check size={18} color="transparent" /> Custom domain</li>
          </ul>
          <button 
            className="upgrade-btn primary"
            onClick={() => handleUpgrade('essential')}
            disabled={loadingTier === 'essential'}
          >
            {loadingTier === 'essential' ? 'Processing...' : 'Upgrade to Essential'}
          </button>
        </motion.div>

        {/* Premium Tier */}
        <motion.div 
          className="pricing-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="card-header">
            <h3>Premium</h3>
            <div className="price">$99<span>/event</span></div>
            <p className="description">The ultimate experience for your guests.</p>
          </div>
          <ul className="features-list">
            <li><Check size={18} /> Unlimited guests</li>
            <li><Check size={18} /> Custom RSVP questions</li>
            <li><Check size={18} /> All premium themes</li>
            <li><Check size={18} /> No watermark</li>
            <li><Check size={18} /> Custom domain integration</li>
          </ul>
          <button 
            className="upgrade-btn"
            onClick={() => handleUpgrade('premium')}
            disabled={loadingTier === 'premium'}
          >
            {loadingTier === 'premium' ? 'Processing...' : 'Upgrade to Premium'}
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default BillingPage;
