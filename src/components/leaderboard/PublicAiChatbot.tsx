import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  AlertCircle,
  HelpCircle,
  Trophy,
  ClipboardList,
  Calendar,
  PlayCircle,
  Mic,
  MicOff,
  Volume2
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface PublicAiChatbotProps {
  festivalId?: string;
}

export default function PublicAiChatbot({ festivalId }: PublicAiChatbotProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'ഹായ്! ഞാൻ സാഹിത്യോത്സവ് AI അസിസ്റ്റന്റാണ്. ഫെസ്റ്റിവൽ ഫലങ്ങളെക്കുറിച്ചും, പോയിന്റുകളെക്കുറിച്ചും ചോദിക്കൂ!\n\nHi! I am the Sahithyolsav AI Assistant. How can I help you today?\n\n[OPTION:What all can I ask you?|Chat anything] [OPTION:I want to find a result|Find result]',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const recognitionRef = useRef<any>(null);

  const isMobile = windowWidth <= 1024;
  const isTablet = windowWidth >= 768;

  const dStyles = {
    headerTitle: { fontSize: isTablet ? 18 : 14.5 },
    headerSubtitle: { fontSize: isTablet ? 12 : 10 },
    messageText: { fontSize: isTablet ? 15 : 12.5, lineHeight: isTablet ? 22 : 18 },
    messageTime: { fontSize: isTablet ? 10.5 : 8.5 },
    typingText: { fontSize: isTablet ? 13.5 : 11.5 },
    chipText: { fontSize: isTablet ? 12 : 10 },
    inlineChipText: { fontSize: isTablet ? 13 : 11 },
    textInput: { fontSize: isTablet ? 15 : 12.5 },
  };

  const triggerHaptic = () => {
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (e) {
      // Ignored
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    triggerHaptic();
    setInputValue('');
    setErrorText(null);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let baseUrl = '';
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        baseUrl = window.location.origin;
      }
      
      const chatHistoryForApi = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const response = await fetch(`${baseUrl}/api/public-ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          chatHistory: chatHistoryForApi,
          festivalId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'No response received.',
        timestamp: new Date(),
      };

      // Show text IMMEDIATELY
      setMessages((prev) => [...prev, assistantMsg]);

      // Play voice in background (non-blocking) only if voice is enabled
      if (isVoiceEnabled) {
        speakText(assistantMsg.content); // no await — runs in background
      }
    } catch (err: any) {
      console.error('Error fetching AI response:', err);
      setErrorText(err.message || 'Error occurred. Please try again.');
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const toggleVoice = () => {
    if (Platform.OS !== 'web') {
      alert('Voice assistant is currently only supported on the website.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Your browser does not support voice input.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    triggerHaptic();
    const recognition = new SpeechRecognition();
    recognition.lang = 'ml-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join('');
      setInputValue(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const speakText = async (text: string) => {
    if (Platform.OS !== 'web') return;
    
    triggerHaptic();
    let cleanText = text.replace(/\[OPTION:.*?\]/g, '');
    cleanText = cleanText.replace(/[*#_~`]/g, '').trim();

    const fallbackTTS = (fallbackText: string) => {
      const synth = (window as any).speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(fallbackText);
      utterance.lang = 'ml-IN';
      synth.speak(utterance);
    };

    if ((window as any)._currentAudio) {
      (window as any)._currentAudio.pause();
    }

    try {
      let baseUrl = '';
      if (typeof window !== 'undefined') {
        baseUrl = window.location.origin;
      }
      
      const response = await fetch(`${baseUrl}/api/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: cleanText }),
      });

      if (!response.ok) {
        throw new Error('TTS API failed');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const audio = new window.Audio(url);
      
      (window as any)._currentAudio = audio;
      
      audio.onended = () => {
        URL.revokeObjectURL(url); // Clean up memory
      };

      await audio.play();
    } catch (e) {
      console.warn('Backend TTS failed, trying fallback:', e);
      fallbackTTS(cleanText);
    }
  };

  const handleChipPress = (query: string) => {
    handleSend(query);
  };

  const toggleChat = () => {
    triggerHaptic();
    setIsOpen(!isOpen);
  };

  const quickActionChips = [
    {
      label: 'Leading Unit? / ആരാണ് ഫസ്റ്റ്?',
      icon: <Trophy size={12} color="#FBBF24" />,
      query: 'Who is leading the units standings?',
    },
    {
      label: 'Latest Results / അവസാന ഫലങ്ങൾ',
      icon: <ClipboardList size={12} color="#06B6D4" />,
      query: 'What are the latest published results?',
    },
    {
      label: 'Live Stages / സ്റ്റേജ് ലൈവ് ആയോ?',
      icon: <PlayCircle size={12} color="#10B981" />,
      query: 'What events are currently live on stage?',
    },
    {
      label: 'Today Schedule / ഇന്നത്തെ പരിപാടികൾ',
      icon: <Calendar size={12} color="#A78BFA" />,
      query: 'What is the schedule for today?',
    },
  ];

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Floating Action Button */}
      {!isOpen && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={toggleChat}
          style={styles.floatingButton}
        >
          <LinearGradient
            colors={['#34D399', '#059669', '#064E3B']}
            locations={[0, 0.5, 1]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.floatingButtonGradient}
          >
            <View style={styles.floatingIconWrapper}>
              <MessageSquare size={24} color="#FFFFFF" />
              <View style={styles.sparkleIcon}>
                <Sparkles size={12} color="#FBBF24" />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Glassmorphic Chat Panel */}
      {isOpen && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[
            styles.chatPanel,
            isMobile
              ? { top: 0, bottom: 0, left: 0, right: 0, width: '100%', height: '100%', borderRadius: 0, borderWidth: 0 }
              : { width: 420, height: Math.min(650, windowHeight - 60), bottom: 30, right: 30 },
          ]}
        >
          <View style={styles.panelInner}>
            {/* Header */}
            <LinearGradient
              colors={['rgba(16, 185, 129, 0.12)', 'rgba(3, 15, 30, 0.4)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.panelHeader}
            >
              <View style={styles.headerTitleRow}>
                <View style={styles.aiBadgeGlow}>
                  <Sparkles size={16} color="#10B981" />
                </View>
                <View>
                  <Text style={[styles.headerTitle, dStyles.headerTitle]}>Sahithyolsav AI</Text>
                  <Text style={[styles.headerSubtitle, dStyles.headerSubtitle]}>Public Festival Assistant • Read Only</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {/* Voice Toggle Button */}
                <TouchableOpacity
                  onPress={() => {
                    // Stop any currently playing audio when turning off
                    if (isVoiceEnabled && (window as any)._currentAudio) {
                      (window as any)._currentAudio.pause();
                    }
                    setIsVoiceEnabled(!isVoiceEnabled);
                  }}
                  style={[
                    styles.closeButton,
                    { backgroundColor: isVoiceEnabled ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.06)' }
                  ]}
                  activeOpacity={0.8}
                >
                  <Volume2 size={16} color={isVoiceEnabled ? '#10B981' : 'rgba(255,255,255,0.4)'} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={toggleChat}
                  style={styles.closeButton}
                  activeOpacity={0.8}
                >
                  <X size={18} color="rgba(255, 255, 255, 0.6)" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Message Area */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messageScroll}
              contentContainerStyle={styles.messageScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                
                let cleanText = msg.content;
                const options: { query: string; label: string }[] = [];
                
                if (!isUser) {
                  const parts = msg.content.split(/(\[OPTION:.*?\|.*?\])/);
                  const textParts = parts.map((part) => {
                    const match = part.match(/\[OPTION:(.*?)\|(.*?)\]/);
                    if (match) {
                      options.push({ query: match[1], label: match[2] });
                      return '';
                    }
                    return part;
                  });
                  cleanText = textParts.join('').trim();
                }

                return (
                  <View
                    key={msg.id}
                    style={[
                      styles.messageRow,
                      isUser ? styles.messageRowUser : styles.messageRowAi,
                    ]}
                  >
                    {!isUser && (
                      <View style={styles.botIconWrapper}>
                        <Sparkles size={10} color="#10B981" />
                      </View>
                    )}
                    <LinearGradient
                      colors={
                        isUser
                          ? ['#10B981', '#0B8A5E']
                          : ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.03)']
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.messageBubble,
                        isUser ? styles.messageBubbleUser : styles.messageBubbleAi,
                      ]}
                    >
                      <Text style={[styles.messageText, isUser ? styles.messageTextUser : styles.messageTextAi, dStyles.messageText]}>
                        {cleanText}
                      </Text>
                      {options.length > 0 && (
                        <View style={styles.inlineChipsContainer}>
                          {options.map((opt, i) => (
                            <TouchableOpacity
                              key={i}
                              onPress={() => handleSend(opt.query)}
                              style={styles.inlineChipButton}
                              activeOpacity={0.8}
                              disabled={isLoading}
                            >
                              <Text style={[styles.inlineChipText, dStyles.inlineChipText]}>{opt.label}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                        {!isUser ? (
                          <TouchableOpacity 
                            onPress={() => speakText(msg.content)} 
                            activeOpacity={0.7}
                            style={{ padding: 4, marginLeft: -4 }}
                          >
                            <Volume2 size={14} color="rgba(255, 255, 255, 0.4)" />
                          </TouchableOpacity>
                        ) : <View />}
                        <Text style={[styles.messageTime, dStyles.messageTime, { alignSelf: 'auto', marginTop: 0 }]}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </LinearGradient>
                  </View>
                );
              })}

              {isLoading && (
                <View style={[styles.messageRow, styles.messageRowAi]}>
                  <View style={styles.botIconWrapper}>
                    <Sparkles size={10} color="#10B981" />
                  </View>
                  <View style={[styles.messageBubble, styles.messageBubbleAi, styles.typingIndicator]}>
                    <ActivityIndicator size="small" color="#10B981" />
                    <Text style={[styles.typingText, dStyles.typingText]}>Analyzing leaderboard...</Text>
                  </View>
                </View>
              )}

              {errorText && (
                <View style={styles.errorContainer}>
                  <AlertCircle size={16} color="#EF4444" />
                  <Text style={styles.errorText}>{errorText}</Text>
                </View>
              )}
            </ScrollView>

            {/* Quick Action Chips */}
            <View style={styles.chipsOuterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={Platform.OS === 'web'}
                contentContainerStyle={styles.chipsContainer}
              >
                {quickActionChips.map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.8}
                    onPress={() => handleChipPress(chip.query)}
                    style={styles.chipButton}
                    disabled={isLoading}
                  >
                    {chip.icon}
                    <Text style={[styles.chipText, dStyles.chipText]}>{chip.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Input Bar */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                onPress={toggleVoice}
                style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff size={18} color="#EF4444" />
                ) : (
                  <Mic size={18} color="rgba(255, 255, 255, 0.7)" />
                )}
              </TouchableOpacity>
              <TextInput
                value={inputValue}
                onChangeText={setInputValue}
                placeholder="Ask in English, Malayalam or Manglish..."
                placeholderTextColor="rgba(255, 255, 255, 0.35)"
                style={[styles.textInput, dStyles.textInput]}
                onSubmitEditing={() => handleSend(inputValue)}
                editable={!isLoading}
                {...Platform.select({
                  web: { outlineStyle: 'none' as any },
                  default: {},
                })}
              />
              <TouchableOpacity
                onPress={() => handleSend(inputValue)}
                disabled={!inputValue.trim() || isLoading}
                style={[
                  styles.sendButton,
                  (!inputValue.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
                activeOpacity={0.8}
              >
                <Send size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowOpacity: 0.6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 25px -5px rgba(16, 185, 129, 0.6), inset 0px 4px 10px rgba(255, 255, 255, 0.5), inset 0px -4px 10px rgba(0, 0, 0, 0.3)',
      },
      default: {},
    }),
  },
  floatingButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingIconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))',
      },
      default: {},
    }),
  },
  sparkleIcon: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#031E19',
    borderRadius: 8,
    padding: 1.5,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.4)',
  },
  chatPanel: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(3, 15, 30, 0.92)',
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    shadowOpacity: 0.6,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
      },
      default: {},
    }),
  },
  panelInner: {
    flex: 1,
    flexDirection: 'column',
  },
  voiceButton: {
    padding: 10,
    marginRight: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  voiceButtonActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  panelHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBadgeGlow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins_700Bold',
    color: '#FFFFFF',
    fontSize: 14.5,
  },
  headerSubtitle: {
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 10,
    marginTop: 0.5,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageScroll: {
    flex: 1,
  },
  messageScrollContent: {
    padding: 16,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    gap: 8,
    maxWidth: '85%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  messageRowAi: {
    alignSelf: 'flex-start',
  },
  botIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    flexShrink: 1,
  },
  messageBubbleUser: {
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopRightRadius: 2,
  },
  messageBubbleAi: {
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 2,
  },
  messageText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12.5,
    lineHeight: 18,
  },
  messageTextUser: {
    color: '#FFFFFF',
  },
  messageTextAi: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  messageTime: {
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 8.5,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  typingText: {
    fontFamily: 'Poppins_400Regular',
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11.5,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 4,
  },
  errorText: {
    fontFamily: 'Poppins_400Regular',
    color: '#FCA5A5',
    fontSize: 11.5,
    flex: 1,
  },
  chipsOuterContainer: {
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(3, 15, 30, 0.4)',
  },
  chipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 30,
  },
  chipText: {
    fontFamily: 'Poppins_700Bold',
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
  },
  inlineChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  inlineChipButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  inlineChipText: {
    fontFamily: 'Poppins_700Bold',
    color: '#10B981',
    fontSize: 11,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'rgba(2, 8, 18, 0.8)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#FFFFFF',
    fontSize: 12.5,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
});
