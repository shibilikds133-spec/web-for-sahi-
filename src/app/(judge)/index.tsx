import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, Animated, Platform,
  KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react-native';
import { judgeTokenService } from '../../services/judgeTokenService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function JudgePortalLanding() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const handleCodeChange = (text: string) => {
    setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
    setError('');
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (code.length < 6) {
      setError('Please enter a complete 6-character code.');
      shake();
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const tokenData = await judgeTokenService.validateToken(code);
      await AsyncStorage.setItem('judge_session_token', code);
      await AsyncStorage.setItem('judge_session_data', JSON.stringify(tokenData));
      router.replace('/(judge)/marks' as any);
    } catch (e: any) {
      setError(e.message ?? 'Invalid code. Please try again.');
      shake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#064E3B', '#065F46', '#047857']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

          {/* Header */}
          <View className="items-center pt-20 pb-10 px-8">
            <View className="w-24 h-24 rounded-3xl bg-white/10 border border-white/20 items-center justify-center mb-6">
              <ShieldCheck size={48} color="#FFF" strokeWidth={1.5} />
            </View>
            <Text className="text-4xl font-poppins-black text-white text-center mb-2">
              Judge Portal
            </Text>
            <Text className="text-white/60 font-poppins text-center text-sm leading-5">
              Sahithyolsav Judging System{'\n'}Enter your one-time access code to continue
            </Text>
          </View>

          {/* Card */}
          <View className="mx-5 bg-white rounded-3xl p-7 shadow-2xl">
            <Text className="font-poppins-bold text-gray-800 text-base mb-1">Access Code</Text>
            <Text className="font-poppins text-gray-400 text-xs mb-5">
              You should have received this from the event coordinator
            </Text>

            <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
              <TouchableOpacity
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
                className={`border-2 rounded-2xl px-5 py-4 mb-2 ${
                  error ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}
              >
                <TextInput
                  ref={inputRef}
                  value={code}
                  onChangeText={handleCodeChange}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  onSubmitEditing={handleSubmit}
                  style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                />
                <View className="flex-row justify-center gap-x-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <View
                      key={i}
                      className={`w-10 h-12 rounded-xl items-center justify-center border-b-2 ${
                        i < code.length ? 'border-green-600' :
                        i === code.length ? 'border-gray-400' : 'border-gray-200'
                      }`}
                    >
                      <Text className={`font-poppins-black text-xl ${
                        i < code.length ? 'text-gray-900' : 'text-gray-300'
                      }`}>
                        {code[i] ?? '·'}
                      </Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {error ? (
              <View className="flex-row items-center gap-x-2 mb-4 px-1">
                <AlertCircle size={14} color="#EF4444" />
                <Text className="font-poppins text-red-500 text-xs flex-1">{error}</Text>
              </View>
            ) : <View className="mb-4" />}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isLoading || code.length < 6}
              className={`rounded-2xl py-4 flex-row items-center justify-center gap-x-2 ${
                code.length === 6 && !isLoading ? 'bg-green-700' : 'bg-gray-200'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text className={`font-poppins-black text-base ${
                    code.length === 6 ? 'text-white' : 'text-gray-400'
                  }`}>Enter Portal</Text>
                  <ArrowRight size={18} color={code.length === 6 ? '#FFF' : '#9CA3AF'} />
                </>
              )}
            </TouchableOpacity>

            <Text className="font-poppins text-gray-400 text-xs text-center mt-5 leading-4">
              This code is for single use only.{'\n'}Contact the admin if you need a new code.
            </Text>
          </View>

          <Text className="text-white/30 font-poppins text-center text-xs mt-8 mb-6">
            Sahithyolsav · Powered by SSF
          </Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
