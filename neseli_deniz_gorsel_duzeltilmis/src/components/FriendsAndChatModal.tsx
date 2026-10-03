/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  MessageCircle, 
  Users, 
  UserPlus, 
  Send, 
  Gift, 
  Copy, 
  Check, 
  Trash2, 
  Globe, 
  Smile, 
  Sparkles,
  ChevronRight,
  Edit2
} from 'lucide-react';
import { Friend, ChatMessage, PlayerProfile, CREATURES } from '../types';

interface FriendsAndChatModalProps {
  coins: number;
  onCoinsUpdate: (newCoins: number) => void;
  onClose: () => void;
  onPlaySFX?: (soundUrl: string) => void;
  initialTab?: 'chat' | 'friends';
}

const DEFAULT_SUGGESTIONS: Omit<Friend, 'id'>[] = [
  {
    code: 'DENIZ-1024',
    name: 'Kaptan Mercan',
    avatar: CREATURES[4].src, // Yunus
    level: 28,
    stars: 76,
    status: 'online',
    lastSeen: 'Şu an oyunda',
  },
  {
    code: 'DENIZ-3941',
    name: 'Dalgıç Selin',
    avatar: CREATURES[0].src, // Palyaço Balığı
    level: 16,
    stars: 42,
    status: 'online',
    lastSeen: 'Şu an oyunda',
  },
  {
    code: 'DENIZ-7721',
    name: 'Mavi Balina Efe',
    avatar: CREATURES[5].src, // Fok
    level: 45,
    stars: 120,
    status: 'offline',
    lastSeen: '15 dk önce',
  },
  {
    code: 'DENIZ-8819',
    name: 'Deniz Yıldızı Ada',
    avatar: CREATURES[7].src, // Deniz Yıldızı
    level: 9,
    stars: 22,
    status: 'online',
    lastSeen: 'Şu an oyunda',
  },
];

const INITIAL_GLOBAL_MESSAGES: ChatMessage[] = [
  {
    id: 'g-1',
    senderId: 'bot-1',
    senderName: 'Kaptan Mercan',
    senderAvatar: CREATURES[4].src,
    text: 'Selam dalgıçlar! 🌊 Yeni deniz canlısı bölümleri harika olmuş!',
    timestamp: Date.now() - 1000 * 60 * 12,
    channel: 'global',
  },
  {
    id: 'g-2',
    senderId: 'bot-2',
    senderName: 'Dalgıç Selin',
    senderAvatar: CREATURES[0].src,
    text: 'Girdap güçlendiricisiyle az önce 6 kombo yaptım! 🌀 Kesinlikle deneyin.',
    timestamp: Date.now() - 1000 * 60 * 6,
    channel: 'global',
  },
  {
    id: 'g-3',
    senderId: 'bot-3',
    senderName: 'Deniz Yıldızı Ada',
    senderAvatar: CREATURES[7].src,
    text: 'Deniz yıldızlarını eşleştirince tüm satır patlıyor, çok rahatlatıcı ⭐',
    timestamp: Date.now() - 1000 * 60 * 2,
    channel: 'global',
  },
];

const QUICK_STICKERS = ['🐬', '🐠', '⭐', '🐙', '🌊', '💎', '🎉', '❤️'];

const BOT_REPLIES = [
  'Harikasın! Birlikte daha nice bölümler geçeceğiz 🐬',
  'Sana denizler dolusu şans diliyorum! 🌊',
  'Çok iyi hamle! Ben de o bölümde biraz zorlanmıştım ⭐',
  'Girdap ve Deniz Yıldızı kombosu inanılmaz puan getiriyor! 🌀',
  'Selam! Nasıl gidiyor su altı macerası? 🐠',
  'Tebrikler kaptan! Bir sonraki bölümde bol şans! 🎉',
];

