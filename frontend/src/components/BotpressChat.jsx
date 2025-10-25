import { useEffect } from 'react';

const BotpressChat = () => {
  useEffect(() => {
    // Load the Botpress webchat script
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v2.2/inject.js';
    script.async = true;
    
    script.onload = () => {
      console.log('Botpress script loaded successfully');
      
      // Initialize Botpress with your configuration
      if (window.botpress) {
        window.botpress.init({
          "botId": "1ca83ec7-cf68-4d60-9986-5fd8b2f7e863",
          "configuration": {
            "version": "v2",
            "website": {},
            "email": {},
            "phone": {},
            "termsOfService": {},
            "privacyPolicy": {},
            "color": "#3276EA",
            "variant": "solid",
            "headerVariant": "glass",
            "themeMode": "light",
            "fontFamily": "inter",
            "radius": 4,
            "feedbackEnabled": false,
            "footer": "[⚡️ by Botpress](https://botpress.com/?from=webchat)",
            "soundEnabled": false,
            "proactiveMessageEnabled": false,
            "proactiveBubbleMessage": "Hi! 👋 Need help?",
            "proactiveBubbleTriggerType": "afterDelay",
            "proactiveBubbleDelayTime": 10
          },
          "clientId": "35f2a48f-02de-4a68-8044-4273eaf4a31a"
        });
        console.log('Botpress initialized successfully');
      } else {
        console.error('Botpress not found on window object');
      }
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Botpress script:', error);
    };
    
    document.body.appendChild(script);

    // Cleanup function
    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return null;
};

export default BotpressChat;
