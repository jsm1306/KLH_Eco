import React, { useState, useRef, useEffect } from 'react';
import '../index.css';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm KLH Campus Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const quickActions = [
    { label: '📅 Upcoming Events', action: 'events' },
    { label: '🔍 Lost & Found', action: 'lostfound' },
    { label: '💬 Submit Feedback', action: 'feedback' },
    { label: '🎯 View Clubs', action: 'clubs' },
  ];

  const getResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();

    // Event related queries
    if (msg.includes('event') || msg.includes('happening') || msg.includes('activities')) {
      return {
        text: "You can view all upcoming events on the Events page. We have cultural events, technical fests, sports tournaments, and more! Would you like me to navigate you there?",
        actions: [{ label: 'Go to Events', link: '/events' }]
      };
    }

    // Lost and Found queries
    if (msg.includes('lost') || msg.includes('found') || msg.includes('missing')) {
      return {
        text: "The Lost & Found section helps you report lost items or check if someone found your item. You can also browse items that others have found.",
        actions: [{ label: 'Go to Lost & Found', link: '/lostfound' }]
      };
    }

    // Feedback queries
    if (msg.includes('feedback') || msg.includes('complaint') || msg.includes('grievance') || msg.includes('issue')) {
      return {
        text: "You can submit feedback or grievances through our Feedback system. Your concerns will be reviewed by the administration.",
        actions: [{ label: 'Submit Feedback', link: '/feedback' }]
      };
    }

    // Club queries
    if (msg.includes('club') || msg.includes('organization') || msg.includes('join')) {
      return {
        text: "We have various clubs including Technical, Cultural, Sports, Literary, Music, and Dance clubs. Check out the Events page to see club activities!",
        actions: [{ label: 'View Clubs', link: '/events' }]
      };
    }

    // Help queries
    if (msg.includes('help') || msg.includes('how') || msg.includes('what can')) {
      return {
        text: "I can help you with:\n• Finding upcoming events\n• Reporting lost/found items\n• Submitting feedback or grievances\n• Learning about campus clubs\n• Navigating the portal\n\nWhat would you like to know more about?",
        actions: quickActions.map(qa => ({ label: qa.label, action: qa.action }))
      };
    }

    // Login/Account queries
    if (msg.includes('login') || msg.includes('account') || msg.includes('sign in')) {
      return {
        text: "You can log in using your Google account through the Login button in the navigation bar. Once logged in, you'll have access to all features!",
        actions: []
      };
    }

    // Dashboard queries
    if (msg.includes('dashboard') || msg.includes('home') || msg.includes('main')) {
      return {
        text: "The Dashboard shows you a quick overview of upcoming events, recent lost & found items, and your feedback submissions.",
        actions: [{ label: 'Go to Dashboard', link: '/' }]
      };
    }

    // Default response
    return {
      text: "I'm here to help! You can ask me about:\n• Upcoming events and activities\n• Lost & Found items\n• Submitting feedback\n• Campus clubs\n• How to use this portal",
      actions: quickActions.map(qa => ({ label: qa.label, action: qa.action }))
    };
  };

  const handleQuickAction = (action) => {
    const actionMap = {
      events: '/events',
      lostfound: '/lostfound',
      feedback: '/feedback',
      clubs: '/events'
    };

    const link = actionMap[action];
    if (link) {
      window.location.href = link;
    }
  };

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot typing and response
    setTimeout(() => {
      const response = getResponse(inputValue);
      const botMessage = {
        id: messages.length + 2,
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        actions: response.actions
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleActionClick = (action) => {
    if (action.link) {
      window.location.href = action.link;
    } else if (action.action) {
      handleQuickAction(action.action);
    }
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button
        className={`chatbot-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle chatbot"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="chatbot-window">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-avatar">🤖</div>
            <div className="chatbot-title">
              <h3>KLH Assistant</h3>
              <span className="chatbot-status">Online</span>
            </div>
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-message ${msg.sender}`}>
                <div className="message-bubble">
                  <p className="message-text">{msg.text}</p>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="message-actions">
                      {msg.actions.map((action, idx) => (
                        <button
                          key={idx}
                          className="action-button"
                          onClick={() => handleActionClick(action)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            {isTyping && (
              <div className="chatbot-message bot">
                <div className="message-bubble typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chatbot-input-container">
            <input
              type="text"
              className="chatbot-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              className="chatbot-send"
              onClick={handleSend}
              disabled={!inputValue.trim()}
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