export default function FriendsAndChatModal({
  coins,
  onCoinsUpdate,
  onClose,
  onPlaySFX,
  initialTab = 'chat',
}: FriendsAndChatModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'friends'>(initialTab);
  const [activeChannel, setActiveChannel] = useState<string>('global'); // 'global' or friend.id
  
  // Player Profile
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = localStorage.getItem('sea-match-player-profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    const randomCode = 'DENIZ-' + Math.floor(1000 + Math.random() * 9000);
    return {
      name: 'Deniz Kaşifi',
      code: randomCode,
      avatar: CREATURES[4].src,
    };
  });

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Friends State
  const [friends, setFriends] = useState<Friend[]>(() => {
    const saved = localStorage.getItem('sea-match-friends');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return DEFAULT_SUGGESTIONS.map((s, idx) => ({
      ...s,
      id: `friend-${idx + 1}`,
      giftSentToday: false,
    }));
  });

  // Friend input search
  const [newFriendInput, setNewFriendInput] = useState('');
  const [addFriendFeedback, setAddFriendFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Chat Messages State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('sea-match-chat-messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_GLOBAL_MESSAGES;
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem('sea-match-player-profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('sea-match-friends', JSON.stringify(friends));
  }, [friends]);

  useEffect(() => {
    localStorage.setItem('sea-match-chat-messages', JSON.stringify(messages));
  }, [messages]);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [activeTab, activeChannel, messages, isTyping]);

  // Handle Save Name
  const handleSaveName = () => {
    if (nameInput.trim()) {
      setProfile(prev => ({ ...prev, name: nameInput.trim() }));
    }
    setIsEditingName(false);
  };

  // Copy Friend Code
  const handleCopyCode = () => {
    navigator.clipboard?.writeText(profile.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Add Friend
  const handleAddFriend = (customNameOrCode?: string) => {
    const target = (customNameOrCode || newFriendInput).trim();
    if (!target) return;

    if (target.toUpperCase() === profile.code || target.toLowerCase() === profile.name.toLowerCase()) {
      setAddFriendFeedback({ type: 'error', message: 'Kendi kodunuzu ekleyemezsiniz!' });
      return;
    }

    const alreadyExists = friends.some(
      f => f.code.toUpperCase() === target.toUpperCase() || f.name.toLowerCase() === target.toLowerCase()
    );

    if (alreadyExists) {
      setAddFriendFeedback({ type: 'error', message: 'Bu dalgıç zaten arkadaş listenizde!' });
      return;
    }

    const randomAvatar = CREATURES[Math.floor(Math.random() * 7)].src;
    const newFriend: Friend = {
      id: `friend-${Date.now()}`,
      code: target.startsWith('DENIZ-') ? target.toUpperCase() : 'DENIZ-' + Math.floor(1000 + Math.random() * 9000),
      name: target.startsWith('DENIZ-') ? `Dalgıç #${target.slice(-4)}` : target,
      avatar: randomAvatar,
      level: Math.floor(Math.random() * 25) + 1,
      stars: Math.floor(Math.random() * 60) + 10,
      status: 'online',
      lastSeen: 'Şu an oyunda',
      giftSentToday: false,
    };

    setFriends(prev => [newFriend, ...prev]);
    setNewFriendInput('');
    setAddFriendFeedback({ type: 'success', message: `${newFriend.name} arkadaş listenize eklendi! 🎉` });
    setTimeout(() => setAddFriendFeedback(null), 3000);

    // Initial greeting from new friend in DM
    setTimeout(() => {
      const greetingMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: newFriend.id,
        senderName: newFriend.name,
        senderAvatar: newFriend.avatar,
        text: `Merhaba! Arkadaş olduğumuza çok sevindim 🌊 İyi oyunlar!`,
        timestamp: Date.now(),
        channel: newFriend.id,
      };
      setMessages(prev => [...prev, greetingMsg]);
    }, 1500);
  };

  // Send Gift (Coins)
  const handleSendGift = (friendId: string) => {
    setFriends(prev =>
      prev.map(f => {
        if (f.id === friendId) {
          return { ...f, giftSentToday: true };
        }
        return f;
      })
    );

    // Player gets friendly bonus +15 coins for being generous!
    const updatedCoins = coins + 15;
    onCoinsUpdate(updatedCoins);
    localStorage.setItem('sea-match-coins', updatedCoins.toString());

    // Friend sends a thank-you message in chat
    const friend = friends.find(f => f.id === friendId);
    if (friend) {
      setTimeout(() => {
        const thankMsg: ChatMessage = {
          id: `gift-${Date.now()}`,
          senderId: friend.id,
          senderName: friend.name,
          senderAvatar: friend.avatar,
          text: `Hediyen için çok teşekkürler! Sana da şans getirmesi için 15 Deniz Parası gönderdim 🎁✨`,
          timestamp: Date.now(),
          channel: friend.id,
        };
        setMessages(prev => [...prev, thankMsg]);
      }, 1200);
    }
  };

  // Remove Friend
  const handleRemoveFriend = (friendId: string) => {
    setFriends(prev => prev.filter(f => f.id !== friendId));
    if (activeChannel === friendId) {
      setActiveChannel('global');
    }
  };

  // Send Message
  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      senderName: profile.name,
      senderAvatar: profile.avatar,
      text,
      timestamp: Date.now(),
      channel: activeChannel,
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');

    if (onPlaySFX) {
      onPlaySFX('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    }

    // Trigger simulated companion reply
    if (activeChannel !== 'global') {
      const activeFriend = friends.find(f => f.id === activeChannel);
      if (activeFriend) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const replyText = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
          const replyMsg: ChatMessage = {
            id: `reply-${Date.now()}`,
            senderId: activeFriend.id,
            senderName: activeFriend.name,
            senderAvatar: activeFriend.avatar,
            text: replyText,
            timestamp: Date.now(),
            channel: activeChannel,
          };
          setMessages(prev => [...prev, replyMsg]);
        }, 1500);
      }
    } else {
      // Occasional friendly reaction in Global
      if (Math.random() > 0.4 && friends.length > 0) {
        const randomFriend = friends[Math.floor(Math.random() * friends.length)];
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const globalReplies = [
            'Denizaltı topluluğuna hoş geldin! 🌊',
            'Bugün skor rekoru kıran var mı? ⭐',
            'Bölümlerdeki deniz analarını temizlemek çok eğlenceli!',
            'Harika bir gün! İyi eşleştirmeler 🐬',
          ];
          const replyMsg: ChatMessage = {
            id: `g-reply-${Date.now()}`,
            senderId: randomFriend.id,
            senderName: randomFriend.name,
            senderAvatar: randomFriend.avatar,
            text: globalReplies[Math.floor(Math.random() * globalReplies.length)],
            timestamp: Date.now(),
            channel: 'global',
          };
          setMessages(prev => [...prev, replyMsg]);
        }, 1800);
      }
    }
  };

  // Filter messages for current channel
  const filteredMessages = messages.filter(m => m.channel === activeChannel);
  const activeFriend = friends.find(f => f.id === activeChannel);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/85 backdrop-blur-md p-2 sm:p-4 select-none"
    >
      <motion.div
        initial={{ scale: 0.95, y: 15 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-slate-900 border border-white/20 rounded-3xl w-full max-w-lg h-[92dvh] max-h-[680px] flex flex-col overflow-hidden shadow-2xl relative text-white"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 p-3 sm:p-4 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/15 rounded-xl">
              {activeTab === 'chat' ? (
                <MessageCircle className="text-cyan-300 w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Users className="text-yellow-300 w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                {activeTab === 'chat' ? 'DENİZ SOHBET ODASI' : 'ARKADAŞLARIM & PROFİL'}
              </h2>
              <p className="text-[10px] text-blue-200/80 font-medium">
                {activeTab === 'chat'
                  ? activeChannel === 'global'
                    ? 'Genel Topluluk Kanalı'
                    : `${activeFriend?.name || 'Özel'} ile Sohbet`
                  : `${friends.length} Dalgıç Arkadaş`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 active:scale-95 rounded-xl transition-all text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-800/80 p-1 border-b border-white/10 flex-shrink-0">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageCircle size={16} />
            SOHBET
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          </button>
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
              activeTab === 'friends'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users size={16} />
            ARKADAŞLAR ({friends.length})
          </button>
        </div>

        {/* TAB 1: SOHBET (CHAT) */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/90 overflow-hidden">
            {/* Channel Chips (Global + Direct Message Friends) */}
            <div className="flex items-center gap-1.5 p-2 bg-slate-800/50 border-b border-white/10 overflow-x-auto flex-shrink-0 scrollbar-none">
              <button
                onClick={() => setActiveChannel('global')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  activeChannel === 'global'
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md scale-102'
                    : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                <Globe size={13} />
                Genel Denizaltı
              </button>

              {friends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => setActiveChannel(friend.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                    activeChannel === friend.id
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md scale-102'
                      : 'bg-white/10 text-white/80 hover:bg-white/15'
                  }`}
                >
                  <img src={friend.avatar} alt="" className="w-4 h-4 rounded-full object-cover" />
                  <span>{friend.name.split(' ')[0]}</span>
                  {friend.status === 'online' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  )}
                </button>
              ))}
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 overscroll-contain">
              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
                  <MessageCircle size={36} className="text-slate-600 mb-2" />
                  <p className="font-bold text-sm text-slate-300">Henüz mesaj yok</p>
                  <p className="text-xs text-slate-400 mt-1">
                    İlk mesajı yazarak arkadaşınla sohbete başla!
                  </p>
                </div>
              ) : (
                filteredMessages.map(msg => {
                  const isMe = msg.senderId === 'me';
                  const timeFormatted = new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMe && (
                        <div className="w-7 h-7 rounded-xl bg-white/10 overflow-hidden flex-shrink-0 border border-white/20">
                          <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div
                        className={`max-w-[78%] flex flex-col ${
                          isMe ? 'items-end' : 'items-start'
                        }`}
                      >
                        {!isMe && (
                          <span className="text-[10px] text-cyan-300 font-bold mb-0.5 px-1">
                            {msg.senderName}
                          </span>
                        )}

                        <div
                          className={`px-3 py-2 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed break-words shadow-md ${
                            isMe
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-br-none'
                              : 'bg-slate-800 border border-white/10 text-white rounded-bl-none'
                          }`}
                        >
                          {msg.text}
                        </div>

                        <span className="text-[9px] text-slate-400 mt-0.5 px-1 font-mono">
                          {timeFormatted}
                        </span>
                      </div>

                      {isMe && (
                        <div className="w-7 h-7 rounded-xl bg-cyan-600/30 overflow-hidden flex-shrink-0 border border-cyan-400/40">
                          <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2 text-cyan-300 text-xs italic px-2">
                  <div className="flex gap-1 items-center bg-slate-800/80 px-2.5 py-1.5 rounded-full border border-white/10">
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    <span className="ml-1 text-[10px] font-bold text-slate-300">Yazıyor...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Stickers Bar */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border-t border-white/10 overflow-x-auto flex-shrink-0 scrollbar-none">
              <span className="text-[10px] text-slate-400 font-bold uppercase mr-1 flex items-center gap-1">
                <Smile size={12} />
              </span>
              {QUICK_STICKERS.map(sticker => (
                <button
                  key={sticker}
                  onClick={() => handleSendMessage(sticker)}
                  className="px-2 py-0.5 bg-white/10 hover:bg-white/20 active:scale-90 rounded-lg text-base transition-transform flex-shrink-0"
                  title="Sticker Gönder"
                >
                  {sticker}
                </button>
              ))}
            </div>

            {/* Message Input Box */}
            <div className="p-2 sm:p-3 bg-slate-800/90 border-t border-white/10 flex items-center gap-2 flex-shrink-0">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
                placeholder={
                  activeChannel === 'global'
                    ? 'Genel odaya mesaj yaz...'
                    : `${activeFriend?.name || 'Arkadaşına'} mesaj yaz...`
                }
                maxLength={120}
                className="flex-1 bg-slate-950/80 border border-white/15 text-white placeholder-slate-400 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-all"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim()}
                className="p-2.5 sm:px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1"
                title="Gönder"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: ARKADAŞLARIM & PROFİL */}
        {activeTab === 'friends' && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 overscroll-contain bg-slate-900/90">
            {/* Player Own Profile Card */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-800 to-indigo-950 border border-white/20 rounded-2xl p-3 sm:p-4 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-cyan-300 uppercase font-black tracking-wider flex items-center gap-1">
                  <Sparkles size={12} />
                  Kişisel Dalgıç Kartın
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg text-white font-bold transition-all active:scale-95"
                >
                  {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedCode ? 'Kopyalandı!' : 'Kodu Kopyala'}</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {/* Avatar with selector trigger */}
                <div className="relative">
                  <div 
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="w-12 h-12 rounded-2xl bg-cyan-600/30 border-2 border-cyan-400 overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-all"
                    title="Avatarını Değiştir"
                  >
                    <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-cyan-500 rounded-full p-0.5 pointer-events-none">
                    <Edit2 size={10} className="text-slate-950" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {isEditingName ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        maxLength={18}
                        className="bg-slate-950 border border-cyan-400 px-2 py-1 rounded-lg text-white text-xs font-bold w-full focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        className="bg-cyan-500 text-slate-950 font-bold px-2 py-1 rounded-lg text-xs"
                      >
                        Kaydet
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-white text-sm sm:text-base truncate">
                        {profile.name}
                      </h3>
                      <button
                        onClick={() => {
                          setNameInput(profile.name);
                          setIsEditingName(true);
                        }}
                        className="text-slate-400 hover:text-white"
                        title="İsmini Düzenle"
                      >
                        <Edit2 size={12} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-cyan-300 font-bold text-xs">{profile.code}</span>
                    <span className="text-[10px] text-slate-400">• Baş Dalgıç</span>
                  </div>
                </div>
              </div>

              {/* Avatar Selector Dropdown */}
              <AnimatePresence>
                {showAvatarPicker && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-white/10 overflow-hidden"
                  >
                    <p className="text-[10px] text-slate-300 mb-2 font-bold uppercase">
                      Bir Deniz Canlısı Avatarı Seç:
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {CREATURES.slice(0, 7).map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setProfile(prev => ({ ...prev, avatar: c.src }));
                            setShowAvatarPicker(false);
                          }}
                          className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-all p-0.5 ${
                            profile.avatar === c.src
                              ? 'border-cyan-400 scale-110 shadow-md bg-cyan-500/20'
                              : 'border-white/20 hover:border-white/50 bg-white/5'
                          }`}
                        >
                          <img src={c.src} alt={c.name} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Add Friend Input Box */}
            <div className="bg-slate-800/80 border border-white/15 rounded-2xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={16} className="text-cyan-400" />
                <h4 className="text-xs sm:text-sm font-black uppercase text-white">
                  Yeni Arkadaş Ekle
                </h4>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFriendInput}
                  onChange={e => setNewFriendInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddFriend();
                  }}
                  placeholder="Dalgıç Adı veya Kodu gir (Örn: DENIZ-1024)..."
                  className="flex-1 bg-slate-950 border border-white/15 text-white placeholder-slate-500 text-xs px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <button
                  onClick={() => handleAddFriend()}
                  disabled={!newFriendInput.trim()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-black text-xs rounded-xl transition-all active:scale-95 whitespace-nowrap"
                >
                  Ekle
                </button>
              </div>

              {addFriendFeedback && (
                <p
                  className={`text-xs mt-2 font-bold ${
                    addFriendFeedback.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {addFriendFeedback.message}
                </p>
              )}
            </div>

            {/* Friends List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Kayıtlı Arkadaşlar ({friends.length})
                </h4>
                <span className="text-[10px] text-cyan-300 font-bold">
                  {friends.filter(f => f.status === 'online').length} Çevrimiçi
                </span>
              </div>

              {friends.length === 0 ? (
                <div className="py-8 text-center bg-slate-800/40 rounded-2xl border border-white/10 text-slate-400">
                  <p className="text-sm font-bold">Henüz arkadaşın yok.</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Yukarıdan kod girerek veya önerilen dalgıçları ekleyebilirsin!
                  </p>
                </div>
              ) : (
                friends.map(friend => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-2.5 sm:p-3 bg-slate-800/70 hover:bg-slate-800 border border-white/10 rounded-2xl transition-all gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 overflow-hidden">
                          <img src={friend.avatar} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                            friend.status === 'online' ? 'bg-emerald-400' : 'bg-slate-500'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="font-bold text-white text-xs sm:text-sm truncate">
                            {friend.name}
                          </h5>
                          <span className="text-[10px] font-mono text-cyan-300 font-semibold hidden sm:inline">
                            {friend.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          <span>Bölüm {friend.level}</span>
                          <span>•</span>
                          <span className="text-yellow-400 font-bold">⭐ {friend.stars}</span>
                          <span>•</span>
                          <span className={friend.status === 'online' ? 'text-emerald-400' : ''}>
                            {friend.lastSeen}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          setActiveChannel(friend.id);
                          setActiveTab('chat');
                        }}
                        className="p-2 sm:px-2.5 sm:py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl text-white font-bold text-xs flex items-center gap-1 transition-all"
                        title="Sohbet Et"
                      >
                        <MessageCircle size={14} />
                        <span className="hidden sm:inline">Sohbet</span>
                      </button>

                      <button
                        onClick={() => handleSendGift(friend.id)}
                        disabled={friend.giftSentToday}
                        className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
                          friend.giftSentToday
                            ? 'bg-slate-700/50 text-emerald-400 border border-emerald-400/30 cursor-default'
                            : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 active:scale-95'
                        }`}
                        title={friend.giftSentToday ? 'Bugün hediye gönderildi' : 'Hediye Gönder'}
                      >
                        <Gift size={14} />
                        <span className="hidden sm:inline">
                          {friend.giftSentToday ? 'Gönderildi' : 'Hediye'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleRemoveFriend(friend.id)}
                        className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 active:scale-90 rounded-xl transition-all"
                        title="Arkadaşı Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Quick Suggested Friends (if any available to add) */}
            {DEFAULT_SUGGESTIONS.some(s => !friends.some(f => f.code === s.code)) && (
              <div className="pt-2">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">
                  Önerilen Deniz Dalgıçları
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEFAULT_SUGGESTIONS.filter(s => !friends.some(f => f.code === s.code)).map(sugg => (
                    <div
                      key={sugg.code}
                      className="p-2.5 bg-slate-800/40 border border-white/10 rounded-xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <img src={sugg.avatar} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        <div>
                          <p className="font-bold text-xs text-white">{sugg.name}</p>
                          <p className="text-[10px] text-slate-400">Bölüm {sugg.level}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddFriend(sugg.name)}
                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold active:scale-95"
                      >
                        Ekle
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
