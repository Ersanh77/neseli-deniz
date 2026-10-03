/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { X, Star, ShoppingBag, RotateCcw, PlusCircle, Sparkles } from 'lucide-react';
import { BoosterType } from '../types';

interface ShopItem {
  id: BoosterType;
  name: string;
  description: string;
  price: number;
  icon: React.ReactNode;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'EXTRA_MOVES',
    name: 'Ekstra Hamle',
    description: '+5 Hamle ekle',
    price: 500,
    icon: <PlusCircle size={24} className="text-emerald-400" />,
  },
  {
    id: 'SHUFFLE',
    name: 'Karıştır',
    description: 'Tahtayı yeniden diz',
    price: 300,
    icon: <RotateCcw size={24} className="text-blue-400" />,
  },
  {
    id: 'SPAWN_STARFISH',
    name: 'Deniz Yıldızı',
    description: 'Tüm satırı temizle',
    price: 400,
    icon: <Sparkles size={24} className="text-yellow-400" />,
  },
];

interface ShopProps {
  coins: number;
  onPurchase: (item: ShopItem) => void;
  onClose: () => void;
}

export default function Shop({ coins, onPurchase, onClose }: ShopProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/90 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-md max-h-[90dvh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 sm:p-6 text-white flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <ShoppingBag className="text-yellow-400 w-6 h-6 sm:w-8 sm:h-8" />
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">Deniz Mağazası</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 active:scale-95 rounded-full transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Coin Balance */}
        <div className="bg-yellow-50 p-3 sm:p-4 border-b border-yellow-100 flex items-center justify-center gap-2 flex-shrink-0">
          <Star size={18} className="text-yellow-500 fill-yellow-500" />
          <span className="text-lg sm:text-xl font-black text-slate-800">{coins} DENİZ PARASI</span>
        </div>

        {/* Items */}
        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {SHOP_ITEMS.map((item) => (
            <div 
              key={item.id}
              className="flex items-center justify-between p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-100 group transition-all"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-white p-2.5 sm:p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base">{item.name}</h3>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
              <button
                onClick={() => onPurchase(item)}
                disabled={coins < item.price}
                className={`flex flex-col items-center gap-0.5 sm:gap-1 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-black transition-all ${
                  coins >= item.price 
                    ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95' 
                    : 'bg-slate-200 text-slate-400 grayscale'
                }`}
              >
                <div className="flex items-center gap-1 text-xs sm:text-sm">
                   <Star size={12} className={coins >= item.price ? 'fill-white' : 'fill-slate-400'} />
                   {item.price}
                </div>
                <span className="text-[9px] sm:text-[10px] uppercase">SATIN AL</span>
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-5 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest border-t border-slate-100 flex-shrink-0">
           Güçlendiriciler oyun sırasında hemen kullanılır
        </div>
      </motion.div>
    </motion.div>
  );
}
