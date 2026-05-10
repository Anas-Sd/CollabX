import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import FeedbackModal from './FeedbackModal';

export default function FeedbackButton({ context = 'General', className = '', showLabel = false }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`${className} cursor-pointer flex items-center justify-center gap-2`}
      >
        <MessageSquare size={16} />
        {showLabel && <span>Feedback</span>}
      </button>
      <FeedbackModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        context={context} 
      />
    </>
  );
}
