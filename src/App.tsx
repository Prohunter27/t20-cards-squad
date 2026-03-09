/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  Home, 
  Layers, 
  Trophy, 
  User, 
  X, 
  Play, 
  Swords,
  ChevronRight,
  LogOut,
  ShieldCheck,
  ShoppingBag,
  HelpCircle,
  Info,
  Filter,
  Search,
  Lock,
  Clock,
  Plus,
  ChevronLeft,
  Crown,
  Medal,
  Flame,
  Percent,
  Zap,
  Shield,
  Activity
} from 'lucide-react';

// --- Hooks ---

const GAME_SOUNDS = {
  CARD_SELECT: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3', // Card slide
  CARD_FLIP: 'https://assets.mixkit.co/active_storage/sfx/2017/2017-preview.mp3',   // Card snap/flip
  SHUFFLE: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',     // Deck shuffle
  WIN: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',        // Tada/Success
  LOSE: 'https://assets.mixkit.co/active_storage/sfx/251/251-preview.mp3',         // Fail/Buzzer
  TICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',       // Mechanical tick
  HOVER: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',      // Soft UI click
  VICTORY: 'https://assets.mixkit.co/active_storage/sfx/2020/2020-preview.mp3'     // Big Win
};

const playSound = (url: string, volume = 0.6) => {
  try {
    const audio = new Audio(url);
    audio.volume = volume;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        // Autoplay was prevented
        console.log("Playback prevented:", error);
      });
    }
  } catch (e) {
    console.error("Sound error", e);
  }
};

const useImagePreloader = (urls: string[]) => {
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    if (!urls || urls.length === 0) {
      setImagesLoaded(true);
      return;
    }

    let loadedCount = 0;
    const total = urls.length;
    const images: HTMLImageElement[] = [];

    const handleLoad = () => {
      loadedCount++;
      if (loadedCount === total) {
        setImagesLoaded(true);
      }
    };

    urls.forEach(url => {
      const img = new Image();
      img.src = url;
      img.onload = handleLoad;
      img.onerror = handleLoad; // Count errors as loaded to avoid blocking
      images.push(img);
    });

    return () => {
      images.forEach(img => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [urls]);

  return imagesLoaded;
};

const GameLoadingScreen = ({ teamName }: { teamName: string }) => {
  const team = TEAMS.find(t => t.name === teamName);
  return (
    <div className="fixed inset-0 bg-[#050505] z-[200] flex flex-col items-center justify-center p-8 text-center">
      <div className="relative mb-6">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 border-4 border-orange-500/20 border-t-orange-500 rounded-full"
        />
        {team?.logo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <img src={team.logo} className="w-10 h-10 object-contain" alt="Logo" referrerPolicy="no-referrer" />
          </div>
        )}
      </div>
      <h2 className="text-xl font-black text-white italic uppercase tracking-tighter mb-2">Preparing Arena</h2>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading {teamName} Squad Assets...</p>
    </div>
  );
};

// --- Types ---

type View = 'home' | 'game' | 'collections' | 'profile' | 'challenges' | 'tournaments' | 'leaderboard' | 'challenge-battle' | 'store' | 'team-pack';

interface CapturedCard {
  id: string;
  cardId: string;
  opponentName: string;
  opponentTeamId: string;
  capturedAt: string;
  isRare: boolean;
}

interface UserProfile {
  name: string;
  avatar: string;
  teamId: string | null;
  rank: number;
  wins: number;
  losses: number;
  cardsCaptured: number;
  points: number;
  bestStreak: number;
  totalCardsOwned: number;
  teamsCompleted: number;
  cardsCapturedFromOpponents: number;
  matchHistory: { opponent: string, result: 'win' | 'loss', date: string }[];
  inventory: {
    teamId: string;
    sets: number;
  }[];
  capturedCards: CapturedCard[];
}

interface Challenge {
  id: string;
  playerName: string;
  playerAvatar: string;
  teamId: string;
  entryFee: number;
  mode: 'Classic' | 'Fire Mode';
  requiredSets: number;
  status: 'open' | 'active' | 'completed';
}

interface Tournament {
  id: string;
  name: string;
  entryFee: number;
  players: number;
  maxPlayers: number;
  prizePool: number;
}

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar: string;
  teamId: string;
  cardsWon: number;
  battlesWon: number;
  points: number;
  totalCardsOwned: number;
  teamsCompleted: number;
  cardsCapturedFromOpponents: number;
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo: string;
  cardBack: string;
}

interface GameCard {
  label: string;
  value: number;
  id: string;
}

// --- Constants ---

const TEAM_COLORS: Record<string, string> = {
  '1': '#ef4444', // BRW - red
  '2': '#eab308', // CHS - yellow
  '3': '#2563eb', // MIM - blue
  '4': '#f97316', // HYH - orange
  '5': '#ef4444', // DLD - red
  '6': '#22d3ee', // LKL - cyan
  '7': '#a855f7', // KKM - purple
  '8': '#1e3a8a', // GJG - dark blue
  '9': '#ef4444', // PNP - red
  '10': '#ec4899', // JPR - pink
};

const TEAMS: Team[] = [
  { id: '1', name: 'Bangalore Warriors', shortName: 'BRW', color: 'from-red-600 to-black', logo: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Flogo.png?alt=media&token=aa646897-c75b-441f-9c7a-a939da55ecda', cardBack: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcard-back.png?alt=media&token=47f58b02-bd02-4f35-b026-493c2e4bc498' },
  { id: '2', name: 'Chennai Strikers', shortName: 'CHS', color: 'from-yellow-400 to-yellow-600', logo: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Flogo.png?alt=media&token=a0bdcfbc-60e5-423d-822e-4cde15c90200', cardBack: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcard-back.png?alt=media&token=bf904cbf-9a64-40ed-b7ac-0c3ca48c2286' },
  { id: '3', name: 'Mumbai Masters', shortName: 'MIM', color: 'from-blue-600 to-blue-800', logo: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Flogo.png?alt=media&token=295e66a2-4a27-42d5-953a-6d05a983ca03', cardBack: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcard-back.png?alt=media&token=ba0a00d9-7ee4-44d6-83d4-4af37e88b155' },
  { id: '4', name: 'Hyderabad Hurricanes', shortName: 'HYH', color: 'from-orange-500 to-black', logo: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Flogo.png?alt=media&token=efa2a4a2-d49d-4994-b771-1e20389976b2', cardBack: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcard-back.png?alt=media&token=36759fb3-9bad-47c0-af04-24262fed3719' },
  { id: '5', name: 'Delhi Dominators', shortName: 'DLD', color: 'from-blue-700 to-red-600', logo: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Flogo.png?alt=media&token=ce904f6d-6c3c-4a58-8ccc-ec310233e6f4', cardBack: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcard-back.png?alt=media&token=52ebd2d4-407e-47dd-940c-12525181d194' },
  { id: '6', name: 'Lucknow Legends', shortName: 'LKL', color: 'from-cyan-400 to-blue-500', logo: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Flogo.png?alt=media&token=8e39b9c0-d7ff-4ed3-932b-75998484e88a', cardBack: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcard-back.png?alt=media&token=e8edb7c2-4434-470f-af54-dbc995b469f5' },
  { id: '7', name: 'Kolkata Kingsmen', shortName: 'KKM', color: 'from-purple-700 to-yellow-500', logo: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Flogo.png?alt=media&token=5a4c3483-7c9d-4fb0-9300-f72f0a0c3de4', cardBack: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcard-back.png?alt=media&token=6fced10c-b53a-4c1a-a87e-6be50a3a609b' },
  { id: '8', name: 'Gujarat Gladiators', shortName: 'GJG', color: 'from-blue-900 to-orange-500', logo: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Flogo.png?alt=media&token=737f36e4-37f5-4c32-8e5d-77ba6734ec5a', cardBack: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcard-back.png?alt=media&token=137bf7f1-60cb-4a3d-b6d5-99481b420a2d' },
  { id: '9', name: 'Punjab Panthers', shortName: 'PNP', color: 'from-red-500 to-silver-400', logo: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Flogo.png?alt=media&token=7f425f60-6eeb-47fe-ba94-1d1b57aa2b11', cardBack: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcard-back.png?alt=media&token=cdbf8cd8-c505-4e4d-a639-8a4d78127640' },
  { id: '10', name: 'Jaipur Royals', shortName: 'JPR', color: 'from-pink-500 to-blue-900', logo: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Flogo.png?alt=media&token=c36221ba-e1b5-4879-bac6-4b4d166438c7', cardBack: 'https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcard-back.png?alt=media&token=0e368524-2886-494f-96ea-b656ee649b0e' },
];

const GAME_CARDS: GameCard[] = [
  { id: 'c1', label: 'Dot ball', value: 0 },
  { id: 'c2', label: 'Wide', value: 1 },
  { id: 'c3', label: 'Double', value: 2 },
  { id: 'c4', label: 'Four', value: 4 },
  { id: 'c5', label: 'Six', value: 6 },
  { id: 'c6', label: 'No ball', value: 8 },
  { id: 'c7', label: 'Catch', value: 10 },
  { id: 'c8', label: 'Run out', value: 12 },
  { id: 'c9', label: 'LBW', value: 15 },
  { id: 'c10', label: 'Bowled', value: 18 },
];

const TEAM_SCORE_CARDS: Record<string, Record<number, string>> = {
  "BRW": {
    0: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcards%2F0.png?alt=media&token=5c73dad3-6a12-44ca-9e0f-4e3431acf980",
    1: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcards%2F1.png?alt=media&token=c4753a4d-72df-4ff7-8f72-a31b0556fb01",
    2: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcards%2F2.png?alt=media&token=7d5a0fee-7de0-4c9e-a889-d2cdecd85109",
    4: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcards%2F4.png?alt=media&token=1f38be24-7f00-4dde-b091-98fa04a63215",
    6: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcards%2F6.png?alt=media&token=1591578a-c9cb-48f6-a9a2-32a237c02497",
    8: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcards%2F8.png?alt=media&token=8cce08ae-580f-4533-a49e-8074d907f9c8",
    10: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcards%2F10.png?alt=media&token=8124826f-7380-445b-99e3-2db1a4223b86",
    12: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcards%2F12.png?alt=media&token=99b5408f-b94e-4081-8a2d-d2ae9fc5ecc0",
    15: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcards%2F15.png?alt=media&token=8b475251-a424-4417-8946-5279724ca46e",
    18: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fbrw%2Fcards%2F18.png?alt=media&token=c79e1228-bcaf-43e6-b7ec-94bd7b840964",
  },
  "CHS": {
    0: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcards%2F0.png?alt=media&token=b8649c10-fb7e-4824-bb92-3f1743c820d8",
    1: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcards%2F1.png?alt=media&token=9b445029-3f54-4b93-95dd-bbcf697a5e02",
    2: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcards%2F2.png?alt=media&token=4dd9bda7-5bf1-4600-b939-12bdf4e5e859",
    4: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcards%2F4.png?alt=media&token=c75792aa-869a-47f0-aac2-97b52bc61cbe",
    6: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcards%2F6.png?alt=media&token=ced5fb9f-9f8a-456d-8c5b-63202da18616",
    8: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcards%2F8.png?alt=media&token=bb1de92e-93f5-4d39-b94d-9444da710ae2",
    10: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcards%2F10.png?alt=media&token=85d52f87-fffa-477b-8bbb-1def5701d02d",
    12: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcards%2F12.png?alt=media&token=be48451a-45a4-4534-871e-14a9d812b062",
    15: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcards%2F15.png?alt=media&token=d6aacd0d-2986-4642-abcf-73ef6646d712",
    18: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fchs%2Fcards%2F18.png?alt=media&token=7f285a3a-2f9a-4272-9527-fee7f80171dd",
  },
  "DLD": {
    0: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcards%2F0.png?alt=media&token=ec92c047-bd36-4bb2-90c8-b04789b4446d",
    1: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcards%2F1.png?alt=media&token=d6fc6acd-a8eb-48c1-9bae-8483ce1d980b",
    2: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcards%2F2.png?alt=media&token=bf6a838c-a9ff-455b-beb4-9b4bb1956b85",
    4: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcards%2F4.png?alt=media&token=3f0082d2-2452-44e0-b856-df2020ab07ee",
    6: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcards%2F6.png?alt=media&token=6d12d060-1600-45d8-a86b-409db892f8bf",
    8: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcards%2F8.png?alt=media&token=6405badc-653a-42ca-94eb-d45cdbd9e7c3",
    10: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcards%2F10.png?alt=media&token=48a63068-4644-4288-97c6-a5011de3e9f9",
    12: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcards%2F12.png?alt=media&token=5c2cdcc6-ed4f-49a9-9885-bd97d0c73b9c",
    15: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcards%2F15.png?alt=media&token=ad74519b-fbde-49e0-8ba3-868a7256f66b",
    18: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fdld%2Fcards%2F18.png?alt=media&token=55989fa4-75dc-4984-8a7f-2017a6c5276c",
  },
  "GJG": {
    0: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcards%2F0.png?alt=media&token=110b4b49-ecc7-4fc6-83da-ef2f5b8c4996",
    1: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcards%2F1.png?alt=media&token=39f28f08-608d-40f7-9628-9eb80ed8bbcd",
    2: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcards%2F2.png?alt=media&token=275e3850-ca4c-4581-b130-ade00122b2f3",
    4: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcards%2F4.png?alt=media&token=8bdfa8ad-010d-4628-9293-9ddea97a470f",
    6: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcards%2F6.png?alt=media&token=18ad8f4b-7842-492e-91dc-5c33df991cb4",
    8: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcards%2F8.png?alt=media&token=81cec949-70c6-4af2-8c25-bf59d17b1bdd",
    10: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcards%2F10.png?alt=media&token=fedcedf6-fd3f-4067-92b9-f4d8270d0457",
    12: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcards%2F12.png?alt=media&token=21435c3b-99f8-468c-a4c8-38f5f8150c12",
    15: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcards%2F15.png?alt=media&token=82b9e4f3-db61-4f43-82e0-a570c9b414d6",
    18: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fgjg%2Fcards%2F18.png?alt=media&token=989a33a1-684f-40c9-a1e9-b31e71ca2faa",
  },
  "HYH": {
    0: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcards%2F0.png?alt=media&token=88ddbbf6-2eb6-471f-9496-0b217bc611e3",
    1: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcards%2F1.png?alt=media&token=d9740549-311e-4e70-8160-26a9b37599ad",
    2: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcards%2F2.png?alt=media&token=65ee28bf-7a93-4293-9b86-64319b44b385",
    4: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcards%2F4.png?alt=media&token=209a8bec-f553-461d-bc10-a9952dcb9f6d",
    6: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcards%2F6.png?alt=media&token=ec2cd7d7-4616-4993-871c-2e7a8b367713",
    8: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcards%2F8.png?alt=media&token=b535a157-7c8b-4d5a-acb5-441a2ca58d65",
    10: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcards%2F10.png?alt=media&token=a22b7b95-47bf-4821-a96d-b4abf3c1a31d",
    12: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcards%2F12.png?alt=media&token=9b2618af-6ecc-49f5-b8a3-9cdb5ababe3d",
    15: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcards%2F15.png?alt=media&token=14a5bc74-6db3-482a-86de-1cc9b9d72710",
    18: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fhyh%2Fcards%2F18.png?alt=media&token=c3fa1070-26d0-4cc1-8202-15ceb01d2390",
  },
  "JPR": {
    0: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcards%2F0.png?alt=media&token=ec647462-1eff-47ba-9682-c49cc1537874",
    1: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcards%2F1.png?alt=media&token=ef3e8ce3-d1f3-409e-b711-44c75c3401e9",
    2: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcards%2F2.png?alt=media&token=fb7aa89e-6852-466b-a05b-b9d546d387e5",
    4: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcards%2F4.png?alt=media&token=9e431d7f-2ae2-47b5-94ea-7b55257a5fff",
    6: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcards%2F6.png?alt=media&token=b4a1578a-97e0-4510-83d1-35ef15430485",
    8: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcards%2F8.png?alt=media&token=e91aed13-2171-4c2a-b77d-59da0c679c81",
    10: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcards%2F10.png?alt=media&token=d91c50bb-f38d-4335-b10d-fb7f302f2f30",
    12: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcards%2F12.png?alt=media&token=84126225-3c3d-4645-ada5-a82079acad7c",
    15: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcards%2F15.png?alt=media&token=54ccc73b-6d27-4669-8428-6b94c853280f",
    18: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fjpr%2Fcards%2F18.png?alt=media&token=8cea4979-646c-44e1-944c-8a4af29949c3",
  },
  "KKM": {
    0: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcards%2F0.png?alt=media&token=9b015177-01d7-4602-82a6-d9e3179f111b",
    1: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcards%2F1.png?alt=media&token=2ef80562-74f9-409e-8862-9628fd3ea0b2",
    2: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcards%2F2.png?alt=media&token=38e47ade-8863-4bfe-85f7-21318b599da2",
    4: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcards%2F4.png?alt=media&token=5b6d5a98-302b-49c3-b5ac-36147fd04b98",
    6: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcards%2F6.png?alt=media&token=d86d1d3e-6ecf-45c6-b567-17454c07d558",
    8: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcards%2F8.png?alt=media&token=a677949e-ea55-400a-806b-ce23733a8205",
    10: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcards%2F10.png?alt=media&token=82fbabad-f633-4bf1-91cd-c420b84ee3be",
    12: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcards%2F12.png?alt=media&token=82c2a0b6-8ed5-4384-bfce-f724524830f9",
    15: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcards%2F15.png?alt=media&token=56a2094e-f571-42e3-8ebd-40b2264fa54f",
    18: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fkkm%2Fcards%2F18.png?alt=media&token=1e35118d-9520-4405-958d-bf5553119e74",
  },
  "MIM": {
    0: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcards%2F0.png?alt=media&token=821ff2a8-0fb4-4363-b3fd-46a669bf4a23",
    1: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcards%2F1.png?alt=media&token=84eb2dac-9e82-44b2-afda-15ac651034cf",
    2: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcards%2F2.png?alt=media&token=59c3a253-0ed2-48d7-ae15-c5c48000e7ac",
    4: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcards%2F4.png?alt=media&token=d6c6b4f3-d633-486a-a52a-3007fe3648dc",
    6: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcards%2F6.png?alt=media&token=963622e5-9a4d-4400-aacc-1e09bf876275",
    8: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcards%2F8.png?alt=media&token=1526cdb3-a3f1-408d-af6f-707ecd4dbfac",
    10: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcards%2F10.png?alt=media&token=7eb2886f-8cd5-47d3-8918-55a7c9e918f3",
    12: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcards%2F12.png?alt=media&token=c864fa1b-83db-4b49-9eb2-c3fe3b69116c",
    15: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcards%2F15.png?alt=media&token=353fdb80-ff40-444e-a700-98930e9525e6",
    18: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fmim%2Fcards%2F18.png?alt=media&token=df8b1e0a-5f20-40b9-8639-84d4b46e4bd9",
  },
  "PNP": {
    0: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcards%2F0.png?alt=media&token=ae158ac1-7ab2-4714-8f46-68dca3ddae0f",
    1: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcards%2F1.png?alt=media&token=d7b6d80b-269e-4060-bf91-449d7afef6c0",
    2: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcards%2F2.png?alt=media&token=96029e7f-9df4-4e76-a094-b8c1aa57add2",
    4: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcards%2F4.png?alt=media&token=79019dd2-70f1-48ee-9c22-c36df97e815c",
    6: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcards%2F6.png?alt=media&token=0ef7b41f-46c1-4d17-b964-7a5d8a123135",
    8: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcards%2F8.png?alt=media&token=7751f038-50b2-4b49-bc13-93782ec1e302",
    10: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcards%2F10.png?alt=media&token=cf9f86a4-9a03-4b52-8cb8-f79b3b269dd4",
    12: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcards%2F12.png?alt=media&token=5dbf97e6-53a0-4e1c-9985-088acb70e1c3",
    15: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcards%2F15.png?alt=media&token=35af14ea-aab5-4c37-a950-d611cc7a515f",
    18: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Fpnp%2Fcards%2F18.png?alt=media&token=e1ea95e4-1534-42cc-bea5-ba109e44fc83",
  },
  "LKL": {
    0: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcards%2F0.png?alt=media&token=29f0714a-25a0-4087-ba0d-c6e92c6e09a6",
    1: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcards%2F1.png?alt=media&token=d8e22e26-59da-4344-915b-d6276209515c",
    2: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcards%2F2.png?alt=media&token=c32f6d65-baba-4c23-b094-5067a11b6689",
    4: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcards%2F4.png?alt=media&token=ad14d177-da23-43ae-add0-6be4c16f1c7c",
    6: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcards%2F6.png?alt=media&token=5bd56909-db64-4aeb-87a3-de712c7ae15f",
    8: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcards%2F8.png?alt=media&token=6a9f20f8-eaa4-4544-8219-7e4dced4d4b4",
    10: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcards%2F10.png?alt=media&token=662d5b9d-207a-462c-b995-be29e057da4b",
    12: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcards%2F12.png?alt=media&token=08d25e64-1682-4e15-83cd-fa22260a3ac0",
    15: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcards%2F15.png?alt=media&token=29e5986f-d677-419f-8121-bb8b4f329867",
    18: "https://firebasestorage.googleapis.com/v0/b/t20-squad-arena.firebasestorage.app/o/teams%2Flkl%2Fcards%2F18.png?alt=media&token=42a8f3da-2eb8-4eb3-92f3-852cb99a4919",
  }
};

const MOCK_CHALLENGES: Challenge[] = [
  { id: 'ch1', playerName: 'CricketKing', playerAvatar: 'https://picsum.photos/seed/user1/100', teamId: '1', entryFee: 100, mode: 'Classic', requiredSets: 2, status: 'open' },
  { id: 'ch2', playerName: 'MasterBlaster', playerAvatar: 'https://picsum.photos/seed/user2/100', teamId: '3', entryFee: 500, mode: 'Fire Mode', requiredSets: 2, status: 'open' },
  { id: 'ch3', playerName: 'SpinWizard', playerAvatar: 'https://picsum.photos/seed/user3/100', teamId: '7', entryFee: 250, mode: 'Classic', requiredSets: 2, status: 'open' },
];

const MOCK_TOURNAMENTS: Tournament[] = [
  { id: 't1', name: 'Weekend Warriors', entryFee: 50, players: 128, maxPlayers: 256, prizePool: 10000 },
  { id: 't2', name: 'Elite Battle Royale', entryFee: 500, players: 32, maxPlayers: 64, prizePool: 25000 },
  { id: 't3', name: 'Rookie Cup', entryFee: 0, players: 450, maxPlayers: 1000, prizePool: 1000 },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: 'Rahul_92', avatar: 'https://picsum.photos/seed/p1/100', teamId: '1', cardsWon: 450, battlesWon: 85, points: 12500, totalCardsOwned: 120, teamsCompleted: 4, cardsCapturedFromOpponents: 85 },
  { rank: 2, name: 'ViratFan_18', avatar: 'https://picsum.photos/seed/p2/100', teamId: '2', cardsWon: 420, battlesWon: 78, points: 11800, totalCardsOwned: 110, teamsCompleted: 3, cardsCapturedFromOpponents: 78 },
  { rank: 3, name: 'Hitman_45', avatar: 'https://picsum.photos/seed/p3/100', teamId: '3', cardsWon: 390, battlesWon: 72, points: 10500, totalCardsOwned: 95, teamsCompleted: 2, cardsCapturedFromOpponents: 72 },
  { rank: 4, name: 'Thala_07', avatar: 'https://picsum.photos/seed/p4/100', teamId: '2', cardsWon: 350, battlesWon: 65, points: 9800, totalCardsOwned: 88, teamsCompleted: 2, cardsCapturedFromOpponents: 65 },
  { rank: 5, name: 'Sky_63', avatar: 'https://picsum.photos/seed/p5/100', teamId: '3', cardsWon: 310, battlesWon: 58, points: 8500, totalCardsOwned: 75, teamsCompleted: 1, cardsCapturedFromOpponents: 58 },
];

