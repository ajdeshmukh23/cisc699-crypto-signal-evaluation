import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AddHoldingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const SUPPORTED_TOKENS = ['BTC', 'ETH', 'SOL', 'ADA'];

export const AddHoldingModal: React.FC<AddHoldingModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { token: authToken } = useAuth();
  const [selectedToken, setSelectedToken] = useState('BTC');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!quantity || !buyPrice) {
      setError('Please fill in all fields');
      return;
    }

    const quantityNum = parseFloat(quantity);
    const buyPriceNum = parseFloat(buyPrice);

    if (quantityNum <= 0 || buyPriceNum <= 0) {
      setError('Quantity and buy price must be positive numbers');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/portfolio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          token: selectedToken,
          quantity: quantityNum,
          buyPrice: buyPriceNum
        })
      });

      const data = await response.json();

      if (data.success) {
        setSelectedToken('BTC');
        setQuantity('');
        setBuyPrice('');
        onSuccess();
      } else {
        setError(data.error || 'Failed to add holding');
      }
    } catch (err) {
      console.error('Error adding holding:', err);
      setError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSelectedToken('BTC');
    setQuantity('');
    setBuyPrice('');
    onClose();
  };

  return (
    <div className="auth-modal-overlay" onClick={handleClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={handleClose}>&times;</button>

        <h2>Add Holding</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="token">Token</label>
            <select
              id="token"
              value={selectedToken}
              onChange={e => setSelectedToken(e.target.value)}
            >
              {SUPPORTED_TOKENS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              placeholder="e.g., 0.5"
              step="any"
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="buyPrice">Buy Price (USD)</label>
            <input
              type="number"
              id="buyPrice"
              value={buyPrice}
              onChange={e => setBuyPrice(e.target.value)}
              placeholder="e.g., 45000"
              step="any"
              min="0"
              required
            />
          </div>

          {error && <div className="auth-error">{error}</div>}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Holding'}
          </button>
        </form>

        <div className="holding-note">
          <small>Note: If you already own this token, the quantity will be added and the buy price will be averaged.</small>
        </div>
      </div>
    </div>
  );
};
