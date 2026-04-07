'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';
import { CardPrinting, CardCondition } from '@/lib/types';
import { formatPrice, formatDate } from '@/lib/scryfall/transform';

interface AddToPortfolioModalProps {
  isOpen: boolean;
  onClose: () => void;
  printing: CardPrinting & { card?: { name: string }; set?: { name: string; code: string } };
  onSuccess?: () => void;
}

export function AddToPortfolioModal({ 
  isOpen, 
  onClose, 
  printing, 
  onSuccess 
}: AddToPortfolioModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    purchase_price: printing.usd || 0,
    acquired_date: new Date().toISOString().split('T')[0],
    condition: CardCondition.NEAR_MINT,
    finish: printing.finish || '',
    source: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/portfolio/holdings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_printing_id: printing.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to portfolio');
      }

      onSuccess?.();
      onClose();
      // Reset form
      setFormData({
        quantity: 1,
        purchase_price: printing.usd || 0,
        acquired_date: new Date().toISOString().split('T')[0],
        condition: CardCondition.NEAR_MINT,
        finish: printing.finish || '',
        source: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error adding to portfolio:', error);
      // Could add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Add to Portfolio</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Card Info */}
          <div className="mb-6">
            <div className="flex gap-4">
              <div className="w-16 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {printing.image_uri ? (
                  <img
                    src={printing.image_uri}
                    alt="Card"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-medium">{printing.card?.name}</div>
                <div className="text-sm text-gray-600">{printing.set?.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {printing.set?.code}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {printing.rarity}
                  </Badge>
                </div>
                <div className="text-sm font-medium mt-2">
                  Current: {formatPrice(printing.usd)}
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => updateField('quantity', parseInt(e.target.value) || 1)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.purchase_price}
                  onChange={(e) => updateField('purchase_price', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Acquired Date</label>
              <Input
                type="date"
                value={formData.acquired_date}
                onChange={(e) => updateField('acquired_date', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Condition</label>
              <Select value={formData.condition} onValueChange={(value) => updateField('condition', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={CardCondition.NEAR_MINT}>Near Mint</SelectItem>
                  <SelectItem value={CardCondition.LIGHTLY_PLAYED}>Lightly Played</SelectItem>
                  <SelectItem value={CardCondition.MODERATELY_PLAYED}>Moderately Played</SelectItem>
                  <SelectItem value={CardCondition.HEAVILY_PLAYED}>Heavily Played</SelectItem>
                  <SelectItem value={CardCondition.DAMAGED}>Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Finish (optional)</label>
              <Input
                value={formData.finish}
                onChange={(e) => updateField('finish', e.target.value)}
                placeholder="e.g., foil, etched"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Source (optional)</label>
              <Select value={formData.source} onValueChange={(value) => updateField('source', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No source</SelectItem>
                  <SelectItem value="game_store">Game Store</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="trade">Trade</SelectItem>
                  <SelectItem value="gift">Gift</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes (optional)</label>
              <Input
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Add any notes..."
              />
            </div>

            {/* Summary */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span>Total Cost:</span>
                  <span className="font-medium">
                    {formatPrice(formData.quantity * formData.purchase_price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Adding...' : 'Add to Portfolio'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
