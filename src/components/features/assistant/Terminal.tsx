"use client";

import { useAssistant } from '@/contexts/AssistantContext';
import { useSettings } from '@/contexts/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

const Terminal = () => {
  const {
    isTerminalOpen,
    toggleTerminal,
    terminalContent,
    processCommand,
  } = useAssistant();

  const [input, setInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isTerminalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTerminalOpen]);
  
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalContent]);

  const handleTerminalInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      processCommand(input);
      setInput('');
    }
  };

  return (
    <AnimatePresence>
      {isTerminalOpen && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 right-0 w-full md:w-1/2 lg:w-2/5 h-1/2 bg-gray-900/95 backdrop-blur-md border-t border-gray-700 z-50 flex flex-col rounded-t-lg"
        >
          <div className="bg-gray-800/80 px-4 py-2 flex justify-between items-center rounded-t-lg flex-shrink-0">
            <div className="flex items-center">
              <div className="flex space-x-1.5 mr-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <h3 className="font-mono text-sm text-gray-300">AI Assistant Terminal</h3>
            </div>
            <button
              className="text-gray-400 hover:text-white"
              onClick={toggleTerminal}
            >
              <X size={20} />
            </button>
          </div>

          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2"
          >
            {terminalContent.map((item) => (
              <div
                key={item.id}
                className={`w-full ${item.type === 'user'
                    ? 'text-blue-400'
                    : item.type === 'ai'
                    ? 'text-cyan-400'
                    : item.type === 'error'
                    ? 'text-red-400'
                    : 'text-yellow-400'
                  }`}
              >
                {item.content}
              </div>
            ))}
          </div>
            <div className="flex items-center p-2 border-t border-gray-800 flex-shrink-0">
              <span className="mr-2 flex-shrink-0 text-cyan-400">
                J.A.R.V.I.S. $
              </span>
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent border-none outline-none text-gray-200 font-mono text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleTerminalInput}
                autoFocus
                placeholder="Type your command..."
              />
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Terminal;
