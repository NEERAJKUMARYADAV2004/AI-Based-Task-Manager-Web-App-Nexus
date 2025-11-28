import React, { useState, useRef, useEffect } from 'react';
import { IconButton } from './UI';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // New State for Mute/Unmute

  // Auto-send state
  const [countdown, setCountdown] = useState(0); 
  const messagesEndRef = useRef(null);
  const autoSendTimerRef = useRef(null); 

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello Chief! I'm Nexus AI. How can I assist you today?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  // --- Countdown Timer ---
  useEffect(() => {
    let interval;
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [countdown]);

  // --- Stop speech when chat closes ---
  useEffect(() => {
    if (!isOpen) {
      window.speechSynthesis.cancel();
    }
  }, [isOpen]);

  // --- Text-to-Speech Function ---
  const speakText = (text) => {
    if (!('speechSynthesis' in window) || isMuted) return;

    // Cancel any currently playing audio to avoid overlap
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1; // Speed: 0.1 to 10
    utterance.pitch = 1; // Pitch: 0 to 2

    // Optional: Try to select a specific voice (e.g., Google US English or Samantha)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Samantha"));
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  };

  const cancelAutoSend = () => {
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    if (countdown > 0) {
      setCountdown(0);
    }
  };

  const generateResponse = (userText) => {
    const lowerText = userText.toLowerCase();
    if (lowerText.includes('hello') || lowerText.includes('hi')) return "Greetings! Ready to be productive?";
    if (lowerText.includes('task') || lowerText.includes('todo')) return "I can help you organize your To-Do list. Just go to the To-Do tab to add new items.";
    if (lowerText.includes('project')) return "Your projects are looking good. Need help tracking a deadline?";
    if (lowerText.includes('date') || lowerText.includes('time')) return `It is currently ${new Date().toLocaleTimeString()}.`;
    if (lowerText.includes('create') || lowerText.includes('add')) return "To add a new item, please use the '+' buttons on the respective pages.";
    return "I'm processing that request. I am currently in beta, but I'm learning every day!";
  };

  // --- Handle Voice Input ---
  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        alert("Voice input is not supported in this browser.");
        return;
    }

    cancelAutoSend();
    window.speechSynthesis.cancel(); // Stop AI from speaking if user starts talking

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    let finalTranscript = '';

    recognition.onstart = () => setIsListening(true);
    
    recognition.onresult = (event) => {
        finalTranscript = event.results[0][0].transcript;
        setInputValue(finalTranscript);
    };

    recognition.onerror = (event) => {
        console.error("Speech error", event.error);
        setIsListening(false);
    };

    recognition.onend = () => {
        setIsListening(false);
        if (finalTranscript.trim()) {
            setCountdown(5); 
            autoSendTimerRef.current = setTimeout(() => {
                handleSendMessage(null, finalTranscript); 
                setCountdown(0); 
            }, 5000);
        }
    };

    recognition.start();
  };

  // --- Send Message ---
  const handleSendMessage = (e, textOverride = null) => {
    if (e) e.preventDefault();
    cancelAutoSend();
    window.speechSynthesis.cancel(); // Stop previous speech

    const textToSend = textOverride !== null ? textOverride : inputValue;
    if (!textToSend.trim()) return;

    const newUserMsg = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing
    setTimeout(() => {
      const botResponseText = generateResponse(newUserMsg.text);
      
      const newBotMsg = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newBotMsg]);
      setIsTyping(false);
      
      // *** TRIGGER VOICE OUTPUT ***
      speakText(botResponseText);

    }, 1500);
  };

  return (
    <>
      <div 
        className={`fixed bottom-24 right-6 w-96 flex flex-col bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right z-50 overflow-hidden ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-10 pointer-events-none'
        }`}
        style={{ maxHeight: '600px', height: '70vh' }}
      >
        {/* Header */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white text-lg">🤖</div>
            <div>
              <h3 className="text-white font-bold text-sm">Nexus AI</h3>
              <p className="text-white/50 text-xs flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Online
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mute Toggle Button */}
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              title={isMuted ? "Unmute Voice" : "Mute Voice"}
            >
              {isMuted ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                 </svg>
              ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                 </svg>
              )}
            </button>
            {/* Close Button */}
            <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-red-600 text-white rounded-br-none' : 'bg-white/10 text-white/90 rounded-bl-none border border-white/5'}`}>
                <p>{msg.text}</p>
                <span className={`text-[10px] block mt-1 ${msg.sender === 'user' ? 'text-red-200' : 'text-white/40'}`}>
                  {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex justify-start">
               <div className="bg-white/10 p-3 rounded-2xl rounded-bl-none flex gap-1 items-center">
                 <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce"></span>
                 <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-100"></span>
                 <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-200"></span>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/5 border-t border-white/10">
          {countdown > 0 && (
            <div className="mb-2 flex items-center justify-between bg-indigo-600/20 border border-indigo-500/30 rounded px-3 py-1">
              <span className="text-xs text-indigo-200 animate-pulse">Sending in {countdown}s...</span>
              <button onClick={cancelAutoSend} className="text-xs text-white hover:text-red-300 font-bold">Tap to Edit</button>
            </div>
          )}

          <form onSubmit={(e) => handleSendMessage(e)} className="relative flex items-center gap-2">
            <input
              name="chatInput"
              type="text"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); cancelAutoSend(); }}
              onFocus={cancelAutoSend} 
              placeholder={isListening ? "Listening..." : "Ask Nexus..."}
              className={`w-full bg-black/20 border border-white/10 rounded-full py-3 pl-4 pr-10 text-sm text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all ${isListening ? 'border-red-500 animate-pulse' : ''}`}
            />
            <button
                type="button"
                onClick={handleVoiceInput}
                className={`absolute right-12 p-2 rounded-full transition-all duration-300 ${isListening ? 'text-red-500 bg-red-500/10 scale-110' : 'text-white/50 hover:text-white hover:bg-white/10'}`}
                title="Speak"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                 </svg>
            </button>
            <button type="submit" disabled={!inputValue.trim() || isTyping} className="p-3 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-lg shadow-red-600/20">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <IconButton
            icon={isOpen ? <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg> : <span className="text-3xl">🤖</span>}
            className={`w-16 h-16 !text-white !shadow-lg !shadow-red-500/50 transition-all duration-300 ${isOpen ? '!bg-slate-700 rotate-180' : '!bg-red-600 hover:!bg-red-700'}`}
            onClick={() => setIsOpen(!isOpen)}
        />
      </div>
    </>
  );
};

export default Chatbot;