// --- Components ---

const GradientIcon = ({ icon: Icon, size = 24 }: { icon: any, size?: number }) => (
  <div className="relative inline-block">
    <svg width="0" height="0" className="absolute">
      <linearGradient id="orange-yellow-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop stopColor="#ff6a00" offset="0%" />
        <stop stopColor="#ffcc33" offset="100%" />
      </linearGradient>
    </svg>
    <Icon size={size} style={{ stroke: "url(#orange-yellow-gradient)" }} />
  </div>
);

const TopNav = ({ onMenuOpen }: { onMenuOpen: () => void }) => (
  <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 flex justify-center">
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full max-w-md glass-navbar rounded-2xl py-3 px-6 flex items-center justify-between relative overflow-hidden shadow-lg border-glow-orange"
    >
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Trophy size={16} className="text-white" />
        </div>
        <h1 className="text-sm font-black tracking-widest text-gray-900 uppercase italic">
          Squad <span className="text-orange-600">Arena</span>
        </h1>
      </div>
      <button onClick={onMenuOpen} className="p-2 hover:bg-gray-50 rounded-xl transition-all active:scale-95 group">
        <Menu size={20} className="text-gray-400 group-hover:text-orange-500 transition-colors" />
      </button>
    </motion.div>
  </div>
);

