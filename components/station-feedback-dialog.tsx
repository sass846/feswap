'use client';

import React from "react"

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Star, Send, Loader2 } from 'lucide-react';

interface StationFeedbackDialogProps {
  stationId: string;
  stationName: string;
  onClose: () => void;
  onSubmit?: () => void;
}

export function StationFeedbackDialog({
  stationId,
  stationName,
  onClose,
  onSubmit,
}: StationFeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [waitTime, setWaitTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating || !waitTime) return;

    setLoading(true);
    try {
      // Simulate API call with dummy data
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Store feedback in localStorage for demo
      const feedbackData = {
        station_id: stationId,
        rating,
        comment,
        wait_time_actual: parseInt(waitTime),
        timestamp: new Date().toISOString(),
      };

      const existingFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('feedback', JSON.stringify(existingFeedback));

      console.log('[v0] Feedback stored:', feedbackData);
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        onSubmit?.();
      }, 2000);
    } catch (error) {
      console.error('[v0] Feedback submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4 md:p-0">
      <Card className="w-full max-w-md border-0 shadow-2xl rounded-t-2xl md:rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Rate Your Visit</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-slate-300 transition p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          // Success Message
          <div className="p-8 text-center">
            <div className="mb-4 inline-block p-3 bg-success/10 rounded-full">
              <Star className="w-8 h-8 text-success fill-success" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Thank You!</h3>
            <p className="text-sm text-muted-foreground">
              Your feedback helps us improve battery swap stations.
            </p>
          </div>
        ) : (
          // Feedback Form
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Station Name */}
            <div>
              <p className="text-sm font-medium text-foreground mb-1">{stationName}</p>
              <p className="text-xs text-muted-foreground">How was your experience?</p>
            </div>

            {/* Star Rating */}
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>

            {/* Wait Time Input */}
            <div>
              <label htmlFor="wait-time" className="block text-sm font-medium text-foreground mb-2">
                Actual Wait Time (minutes)
              </label>
              <Input
                id="wait-time"
                type="number"
                min="0"
                max="120"
                placeholder="Enter wait time"
                value={waitTime}
                onChange={(e) => setWaitTime(e.target.value)}
                disabled={loading}
                className="text-base"
              />
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
                Additional Comments (Optional)
              </label>
              <textarea
                id="comment"
                placeholder="Share your experience... (Max 200 characters)"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 200))}
                disabled={loading}
                className="w-full px-4 py-3 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {comment.length}/200
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-transparent"
              >
                Skip
              </Button>
              <Button
                type="submit"
                disabled={loading || !rating || !waitTime}
                className="flex-1 bg-accent hover:bg-orange-600 text-white gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}
