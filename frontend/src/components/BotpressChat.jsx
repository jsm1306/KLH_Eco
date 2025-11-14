import { useEffect } from 'react';

const BotpressChat = () => {
  useEffect(() => {
    // Load the Botpress webchat script
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v2.2/inject.js';
    script.async = true;
    
    script.onload = () => {
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
            "color": "#00f5ff",
            "variant": "solid",
            "headerVariant": "solid",
            "themeMode": "dark",
            "fontFamily": "Inter",
            "radius": 10,
            "feedbackEnabled": false,
            "footer": "[⚡ Powered by Botpress](https://botpress.com/?from=webchat)",
            "soundEnabled": false,
            "proactiveMessageEnabled": false,
            "proactiveBubbleMessage": "Hi! 👋 Need help?",
            "proactiveBubbleTriggerType": "afterDelay",
            "proactiveBubbleDelayTime": 10
          },
          "clientId": "35f2a48f-02de-4a68-8044-4273eaf4a31a"
        });
        
        // Apply custom neon styling to Botpress
        setTimeout(() => {
          const style = document.createElement('style');
          style.textContent = `
            /* Neon Cyberpunk Theme for Botpress */
            
            /* Widget Container */
            #bp-web-widget-container {
              z-index: 9999 !important;
            }
            
            /* Widget Toggle Button - Neon Cyan/Purple Gradient */
            #bp-web-widget-container button[aria-label="Toggle Webchat"],
            #bp-web-widget-container > div > button {
              background: linear-gradient(135deg, #00f5ff, #b836ff) !important;
              box-shadow: 0 8px 24px rgba(0, 245, 255, 0.5), 0 0 40px rgba(184, 54, 255, 0.3) !important;
              border: 2px solid rgba(0, 245, 255, 0.4) !important;
              transition: all 0.3s ease !important;
              width: 60px !important;
              height: 60px !important;
            }
            
            #bp-web-widget-container button[aria-label="Toggle Webchat"]:hover,
            #bp-web-widget-container > div > button:hover {
              transform: scale(1.1) translateY(-2px) !important;
              box-shadow: 0 12px 32px rgba(0, 245, 255, 0.7), 0 0 60px rgba(184, 54, 255, 0.5) !important;
              border-color: rgba(0, 245, 255, 0.8) !important;
            }
            
            /* Chat Window Container */
            #bp-web-widget-container > div > div {
              border-radius: 12px !important;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(0, 245, 255, 0.2) !important;
              border: 1px solid rgba(0, 245, 255, 0.3) !important;
              overflow: hidden !important;
            }
            
            /* Chat Iframe Styling */
            #bp-web-widget-container iframe {
              border-radius: 12px !important;
              border: none !important;
            }
            
            /* Try to override iframe content if possible */
            #bp-web-widget-container iframe::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: linear-gradient(135deg, rgba(10, 15, 31, 0.95), rgba(14, 31, 59, 0.95)) !important;
              pointer-events: none;
            }
          `;
          document.head.appendChild(style);
        }, 1000);
      } else {
        // Botpress not loaded yet
      }
    };
    
    script.onerror = (error) => {
      // Error silently handled
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