const CompetitionNewsStrip = () => {
  const news = [
    { icon: <Flame size={12} className="text-orange-500" />, text: "Rahul_92 captured 12 cards", playerName: "Rahul_92" },
    { icon: <Trophy size={12} className="text-yellow-400" />, text: "ViratFan_18 won 5 battles today", playerName: "ViratFan_18" },
    { icon: <Zap size={12} className="text-blue-400" />, text: "Hitman_45 is today's top scorer", playerName: "Hitman_45" },
    { icon: <Crown size={12} className="text-purple-400" />, text: "King_Kohli leads weekly leaderboard", playerName: "King_Kohli" },
  ];

  return (
    <div className="mt-24 px-4 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10" />
      
      <div className="flex gap-4 overflow-hidden">
        <motion.div 
          animate={{ x: [0, -800] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex gap-4 whitespace-nowrap"
        >
          {[...news, ...news, ...news].map((item, i) => {
            const leaderboardEntry = MOCK_LEADERBOARD.find(l => l.name === item.playerName);
            const team = TEAMS.find(t => t.id === leaderboardEntry?.teamId);
            
            return (
              <div key={i} className="flex-shrink-0 glass-card px-5 py-2.5 flex items-center gap-3 group relative overflow-hidden border-white/5">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-black/40 rounded-full group-hover:bg-black/60 transition-colors shadow-sm border border-white/5">
                    {item.icon}
                  </div>
                  {team && (
                    <img src={team.logo} className="w-4 h-4 object-contain" alt="Team" referrerPolicy="no-referrer" />
                  )}
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.text}</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

const ActionCards = ({ onPlayClick, onStoreClick }: { onPlayClick: () => void, onStoreClick: () => void }) => (
  <div className="grid grid-cols-2 gap-4 px-4 mt-6">
    {/* Battle Arena Card */}
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="glass-card border-glow-orange p-5 flex flex-col items-center text-center relative overflow-hidden group"
    >
      {/* Icon Section */}
      <div className="w-full aspect-square bg-black/40 rounded-2xl mb-4 flex items-center justify-center relative border-glow-orange">
        <div className="relative flex items-center justify-center">
          {/* Crossed Cards */}
          <div className="w-10 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg border border-white/30 rotate-[-15deg] shadow-lg transform -translate-x-2" />
          <div className="w-10 h-14 bg-gradient-to-br from-orange-500 to-orange-700 rounded-lg border border-white/30 rotate-[15deg] shadow-lg transform translate-x-2 absolute" />
          <div className="absolute z-10 bg-orange-500/20 backdrop-blur-md rounded-full p-2 shadow-sm border border-white/20">
            <Swords size={18} className="text-orange-500" />
          </div>
        </div>
      </div>

      <h4 className="text-xs font-black text-white mb-0.5 uppercase tracking-widest">Battle Arena</h4>
      <p className="text-[9px] font-bold text-orange-500 uppercase mb-4 tracking-widest">1 VS 1 CLASH</p>
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onPlayClick}
        className="w-full py-2.5 btn-primary text-[10px]"
      >
        START BATTLE
      </motion.button>
    </motion.div>

    {/* STORE Card */}
    <motion.div 
      whileTap={{ scale: 0.98 }}
      className="glass-card border-glow-orange p-5 flex flex-col items-center text-center relative overflow-hidden group"
    >
      {/* Icon Section */}
      <div className="w-full aspect-square bg-black/40 rounded-2xl mb-4 flex items-center justify-center relative border-glow-orange">
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg border border-white/30 rotate-[-10deg] shadow-lg" />
          <div className="absolute z-10 bg-orange-500/20 backdrop-blur-md rounded-full p-2 shadow-sm border border-white/20">
            <ShoppingBag size={18} className="text-orange-500" />
          </div>
        </div>
      </div>

      <h4 className="text-xs font-black text-white mb-0.5 uppercase tracking-widest">STORE</h4>
      <p className="text-[9px] font-bold text-orange-500 uppercase mb-4 tracking-widest">CARD HOUSE</p>
      
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStoreClick}
        className="w-full py-2.5 btn-primary text-[10px]"
      >
        OPEN STORE
      </motion.button>
    </motion.div>
  </div>
);

const CardHousePage = ({ onSelectTeam, onBack }: { onSelectTeam: (team: Team) => void, onBack: () => void }) => {
  return (
    <div className="px-4 mt-28 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-xl border border-white/10">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Card House</h2>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Official Team Packs</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {TEAMS.map((team) => (
          <motion.div 
            key={team.id}
            whileHover={{ y: -5 }}
            onClick={() => onSelectTeam(team)}
            className="flex flex-col items-center group cursor-pointer will-change-transform"
          >
            <div className="w-full aspect-[2/3] rounded-2xl shadow-2xl relative overflow-hidden mb-3 orange-card group-hover:shadow-orange-500/40 transition-all duration-500">
              <img 
                src={team.cardBack} 
                alt={team.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              {/* Centered Logo with Highlight Effect */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative">
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <img 
                    src={team.logo} 
                    className="w-20 h-20 object-contain relative z-10 drop-shadow-[0_0_20px_rgba(255,255,255,0.6)] group-hover:scale-125 transition-transform duration-500" 
                    alt="Logo" 
                    referrerPolicy="no-referrer" 
                    loading="eager"
                    decoding="async"
                  />
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-20">
                <div className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full shadow-xl border border-white/20">
                  <p className="text-[8px] font-black text-white uppercase tracking-widest">View Pack</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 group-hover:text-yellow-400 transition-colors">
              <img src={team.logo} className="w-3 h-3 object-contain" alt="Logo" referrerPolicy="no-referrer" loading="eager" decoding="async" />
              <p className="text-[10px] font-black text-white uppercase tracking-widest text-center">{team.name}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const TeamPackPage = ({ team, onBack, onBuy }: { team: Team, onBack: () => void, onBuy: (teamId: string) => void }) => {
  const packCards = [0, 1, 2, 4, 6, 8, 10, 12, 15, 18];
  
  return (
    <div className="px-4 mt-28 pb-32">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 bg-white/5 rounded-xl border border-white/10">
          <ChevronLeft size={20} className="text-white" />
        </button>
        <div className="flex items-center gap-3">
          <img src={team.logo} className="w-6 h-6 object-contain" alt="Logo" referrerPolicy="no-referrer" loading="eager" />
          <h2 className="text-xl font-black text-gradient-primary italic uppercase tracking-tighter">{team.name}</h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        {packCards.map((val, i) => (
          <div key={i} className="aspect-[2/3] rounded-2xl shadow-xl relative overflow-hidden group border border-white/10 glass-card bg-black/40">
            <img 
              src={TEAM_SCORE_CARDS[team.shortName]?.[val]} 
              alt={`${team.name} Card ${val}`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              referrerPolicy="no-referrer"
              loading="eager"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      <div className="fixed bottom-28 left-0 right-0 px-8 z-[60] flex justify-center">
        <motion.button 
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onBuy(team.id)}
          className="w-full max-w-[240px] py-3.5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 border border-white/20"
        >
          <ShoppingBag size={16} />
          BUY PACK – ₹49
        </motion.button>
      </div>
    </div>
  );
};

const BottomNav = ({ activeView, setView }: { activeView: View, setView: (v: View) => void }) => (
  <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center">
    <div className="w-full max-w-md glass-navbar rounded-3xl p-2 flex justify-around items-center relative overflow-hidden shadow-2xl border-glow-orange">
      {[
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'collections', icon: Layers, label: 'Collection' },
        { id: 'challenges', icon: Play, label: 'Battle' },
        { id: 'leaderboard', icon: Trophy, label: 'Ranks' },
        { id: 'profile', icon: User, label: 'Profile' },
      ].map((item) => (
        <button 
          key={item.id}
          onClick={() => setView(item.id as View)}
          className="flex flex-col items-center p-3 relative z-10 group transition-all"
        >
          <div className={`transition-all duration-300 ${activeView === item.id ? 'scale-110 -translate-y-1' : 'opacity-40 group-hover:opacity-70 group-hover:-translate-y-0.5'}`}>
            <GradientIcon icon={item.icon} size={20} />
          </div>
          <span className={`text-[7px] font-black mt-1.5 uppercase tracking-widest transition-colors ${activeView === item.id ? 'text-orange-600' : 'text-gray-400'}`}>
            {item.label}
          </span>
          {activeView === item.id && (
            <motion.div 
              layoutId="nav-underline"
              className="absolute -bottom-1 w-6 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full shadow-lg shadow-orange-500/40"
            />
          )}
        </button>
      ))}
    </div>
  </div>
);

const SideMenu = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
        />
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          className="fixed top-0 right-0 bottom-0 w-64 bg-[#050505] z-[70] shadow-2xl p-6 flex flex-col border-l border-white/10 rounded-none"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-black text-white uppercase tracking-widest italic">Menu</h2>
            <button onClick={onClose} className="p-1">
              <X size={20} className="text-gray-400" />
            </button>
          </div>
          
          <div className="flex-1 space-y-4">
            {[
              { icon: ShieldCheck, label: 'Terms & Conditions' },
              { icon: ShoppingBag, label: 'Products' },
              { icon: ShieldCheck, label: 'Privacy Policy' },
              { icon: HelpCircle, label: 'Help' },
              { icon: Info, label: 'About' },
            ].map((item, i) => (
              <button key={i} className="flex items-center gap-3 w-full p-3 hover:bg-white/5 rounded-2xl transition-all group">
                <div className="group-hover:scale-110 transition-transform">
                  <GradientIcon icon={item.icon} size={18} />
                </div>
                <span className="text-[12px] font-bold text-gray-400 group-hover:text-white transition-colors uppercase tracking-tight">{item.label}</span>
              </button>
            ))}
          </div>

          <button className="flex items-center gap-3 w-full p-3 text-red-500 mt-auto hover:bg-red-500/10 rounded-2xl transition-all group">
            <div className="group-hover:scale-110 transition-transform">
              <LogOut size={18} />
            </div>
            <span className="text-[12px] font-black uppercase tracking-widest">Logout</span>
          </button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const PlayModal = ({ isOpen, onClose, onSelect }: { isOpen: boolean, onClose: () => void, onSelect: (type: string) => void }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="fixed bottom-0 left-0 right-0 glass-card rounded-t-[40px] z-[90] p-8 border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]"
        >
          <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />
          <h3 className="text-center text-lg font-black uppercase italic tracking-widest mb-6 text-gradient-primary">Start Match</h3>
          <div className="space-y-4">
            {['Join Room', 'Create Room', 'Auto Play'].map((type, i) => (
              <motion.button 
                key={type}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(type)}
                className="w-full py-4 rounded-2xl glass-card border border-gray-100 flex items-center justify-between px-6 hover:bg-gray-50 transition-all group"
              >
                <span className="text-sm font-black uppercase tracking-widest text-gray-900 group-hover:text-orange-600 transition-colors">{type}</span>
                <ChevronRight size={18} className="text-orange-500 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            ))}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const TeamSelectionModal = ({ isOpen, onSelect }: { isOpen: boolean, onSelect: (teamId: string) => void }) => (
  <AnimatePresence>
    {isOpen && (
        <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-white z-[200] p-8 overflow-y-auto"
      >
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-black text-gradient-primary italic uppercase tracking-tighter mb-2">Select Your Team</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Your team defines your profile theme and fanbase leaderboard.</p>
          
          <div className="grid grid-cols-1 gap-4">
            {TEAMS.map((team) => (
              <motion.button
                key={team.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(team.id)}
                className="glass-card p-5 flex items-center justify-between group border-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white p-2 border border-gray-100 group-hover:bg-white transition-colors">
                    <img src={team.logo} className="w-full h-full object-contain" alt={team.name} referrerPolicy="no-referrer" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">{team.name}</h4>
                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{team.shortName}</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-orange-500 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const HallOfFamePage = ({ user }: { user: UserProfile | null }) => {
  const [sortBy, setSortBy] = useState<'value' | 'latest' | 'team'>('latest');
  
  const capturedCards = user?.capturedCards || [];

  const sortedCards = [...capturedCards].sort((a, b) => {
    if (sortBy === 'value') {
      const valA = GAME_CARDS.find(c => c.id === a.cardId)?.value || 0;
      const valB = GAME_CARDS.find(c => c.id === b.cardId)?.value || 0;
      return valB - valA;
    }
    if (sortBy === 'latest') {
      return new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime();
    }
    if (sortBy === 'team') {
      return a.opponentTeamId.localeCompare(b.opponentTeamId);
    }
    return 0;
  });

  return (
    <div className="px-4 mt-28 pb-32">
      {/* Hall of Fame Header */}
      <div className="bg-gradient-to-br from-orange-500 to-yellow-500 rounded-[32px] p-6 mb-8 relative overflow-hidden shadow-[0_20px_40px_rgba(249,115,22,0.3)] border border-white/20">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/5 rounded-full -ml-16 -mb-16 blur-2xl" />
        
        <div className="flex items-center gap-4 mb-8 relative z-10">
          <div className="relative">
            <img src={user?.avatar || 'https://picsum.photos/seed/me/200'} className="w-14 h-14 rounded-2xl shadow-xl border-2 border-white/40 object-cover" alt="Profile" referrerPolicy="no-referrer" loading="eager" decoding="async" />
            <div className="absolute -bottom-1 -right-1 bg-black/60 rounded-full p-1 shadow-lg border border-white/10">
              <Trophy size={10} className="text-orange-500" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-wider italic drop-shadow-sm">Hall of Fame</h2>
            <p className="text-[9px] font-bold text-white/60 uppercase tracking-[0.2em]">Competitive Collection</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 relative z-10">
          <div className="text-center">
            <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-1">Total Cards</p>
            <p className="text-xl font-black text-white leading-none drop-shadow-sm">{user?.totalCardsOwned || 0}</p>
          </div>
          <div className="text-center border-x border-white/20">
            <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-1">Teams Done</p>
            <p className="text-xl font-black text-white leading-none drop-shadow-sm">{user?.teamsCompleted || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-[7px] font-black text-white/40 uppercase tracking-widest mb-1">Captured</p>
            <p className="text-xl font-black text-white leading-none">{user?.cardsCapturedFromOpponents || 0}</p>
          </div>
        </div>
      </div>

      {/* Collection Filters */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Collection</h3>
        <div className="flex gap-1.5">
          {(['latest', 'value', 'team'] as const).map(s => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all duration-300 ${
                sortBy === s 
                  ? 'btn-primary shadow-md' 
                  : 'bg-white/5 text-gray-500 border border-white/10'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Collection Grid */}
      <div className="grid grid-cols-2 gap-5">
        <AnimatePresence mode="popLayout">
          {sortedCards.map((cc) => {
            const card = GAME_CARDS.find(c => c.id === cc.cardId);
            const team = TEAMS.find(t => t.id === cc.opponentTeamId);
            const cardImageUrl = team ? TEAM_SCORE_CARDS[team.shortName]?.[card?.value || 0] : null;

            return (
              <motion.div
                key={cc.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className="glass-card p-3 shadow-xl relative overflow-hidden group transition-all duration-300 border-white/5"
              >
                {/* Card Image Section */}
                <div className="aspect-[2/3] rounded-2xl mb-3 overflow-hidden relative shadow-inner bg-black/40">
                  {cardImageUrl ? (
                    <img 
                      src={cardImageUrl} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      alt="Card" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black/40">
                      <Layers size={24} className="text-gray-600" />
                    </div>
                  )}
                  
                  {/* Score Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-4xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">
                      {card?.value}
                    </span>
                  </div>

                  {/* Rare Glow */}
                  {cc.isRare && (
                    <div className="absolute top-2 right-2">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_8px_#facc15]" />
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="text-center px-1">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <img src={team?.logo} className="w-3 h-3 object-contain opacity-80" alt="Logo" referrerPolicy="no-referrer" />
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{team?.shortName}</span>
                  </div>
                  <p className="text-[9px] font-black text-white truncate uppercase tracking-tighter">vs {cc.opponentName}</p>
                </div>

                {/* Subtle Hover Glow */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-transparent to-purple-500/0 group-hover:from-blue-500/5 group-hover:to-purple-500/5 pointer-events-none transition-all duration-500" />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

const LeaderboardPage = ({ user, setUser, userTeamId }: { user: UserProfile | null, setUser: (u: UserProfile) => void, userTeamId?: string | null }) => {
  const [tab, setTab] = useState<'today' | 'this_week' | 'last_week'>('this_week');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(MOCK_LEADERBOARD);
  const [isCelebrating, setIsCelebrating] = useState(false);
  
  // Simulate live updates and filtering
  useEffect(() => {
    let data = [...MOCK_LEADERBOARD];
    
    // Simulate different data for different tabs
    if (tab === 'today') {
      data = data.map(d => ({ ...d, points: Math.floor(d.points * 0.1) }));
    } else if (tab === 'last_week') {
      data = data.map(d => ({ ...d, points: Math.floor(d.points * 0.9) }));
    }

    // Sort by competitive metrics: Cards Captured + (Teams Completed * 100) + (Total Cards * 10)
    data.sort((a, b) => {
      const scoreA = a.cardsCapturedFromOpponents + (a.teamsCompleted * 100) + (a.totalCardsOwned * 10);
      const scoreB = b.cardsCapturedFromOpponents + (b.teamsCompleted * 100) + (b.totalCardsOwned * 10);
      return scoreB - scoreA;
    });
    
    // Update ranks
    const updatedData = data.map((d, i) => ({
      ...d,
      rank: i + 1
    }));

    setLeaderboardData(updatedData);

    // Trigger celebration if user is #1 (simulated)
    if (updatedData[0]?.name === user?.name) {
      setIsCelebrating(true);
      setTimeout(() => setIsCelebrating(false), 5000);
    }
  }, [tab, user?.name]);

  const handleClaimPrize = () => {
    if (!user) return;
    const rank = leaderboardData.findIndex(d => d.name === user.name) + 1;
    if (rank > 2) return;

    const prize = rank === 1 ? 5000 : 3000;
    if (confirm(`Congratulations! You are Rank #${rank}. Claim your ₹${prize} prize? \n\nNote: All your cards and teams will be reset to zero.`)) {
      const resetUser: UserProfile = {
        ...user,
        totalCardsOwned: 0,
        teamsCompleted: 0,
        cardsCapturedFromOpponents: 0,
        cardsCaptured: 0,
        points: 0,
        inventory: [],
        capturedCards: [],
        rank: 999 // Reset rank
      };
      setUser(resetUser);
      localStorage.setItem('t20_user', JSON.stringify(resetUser));
      alert(`₹${prize} prize claimed! Your collection has been reset. Start your journey again!`);
    }
  };

  const getTeamGlow = (teamId: string) => {
    const color = TEAM_COLORS[teamId] || '#ffffff';
    return `0 0 20px ${color}33`;
  };

  const getTeamGradient = (teamId: string) => {
    const color = TEAM_COLORS[teamId] || '#ffffff';
    return `linear-gradient(135deg, ${color}15 0%, transparent 100%)`;
  };

  return (
    <div className="px-4 mt-28 pb-32 relative">
      {/* Celebration Overlay */}
      <AnimatePresence>
        {isCelebrating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-yellow-400/10 backdrop-blur-[2px]" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              className="bg-black/80 p-8 rounded-[40px] border-2 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.2)] text-center backdrop-blur-xl"
            >
              <Crown size={80} className="text-yellow-400 mx-auto mb-4" />
              <h2 className="text-2xl font-black text-white uppercase italic">Weekly Champion!</h2>
              <p className="text-yellow-600 font-bold uppercase tracking-widest text-sm">{user?.name}</p>
            </motion.div>
            {/* Simulated Confetti */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth - window.innerWidth/2, 
                  y: -100,
                  rotate: 0
                }}
                animate={{ 
                  y: window.innerHeight + 100,
                  rotate: 360,
                  x: (Math.random() * 200 - 100) + (Math.random() * window.innerWidth - window.innerWidth/2)
                }}
                transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, ease: "linear" }}
                className="absolute w-2 h-2 rounded-sm"
                style={{ backgroundColor: ['#fbbf24', '#f87171', '#60a5fa', '#34d399'][i % 4] }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-4 mb-8">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-black text-gradient-primary italic uppercase tracking-tighter">Leaderboard</h2>
          <div className="bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
            <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Live Rewards</p>
          </div>
        </div>
        
        <div className="flex glass-card p-1 rounded-2xl overflow-x-auto no-scrollbar border border-white/5">
          {(['today', 'this_week', 'last_week'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                tab === t 
                  ? 'btn-primary shadow-md' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Weekly Announcement for Last Week */}
      {tab === 'last_week' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 bg-blue-500/10 border border-blue-500/20 p-4 rounded-3xl text-center"
        >
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Last Week's Champions</p>
          <p className="text-xs font-bold text-gray-400">Winners announced every Monday at 00:00 AM</p>
        </motion.div>
      )}

      {/* Prize Highlight for User */}
      {user && leaderboardData.findIndex(d => d.name === user.name) < 2 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-3xl shadow-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-2xl">
              <Trophy size={24} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">Available Prize</p>
              <p className="text-xl font-black text-white">₹{leaderboardData.findIndex(d => d.name === user.name) === 0 ? '5,000' : '3,000'}</p>
            </div>
          </div>
          <button 
            onClick={handleClaimPrize}
            className="bg-white text-orange-600 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-transform"
          >
            Claim Now
          </button>
        </motion.div>
      )}

      {/* Top 3 Celebratory Header */}
      <div className="flex justify-center items-end gap-3 mb-16 mt-12">
        {/* Rank 2 - Silver */}
        {leaderboardData[1] && (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center group"
          >
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-gray-400/20 rounded-3xl blur-xl group-hover:bg-gray-400/40 transition-all" />
              <img 
                src={leaderboardData[1].avatar} 
                className="w-16 h-16 rounded-3xl border-2 border-gray-300 shadow-2xl relative z-10 object-cover" 
                alt="2" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute -bottom-2 -right-2 w-7 h-7 rank-silver rounded-xl flex items-center justify-center text-[12px] font-black text-white shadow-lg z-20">2</div>
              <div className="absolute -top-4 -left-2 z-20">
                <motion.div animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 2, repeat: Infinity }}>
                  <Medal size={24} className="text-gray-400 drop-shadow-md" />
                </motion.div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <img src={TEAMS.find(t => t.id === leaderboardData[1].teamId)?.logo} className="w-3 h-3 object-contain" alt="Logo" referrerPolicy="no-referrer" />
              <p className="text-[10px] font-black text-white uppercase tracking-tighter">{leaderboardData[1].name}</p>
            </div>
            <p className="text-[9px] font-bold text-gray-500">₹3,000 Prize</p>
          </motion.div>
        )}

        {/* Rank 1 - Gold */}
        {leaderboardData[0] && (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center -mt-8 group"
          >
            <div className="relative mb-4">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20">
                <motion.div
                  animate={{ y: [0, -5, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Crown size={40} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                </motion.div>
              </div>
              <div className="absolute inset-0 bg-yellow-400/30 rounded-[32px] blur-2xl group-hover:bg-yellow-400/50 transition-all" />
              <img 
                src={leaderboardData[0].avatar} 
                className="w-24 h-24 rounded-[32px] border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] relative z-10 object-cover" 
                alt="1" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute -bottom-3 -right-3 w-10 h-10 rank-gold rounded-2xl flex items-center justify-center text-[16px] font-black text-white shadow-xl z-20">1</div>
              {/* Highlight Glow for #1 */}
              <motion.div 
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -inset-2 rounded-[40px] border-2 border-yellow-400/50 blur-md pointer-events-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <img src={TEAMS.find(t => t.id === leaderboardData[0].teamId)?.logo} className="w-4 h-4 object-contain" alt="Logo" referrerPolicy="no-referrer" />
              <p className="text-[14px] font-black text-white uppercase italic tracking-tight">{leaderboardData[0].name}</p>
            </div>
            <p className="text-[11px] font-bold text-orange-600">₹5,000 Prize</p>
          </motion.div>
        )}

        {/* Rank 3 - Bronze */}
        {leaderboardData[2] && (
          <motion.div 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center group"
          >
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-orange-400/20 rounded-3xl blur-xl group-hover:bg-orange-400/40 transition-all" />
              <img 
                src={leaderboardData[2].avatar} 
                className="w-14 h-14 rounded-3xl border-2 border-orange-400 shadow-2xl relative z-10 object-cover" 
                alt="3" 
                referrerPolicy="no-referrer" 
              />
              <div className="absolute -bottom-2 -right-2 w-6 h-6 rank-bronze rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg z-20">3</div>
            </div>
            <div className="flex items-center gap-1.5">
              <img src={TEAMS.find(t => t.id === leaderboardData[2].teamId)?.logo} className="w-3 h-3 object-contain" alt="Logo" referrerPolicy="no-referrer" />
              <p className="text-[10px] font-black text-white uppercase tracking-tighter">{leaderboardData[2].name}</p>
            </div>
            <p className="text-[9px] font-bold text-gray-500">Elite Rank</p>
          </motion.div>
        )}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {leaderboardData.map((entry) => {
            const isCurrentUser = entry.name === user?.name;
            const team = TEAMS.find(t => t.id === entry.teamId);
            
            return (
              <motion.div 
                key={entry.name}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-3xl flex items-center gap-4 transition-all duration-300 glass-card ${
                  isCurrentUser 
                    ? 'border-glow-orange shadow-lg' 
                    : 'border-gray-100'
                }`}
              >
                <div className="flex flex-col items-center w-6">
                  <span className={`text-[10px] font-black ${isCurrentUser ? 'text-orange-600' : 'text-gray-400'}`}>
                    {entry.rank}
                  </span>
                </div>

                <div className="relative">
                  <img src={entry.avatar} className="w-12 h-12 rounded-2xl object-cover border border-white/10" alt={entry.name} referrerPolicy="no-referrer" />
                  {entry.rank === 1 && <Crown size={14} className="absolute -top-2 -left-2 text-yellow-500 drop-shadow-sm" />}
                  {entry.rank === 2 && <Medal size={14} className="absolute -top-2 -left-2 text-gray-400 drop-shadow-sm" />}
                  {entry.rank === 3 && <Medal size={14} className="absolute -top-2 -left-2 text-orange-400 drop-shadow-sm" />}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={`text-sm font-black uppercase tracking-tight text-white`}>
                      {entry.name}
                    </h4>
                    {isCurrentUser && (
                      <div className="bg-orange-500/10 px-1.5 py-0.5 rounded-md border border-orange-500/20">
                        <span className="text-[7px] font-black text-orange-600 uppercase tracking-widest">YOU</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={team?.logo} className="w-3 h-3 object-contain opacity-60" alt="Team" referrerPolicy="no-referrer" />
                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                      {entry.totalCardsOwned} Cards • {entry.teamsCompleted} Teams
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className={`text-base font-black italic ${isCurrentUser ? 'text-orange-600' : 'text-white'}`}>
                    {entry.cardsCapturedFromOpponents}
                  </p>
                  <p className="text-[7px] font-black text-gray-400 uppercase tracking-[0.2em]">Captured</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ChallengeBattleArena = ({ 
  challenge, 
  onExit, 
  playerTeamId, 
  betTeamId,
  user,
  setUser
}: { 
  challenge: Challenge, 
  onExit: () => void, 
  playerTeamId: string,
  betTeamId: string,
  user: UserProfile | null,
  setUser: (u: UserProfile) => void
}) => {
  const playerTeam = TEAMS.find(t => t.id === playerTeamId)!;
  const opponentTeam = TEAMS.find(t => t.id === challenge.teamId)!;
  const betTeam = TEAMS.find(t => t.id === betTeamId)!;

  // Preload all cards for both teams
  const cardUrls = useMemo(() => {
    const urls: string[] = [];
    const values = [0, 1, 2, 4, 6, 8, 10, 12, 15, 18];
    
    // Player team cards
    values.forEach(v => {
      if (TEAM_SCORE_CARDS[playerTeam.shortName]?.[v]) {
        urls.push(TEAM_SCORE_CARDS[playerTeam.shortName][v]);
      }
    });
    
    // Opponent team cards
    values.forEach(v => {
      if (TEAM_SCORE_CARDS[opponentTeam.shortName]?.[v]) {
        urls.push(TEAM_SCORE_CARDS[opponentTeam.shortName][v]);
      }
    });

    // Card backs
    urls.push(playerTeam.cardBack);
    urls.push(opponentTeam.cardBack);
    
    return urls;
  }, [playerTeam.shortName, opponentTeam.shortName]);

  // const isLoaded = useImagePreloader(cardUrls);

  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'reveal' | 'result' | 'victory'>('waiting');
  const [round, setRound] = useState(1);
  const [playerHand, setPlayerHand] = useState<GameCard[]>([]);
  const [playerCard, setPlayerCard] = useState<GameCard | null>(null);
  const [opponentCard, setOpponentCard] = useState<GameCard | null>(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [playerRounds, setPlayerRounds] = useState(0);
  const [opponentRounds, setOpponentRounds] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(10);
  const [isDraw, setIsDraw] = useState(false);
  const [capturedCards, setCapturedCards] = useState<string[]>([]);

  useEffect(() => {
    // Initialize hand with 10 random cards
    const hand = [...GAME_CARDS].sort(() => Math.random() - 0.5).slice(0, 10);
    setPlayerHand(hand);
    playSound(GAME_SOUNDS.SHUFFLE);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'waiting' && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 5 && t > 1) playSound(GAME_SOUNDS.TICK, 0.2);
          return t - 1;
        });
      }, 1000);
    } else if (timer === 0 && gameState === 'waiting') {
      // Auto select random card if timer hits 0
      const randomCard = playerHand[Math.floor(Math.random() * playerHand.length)];
      handleCardSelect(randomCard);
    }
    return () => clearInterval(interval);
  }, [timer, gameState, playerHand]);

  const handleCardSelect = (card: GameCard) => {
    playSound(GAME_SOUNDS.CARD_SELECT);
    playSound(GAME_SOUNDS.CARD_FLIP);
    setPlayerCard(card);
    setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    setGameState('countdown');
    setCountdown(3);

    const countInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev > 0) playSound(GAME_SOUNDS.TICK, 0.4);
        if (prev <= 1) {
          clearInterval(countInterval);
          // Pre-set opponent card before reveal to avoid "buffering" feel
          const oppCard = GAME_CARDS[Math.floor(Math.random() * GAME_CARDS.length)];
          setOpponentCard(oppCard);
          revealCards(card, oppCard);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const revealCards = (pCard: GameCard, oppCard: GameCard) => {
    playSound(GAME_SOUNDS.CARD_FLIP);
    setGameState('reveal');

    // Reveal front side for 3 seconds as requested
    setTimeout(() => {
      setGameState('result');
      if (pCard.value > oppCard.value) {
        playSound(GAME_SOUNDS.WIN);
        setPlayerRounds(s => s + 1);
        setPlayerScore(s => s + pCard.value);
        setIsDraw(false);
        
        // Add to captured cards immediately for visual feedback
        const capturedImg = TEAM_SCORE_CARDS[opponentTeam.shortName][oppCard.value];
        if (capturedImg) {
          setCapturedCards(prev => [...prev, capturedImg]);
          
          // Add to user's collection immediately as requested
          if (user) {
            const newUser: UserProfile = {
              ...user,
              cardsCapturedFromOpponents: user.cardsCapturedFromOpponents + 1,
              totalCardsOwned: user.totalCardsOwned + 1,
              capturedCards: [
                {
                  id: `cap-${Date.now()}`,
                  cardId: `c${oppCard.value}`,
                  opponentName: challenge.playerName,
                  opponentTeamId: challenge.teamId,
                  capturedAt: new Date().toISOString(),
                  isRare: oppCard.value >= 15
                },
                ...user.capturedCards
              ]
            };
            setUser(newUser);
            localStorage.setItem('t20_user', JSON.stringify(newUser));
          }
        }
      } else if (pCard.value < oppCard.value) {
        playSound(GAME_SOUNDS.LOSE);
        setOpponentRounds(s => s + 1);
        setOpponentScore(s => s + oppCard.value);
        setIsDraw(false);
      } else {
        setIsDraw(true);
      }
    }, 3000);
  };

  // Auto-advance to next round
  useEffect(() => {
    if (gameState === 'result') {
      const timer = setTimeout(() => {
        nextRound();
      }, 3000); // Wait 3 seconds to show result and "borrowing" before auto-advancing
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const nextRound = () => {
    if (round < 10) {
      setRound(r => r + 1);
      setPlayerCard(null);
      setOpponentCard(null);
      setTimer(10);
      setGameState('waiting');
    } else {
      // Determine final winner and captured cards
      if (playerRounds > opponentRounds) {
        playSound(GAME_SOUNDS.VICTORY);
        // Capture opponent's bet set + some of their lost cards
        const newCaptured = [
          opponentTeam.cardBack, 
          betTeam.cardBack,
          opponentTeam.cardBack,
          opponentTeam.cardBack
        ];
        setCapturedCards(newCaptured);

        // Update user stats
        if (user) {
          const newUser: UserProfile = {
            ...user,
            wins: user.wins + 1,
            cardsCapturedFromOpponents: user.cardsCapturedFromOpponents + newCaptured.length,
            totalCardsOwned: user.totalCardsOwned + newCaptured.length,
            points: user.points + playerScore,
            capturedCards: [
              ...user.capturedCards,
              ...newCaptured.map((img, i) => ({
                id: `cap-${Date.now()}-${i}`,
                cardId: `c${Math.floor(Math.random() * 10) + 1}`,
                opponentName: challenge.playerName,
                opponentTeamId: challenge.teamId,
                capturedAt: new Date().toISOString(),
                isRare: Math.random() > 0.8
              }))
            ]
          };
          setUser(newUser);
          localStorage.setItem('t20_user', JSON.stringify(newUser));
        }
      } else if (playerRounds < opponentRounds) {
        if (user) {
          const newUser: UserProfile = {
            ...user,
            losses: user.losses + 1
          };
          setUser(newUser);
          localStorage.setItem('t20_user', JSON.stringify(newUser));
        }
      }
      setGameState('victory');
    }
  };

  // if (!isLoaded) return <GameLoadingScreen teamName={playerTeam.name} />;

  return (
    <div className="fixed inset-0 z-[150] bg-[#050505] overflow-hidden font-sans select-none">
      {/* Fire Board Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#ff4d00_0%,_#ff0000_20%,_#000000_80%)] opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-[80%] h-[80%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute -top-40 -right-40 w-[80%] h-[80%] bg-red-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
        
        {/* Dynamic Glows */}
        <div className={`absolute bottom-0 left-0 right-0 h-[60vh] bg-gradient-to-t ${challenge.mode === 'Fire Mode' ? 'from-orange-600/40 via-red-600/20' : 'from-orange-900/20'} to-transparent blur-[100px]`} />
        <div className={`absolute top-0 left-0 right-0 h-[40vh] bg-gradient-to-b ${challenge.mode === 'Fire Mode' ? 'from-red-600/30' : 'from-red-900/10'} to-transparent blur-[100px]`} />
        
        {challenge.mode === 'Fire Mode' && (
          <>
            <motion.div 
              animate={{ y: [-20, 20], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"
            />
            {/* Animated Flame Particles */}
            {[...Array(10)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: '110%', x: `${Math.random() * 100}%`, scale: 0 }}
                animate={{ 
                  y: '-10%', 
                  scale: [0, 1.5, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ 
                  duration: 2 + Math.random() * 3, 
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
                className="absolute w-2 h-2 bg-orange-500 rounded-full blur-sm"
              />
            ))}
          </>
        )}
      </div>

      {/* Live Rivalry Ticker */}
      <div className="absolute top-0 left-0 right-0 h-10 bg-black/80 backdrop-blur-md z-50 flex items-center overflow-hidden border-b border-white/10">
        <motion.div 
          animate={{ x: ['100%', '-100%'] }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          className="whitespace-nowrap flex items-center gap-12"
        >
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            LIVE RIVALRY: 
            <img src={playerTeam.logo} className="w-4 h-4 object-contain" alt="Logo" referrerPolicy="no-referrer" />
            {playerTeam.name} Warrior 🔥 vs 
            <img src={opponentTeam.logo} className="w-4 h-4 object-contain" alt="Logo" referrerPolicy="no-referrer" />
            {opponentTeam.name} Master 😎 🏏 ⚔️ 🏏
          </span>
          <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            LIVE RIVALRY: 
            <img src={playerTeam.logo} className="w-4 h-4 object-contain" alt="Logo" referrerPolicy="no-referrer" />
            {playerTeam.name} Warrior 🔥 vs 
            <img src={opponentTeam.logo} className="w-4 h-4 object-contain" alt="Logo" referrerPolicy="no-referrer" />
            {opponentTeam.name} Master 😎 🏏 ⚔️ 🏏
          </span>
        </motion.div>
      </div>

      {/* Top Area: Opponent Panel */}
      <div className="mt-10 px-6 py-4 relative z-10 flex justify-between items-center bg-black/40 backdrop-blur-sm border-b border-white/5">
        <div className="flex items-center gap-4">
          <button 
            onClick={onExit}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors mr-2"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="relative">
            <img src={challenge.playerAvatar} className="w-12 h-12 rounded-xl object-cover border border-white/20" alt="Opponent" referrerPolicy="no-referrer" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 rounded-lg flex items-center justify-center border border-white/20">
              <img src={opponentTeam.logo} className="w-3 h-3 object-contain" alt="Logo" referrerPolicy="no-referrer" />
            </div>
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">{challenge.playerName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] font-bold text-gray-500 uppercase">Rounds:</span>
              <span className="text-[10px] font-black text-red-500">{opponentRounds}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="w-10 aspect-[2/3] rounded-md border border-white/10 bg-white/5 overflow-hidden relative">
              <img src={opponentTeam.cardBack} className="w-full h-full object-cover opacity-30" alt="Bet" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock size={10} className="text-white/20" />
              </div>
            </div>
            <span className="text-[6px] font-black text-gray-500 uppercase mt-1">Enemy Bet</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-10 aspect-[2/3] rounded-md border border-white/10 bg-white/5 overflow-hidden relative">
              <img src={betTeam.cardBack} className="w-full h-full object-cover opacity-30" alt="Bet" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Lock size={10} className="text-white/20" />
              </div>
            </div>
            <span className="text-[6px] font-black text-gray-500 uppercase mt-1">Your Bet</span>
          </div>
        </div>

        <div className="text-right">
          <p className="text-2xl font-black text-white leading-none">{opponentScore}</p>
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mt-1">Points</p>
        </div>
      </div>

      {/* Center Board: Battle Zone */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
        {challenge.mode === 'Fire Mode' && (
          <div className="absolute inset-0 border-[16px] border-orange-600/10 pointer-events-none">
            <div className="absolute inset-0 border-2 border-orange-500/20 animate-pulse" />
          </div>
        )}
        
        {/* Round Indicator */}
        <div className="mb-8 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full">
          <span className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Round {round} / 10</span>
        </div>

        <div className="w-full max-w-sm flex items-center justify-between gap-6">
          {/* Player Slot */}
          <div className="flex-1 flex flex-col items-center gap-4">
            <div className={`relative w-full aspect-[2/3] rounded-2xl border-2 transition-all duration-500 flex items-center justify-center overflow-hidden ${
              playerCard 
                ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.4)] bg-orange-500/10' 
                : 'border-dashed border-white/20 bg-white/5 animate-pulse'
            }`}>
              {!playerCard && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                    <Plus size={16} className="text-white/20" />
                  </div>
                  <span className="text-[8px] font-black text-white/20 uppercase">Place Card</span>
                </div>
              )}
              
              {playerCard && (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0, y: 100 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="w-full h-full"
                >
                  <AnimatePresence mode="wait">
                    {gameState === 'reveal' || gameState === 'result' ? (
                      <motion.div 
                        key="front"
                        initial={{ rotateY: 180, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ duration: 0.6, type: 'spring', damping: 12 }}
                        className="w-full h-full relative"
                        style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                      >
                        <img 
                          src={TEAM_SCORE_CARDS[playerTeam.shortName][playerCard.value]} 
                          className="w-full h-full object-cover" 
                          alt={playerCard.label} 
                          referrerPolicy="no-referrer"
                        />
                        
                        {gameState === 'result' && playerCard.value > (opponentCard?.value || 0) && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 border-4 border-orange-500 shadow-[inset_0_0_40px_rgba(249,115,22,0.6)] z-20"
                          />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="back"
                        initial={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -180, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0"
                        style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                      >
                        <img src={playerTeam.cardBack} className="w-full h-full object-cover" alt="Back" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent" 
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Your Play</span>
          </div>

          {/* VS Icon & Countdown */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            <AnimatePresence mode="wait">
              {gameState === 'countdown' ? (
                <motion.div 
                  key={countdown}
                  initial={{ scale: 4, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0, rotate: 45 }}
                  className="text-8xl font-black text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] z-30"
                >
                  {countdown}
                </motion.div>
              ) : (
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="relative z-30"
                >
                  <div className="text-5xl font-black text-white italic tracking-tighter drop-shadow-[0_0_20px_rgba(255,255,255,0.5)]">VS</div>
                  <motion.div 
                    animate={{ 
                      opacity: [0.3, 0.6, 0.3], 
                      scale: [1, 2.5, 1],
                      rotate: [0, 180, 360]
                    }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-orange-600 blur-[40px] -z-10 rounded-full" 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Opponent Slot */}
          <div className="flex-1 flex flex-col items-center gap-4">
            <div className={`relative w-full aspect-[2/3] rounded-2xl border-2 transition-all duration-500 flex items-center justify-center overflow-hidden ${
              opponentCard 
                ? 'border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] bg-red-500/10' 
                : 'border-dashed border-white/20 bg-white/5'
            }`}>
              {!opponentCard && (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                  </div>
                  <span className="text-[8px] font-black text-white/20 uppercase">Waiting...</span>
                </div>
              )}

              {opponentCard && (
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0, y: -100 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="w-full h-full"
                >
                  <AnimatePresence mode="wait">
                    {gameState === 'reveal' || gameState === 'result' ? (
                      <motion.div 
                        key="front"
                        initial={{ rotateY: 180, opacity: 0 }}
                        animate={{ rotateY: 0, opacity: 1 }}
                        transition={{ duration: 0.6, type: 'spring', damping: 12 }}
                        className="w-full h-full relative"
                        style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                      >
                        <img 
                          src={TEAM_SCORE_CARDS[opponentTeam.shortName][opponentCard.value]} 
                          className="w-full h-full object-cover" 
                          alt={opponentCard.label} 
                          referrerPolicy="no-referrer"
                        />
                        
                        {gameState === 'result' && opponentCard.value > (playerCard?.value || 0) && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 border-4 border-red-500 shadow-[inset_0_0_40px_rgba(239,68,68,0.6)] z-20"
                          />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="back"
                        initial={{ rotateY: 0, opacity: 1 }}
                        exit={{ rotateY: -180, opacity: 0 }}
                        transition={{ duration: 0.6 }}
                        className="absolute inset-0"
                        style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                      >
                        <img src={opponentTeam.cardBack} className="w-full h-full object-cover" alt="Back" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent" 
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </div>
            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">Enemy Play</span>
          </div>
        </div>

        {/* Round Result Message */}
        <AnimatePresence>
          {gameState === 'result' && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="mt-12 flex flex-col items-center gap-6"
            >
              <h2 className={`text-4xl font-black italic uppercase tracking-tighter ${
                isDraw ? 'text-gray-400' : (playerCard?.value || 0) > (opponentCard?.value || 0) ? 'text-orange-500' : 'text-red-500'
              }`}>
                {isDraw ? 'DRAW ROUND' : (playerCard?.value || 0) > (opponentCard?.value || 0) ? 'ROUND WON! 🔥' : 'ROUND LOST! 💀'}
              </h2>
              
              {(playerCard?.value || 0) > (opponentCard?.value || 0) && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-orange-500 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg animate-bounce"
                >
                  Borrowing Opponent's Card... 🃏
                </motion.div>
              )}
              
              <div className="text-white/40 text-[10px] font-bold uppercase tracking-widest animate-pulse">
                Next round starting automatically...
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Area: Player Panel & Hand */}
      <div className="bg-black/80 backdrop-blur-2xl border-t border-white/10 p-6 pb-10 relative z-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src="https://picsum.photos/seed/me/200" className="w-10 h-10 rounded-xl object-cover border border-white/20" alt="Me" referrerPolicy="no-referrer" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-600 rounded-lg flex items-center justify-center border border-white/20">
                <img src={playerTeam.logo} className="w-2.5 h-2.5 object-contain" alt="Logo" referrerPolicy="no-referrer" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black text-white uppercase tracking-wider">You (Rounds: {playerRounds})</p>
              <p className="text-lg font-black text-orange-500 leading-none mt-0.5">{playerScore}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Time Remaining</p>
              <p className={`text-xl font-black leading-none mt-0.5 ${timer <= 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                00:{timer < 10 ? `0${timer}` : timer}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center relative">
              <svg className="w-full h-full -rotate-90">
                <circle 
                  cx="20" cy="20" r="18" 
                  fill="none" stroke="currentColor" strokeWidth="2"
                  className="text-white/10"
                />
                <motion.circle 
                  cx="20" cy="20" r="18" 
                  fill="none" stroke="currentColor" strokeWidth="2"
                  strokeDasharray="113.1"
                  animate={{ strokeDashoffset: 113.1 - (timer / 10) * 113.1 }}
                  className="text-orange-500"
                />
              </svg>
              <Clock size={14} className="absolute text-white/40" />
            </div>
          </div>
        </div>

        {/* Player Card Roll - Fully Visible Horizontal Scroll */}
        <div className="flex overflow-x-auto gap-4 pb-2 no-scrollbar snap-x snap-mandatory">
          {playerHand.map((card) => (
            <motion.div
              key={card.id}
              whileHover={{ y: -10 }}
              whileTap={{ scale: 0.95 }}
              className="flex-shrink-0 snap-center"
            >
              <button
                disabled={gameState !== 'waiting'}
                onMouseEnter={() => playSound(GAME_SOUNDS.HOVER, 0.1)}
                onClick={() => handleCardSelect(card)}
                className={`w-28 aspect-[2/3] rounded-2xl border-2 transition-all overflow-hidden relative group ${
                  gameState === 'waiting' ? 'border-white/10 hover:border-orange-500' : 'border-white/5 opacity-50 grayscale'
                }`}
              >
                {TEAM_SCORE_CARDS[playerTeam.shortName]?.[card.value] ? (
                  <div className="w-full h-full">
                    <img 
                      src={TEAM_SCORE_CARDS[playerTeam.shortName][card.value]} 
                      className="w-full h-full object-cover" 
                      alt={card.label} 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-white">{card.value}</span>
                        <div className="px-2 py-0.5 bg-orange-600 rounded-full">
                          <span className="text-[6px] font-black text-white uppercase">Play</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full p-3 bg-[#2A1B4E] flex flex-col justify-between">
                    <span className="text-[8px] font-black text-gray-400 uppercase">{card.label}</span>
                    <span className="text-3xl font-black text-white self-center">{card.value}</span>
                    <div className="w-full py-1.5 bg-blue-600 rounded-lg text-center">
                      <span className="text-[8px] font-black text-white uppercase">Select</span>
                    </div>
                  </div>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Victory / Defeat Screen */}
      <AnimatePresence>
        {gameState === 'victory' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div 
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, stiffness: 100 }}
              className="relative mb-12"
            >
              <div className="w-40 h-40 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(249,115,22,0.5)]">
                <Trophy size={80} className="text-white drop-shadow-2xl" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-white p-3 rounded-2xl shadow-2xl border border-gray-100">
                <img src={playerTeam.logo} className="w-10 h-10 object-contain" alt="Team" referrerPolicy="no-referrer" />
              </div>
              <motion.div 
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-orange-500 rounded-full blur-3xl -z-10" 
              />
            </motion.div>

            <h1 className="text-5xl font-black text-white mb-4 uppercase italic tracking-tighter drop-shadow-2xl">
              {playerRounds > opponentRounds ? 'YOU WON THE BATTLE!' : playerRounds < opponentRounds ? 'BATTLE LOST!' : 'BATTLE DRAW!'}
            </h1>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-12 w-full max-w-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-6">Captured Rewards</p>
              <div className="flex justify-center gap-6">
                {capturedCards.length > 0 ? capturedCards.map((card, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 + (idx * 0.2) }}
                    className="w-24 aspect-[2/3] rounded-xl border-2 border-orange-500 overflow-hidden shadow-2xl shadow-orange-500/30"
                  >
                    <img src={card} className="w-full h-full object-cover" alt="Reward" referrerPolicy="no-referrer" />
                  </motion.div>
                )) : (
                  <p className="text-sm font-bold text-red-500 uppercase">No rewards captured</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Points</p>
                <p className="text-2xl font-black text-white">{playerScore}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Rounds Won</p>
                <p className="text-2xl font-black text-orange-500">{playerRounds}</p>
              </div>
            </div>

            <button 
              onClick={onExit}
              className="mt-12 w-full max-w-sm py-6 bg-white text-gray-900 rounded-2xl font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:bg-orange-500 hover:text-white transition-all"
            >
              Return to Arena
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ChallengesPage = ({ 
  user, 
  onJoinBattle,
  onCreateChallenge
}: { 
  user: UserProfile | null, 
  onJoinBattle: (challenge: Challenge) => void,
  onCreateChallenge: () => void
}) => {
  const totalSets = user?.inventory?.reduce((acc, curr) => acc + curr.sets, 0) || 0;
  const canEnter = totalSets >= 2;

  return (
    <div className="px-4 mt-28 pb-32">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-gradient-primary uppercase italic">Challenge Arena</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
            Your Inventory: <span className={canEnter ? 'text-green-500' : 'text-red-500'}>{totalSets} Full Sets</span>
          </p>
        </div>
        <button 
          onClick={() => canEnter ? onCreateChallenge() : null}
          className={`text-[10px] font-bold px-4 py-2 rounded-full shadow-md transition-all ${
            canEnter ? 'btn-primary' : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
        >
          Create Challenge
        </button>
      </div>

      {!canEnter && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <Info size={16} className="text-red-500" />
            </div>
            <p className="text-[11px] font-bold text-red-400 leading-tight">
              You need minimum 2 full team card sets to enter this challenge. Collect more cards to enter Challenge Arena.
            </p>
          </div>
        </motion.div>
      )}
      
      <div className="space-y-4">
        {MOCK_CHALLENGES.map((challenge) => {
          const team = TEAMS.find(t => t.id === challenge.teamId);
          const isFireMode = challenge.mode === 'Fire Mode';
          
          return (
            <motion.div 
              key={challenge.id}
              whileTap={{ scale: 0.98 }}
              className={`glass-card overflow-hidden relative ${
                isFireMode ? 'border-glow-orange' : 'border-white/5'
              }`}
            >
              {isFireMode && (
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 pointer-events-none" />
              )}
              <div className={`h-1.5 bg-gradient-to-r ${isFireMode ? 'from-orange-500 via-red-500 to-yellow-500' : team?.color}`} />
              <div className="p-5 relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={challenge.playerAvatar} className="w-10 h-10 rounded-xl object-cover border-2 border-white/10 shadow-sm" alt="Avatar" referrerPolicy="no-referrer" />
                      {isFireMode && (
                        <motion.div 
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute -inset-1 rounded-xl border-2 border-orange-500 blur-sm" 
                        />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1">
                        {challenge.playerName}
                        {isFireMode && <span className="text-orange-500">🔥</span>}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                      <div className="w-5 h-5 bg-black/40 rounded-lg flex items-center justify-center shadow-sm border border-white/5">
                        <img src={team?.logo} className="w-4 h-4 object-contain" alt="Logo" referrerPolicy="no-referrer" />
                      </div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">{team?.name}</p>
                    </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${isFireMode ? 'text-orange-600' : 'text-blue-600'}`}>
                      {challenge.requiredSets} Sets
                    </p>
                    <p className="text-[8px] font-bold text-gray-400 uppercase">Entry Bet</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${isFireMode ? 'bg-orange-500' : 'bg-green-500'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${isFireMode ? 'text-orange-600' : 'text-gray-400'}`}>
                      {challenge.mode}
                    </span>
                  </div>
                  <button 
                    onClick={() => canEnter && onJoinBattle(challenge)}
                    className={`text-[10px] font-bold px-6 py-2 rounded-full shadow-md transition-all ${
                      canEnter 
                        ? isFireMode 
                          ? 'btn-primary' 
                          : 'btn-secondary-blue'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Join Battle
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const CreateChallengeModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  user 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: (teamId: string, betTeamId: string, mode: string) => void,
  user: UserProfile | null
}) => {
  const [playTeamId, setPlayTeamId] = useState<string | null>(user?.teamId || null);
  const [betTeamId, setBetTeamId] = useState<string | null>(null);
  const [mode, setMode] = useState<'Classic' | 'Fire Mode'>('Classic');

  if (!isOpen) return null;

  const userInventory = user?.inventory || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative w-full max-w-md glass-card rounded-t-[40px] p-8 shadow-2xl border-t border-gray-100"
        >
          <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8" />
          
          <h2 className="text-2xl font-black text-gradient-primary italic uppercase tracking-tighter mb-2">Create Challenge</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Set up your rivalry match</p>

          <div className="space-y-8">
            {/* Team Selection */}
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">1. Team to Play With</p>
              <div className="grid grid-cols-5 gap-2">
                {userInventory.map((item) => {
                  const team = TEAMS.find(t => t.id === item.teamId);
                  const isSelected = playTeamId === item.teamId;
                  return (
                    <button
                      key={`create-play-${item.teamId}`}
                      onClick={() => setPlayTeamId(item.teamId)}
                      className={`relative aspect-square rounded-2xl border-2 transition-all flex items-center justify-center group overflow-hidden ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 shadow-xl scale-110 z-10' 
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${team?.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      <div className="w-full h-full relative z-10 flex items-center justify-center p-0">
                        <img 
                          src={team?.logo} 
                          className="w-full h-full object-contain scale-125 drop-shadow-md" 
                          alt="Logo" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
                          <ShieldCheck size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bet Team Selection */}
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">2. Team Set to Bet</p>
              <div className="grid grid-cols-5 gap-2">
                {userInventory.map((item) => {
                  const team = TEAMS.find(t => t.id === item.teamId);
                  const availableSets = item.teamId === playTeamId ? item.sets - 1 : item.sets;
                  const isAvailable = availableSets > 0;
                  const isSelected = betTeamId === item.teamId;

                  return (
                    <button
                      key={`create-bet-${item.teamId}`}
                      disabled={!isAvailable}
                      onClick={() => setBetTeamId(item.teamId)}
                      className={`relative aspect-square rounded-2xl border-2 transition-all flex items-center justify-center group overflow-hidden ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 shadow-xl scale-110 z-10' 
                          : isAvailable 
                            ? 'border-gray-100 bg-white hover:border-gray-200' 
                            : 'opacity-10 cursor-not-allowed grayscale border-gray-100'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${team?.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      <div className="w-full h-full relative z-10 flex items-center justify-center p-0">
                        <img 
                          src={team?.logo} 
                          className="w-full h-full object-contain scale-125 drop-shadow-md" 
                          alt="Logo" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 bg-gray-900 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md border-2 border-white shadow-md">
                        {item.sets}
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
                          <Play size={10} className="text-white fill-current" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mode Selection */}
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">3. Challenge Mode</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setMode('Classic')}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                    mode === 'Classic' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 text-gray-400'
                  }`}
                >
                  Classic
                </button>
                <button
                  onClick={() => setMode('Fire Mode')}
                  className={`flex-1 py-3 rounded-xl border-2 font-bold text-xs transition-all ${
                    mode === 'Fire Mode' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400'
                  }`}
                >
                  Fire Mode 🔥
                </button>
              </div>
            </div>

            <button
              disabled={!playTeamId || !betTeamId}
              onClick={() => playTeamId && betTeamId && onConfirm(playTeamId, betTeamId, mode)}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${
                playTeamId && betTeamId 
                  ? 'btn-primary text-white' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Create Challenge
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const ChallengeSetupModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  user 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onConfirm: (playTeamId: string, betTeamId: string) => void,
  user: UserProfile | null
}) => {
  const [playTeamId, setPlayTeamId] = useState<string | null>(user?.teamId || null);
  const [betTeamId, setBetTeamId] = useState<string | null>(null);

  if (!isOpen) return null;

  const userInventory = user?.inventory || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="relative w-full max-w-md glass-card rounded-t-[40px] p-8 shadow-2xl border-t border-gray-100"
        >
          <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8" />
          
          <h2 className="text-2xl font-black text-gradient-primary italic uppercase tracking-tighter mb-2">Battle Setup</h2>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">Select your cards for the rivalry</p>

          <div className="space-y-8">
            {/* Play Team Selection */}
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">1. Team to Play With</p>
              <div className="grid grid-cols-5 gap-2">
                {userInventory.map((item) => {
                  const team = TEAMS.find(t => t.id === item.teamId);
                  const isSelected = playTeamId === item.teamId;
                  return (
                    <button
                      key={`play-${item.teamId}`}
                      onClick={() => setPlayTeamId(item.teamId)}
                      className={`relative aspect-square rounded-2xl border-2 transition-all flex items-center justify-center group overflow-hidden ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 shadow-xl scale-110 z-10' 
                          : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${team?.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      <div className="w-full h-full relative z-10 flex items-center justify-center p-0">
                        <img 
                          src={team?.logo} 
                          className="w-full h-full object-contain scale-125 drop-shadow-md" 
                          alt="Logo" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
                          <ShieldCheck size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bet Team Selection */}
            <div>
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-4">2. Team Set to Bet</p>
              <div className="grid grid-cols-5 gap-2">
                {userInventory.map((item) => {
                  const team = TEAMS.find(t => t.id === item.teamId);
                  // Can bet a team if we have more than 0 sets, but if it's the same as play team, we need at least 2 sets
                  const availableSets = item.teamId === playTeamId ? item.sets - 1 : item.sets;
                  const isAvailable = availableSets > 0;
                  const isSelected = betTeamId === item.teamId;

                  return (
                    <button
                      key={`bet-${item.teamId}`}
                      disabled={!isAvailable}
                      onClick={() => setBetTeamId(item.teamId)}
                      className={`relative aspect-square rounded-2xl border-2 transition-all flex items-center justify-center group overflow-hidden ${
                        isSelected 
                          ? 'border-orange-500 bg-orange-50 shadow-xl scale-110 z-10' 
                          : isAvailable 
                            ? 'border-gray-100 bg-white hover:border-gray-200' 
                            : 'opacity-10 cursor-not-allowed grayscale border-gray-100'
                      }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${team?.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
                      <div className="w-full h-full relative z-10 flex items-center justify-center p-0">
                        <img 
                          src={team?.logo} 
                          className="w-full h-full object-contain scale-125 drop-shadow-md" 
                          alt="Logo" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 bg-gray-900 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md border-2 border-white shadow-md">
                        {item.sets}
                      </div>
                      {isSelected && (
                        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg border-2 border-white">
                          <Play size={10} className="text-white fill-current" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              disabled={!playTeamId || !betTeamId}
              onClick={() => playTeamId && betTeamId && onConfirm(playTeamId, betTeamId)}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${
                playTeamId && betTeamId 
                  ? 'btn-primary text-white' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Enter Battle Arena
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const TournamentsPage = () => (
  <div className="px-4 mt-28 pb-32">
    <h2 className="text-xl font-black text-gray-900 mb-6">Tournaments</h2>
    
    <div className="space-y-6">
      {MOCK_TOURNAMENTS.map((tournament) => (
        <motion.div 
          key={tournament.id}
          whileTap={{ scale: 0.98 }}
          className="bg-white rounded-3xl border border-gray-100 shadow-lg overflow-hidden relative"
        >
          <div className="absolute top-0 right-0 p-4">
            <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">
              LIVE
            </div>
          </div>
          
          <div className="p-6">
            <h3 className="text-lg font-black text-white mb-1">{tournament.name}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Card Battle Championship</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white/5 p-3 rounded-2xl">
                <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Prize Pool</p>
                <p className="text-sm font-black text-blue-400">₹{tournament.prizePool.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl">
                <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Entry Fee</p>
                <p className="text-sm font-black text-white">{tournament.entryFee === 0 ? 'FREE' : `₹${tournament.entryFee}`}</p>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-gray-400">Players Joined</span>
                <span className="text-white">{tournament.players} / {tournament.maxPlayers}</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full" 
                  style={{ width: `${(tournament.players / tournament.maxPlayers) * 100}%` }} 
                />
              </div>
            </div>
            
            <button className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl font-bold text-sm shadow-xl">
              Join Tournament
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// --- Game Arena Screen (Portrait Board Game) ---

interface PlayerStats {
  name: string;
  rank: string;
  roundsWon: number;
  cardsWon: number;
  points: number;
  avatar: string;
}

const VerticalGameArena = ({ 
  onExit, 
  playerTeamId, 
  opponentTeamId,
  user,
  setUser
}: { 
  onExit: () => void, 
  playerTeamId: string, 
  opponentTeamId: string,
  user: UserProfile | null,
  setUser: (u: UserProfile) => void
}) => {
  const playerTeam = TEAMS.find(t => t.id === playerTeamId) || TEAMS[0];
  const opponentTeam = TEAMS.find(t => t.id === opponentTeamId) || TEAMS[1];

  // Preload all cards for both teams
  const cardUrls = useMemo(() => {
    const urls: string[] = [];
    const values = [0, 1, 2, 4, 6, 8, 10, 12, 15, 18];
    
    // Player team cards
    values.forEach(v => {
      if (TEAM_SCORE_CARDS[playerTeam.shortName]?.[v]) {
        urls.push(TEAM_SCORE_CARDS[playerTeam.shortName][v]);
      }
    });
    
    // Opponent team cards
    values.forEach(v => {
      if (TEAM_SCORE_CARDS[opponentTeam.shortName]?.[v]) {
        urls.push(TEAM_SCORE_CARDS[opponentTeam.shortName][v]);
      }
    });

    // Card backs
    urls.push(playerTeam.cardBack);
    urls.push(opponentTeam.cardBack);
    
    return urls;
  }, [playerTeam.shortName, opponentTeam.shortName]);

  // const isLoaded = useImagePreloader(cardUrls);

  const [gameState, setGameState] = useState<'waiting' | 'countdown' | 'reveal' | 'result' | 'end' | 'quit'>('waiting');
  const [round, setRound] = useState(1);
  const [timer, setTimer] = useState(10);
  const [playerHand, setPlayerHand] = useState<GameCard[]>(GAME_CARDS);
  const [playerCard, setPlayerCard] = useState<GameCard | null>(null);
  const [opponentCard, setOpponentCard] = useState<GameCard | null>(null);
  
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    name: 'Rahul_92',
    rank: '#18',
    roundsWon: 0,
    cardsWon: 0,
    points: 0,
    avatar: 'https://picsum.photos/seed/me/100'
  });
  const [opponentStats, setOpponentStats] = useState<PlayerStats>({
    name: 'Opponent_X',
    rank: '#42',
    roundsWon: 0,
    cardsWon: 0,
    points: 0,
    avatar: 'https://picsum.photos/seed/opp/100'
  });
  const [countdown, setCountdown] = useState(3);
  const [isDraw, setIsDraw] = useState(false);

  useEffect(() => {
    playSound(GAME_SOUNDS.SHUFFLE);
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: any;
    if (gameState === 'waiting' && timer > 0) {
      interval = setInterval(() => {
        setTimer(t => {
          if (t <= 5 && t > 1) playSound(GAME_SOUNDS.TICK, 0.2);
          return t - 1;
        });
      }, 1000);
    } else if (gameState === 'waiting' && timer === 0) {
      // Auto play
      const random = playerHand[Math.floor(Math.random() * playerHand.length)];
      handleCardSelect(random);
    }
    return () => clearInterval(interval);
  }, [gameState, timer, playerHand]);

  // Countdown logic
  useEffect(() => {
    if (gameState === 'countdown') {
      if (countdown > 0) {
        playSound(GAME_SOUNDS.TICK, 0.4);
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
      } else {
        playSound(GAME_SOUNDS.CARD_FLIP);
        setGameState('reveal');
        if (playerCard && opponentCard) {
          setTimeout(() => {
            determineWinner(playerCard, opponentCard);
          }, 3000); // Reveal front side for 3 seconds
        }
      }
    }
  }, [gameState, countdown]);

  // Auto-advance to next round
  useEffect(() => {
    if (gameState === 'result') {
      const timer = setTimeout(() => {
        nextRound();
      }, 3000); // Show result for 3s then auto-advance
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const handleCardSelect = (card: GameCard) => {
    if (gameState !== 'waiting') return;
    playSound(GAME_SOUNDS.CARD_SELECT);
    playSound(GAME_SOUNDS.CARD_FLIP);
    setPlayerCard(card);
    setPlayerHand(prev => prev.filter(c => c.id !== card.id));
    
    // Simulate opponent selecting a card
    const opponentAvailable = GAME_CARDS.filter(c => c.id !== card.id); // Simplified for demo
    const randomOpponent = opponentAvailable[Math.floor(Math.random() * opponentAvailable.length)];
    setOpponentCard(randomOpponent);
    
    setGameState('countdown');
    setCountdown(3);
  };

  const determineWinner = (pCard: GameCard, oCard: GameCard) => {
    if (!pCard || !oCard) return;

    if (pCard.value > oCard.value) {
      playSound(GAME_SOUNDS.WIN);
      setPlayerStats(prev => ({
        ...prev,
        roundsWon: prev.roundsWon + 1,
        cardsWon: prev.cardsWon + 2, // Captured opponent's card + kept own
        points: prev.points + pCard.value
      }));
      
      // Add to user's collection immediately
      if (user) {
        const newUser: UserProfile = {
          ...user,
          cardsCapturedFromOpponents: user.cardsCapturedFromOpponents + 1,
          totalCardsOwned: user.totalCardsOwned + 1,
          capturedCards: [
            {
              id: `cap-${Date.now()}`,
              cardId: `c${oCard.value}`,
              opponentName: 'Opponent_X',
              opponentTeamId: opponentTeam.id,
              capturedAt: new Date().toISOString(),
              isRare: oCard.value >= 15
            },
            ...user.capturedCards
          ]
        };
        setUser(newUser);
        localStorage.setItem('t20_user', JSON.stringify(newUser));
      }
      
      setGameState('result');
      setIsDraw(false);
    } else if (oCard.value > pCard.value) {
      playSound(GAME_SOUNDS.LOSE);
      setOpponentStats(prev => ({
        ...prev,
        roundsWon: prev.roundsWon + 1,
        cardsWon: prev.cardsWon + 2,
        points: prev.points + oCard.value
      }));
      setGameState('result');
      setIsDraw(false);
    } else {
      setIsDraw(true);
      setGameState('waiting');
      setTimer(10);
      setPlayerCard(null);
      setOpponentCard(null);
      // Don't increment round on draw, just play again
    }
  };

  const nextRound = () => {
    if (round >= 10) {
      const isWinner = playerStats.cardsWon >= opponentStats.cardsWon;
      if (isWinner) playSound(GAME_SOUNDS.VICTORY);
      setGameState('end');
    } else {
      setRound(prev => prev + 1);
      setGameState('waiting');
      setTimer(10);
      setPlayerCard(null);
      setOpponentCard(null);
    }
  };

  const handleQuit = () => {
    setGameState('quit');
    // Award remaining cards to player if opponent "quits"
    const remaining = playerHand.length;
    setPlayerStats(prev => ({
      ...prev,
      cardsWon: prev.cardsWon + remaining
    }));
  };

  if (gameState === 'end') {
    const isWinner = playerStats.cardsWon >= opponentStats.cardsWon;
    return (
      <div className="fixed inset-0 bg-white z-[120] flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mb-8"
        >
          <Trophy size={80} className={isWinner ? "text-yellow-500" : "text-gray-400"} />
        </motion.div>
        <h2 className="text-2xl font-black mb-2 text-gray-900">{isWinner ? 'VICTORY!' : 'DEFEAT'}</h2>
        <p className="text-sm text-gray-400 mb-8">Match Completed - 10 Rounds</p>
        
        <div className="bg-white border border-gray-100 rounded-3xl p-6 w-full max-w-xs space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Winner</span>
            <span className="text-sm font-bold text-gray-900">{isWinner ? playerStats.name : opponentStats.name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Cards Captured</span>
            <span className="text-sm font-bold text-gray-900">{playerStats.cardsWon}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Total Points</span>
            <span className="text-sm font-black text-blue-600">{playerStats.points}</span>
          </div>
        </div>

        <button 
          onClick={onExit}
          className="w-full max-w-xs py-4 bg-white text-gray-900 rounded-2xl font-bold text-sm shadow-xl"
        >
          Back to Lobby
        </button>

        {isWinner && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -20, x: Math.random() * window.innerWidth }}
                animate={{ 
                  y: window.innerHeight + 20,
                  rotate: 360,
                  x: (Math.random() - 0.5) * 100 + (Math.random() * window.innerWidth)
                }}
                transition={{ 
                  duration: 2 + Math.random() * 2, 
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
                className="absolute w-2 h-2 bg-blue-500 rounded-full"
                style={{ backgroundColor: ['#3b82f6', '#a855f7', '#f59e0b', '#ef4444'][Math.floor(Math.random() * 4)] }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // if (!isLoaded) return <GameLoadingScreen teamName={playerTeam.name} />;

  if (gameState === 'quit') {
    return (
      <div className="fixed inset-0 bg-white z-[120] flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white border border-gray-100 p-6 rounded-3xl mb-8">
          <Info size={48} className="text-blue-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Opponent left the battle</h2>
          <p className="text-sm text-gray-400">All remaining cards awarded to you.</p>
        </div>
        <button 
          onClick={onExit}
          className="w-full max-w-xs py-4 btn-primary text-white rounded-2xl font-bold text-sm"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#050505] z-[100] flex flex-col overflow-hidden font-sans">
      {/* Fire Board Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_#ff4d00_0%,_#ff0000_20%,_#000000_80%)] opacity-20" />
        <div className="absolute -bottom-40 -left-40 w-[80%] h-[80%] bg-orange-600/10 blur-[120px] rounded-full" />
        <div className="absolute -top-40 -right-40 w-[80%] h-[80%] bg-red-600/10 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay" />
        
        {/* Grid Lines */}
        <div className="absolute inset-0 opacity-[0.05]" style={{ 
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* Top Section: Opponent Info */}
      <div className="p-4 flex justify-between items-start z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onExit}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors mr-1"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl">
            <img src={opponentStats.avatar} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="Opponent" referrerPolicy="no-referrer" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold text-white">{opponentStats.name}</p>
                <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20">{opponentStats.rank}</span>
              </div>
              <div className="flex gap-3 mt-0.5">
                <span className="text-[8px] text-gray-500 font-bold uppercase">CW: {opponentStats.cardsWon}</span>
                <span className="text-[8px] text-gray-500 font-bold uppercase">RW: {opponentStats.roundsWon}</span>
                <span className="text-[8px] text-gray-500 font-bold uppercase">PTS: {opponentStats.points}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <div className="bg-white/5 backdrop-blur-sm px-3 py-1 rounded-full border border-white/10 shadow-sm gradient-border">
            <p className="text-[10px] font-black text-white uppercase tracking-widest">Round {round}/10</p>
          </div>
          <button onClick={handleQuit} className="text-[10px] font-bold text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full border border-red-500/20">
            Quit Game
          </button>
        </div>
      </div>

      {/* Center Section: Battle Board Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4">
        {/* Scoreboard Table */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full max-w-[200px] bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-2 overflow-hidden gradient-border">
          <table className="w-full text-[8px] font-bold uppercase tracking-tighter">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-1 text-gray-400">Player</th>
                <th className="text-center py-1 text-gray-400">Cards</th>
                <th className="text-right py-1 text-gray-400">Points</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 text-gray-400">You</td>
                <td className="text-center py-1 text-blue-400">{playerStats.cardsWon}</td>
                <td className="text-right py-1 text-white">{playerStats.points}</td>
              </tr>
              <tr>
                <td className="py-1 text-gray-400">Enemy</td>
                <td className="text-center py-1 text-red-400">{opponentStats.cardsWon}</td>
                <td className="text-right py-1 text-white">{opponentStats.points}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Battle Slots */}
        <div className="flex gap-8 items-center mt-12">
          {/* My Card Slot */}
          <div className="flex flex-col items-center gap-3">
            <div className={`w-28 aspect-[2/3] rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden relative ${
              playerCard ? 'border-blue-400 bg-blue-500/10' : 'border-white/10 bg-white/5'
            }`}>
              {playerCard ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className={`w-full h-full p-3 flex flex-col justify-between shadow-lg ${
                    gameState === 'reveal' || gameState === 'result' ? 'bg-black' : ''
                  }`}
                >
                  {gameState === 'reveal' || gameState === 'result' ? (
                    <motion.div 
                      initial={{ rotateY: 180 }}
                      animate={{ rotateY: 0 }}
                      transition={{ duration: 0.6, type: 'spring' }}
                      className="absolute inset-0 bg-black rounded-xl overflow-hidden shadow-lg"
                    >
                      <img 
                        src={TEAM_SCORE_CARDS[playerTeam.shortName][playerCard.value]} 
                        className="w-full h-full object-cover" 
                        alt={playerCard.label} 
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0">
                      <img src={playerTeam.cardBack} className="w-full h-full object-cover rounded-xl" alt="Back" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-white/5 mx-auto mb-2 flex items-center justify-center">
                    <ChevronRight size={16} className="text-white/20 rotate-90" />
                  </div>
                  <span className="text-[8px] font-bold text-white/20 uppercase">Place Card</span>
                </div>
              )}
              {gameState === 'reveal' && playerCard && opponentCard && playerCard.value > opponentCard.value && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1.2 }}
                  className="absolute inset-0 bg-blue-500/20 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-full h-full border-4 border-blue-500 animate-pulse" />
                </motion.div>
              )}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your Play</p>
          </div>

          {/* VS Divider & Countdown */}
          <div className="relative flex items-center justify-center w-12 h-12">
            <AnimatePresence mode="wait">
              {gameState === 'countdown' ? (
                <motion.div 
                  key={countdown}
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="text-4xl font-black text-blue-600"
                >
                  {countdown}
                </motion.div>
              ) : gameState === 'result' ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-center"
                >
                  <div className={`text-[10px] font-black uppercase tracking-widest mb-2 ${
                    (playerCard?.value || 0) > (opponentCard?.value || 0) ? 'text-blue-600' : (playerCard?.value || 0) < (opponentCard?.value || 0) ? 'text-red-600' : 'text-gray-400'
                  }`}>
                    {(playerCard?.value || 0) > (opponentCard?.value || 0) ? 'WIN - BORROWING CARD' : (playerCard?.value || 0) < (opponentCard?.value || 0) ? 'LOSE' : 'DRAW'}
                  </div>
                  <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
                    Auto-advancing...
                  </div>
                </motion.div>
              ) : isDraw ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-black text-orange-500 uppercase tracking-widest"
                >
                  Draw!
                </motion.div>
              ) : (
                <div className="w-px h-12 bg-white/10" />
              )}
            </AnimatePresence>
          </div>

          {/* Opponent Card Slot */}
          <div className="flex flex-col items-center gap-3">
            <div className={`w-28 aspect-[2/3] rounded-2xl border-2 border-dashed transition-all duration-300 flex items-center justify-center overflow-hidden relative ${
              opponentCard ? 'border-red-400 bg-red-500/10' : 'border-white/10 bg-white/5'
            }`}>
              {opponentCard ? (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0, y: -50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  className={`w-full h-full p-3 flex flex-col justify-between shadow-lg ${
                    gameState === 'reveal' || gameState === 'result' ? 'bg-black' : ''
                  }`}
                >
                  {gameState === 'reveal' || gameState === 'result' ? (
                    <motion.div 
                      initial={{ rotateY: 180 }}
                      animate={{ rotateY: 0 }}
                      transition={{ duration: 0.6, type: 'spring' }}
                      className="absolute inset-0 bg-black rounded-xl overflow-hidden shadow-lg"
                    >
                      <img 
                        src={TEAM_SCORE_CARDS[opponentTeam.shortName][opponentCard.value]} 
                        className="w-full h-full object-cover" 
                        alt={opponentCard.label} 
                        referrerPolicy="no-referrer"
                      />
                    </motion.div>
                  ) : (
                    <div className="absolute inset-0">
                      <img src={opponentTeam.cardBack} className="w-full h-full object-cover rounded-xl" alt="Back" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="text-center">
                  <div className="w-8 h-8 rounded-full bg-white/5 mx-auto mb-2 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
                  </div>
                  <span className="text-[8px] font-bold text-white/20 uppercase">Opponent...</span>
                </div>
              )}
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Enemy Play</p>
          </div>
        </div>
      </div>

      {/* Bottom Section: My Player Area */}
      <div className="bg-black/80 backdrop-blur-md rounded-t-[40px] border-t border-white/10 shadow-2xl p-6 z-20">
        <div className="flex justify-between items-end mb-6">
          <div className="flex items-center gap-3">
            <img src={playerStats.avatar} className="w-12 h-12 rounded-2xl object-cover shadow-md border border-white/10" alt="Me" referrerPolicy="no-referrer" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-black text-white">{playerStats.name}</p>
                <span className="text-[9px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">{playerStats.rank}</span>
              </div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mt-0.5">Level 24 Elite</p>
            </div>
          </div>
          <div className="text-right">
            <div className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full inline-block mb-1">
              {timer}s
            </div>
            <p className="text-[8px] font-bold text-gray-500 uppercase">Time Remaining</p>
          </div>
        </div>

        {/* Swipeable Card Hand */}
        <div className="relative">
          <div className="flex overflow-x-auto gap-3 pb-4 no-scrollbar snap-x snap-mandatory px-2">
            {playerHand.map((card) => (
              <motion.button
                key={card.id}
                disabled={gameState !== 'waiting'}
                onMouseEnter={() => playSound(GAME_SOUNDS.HOVER, 0.1)}
                onClick={() => handleCardSelect(card)}
                whileHover={{ y: -10 }}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0 w-24 aspect-[2/3] bg-black/40 rounded-2xl shadow-md border border-white/10 flex flex-col justify-between text-left snap-center relative group overflow-hidden"
              >
                {TEAM_SCORE_CARDS[playerTeam.shortName]?.[card.value] ? (
                  <div className="absolute inset-0">
                    <img 
                      src={TEAM_SCORE_CARDS[playerTeam.shortName][card.value]} 
                      className="w-full h-full object-cover" 
                      alt={card.label} 
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-[8px] font-bold text-gray-400 uppercase leading-none z-10">{card.label}</span>
                    <div className="flex-1 flex items-center justify-center z-10">
                      <span className="text-2xl font-black text-white">{card.value}</span>
                    </div>
                    <div className="flex justify-between items-center z-10">
                      <div className="w-4 h-4 rounded-full bg-white/5 flex items-center justify-center">
                        <Trophy size={8} className="text-gray-400" />
                      </div>
                      <span className="text-[7px] font-bold text-blue-400 uppercase">Select</span>
                    </div>
                  </>
                )}
              </motion.button>
            ))}
            {playerHand.length === 0 && (
              <div className="w-full py-10 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                No cards remaining
              </div>
            )}
          </div>
          
          {/* Hand Indicator */}
          <div className="flex justify-center gap-1 mt-2">
            {[...Array(Math.min(5, playerHand.length))].map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all ${i === 0 ? 'w-4 bg-blue-600' : 'w-1 bg-white/10'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main App ---

export default function App() {
  const [view, setView] = useState<View>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [isChallengeSetupModalOpen, setIsChallengeSetupModalOpen] = useState(false);
  const [isCreateChallengeModalOpen, setIsCreateChallengeModalOpen] = useState(false);
  const [selectedStoreTeam, setSelectedStoreTeam] = useState<Team | null>(null);
  const [playerTeamId, setPlayerTeamId] = useState<string | null>(null);
  const [betTeamId, setBetTeamId] = useState<string | null>(null);

  useEffect(() => {
    // Global Background Preloader - Loads all essential assets in the background
    // without blocking the user interface.
    const preloadAssets = () => {
      const urls: string[] = [];
      
      // Preload all team logos and card backs
      TEAMS.forEach(team => {
        if (team.logo) urls.push(team.logo);
        if (team.cardBack) urls.push(team.cardBack);
      });

      // Preload first few score cards for each team to make store feel instant
      TEAMS.forEach(team => {
        const firstFew = [0, 4, 6]; // Most common cards
        firstFew.forEach(val => {
          if (TEAM_SCORE_CARDS[team.shortName]?.[val]) {
            urls.push(TEAM_SCORE_CARDS[team.shortName][val]);
          }
        });
      });

      urls.forEach(url => {
        const img = new Image();
        img.src = url;
      });
    };

    // Delay preloading slightly to prioritize initial UI render
    const timer = setTimeout(preloadAssets, 1000);

    // Simulate checking if user has selected a team
    const savedUser = localStorage.getItem('t20_user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      if (!parsedUser.inventory) {
        parsedUser.inventory = [
          { teamId: parsedUser.teamId || '1', sets: 2 },
          { teamId: parsedUser.teamId === '1' ? '2' : '1', sets: 1 },
        ];
      }
      if (!parsedUser.capturedCards) {
        parsedUser.capturedCards = [
          { id: 'cc1', cardId: 'c10', opponentName: 'Rahul_92', opponentTeamId: '1', capturedAt: '2024-03-01', isRare: true },
          { id: 'cc2', cardId: 'c7', opponentName: 'ViratFan_18', opponentTeamId: '2', capturedAt: '2024-03-02', isRare: false },
          { id: 'cc3', cardId: 'c5', opponentName: 'Hitman_45', opponentTeamId: '3', capturedAt: '2024-03-03', isRare: false },
          { id: 'cc4', cardId: 'c8', opponentName: 'Sky_63', opponentTeamId: '3', capturedAt: '2024-03-04', isRare: true },
          { id: 'cc5', cardId: 'c9', opponentName: 'Thala_07', opponentTeamId: '2', capturedAt: '2024-03-05', isRare: false },
          { id: 'cc6', cardId: 'c6', opponentName: 'Hardik_33', opponentTeamId: '8', capturedAt: '2024-03-06', isRare: false },
        ];
      }
      if (parsedUser.totalCardsOwned === undefined) parsedUser.totalCardsOwned = 120;
      if (parsedUser.teamsCompleted === undefined) parsedUser.teamsCompleted = 4;
      if (parsedUser.cardsCapturedFromOpponents === undefined) parsedUser.cardsCapturedFromOpponents = 85;
      setUser(parsedUser);
    } else {
      setIsTeamModalOpen(true);
    }
  }, []);

  const handleTeamSelect = (teamId: string) => {
    const newUser: UserProfile = {
      name: 'Cricket Pro 01',
      avatar: 'https://picsum.photos/seed/me/200',
      teamId,
      rank: 124,
      wins: 45,
      losses: 22,
      cardsCaptured: 180,
      points: 12450,
      bestStreak: 8,
      totalCardsOwned: 120,
      teamsCompleted: 4,
      cardsCapturedFromOpponents: 85,
      matchHistory: [
        { opponent: 'Rahul_92', result: 'win', date: '2 hours ago' },
        { opponent: 'ViratFan_18', result: 'loss', date: '5 hours ago' },
        { opponent: 'Hitman_45', result: 'win', date: '1 day ago' },
      ],
      inventory: [
        { teamId: teamId, sets: 2 },
        { teamId: teamId === '1' ? '2' : '1', sets: 1 },
      ],
      capturedCards: [
        { id: 'cc1', cardId: 'c10', opponentName: 'Rahul_92', opponentTeamId: '1', capturedAt: '2024-03-01', isRare: true },
        { id: 'cc2', cardId: 'c7', opponentName: 'ViratFan_18', opponentTeamId: '2', capturedAt: '2024-03-02', isRare: false },
        { id: 'cc3', cardId: 'c5', opponentName: 'Hitman_45', opponentTeamId: '3', capturedAt: '2024-03-03', isRare: false },
        { id: 'cc4', cardId: 'c8', opponentName: 'Sky_63', opponentTeamId: '3', capturedAt: '2024-03-04', isRare: true },
        { id: 'cc5', cardId: 'c9', opponentName: 'Thala_07', opponentTeamId: '2', capturedAt: '2024-03-05', isRare: false },
        { id: 'cc6', cardId: 'c6', opponentName: 'Hardik_33', opponentTeamId: '8', capturedAt: '2024-03-06', isRare: false },
      ]
    };
    setUser(newUser);
    localStorage.setItem('t20_user', JSON.stringify(newUser));
    setIsTeamModalOpen(false);
  };

  const handleJoinBattle = (challenge: Challenge) => {
    setCurrentChallenge(challenge);
    setIsChallengeSetupModalOpen(true);
  };

  const handleStartGame = (type: string) => {
    setIsPlayModalOpen(false);
    setView('game');
  };

  const handleConfirmChallenge = (playId: string, betId: string) => {
    setPlayerTeamId(playId);
    setBetTeamId(betId);
    setIsChallengeSetupModalOpen(false);
    setView('challenge-battle');
  };

  const handleCreateChallengeConfirm = (teamId: string, betTeamId: string, mode: string) => {
    // In a real app, this would send to Firebase
    // For now, we simulate creating a challenge and joining it immediately
    const newChallenge: Challenge = {
      id: `custom-${Date.now()}`,
      playerName: user?.name || 'You',
      playerAvatar: user?.avatar || 'https://picsum.photos/seed/me/200',
      teamId: teamId,
      entryFee: 0,
      requiredSets: 1,
      mode: mode as any,
      status: 'open'
    };
    
    setCurrentChallenge(newChallenge);
    setPlayerTeamId(teamId);
    setBetTeamId(betTeamId);
    setIsCreateChallengeModalOpen(false);
    setView('challenge-battle');
  };

  const handleBuyTeam = (teamId: string) => {
    if (!user) return;
    
    const newInventory = [
      ...user.inventory.filter(i => i.teamId !== teamId),
      { teamId: teamId, sets: (user.inventory.find(i => i.teamId === teamId)?.sets || 0) + 1 }
    ];

    const newUser: UserProfile = {
      ...user,
      teamId: teamId,
      totalCardsOwned: user.totalCardsOwned + 10,
      teamsCompleted: newInventory.length,
      inventory: newInventory
    };
    
    setUser(newUser);
    localStorage.setItem('t20_user', JSON.stringify(newUser));
    alert(`Team ${TEAMS.find(t => t.id === teamId)?.name} purchased and activated! 10 cards added to your collection.`);
  };

  if (view === 'game') {
    return (
      <VerticalGameArena 
        onExit={() => setView('home')} 
        playerTeamId={user?.teamId || '1'} 
        opponentTeamId="2" 
        user={user}
        setUser={setUser}
      />
    );
  }

  if (view === 'challenge-battle' && currentChallenge && playerTeamId && betTeamId) {
    return (
      <ChallengeBattleArena 
        challenge={currentChallenge} 
        onExit={() => {
          setView('challenges');
          setCurrentChallenge(null);
        }} 
        playerTeamId={playerTeamId}
        betTeamId={betTeamId}
        user={user}
        setUser={setUser}
      />
    );
  }

  const userTeam = user?.teamId ? TEAMS.find(t => t.id === user.teamId) : null;

  return (
    <div className="min-h-screen font-sans text-white pb-32 bg-[#050505] bg-soft-glow">
      <TopNav onMenuOpen={() => setIsMenuOpen(true)} />
      
      <main className="max-w-md mx-auto">
        {view === 'home' && (
          <>
            <CompetitionNewsStrip />
            <ActionCards 
              onPlayClick={() => setIsPlayModalOpen(true)} 
              onStoreClick={() => setView('store')}
            />

            {/* Competition Highlights */}
            <div className="px-4 mt-8">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-lg font-black text-white italic uppercase tracking-tighter">Competition Highlights</h2>
                <div className="bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">
                  <p className="text-[8px] font-black text-orange-500 uppercase tracking-widest">Live Rewards</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Rank 1 Highlight */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => setView('leaderboard')}
                  className="orange-card p-4 rounded-[32px] relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-2">
                    <Crown size={16} className="text-yellow-400" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={MOCK_LEADERBOARD[0].avatar} className="w-10 h-10 rounded-2xl border border-white/20 object-cover" alt="Rank 1" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">Rank #1</p>
                      <div className="flex items-center gap-1.5">
                        <img src={TEAMS.find(t => t.id === MOCK_LEADERBOARD[0].teamId)?.logo} className="w-3 h-3 object-contain" alt="Logo" referrerPolicy="no-referrer" />
                        <p className="text-xs font-black text-white truncate">{MOCK_LEADERBOARD[0].name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-2 text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Weekly Prize</p>
                    <p className="text-sm font-black text-white leading-none">₹5,000</p>
                  </div>
                </motion.div>

                {/* Rank 2 Highlight */}
                <motion.div 
                  whileHover={{ y: -5 }}
                  onClick={() => setView('leaderboard')}
                  className="orange-card p-4 rounded-[32px] relative overflow-hidden group cursor-pointer"
                >
                  <div className="absolute top-0 right-0 p-2">
                    <Medal size={16} className="text-gray-400" />
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={MOCK_LEADERBOARD[1].avatar} className="w-10 h-10 rounded-2xl border border-white/20 object-cover" alt="Rank 2" referrerPolicy="no-referrer" />
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Rank #2</p>
                      <div className="flex items-center gap-1.5">
                        <img src={TEAMS.find(t => t.id === MOCK_LEADERBOARD[1].teamId)?.logo} className="w-3 h-3 object-contain" alt="Logo" referrerPolicy="no-referrer" />
                        <p className="text-xs font-black text-white truncate">{MOCK_LEADERBOARD[1].name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-2 text-center">
                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">Weekly Prize</p>
                    <p className="text-sm font-black text-white leading-none">₹3,000</p>
                  </div>
                </motion.div>

                {/* Today's High Scorer */}
                <div className="col-span-2 orange-card p-4 rounded-[32px] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500/20 p-3 rounded-2xl">
                      <Trophy size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Today's High Scorer</p>
                      <div className="flex items-center gap-2">
                        <img src={TEAMS.find(t => t.id === MOCK_LEADERBOARD[2].teamId)?.logo} className="w-4 h-4 object-contain" alt="Logo" referrerPolicy="no-referrer" />
                        <p className="text-sm font-black text-white">{MOCK_LEADERBOARD[2].name}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white">+{MOCK_LEADERBOARD[2].cardsCapturedFromOpponents}</p>
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Captured</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Stats Section */}
            <div className="px-4 mt-8">
              <div className="orange-card rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-bold text-orange-200/60 uppercase tracking-widest">Total Points</p>
                  <p className="text-lg font-black text-white">{user?.points.toLocaleString() || '0'}</p>
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <img 
                      key={i} 
                      src={`https://picsum.photos/seed/user${i}/100`} 
                      className="w-8 h-8 rounded-full border-2 border-white" 
                      alt="User"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                  <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">
                    +12
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {view === 'challenges' && (
          <ChallengesPage 
            user={user} 
            onJoinBattle={handleJoinBattle} 
            onCreateChallenge={() => setIsCreateChallengeModalOpen(true)}
          />
        )}
        {view === 'tournaments' && <TournamentsPage />}
        {view === 'leaderboard' && <LeaderboardPage user={user} setUser={setUser} userTeamId={user?.teamId} />}
        {view === 'collections' && <HallOfFamePage user={user} />}

        {view === 'store' && (
          <CardHousePage 
            onSelectTeam={(team) => {
              setSelectedStoreTeam(team);
              setView('team-pack');
            }} 
            onBack={() => setView('home')} 
          />
        )}

        {view === 'team-pack' && selectedStoreTeam && (
          <TeamPackPage 
            team={selectedStoreTeam} 
            onBack={() => setView('store')} 
            onBuy={handleBuyTeam} 
          />
        )}

        {view === 'profile' && user && (
          <div className="px-4 mt-28 pb-20">
            {/* Premium Profile Header */}
            <div className="relative mb-12">
              {/* Large Gradient Banner */}
              <div className={`h-48 rounded-[40px] bg-gradient-to-br ${userTeam?.color || 'from-blue-600 to-purple-600'} shadow-2xl relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-20" style={{ 
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '24px 24px'
                }} />
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/20 rounded-full blur-3xl" />
              </div>

              {/* Avatar & Identity Section */}
              <div className="absolute left-1/2 -translate-x-1/2 -bottom-8 w-full px-6 flex flex-col items-center">
                <div className="relative group">
                  {/* Soft Glow behind avatar */}
                  <div className={`absolute inset-0 rounded-[32px] blur-2xl opacity-50 bg-gradient-to-r ${userTeam?.color || 'from-blue-400 to-purple-400'} group-hover:opacity-80 transition-opacity duration-500`} />
                  <div className="relative">
                    <img 
                      src={user.avatar} 
                      className="w-28 h-28 rounded-[32px] border-4 border-white/10 shadow-2xl object-cover relative z-10" 
                      alt="Profile" 
                      referrerPolicy="no-referrer" 
                    />
                    {/* Team Badge beside avatar */}
                    <div className="absolute -bottom-2 -right-2 bg-black/60 p-1.5 rounded-xl border border-white/10 shadow-lg z-20">
                      <img src={userTeam?.logo} className="w-6 h-6 object-contain" alt="Team" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <img src={userTeam?.logo} className="w-5 h-5 object-contain drop-shadow-md" alt="Team" referrerPolicy="no-referrer" />
                    <h2 className="text-2xl font-black text-gradient-primary italic uppercase tracking-tighter drop-shadow-md">
                      {user.name}
                    </h2>
                  </div>
                  
                  <div className="flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1.5 glass-card px-3 py-1 border border-white/5">
                      <Shield size={10} className="text-blue-500" />
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{userTeam?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 glass-card px-3 py-1 border border-white/5">
                      <Trophy size={10} className="text-yellow-500" />
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Rank #{user.rank}</span>
                    </div>
                    <div className="flex items-center gap-1.5 glass-card px-3 py-1 border border-white/5">
                      <Flame size={10} className="text-orange-500" />
                      <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{user.bestStreak} Streak</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid - Glassmorphism */}
            <div className="grid grid-cols-2 gap-4 mb-10 mt-16">
              {[
                { label: 'Total Wins', value: user.wins, icon: <Trophy size={16} />, color: 'text-yellow-500', border: 'border-glow-orange' },
                { label: 'Captured', value: user.cardsCaptured, icon: <Layers size={16} />, color: 'text-blue-500', border: 'border-glow-blue' },
                { label: 'Win Rate', value: `${Math.round((user.wins / (user.wins + user.losses)) * 100)}%`, icon: <Percent size={16} />, color: 'text-emerald-500', border: 'border-glow-blue' },
                { label: 'Best Streak', value: user.bestStreak, icon: <Flame size={16} />, color: 'text-orange-500', border: 'border-glow-orange' }
              ].map((stat, idx) => (
                <motion.div 
                  key={idx}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`glass-card p-5 flex flex-col items-center justify-center text-center relative overflow-hidden group ${stat.border}`}
                >
                  <div className={`mb-2 p-2 bg-black/40 rounded-xl ${stat.color} border border-white/5`}>
                    {stat.icon}
                  </div>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-white italic tracking-tighter">{stat.value}</p>
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-yellow-500 opacity-0 group-hover:opacity-100 transition-opacity`} />
                </motion.div>
              ))}
            </div>

            {/* Recent Matches Section */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-6 px-2">
                <div>
                  <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Recent Matches</h3>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Performance History</p>
                </div>
                <Activity size={16} className="text-gray-600" />
              </div>

              <div className="bg-white/[0.02] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
                {user.matchHistory.map((match, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`p-5 flex justify-between items-center group hover:bg-white/[0.03] transition-colors ${
                      i !== user.matchHistory.length - 1 ? 'border-b border-white/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-lg ${
                        match.result === 'win' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {match.result === 'win' ? 'W' : 'L'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                            <Shield size={8} className="text-gray-400" />
                          </div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">vs {match.opponent}</p>
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                          <div className="flex items-center gap-1">
                            <Shield size={10} className="text-gray-500" />
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Rival Squad</span>
                          </div>
                        </div>
                        <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{match.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${
                          match.result === 'win' ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {match.result === 'win' ? '+250 PTS' : '-120 PTS'}
                        </p>
                      </div>
                      <div className="bg-white/5 p-2 rounded-xl group-hover:bg-white/10 transition-colors">
                        <ChevronRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav activeView={view} setView={setView} />
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      <PlayModal 
        isOpen={isPlayModalOpen} 
        onClose={() => setIsPlayModalOpen(false)} 
        onSelect={handleStartGame} 
      />
      <TeamSelectionModal 
        isOpen={isTeamModalOpen} 
        onSelect={handleTeamSelect} 
      />
      <ChallengeSetupModal 
        isOpen={isChallengeSetupModalOpen}
        user={user}
        onClose={() => setIsChallengeSetupModalOpen(false)}
        onConfirm={handleConfirmChallenge}
      />

      <CreateChallengeModal
        isOpen={isCreateChallengeModalOpen}
        onClose={() => setIsCreateChallengeModalOpen(false)}
        onConfirm={handleCreateChallengeConfirm}
        user={user}
      />
    </div>
  );
}
