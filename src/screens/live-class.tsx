/**
 * Live Class Interface - Revolutionary Interactive Live Class Experience
 * Pre-recorded video presented as live class with AI tutor interaction
 * Version: 4.0 - Landscape mode with consolidated single bottom bar (Meet/Zoom style)
 */

import { useState, useRef, useEffect } from 'react';
import { ttsSpeak, ttsCancel, onTtsStart, onTtsEnd } from '../shared/tts';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  Send, 
  Check,
  Mic,
  MicOff,
  Camera,

  LogOut,
  AlertCircle,
  X as XIcon,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  Hand,
  Upload,
  Image as ImageIcon,
  GraduationCap,
  FileText,
  MessageSquare,
  BarChart3,
  BookOpen,
  CheckCircle2,
  PartyPopper,
  User,
  Paperclip,
  File,
} from 'lucide-react';
import { StatusBar } from '../shared/premium-ui';
import { LiveClassFeedbackSheet } from './live-class-feedback-sheet';
import { ShareSheet } from './share-sheet';
import { recordClassExit, getCurrentCourseId } from '../shared/feedback-storage';
import { isAnyCooldownActive, registerLowRating, hasFiredThisSession, markFiredThisSession } from '../shared/referral-storage';

// Mock data for live class
const LIVE_CLASS_DATA = {
  topic: "Newton's Laws of Motion - Complete Guide",
  participants: 342,
  tutor: {
    name: "Tutor",
    avatar: "tutor",
  },
  chapters: [
    { id: 1, title: "Introduction & First Law", timestamp: 0, duration: 10 },
    { id: 2, title: "Second Law Explanation", timestamp: 10, duration: 10 },
    { id: 3, title: "Real World Examples & Third Law", timestamp: 20, duration: 10 },
  ],
  totalDuration: 596, // BigBuckBunny.mp4 duration
  // Timed interactions at 10s, 20s, 30s
  timedInteractions: [
    {
      timestamp: 30,
      type: 'mcq',
      question: "If a force of 10 N acts on a mass of 2 kg, what is the acceleration?",
      options: ["2 m/s²", "5 m/s²", "10 m/s²", "20 m/s²"],
      correctAnswer: 1,
      explanation: "Using Newton's Second Law: F = ma, therefore a = F/m = 10/2 = 5 m/s²",
    },
    {
      timestamp: 50,
      type: 'quick-question',
      question: "Can you think of a real-life example where you've experienced Newton's Third Law?",
      placeholder: "Type your answer here...",
      explanation: "Examples include: jumping (you push down on ground, ground pushes you up), swimming (you push water backward, water pushes you forward), rocket propulsion (exhaust pushes down, rocket moves up).",
    },
    {
      timestamp: 70,
      type: 'poll',
      question: "Which of Newton's Laws is most interesting to you?",
      options: ["First Law (Inertia)", "Second Law (F=ma)", "Third Law (Action-Reaction)", "All equally!"],
    },
  ]
};

// Smart nudge messages per trigger type
const NUDGE_MESSAGES: Record<string, string> = {
  'no-doubt': "You've been watching a while — any questions? Tap Chat and I'll answer.",
  'halfway': "We're halfway through. How's it going? Drop a doubt in Chat if anything's unclear.",
  'ending-soon': "Class is wrapping up soon. Last chance to ask — Chat or raise your hand.",
};

// Simulated 1-to-1 chat messages (tutor ↔ student only)
const SIMULATED_MESSAGES = [
  { id: 1, user: "Tutor", message: "Ready to start Newton's Laws? Let's go!", time: "6:01 PM", isTutor: true },
  { id: 2, user: "You", message: "Yes, ready to learn!", time: "6:02 PM", isTutor: false },
  { id: 3, user: "Tutor", message: "Great! We'll start with the First Law — inertia.", time: "6:02 PM", isTutor: true },
  { id: 4, user: "You", message: "Can you explain inertia with an example?", time: "6:03 PM", isTutor: false },
  { id: 5, user: "Tutor", message: "Sure! A ball rolling on a flat surface keeps rolling forever unless friction stops it. That's inertia.", time: "6:03 PM", isTutor: true },
];

// Sample participants
const PARTICIPANTS = [
  { id: 1, name: "Tutor", role: "Tutor", avatar: "tutor", handRaised: false },
  { id: 2, name: "Priya", role: "Student", avatar: "student", handRaised: false },
  { id: 3, name: "Rahul Kumar", role: "Student", avatar: "student", handRaised: false },
  { id: 4, name: "Ananya Patel", role: "Student", avatar: "student", handRaised: false },
  { id: 5, name: "Arjun Singh", role: "Student", avatar: "student", handRaised: false },
  { id: 6, name: "You", role: "Student", avatar: "student", handRaised: false },
];

// ─── Guided Tour ──────────────────────────────────────────────────────────────
type TourHighlight = 'chat' | 'hand' | 'none';

const TOUR_STEPS: {
  type: 'fullscreen' | 'bubble';
  title?: string;
  message: string;
  cta: string;
  highlight: TourHighlight;
}[] = [
  {
    type: 'fullscreen',
    title: 'Hello Sagar, good morning!',
    message: "I'm your tutor for today. Stay focused — it'll all click.",
    cta: "Let's Go",
    highlight: 'none',
  },
  {
    type: 'bubble',
    message: "Keep your notebook handy. If anything doesn't click, just let me know.",
    cta: 'Got it',
    highlight: 'none',
  },
  {
    type: 'bubble',
    message: "Stuck? Tap Chat and drop your doubt — I read every message.",
    cta: 'Got it',
    highlight: 'chat',
  },
  {
    type: 'bubble',
    message: "Want to ask me directly? Just raise your hand and I'll unmute you.",
    cta: 'Got it',
    highlight: 'hand',
  },
  {
    type: 'fullscreen',
    title: "All set, Sagar!",
    message: "No question is too small. Just raise your hand or message me any time.",
    cta: 'Start Class',
    highlight: 'none',
  },
];

type InteractionType = 'none' | 'mcq' | 'quick-question' | 'poll' | 'doubt-resolution';
type QuestionState = 'none' | 'asking' | 'answered-correct' | 'answered-wrong' | 'showing-explanation';

// ─── Join state: determines pre-class / catching-up experience ───────────────
type JoinState = 'early' | 'live' | 'late';

function getJoinState(): { state: JoinState; lateBySeconds: number; earlyBySeconds: number } {
  const params = new URLSearchParams(window.location.search);
  const join = params.get('join') ?? 'live';
  if (join === 'early') return { state: 'early', lateBySeconds: 0, earlyBySeconds: 12 };
  if (join === 'late')  return { state: 'late',  lateBySeconds: 120, earlyBySeconds: 0 };
  return { state: 'live', lateBySeconds: 0, earlyBySeconds: 0 };
}

const PRE_CLASS_MESSAGES = [
  { id: 'p1', user: 'Rahul',   message: 'Good morning everyone! Ready for this',    time: '9:58 AM' },
  { id: 'p2', user: 'Ananya',  message: 'Just finished revising my notes',          time: '9:59 AM' },
  { id: 'p3', user: 'Priya',   message: 'Newton\'s laws are my favourite topic!',   time: '9:59 AM' },
  { id: 'p4', user: 'Arjun',   message: 'Can\'t wait to get into F=ma',             time: '10:00 AM' },
];

// Tutor contextual pause prompts — do NOT pause video, just overlay a brief message
const TUTOR_PAUSES: { timestamp: number; message: string }[] = [
  { timestamp: 18, message: 'Take a moment to absorb this — raise your hand if you have questions.' },
  { timestamp: 42, message: 'Quick check-in: are we all following so far? Let me know in chat!' },
  { timestamp: 62, message: 'Almost done with this section. Any doubts? Raise your hand below.' },
];

// Live Class Component - Clean Zoom/Meet-style interface (v3.0)
export function Component() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const lectureCanvasRef = useRef<HTMLCanvasElement>(null);
  const portraitDisplayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Video state
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [participantCount, setParticipantCount] = useState(342);
  
  // UI state
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showParticipantsPanel, setShowParticipantsPanel] = useState(false);

  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showShareChain, setShowShareChain] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [isDesktopLandscape, setIsDesktopLandscape] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showHandRaiseNotification, setShowHandRaiseNotification] = useState(false);
  const [showControls, setShowControls] = useState(true); // Google Meet-style auto-hide controls
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState(SIMULATED_MESSAGES);
  const [chatInput, setChatInput] = useState('');
  const [chatInputFocused, setChatInputFocused] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  // Simulated keyboard height — portrait ~300px, landscape ~220px
  const simulatedKeyboardHeight = chatInputFocused
    ? (isLandscape ? 220 : 300)
    : 0;

  // Auto-scroll chat to bottom on new messages or keyboard open
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, chatInputFocused]);
  
  // Interaction state
  const [currentInteractionType, setCurrentInteractionType] = useState<InteractionType>('none');
  const [currentInteraction, setCurrentInteraction] = useState<typeof LIVE_CLASS_DATA.timedInteractions[0] | null>(null);
  const [questionState, setQuestionState] = useState<QuestionState>('none');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [quickQuestionImage, setQuickQuestionImage] = useState<string | null>(null);
  const [isRecordingQuickQuestion, setIsRecordingQuickQuestion] = useState(false);
  const [quickQuestionIsCorrect, setQuickQuestionIsCorrect] = useState(false);
  const [isQuickQuestionAudioPlaying, setIsQuickQuestionAudioPlaying] = useState(false);
  const [showQuickQuestionEvaluation, setShowQuickQuestionEvaluation] = useState(false);
  const [shownInteractionTimestamps, setShownInteractionTimestamps] = useState<Set<number>>(new Set());
  const [isExplanationAudioPlaying, setIsExplanationAudioPlaying] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const audioRef = useRef<HTMLAudioElement>(null);
  const quickQuestionImageInputRef = useRef<HTMLInputElement>(null);
  
  // Audio feedback state
  const [isCorrectAnswerAudioPlaying, setIsCorrectAnswerAudioPlaying] = useState(false);
  const correctAnswerAudioRef = useRef<HTMLAudioElement>(null);
  const pollSubmitAudioRef = useRef<HTMLAudioElement>(null);
  const questionAppearAudioRef = useRef<HTMLAudioElement>(null);
  
  // Doubt resolution state
  const [showDoubtResolution, setShowDoubtResolution] = useState(false);
  // Mic unlock: enabled after hand raise + tutor finishes sentence
  const [micUnlocked, setMicUnlocked] = useState(false);
  const [micActive, setMicActive] = useState(false); // currently recording via mic
  const [showMicToast, setShowMicToast] = useState(false);
  const [showAttachSheet, setShowAttachSheet] = useState(false);
  const micEnabled = handRaised && micUnlocked;
  const [doubtText, setDoubtText] = useState('');
  const [doubtImage, setDoubtImage] = useState<string | null>(null);
  const [doubtSubmitted, setDoubtSubmitted] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [showDoubtExplanation, setShowDoubtExplanation] = useState(false);
  const [isDoubtAudioPlaying, setIsDoubtAudioPlaying] = useState(false);
  const [isFollowUpQuestion, setIsFollowUpQuestion] = useState(false);
  const [doubtContext, setDoubtContext] = useState<string>('');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const sentenceEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // ─── Join-state experience ────────────────────────────────────────────────
  const joinInfoRef = useRef(getJoinState());
  const [joinPhase, setJoinPhase] = useState<JoinState>(() => joinInfoRef.current.state);
  const [earlyCountdown, setEarlyCountdown] = useState(() => joinInfoRef.current.earlyBySeconds);
  const [showCatchingUp, setShowCatchingUp] = useState(() => joinInfoRef.current.state === 'late');
  const [joinBannerText, setJoinBannerText] = useState('');
  const [showJoinBanner, setShowJoinBanner] = useState(false);
  const [tutorPauseText, setTutorPauseText] = useState('');
  const [showTutorPause, setShowTutorPause] = useState(false);
  const [shownPauseTimestamps, setShownPauseTimestamps] = useState<Set<number>>(new Set());
  const [preClassParticipants, setPreClassParticipants] = useState(312);

  // ─── Guided Tour state ────────────────────────────────────────────────────
  const [tourActive, setTourActive] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [tourTyping, setTourTyping] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeNudge, setActiveNudge] = useState<string | null>(null);
  const activeNudgeRef = useRef<string | null>(null);
  const firedNudgesRef = useRef<Set<string>>(new Set());
  const tourCompletedRef = useRef(false);
  const hasEngagedRef = useRef(false);
  const tourTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [handShaking, setHandShaking] = useState(false);
  const [chatShaking, setChatShaking] = useState(false);
  const shakeHand = () => { setHandShaking(true); setTimeout(() => setHandShaking(false), 400); };
  const shakeChat = () => { setChatShaking(true); setTimeout(() => setChatShaking(false), 400); };

  // Helper function to safely play audio with error handling
  const safePlayAudio = (audioRef: React.RefObject<HTMLAudioElement>) => {
    if (audioRef.current) {
      // Reset audio to beginning
      audioRef.current.currentTime = 0;
      // Attempt to play and catch any errors
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
  };
  
  // ── Animated physics lecture canvas → feeds all <video> elements ─────────
  useEffect(() => {
    const canvas = lectureCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;

    const SLIDE_DURATION = 540; // ~9 s at 60 fps → 5 slides × 9 s = 45 s total
    const SLIDES = [
      { label: 'LAW I', title: "Newton's First Law", eq: 'ΣF = 0  ⟹  v = constant', sub: 'An object at rest stays at rest.\nAn object in motion stays in motion.', color: '#3b82f6' },
      { label: 'LAW II', title: "Newton's Second Law", eq: 'F = ma', sub: 'Net force equals mass × acceleration.\nDirection of F = direction of a.', color: '#8b5cf6' },
      { label: 'LAW III', title: "Newton's Third Law", eq: "F₁₂ = −F₂₁", sub: 'Every action has an equal\nand opposite reaction.', color: '#06b6d4' },
      { label: 'APPLICATION', title: 'Free Body Diagram', eq: 'Fnet = T − mg', sub: 'Resolve all forces along x and y axes.\nApply ΣFx = max, ΣFy = may.', color: '#10b981' },
      { label: 'MOMENTUM', title: 'Conservation of Momentum', eq: 'p = mv  |  Δp = FΔt', sub: 'Total momentum of a closed system\nis always conserved.', color: '#f59e0b' },
    ];

    let t = 0;
    let animFrame: number;

    const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, lw = 3) => {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 12 * Math.cos(angle - 0.4), y2 - 12 * Math.sin(angle - 0.4));
      ctx.lineTo(x2 - 12 * Math.cos(angle + 0.4), y2 - 12 * Math.sin(angle + 0.4));
      ctx.closePath(); ctx.fill();
    };

    const draw = () => {
      t++;
      // Virtual 720×480 coordinate space — ctx.scale maps it to actual 1280×720
      const W = 720; const H = 480;
      ctx.save();
      ctx.scale(canvas.width / W, canvas.height / H);
      const slideIdx = Math.floor(t / SLIDE_DURATION) % SLIDES.length;
      const slideT = (t % SLIDE_DURATION) / SLIDE_DURATION;
      const slide = SLIDES[slideIdx];

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0a0f1a');
      bg.addColorStop(1, '#050810');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      // Subtle grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 1;
      for (let gx = 0; gx < W; gx += 48) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
      for (let gy = 0; gy < H; gy += 48) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

      // Slide-in fade
      const alpha = slideT < 0.1 ? slideT / 0.1 : slideT > 0.85 ? (1 - slideT) / 0.15 : 1;
      ctx.globalAlpha = Math.min(1, alpha);

      // Accent top bar
      const bar = ctx.createLinearGradient(0, 0, W, 0);
      bar.addColorStop(0, slide.color + 'cc');
      bar.addColorStop(1, slide.color + '22');
      ctx.fillStyle = bar; ctx.fillRect(0, 0, W, 4);

      // Chapter label
      ctx.fillStyle = slide.color + 'cc';
      ctx.font = 'bold 13px "Inter", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`NEWTON'S LAWS OF MOTION  ›  ${slide.label}`, 36, 40);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(slide.title, W / 2, 108);

      // Equation box
      const eqW = 360; const eqH = 80;
      const eqX = (W - eqW) / 2; const eqY = 132;
      const grd = ctx.createLinearGradient(eqX, eqY, eqX + eqW, eqY + eqH);
      grd.addColorStop(0, slide.color + '28');
      grd.addColorStop(1, slide.color + '10');
      ctx.fillStyle = grd;
      ctx.strokeStyle = slide.color + '55'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      (ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(eqX, eqY, eqW, eqH, 12);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = slide.color;
      ctx.font = 'bold 34px "Inter", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(slide.eq, W / 2, eqY + eqH / 2 + 12);

      // Sub text (wrapped)
      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '16px "Inter", sans-serif';
      slide.sub.split('\n').forEach((line, i) => { ctx.fillText(line, W / 2, 244 + i * 26); });

      // Physics diagram (changes per slide)
      ctx.save();
      const dCX = W / 2; const dCY = 370;
      if (slideIdx === 0) {
        // Block moving at constant velocity
        const bx = lerp(120, 560, (Math.sin(t * 0.015) + 1) / 2);
        ctx.fillStyle = slide.color + '33'; ctx.strokeStyle = slide.color + '88'; ctx.lineWidth = 2;
        ctx.fillRect(bx - 28, dCY - 20, 56, 40); ctx.strokeRect(bx - 28, dCY - 20, 56, 40);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'center';
        ctx.fillText('m', bx, dCY + 6);
        drawArrow(bx + 30, dCY, bx + 72, dCY, slide.color, 3);
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(60, dCY + 22); ctx.lineTo(660, dCY + 22); ctx.stroke();
      } else if (slideIdx === 1) {
        // F=ma: block with force arrow
        const bx = dCX - 28;
        ctx.fillStyle = slide.color + '33'; ctx.strokeStyle = slide.color + '88'; ctx.lineWidth = 2;
        ctx.fillRect(bx, dCY - 24, 56, 48); ctx.strokeRect(bx, dCY - 24, 56, 48);
        ctx.fillStyle = '#fff'; ctx.font = 'bold 14px Inter'; ctx.textAlign = 'center'; ctx.fillText('m', dCX, dCY + 6);
        const fLen = 50 + 30 * Math.sin(t * 0.04);
        drawArrow(dCX + 28, dCY, dCX + 28 + fLen, dCY, slide.color, 4);
        ctx.fillStyle = slide.color; ctx.font = 'bold 14px Inter'; ctx.fillText('F', dCX + 28 + fLen / 2, dCY - 12);
        // acceleration arrow (smaller, dashed)
        drawArrow(dCX - 28, dCY, dCX - 28 - 60, dCY, 'rgba(255,255,255,0.3)', 2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillText('a', dCX - 76, dCY - 10);
      } else if (slideIdx === 2) {
        // Action-reaction pair
        const sep = 80 + 20 * Math.sin(t * 0.03);
        [-1, 1].forEach((sign, i) => {
          const bx = dCX + sign * sep - 28;
          ctx.fillStyle = (i === 0 ? '#3b82f6' : '#f59e0b') + '33';
          ctx.strokeStyle = (i === 0 ? '#3b82f6' : '#f59e0b') + '88'; ctx.lineWidth = 2;
          ctx.fillRect(bx, dCY - 20, 56, 40); ctx.strokeRect(bx, dCY - 20, 56, 40);
        });
        drawArrow(dCX - sep + 28, dCY, dCX - sep - 20, dCY, '#3b82f6', 3);
        drawArrow(dCX + sep - 28, dCY, dCX + sep + 20, dCY, '#f59e0b', 3);
        ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = '13px Inter'; ctx.fillText('F₁₂', dCX - sep - 10, dCY - 28); ctx.fillText('F₂₁', dCX + sep + 10, dCY - 28);
      } else if (slideIdx === 3) {
        // Free body diagram
        const theta = 0.35;
        const lx = 100; const ly = dCY + 40; const rx = 560; const ry = dCY - 40;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(rx, ry); ctx.stroke();
        const bx = dCX - 28 * Math.cos(theta);
        const by = dCY + 28 * Math.sin(theta);
        ctx.save(); ctx.translate(bx + 28, by - 20); ctx.rotate(-theta);
        ctx.fillStyle = slide.color + '33'; ctx.strokeStyle = slide.color + '88'; ctx.lineWidth = 2;
        ctx.fillRect(-28, -20, 56, 40); ctx.strokeRect(-28, -20, 56, 40);
        ctx.restore();
        drawArrow(bx + 28, by - 20, bx + 28, by - 80, '#f59e0b', 3);
        drawArrow(bx + 28, by - 20, bx + 28, by + 60, slide.color, 3);
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'right'; ctx.fillText('N', bx + 20, by - 84);
        ctx.fillStyle = slide.color; ctx.textAlign = 'center'; ctx.fillText('mg', bx + 28, by + 80);
      } else {
        // Momentum — two balls approaching then bouncing off each other
        const phase = (t % SLIDE_DURATION) / SLIDE_DURATION; // 0→1 over the full slide
        const collide = 0.5; // collision at midpoint of slide
        const r1 = 24; const r2 = 20;
        let b1x: number; let b2x: number;
        if (phase < collide) {
          // Approaching
          b1x = lerp(100, dCX - r1, phase / collide);
          b2x = lerp(580, dCX + r2, phase / collide);
        } else {
          // Bouncing away
          const k = (phase - collide) / (1 - collide);
          b1x = lerp(dCX - r1, 80, k);
          b2x = lerp(dCX + r2, 600, k);
        }
        // Ball 1 (blue)
        const g1 = ctx.createRadialGradient(b1x - 6, dCY - 8, 4, b1x, dCY, r1);
        g1.addColorStop(0, '#60a5fa'); g1.addColorStop(1, '#1d4ed8');
        ctx.beginPath(); ctx.arc(b1x, dCY, r1, 0, Math.PI * 2);
        ctx.fillStyle = g1; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 13px Inter'; ctx.textAlign = 'center'; ctx.fillText('m₁', b1x, dCY + 5);
        // Ball 2 (amber)
        const g2 = ctx.createRadialGradient(b2x - 6, dCY - 8, 3, b2x, dCY, r2);
        g2.addColorStop(0, '#fcd34d'); g2.addColorStop(1, '#b45309');
        ctx.beginPath(); ctx.arc(b2x, dCY, r2, 0, Math.PI * 2);
        ctx.fillStyle = g2; ctx.fill();
        ctx.fillStyle = '#000'; ctx.font = 'bold 12px Inter'; ctx.fillText('m₂', b2x, dCY + 5);
        // Velocity arrows
        if (phase < collide) {
          drawArrow(b1x - r1 - 4, dCY, b1x - r1 - 48, dCY, '#60a5fa', 3);
          ctx.fillStyle = '#60a5fa'; ctx.font = '12px Inter'; ctx.textAlign = 'center'; ctx.fillText('v₁', b1x - r1 - 24, dCY - 12);
          drawArrow(b2x + r2 + 4, dCY, b2x + r2 + 48, dCY, '#fcd34d', 3);
          ctx.fillStyle = '#fcd34d'; ctx.fillText('v₂', b2x + r2 + 24, dCY - 12);
        } else {
          drawArrow(b1x - r1, dCY, b1x - r1 - 56, dCY, '#60a5fa', 3);
          drawArrow(b2x + r2, dCY, b2x + r2 + 56, dCY, '#fcd34d', 3);
        }
        // Collision flash
        if (phase > 0.47 && phase < 0.55) {
          const flashAlpha = 1 - Math.abs(phase - 0.51) / 0.04;
          ctx.globalAlpha = Math.max(0, flashAlpha * 0.6);
          const flash = ctx.createRadialGradient(dCX, dCY, 0, dCX, dCY, 60);
          flash.addColorStop(0, '#ffffff'); flash.addColorStop(1, 'transparent');
          ctx.fillStyle = flash; ctx.beginPath(); ctx.arc(dCX, dCY, 60, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = Math.min(1, alpha);
        }
        // Conservation label
        ctx.fillStyle = slide.color + 'cc'; ctx.font = '14px Inter'; ctx.textAlign = 'center';
        ctx.fillText('m₁v₁ + m₂v₂  =  m₁v₁\' + m₂v₂\'', dCX, dCY + 64);
      }
      ctx.restore(); // diagram save

      ctx.restore(); // outer scale restore
      ctx.globalAlpha = 1;

      // Mirror to portrait display canvas each frame
      const dc = portraitDisplayCanvasRef.current;
      if (dc) {
        if (dc.width !== canvas.width) { dc.width = canvas.width; dc.height = canvas.height; }
        dc.getContext('2d')?.drawImage(canvas, 0, 0);
      }

      animFrame = requestAnimationFrame(draw);
    };

    draw();

    // Feed canvas stream into all video elements
    if ((canvas as HTMLCanvasElement & { captureStream?: (fps: number) => MediaStream }).captureStream) {
      const stream = (canvas as HTMLCanvasElement & { captureStream: (fps: number) => MediaStream }).captureStream(24);
      video.srcObject = stream;
      video.muted = true;
      video.play().catch(() => {});
    }

    return () => {
      cancelAnimationFrame(animFrame);
      if (video.srcObject) { video.srcObject = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Preload audio files when component mounts
  useEffect(() => {
    // Load audio elements
    [correctAnswerAudioRef, pollSubmitAudioRef, questionAppearAudioRef].forEach(ref => {
      if (ref.current) {
        ref.current.load();
      }
    });
  }, []);

  // ── Mount: handle late / live join ────────────────────────────────────────
  useEffect(() => {
    const { state, lateBySeconds } = joinInfoRef.current;

    if (state === 'late') {
      // Auto-seek to current live position
      setCurrentTime(lateBySeconds);
      if (videoRef.current) videoRef.current.currentTime = lateBySeconds;
      // "Catching up..." dismisses after 2.5 s, then show banner
      setTimeout(() => {
        setShowCatchingUp(false);
        const mins = Math.floor(lateBySeconds / 60);
        setJoinBannerText(`You joined ${mins} min into the class`);
        setShowJoinBanner(true);
        setTimeout(() => setShowJoinBanner(false), 4000);
      }, 2500);
    } else if (state === 'live') {
      setJoinBannerText('Class is in progress');
      setShowJoinBanner(true);
      setTimeout(() => setShowJoinBanner(false), 3000);
    }
    // 'early' is handled by the countdown effect below
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Early-join countdown ──────────────────────────────────────────────────
  useEffect(() => {
    if (joinPhase !== 'early') return;

    // Animate pre-class participant count
    const participantInterval = setInterval(() => {
      setPreClassParticipants(prev => Math.min(342, prev + Math.floor(Math.random() * 8) + 1));
    }, 800);

    if (earlyCountdown <= 0) {
      clearInterval(participantInterval);
      setJoinPhase('live');
      setJoinBannerText('Class has started!');
      setShowJoinBanner(true);
      setTimeout(() => setShowJoinBanner(false), 3500);
      return;
    }

    const timer = setInterval(() => {
      setEarlyCountdown(prev => prev - 1);
    }, 1000);

    return () => { clearInterval(timer); clearInterval(participantInterval); };
  }, [joinPhase, earlyCountdown]);

  // ── Tutor pause prompts (don't stop video) ────────────────────────────────
  useEffect(() => {
    const pause = TUTOR_PAUSES.find(
      p => p.timestamp === currentTime && !shownPauseTimestamps.has(p.timestamp)
    );
    if (pause && !showTutorPause && questionState === 'none') {
      setShownPauseTimestamps(prev => new Set(prev).add(pause.timestamp));
      setTutorPauseText(pause.message);
      setShowTutorPause(true);
      setTimeout(() => setShowTutorPause(false), 6000);
    }
  }, [currentTime, shownPauseTimestamps, showTutorPause, questionState]);
  
  // When hand is raised, wait for tutor to finish sentence, then open chat with mic ON
  useEffect(() => {
    if (handRaised && !micUnlocked) {
      if (sentenceEndTimerRef.current) clearTimeout(sentenceEndTimerRef.current);

      // Simulate tutor finishing current sentence (3-5 seconds)
      const delay = 3000 + Math.random() * 2000;
      sentenceEndTimerRef.current = setTimeout(() => {
        setMicUnlocked(true);
        setMicActive(true); // auto-start mic
        setShowChatPanel(true); // open chat panel
      }, delay);
    }

    if (!handRaised) {
      setMicUnlocked(false);
      setMicActive(false);
    }

    return () => {
      if (sentenceEndTimerRef.current) clearTimeout(sentenceEndTimerRef.current);
    };
  }, [handRaised, micUnlocked]);

  // Speech recognition: start when micActive, stop when not
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (micActive) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setChatInput(transcript);
      };
      recognition.onerror = () => {};
      recognition.start();
      speechRecognitionRef.current = recognition;
    } else {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (_) {}
        speechRecognitionRef.current = null;
      }
    }

    return () => {
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (_) {}
        speechRecognitionRef.current = null;
      }
    };
  }, [micActive]);

  // Pause video when bottom sheet appears
  useEffect(() => {
    if (showDoubtResolution) {
      setIsPlaying(false);
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [showDoubtResolution]);

  // ── Tour: init on mount if ?tour=1 ──────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tour') === '1') {
      const initTimer = setTimeout(() => {
        setIsPlaying(false);
        if (videoRef.current) videoRef.current.pause();
        setTourActive(true);
        setTourStep(0);
        // Speak step 0 greeting as soon as it appears.
        // On mobile (no iframe) this works from setTimeout — the user gesture from
        // tapping "Start Your First Class" is still in scope on the same page context.
        const s0 = TOUR_STEPS[0];
        const s0text = s0.title ? `${s0.title}. ${s0.message}` : s0.message;
        ttsSpeak(s0text, { rate: 0.85, pitch: 1.0, volume: 1 });
        setIsSpeaking(true);
      }, 800);
      return () => clearTimeout(initTimer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Tour: keep video paused while active ────────────────────────────────
  useEffect(() => {
    if (tourActive) {
      setIsPlaying(false);
      if (videoRef.current) videoRef.current.pause();
    }
  }, [tourActive]);

  // ── Tour: advance to next step — speak synchronously within user gesture ──
  const advanceTour = () => {
    const nextStep = tourStep + 1;
    if (nextStep >= TOUR_STEPS.length) {
      tourCompletedRef.current = true;
      setTourActive(false);
      setTourStep(0);
      setIsPlaying(true);
      if (videoRef.current) videoRef.current.play().catch(() => {});
      return;
    }
    const step = TOUR_STEPS[nextStep];
    const text = step.title ? `${step.title}. ${step.message}` : step.message;
    ttsSpeak(text, { rate: 0.85, pitch: 1.0, volume: 1 });
    setIsSpeaking(true);
    setTourTyping(true);
    if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
    tourTimerRef.current = setTimeout(() => {
      setTourTyping(false);
      setTourStep(nextStep);
    }, 700);
  };

  // ── Tour: cancel TTS when tour ends ─────────────────────────────────────
  useEffect(() => {
    if (!tourActive) ttsCancel();
  }, [tourActive]);

  // ── TTS speaking state — drives avatar pulse ring ────────────────────────
  useEffect(() => {
    const unsub1 = onTtsStart(() => setIsSpeaking(true));
    const unsub2 = onTtsEnd(() => setIsSpeaking(false));
    return () => { unsub1(); unsub2(); };
  }, []);

  // ── Tour: skip all steps ─────────────────────────────────────────────────
  const skipTour = () => {
    if (tourTimerRef.current) clearTimeout(tourTimerRef.current);
    tourCompletedRef.current = true;
    setTourActive(false);
    setTourTyping(false);
    setTourStep(0);
    setIsPlaying(true);
    if (videoRef.current) videoRef.current.play().catch(() => {});
  };

  // ── Multi-nudge system: 3 contextual nudges over the session ────────────
  // 1. no-doubt: 120s elapsed + no engagement (scaled from ~10min in 30min class)
  // 2. halfway: video at 50% of totalDuration
  // 3. ending-soon: video at 88% of totalDuration
  useEffect(() => {
    if (!tourCompletedRef.current) return;

    const check = () => {
      if (activeNudgeRef.current) return;

      const elapsed = elapsedRef.current;
      const time = videoRef.current ? Math.floor(videoRef.current.currentTime) : 0;
      const total = LIVE_CLASS_DATA.totalDuration;

      let toFire: string | null = null;

      if (elapsed >= 120 && !hasEngagedRef.current && !firedNudgesRef.current.has('no-doubt')) {
        toFire = 'no-doubt';
      } else if (time >= total * 0.50 && !firedNudgesRef.current.has('halfway')) {
        toFire = 'halfway';
      } else if (time >= total * 0.88 && !firedNudgesRef.current.has('ending-soon')) {
        toFire = 'ending-soon';
      }

      if (toFire) {
        firedNudgesRef.current.add(toFire);
        activeNudgeRef.current = toFire;
        setActiveNudge(toFire);
        setTimeout(() => {
          setActiveNudge(null);
          activeNudgeRef.current = null;
        }, 8000);
      }
    };

    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, [tourActive]);

  // ── Elapsed wall-clock time (survives video looping) ─────────────────────
  const elapsedRef = useRef(0);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => { elapsedRef.current += 1; }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Track video playback using native video events (smooth, no lag!)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const newTime = Math.floor(video.currentTime);
      setCurrentTime(newTime);

      // Update chapter based on timestamp
      const chapterIndex = LIVE_CLASS_DATA.chapters.findIndex((ch, idx) => {
        const nextChapter = LIVE_CLASS_DATA.chapters[idx + 1];
        return newTime >= ch.timestamp && (!nextChapter || newTime < nextChapter.timestamp);
      });

      if (chapterIndex !== -1 && chapterIndex !== currentChapter) {
        setCurrentChapter(chapterIndex);
      }

      // Check for timed interactions using elapsed wall-clock time
      // (video.currentTime resets on loop — elapsed does not)
      const elapsed = elapsedRef.current;
      const interaction = LIVE_CLASS_DATA.timedInteractions.find(
        int => int.timestamp === elapsed && !shownInteractionTimestamps.has(elapsed)
      );

      // Don't interrupt if chat is open, hand raised, or doubt open
      if (interaction && questionState === 'none' && !handRaised && !showDoubtResolution && !showChatPanel) {
        setIsPlaying(false);
        setCurrentInteraction(interaction);
        setCurrentInteractionType(interaction.type as InteractionType);
        setQuestionState('asking');
        video.pause();
        safePlayAudio(questionAppearAudioRef);
        setShownInteractionTimestamps(prev => new Set(prev).add(elapsed));
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentChapter, questionState, shownInteractionTimestamps, handRaised, showDoubtResolution, showChatPanel, doubtSubmitted]);
  
  // ── Auto-dismiss overlay after 20s if student doesn't answer ────────────
  useEffect(() => {
    if (questionState !== 'asking') return;
    const timer = setTimeout(() => {
      setQuestionState('none');
      setCurrentInteraction(null);
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 20000);
    return () => clearTimeout(timer);
  }, [questionState]);

  // Sync isPlaying state with video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isPlaying) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isPlaying]);
  
  // Simulate participant count fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setParticipantCount(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Detect orientation changes and screen size
  useEffect(() => {
    const checkOrientation = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isLandscapeOrientation = width > height;
      
      setIsLandscape(isLandscapeOrientation);
      
      // Desktop landscape: width >= 768 (to support smaller desktop windows)
      // Mobile landscape: width < 768 (like 800×360 mobile)
      setIsDesktopLandscape(isLandscapeOrientation && width >= 768);
      
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);
  
  // Google Meet-style controls auto-hide functionality
  const toggleControls = () => {
    setShowControls(!showControls);
    
    // If showing controls, set a timeout to auto-hide after 3 seconds
    if (!showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };
  
  // Reset auto-hide timer when user interacts with controls
  const resetControlsTimer = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);
  
  // Hand raise functionality
  const toggleHandRaise = () => {
    if (tourActive && tourStep === 3 && !tourTyping) {
      advanceTour(); // Tour: just advance, don't trigger hand raise flow
      return;
    }
    const newState = !handRaised;
    if (newState) hasEngagedRef.current = true;
    setHandRaised(newState);
    
    // Add a chat message when hand is raised/lowered
    const newMessage = {
      id: chatMessages.length + 1,
      user: "System",
      message: newState ? "You raised your hand" : "You lowered your hand",
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isTutor: false,
    };
    setChatMessages([...chatMessages, newMessage]);
    
    // Show notification for hand raise
    if (newState) {
      setShowHandRaiseNotification(true);
      setTimeout(() => {
        setShowHandRaiseNotification(false);
      }, 3000);
    }
  };
  
  const handleChapterJump = (chapterId: number) => {
    const chapter = LIVE_CLASS_DATA.chapters.find(ch => ch.id === chapterId);
    if (chapter) {
      setCurrentTime(chapter.timestamp);
      setCurrentChapter(chapterId - 1);

      if (videoRef.current) {
        videoRef.current.currentTime = chapter.timestamp;
      }
    }
  };
  
  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    hasEngagedRef.current = true;

    // Stop speech recognition when sending
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (_) {}
      speechRecognitionRef.current = null;
    }

    const newMessage = {
      id: chatMessages.length + 1,
      user: "You",
      message: chatInput,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      isTutor: false,
    };

    const updatedMessages = [...chatMessages, newMessage];
    setChatMessages(updatedMessages);
    setChatInput('');

    // If mic was active, restart it after sending
    if (micActive) {
      setMicActive(false);
      setTimeout(() => setMicActive(true), 200);
    }

    // Simulate tutor text response after ~2.5s
    const tutorReplies = [
      "Good question! Let me address that right after this section.",
      "That's a great observation. Yes, exactly — keep that in mind.",
      "I'll come back to that in a moment. Hold on.",
      "Nice catch! The answer is related to what we just covered.",
      "I heard you. Let me explain that once more clearly.",
    ];
    const reply = tutorReplies[Math.floor(Math.random() * tutorReplies.length)];
    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        id: prev.length + 1,
        user: "Tutor",
        message: reply,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        isTutor: true,
      }]);
    }, 2000 + Math.random() * 1000);
  };
  
  // Handle doubt submission
  const handleDoubtSubmit = () => {
    if (!doubtText.trim() && !doubtImage && !isRecordingAudio) return;
    
    // Show submitted state
    setDoubtSubmitted(true);
    
    // Immediately show tutor's explanation (like a real live class)
    setTimeout(() => {
      setShowDoubtExplanation(true);
      setIsDoubtAudioPlaying(true);
      
      // Audio plays for 8 seconds
      setTimeout(() => {
        setIsDoubtAudioPlaying(false);
      }, 8000);
    }, 500);
  };
  
  // Handle continuing after doubt explanation
  const handleContinueAfterDoubt = () => {
    setShowDoubtResolution(false);
    setDoubtSubmitted(false);
    setShowDoubtExplanation(false);
    setIsDoubtAudioPlaying(false);
    setDoubtText('');
    setDoubtImage(null);
    setHandRaised(false);
    setMicUnlocked(false);
    setMicActive(false);
    setIsFollowUpQuestion(false);
    setDoubtContext('');
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };
  
  // Handle image upload for doubt
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDoubtImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Toggle audio recording for doubt
  const toggleAudioRecording = () => {
    setIsRecordingAudio(!isRecordingAudio);
    // In a real app, this would start/stop actual audio recording
  };
  
  // Toggle audio recording for quick question
  const toggleQuickQuestionAudioRecording = () => {
    setIsRecordingQuickQuestion(!isRecordingQuickQuestion);
    if (!isRecordingQuickQuestion) {
      // Simulate recording - add some text after 2 seconds
      setTimeout(() => {
        setTextAnswer("I think Newton's Third Law states that for every action, there's an equal and opposite reaction...");
        setIsRecordingQuickQuestion(false);
      }, 2000);
    }
  };
  
  // Handle image upload for quick question
  const handleQuickQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQuickQuestionImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleAnswerSubmit = (answerIndex?: number) => {
    if (!currentInteraction) return;
    
    // Handle MCQ
    if (currentInteractionType === 'mcq' && answerIndex !== undefined) {
      setSelectedAnswer(answerIndex);
      
      if (answerIndex === (currentInteraction as any).correctAnswer) {
        setQuestionState('answered-correct');
        setIsCorrectAnswerAudioPlaying(true);
        
        // Play tutor encouragement audio
        safePlayAudio(correctAnswerAudioRef);
        
        // Audio plays for ~3 seconds
        setTimeout(() => {
          setIsCorrectAnswerAudioPlaying(false);
        }, 3000);
        
        // Show correct feedback for 3 seconds, then continue
        setTimeout(() => {
          setQuestionState('none');
          setCurrentInteraction(null);
          setCurrentInteractionType('none');
          setSelectedAnswer(null);
          setCountdown(10);
          setIsPlaying(true);
          if (videoRef.current) {
            videoRef.current.play();
          }
        }, 3000); // Show feedback for 3 seconds then continue
      } else {
        setQuestionState('answered-wrong');
        // Show wrong feedback, then explanation
        setTimeout(() => {
          setQuestionState('showing-explanation');
          setIsExplanationAudioPlaying(true);
          // Simulate 6-second audio explanation
          setTimeout(() => {
            setIsExplanationAudioPlaying(false);
          }, 6000);
        }, 1500);
      }
    }
    
    // Handle Quick Question (text input/voice/image)
    else if (currentInteractionType === 'quick-question') {
      if (!textAnswer.trim() && !quickQuestionImage && !isRecordingQuickQuestion) return;
      
      // Simulate tutor evaluating the answer (randomly correct/wrong for demo)
      const isCorrect = Math.random() > 0.5;
      setQuickQuestionIsCorrect(isCorrect);
      
      if (isCorrect) {
        setQuestionState('answered-correct');
        // Wait 3 seconds, then continue
        setTimeout(() => {
          setQuestionState('none');
          setCurrentInteraction(null);
          setCurrentInteractionType('none');
          setTextAnswer('');
          setQuickQuestionImage(null);
          setIsRecordingQuickQuestion(false);
          setIsPlaying(true);
          if (videoRef.current) {
            videoRef.current.play();
          }
        }, 3000);
      } else {
        setQuestionState('answered-wrong');
        // Show wrong feedback, then explanation
        setTimeout(() => {
          setQuestionState('showing-explanation');
          setIsQuickQuestionAudioPlaying(true);
          // Audio plays for 6 seconds
          setTimeout(() => {
            setIsQuickQuestionAudioPlaying(false);
          }, 6000);
        }, 1500);
      }
    }
    
    // Handle Poll
    else if (currentInteractionType === 'poll' && answerIndex !== undefined) {
      setSelectedAnswer(answerIndex);
      setQuestionState('answered-correct');
      
      // Play poll submission confirmation audio
      safePlayAudio(pollSubmitAudioRef);
      
      // Show poll result for 2.5 seconds, then continue
      setTimeout(() => {
        setQuestionState('none');
        setCurrentInteraction(null);
        setCurrentInteractionType('none');
        setSelectedAnswer(null);
        setCountdown(10);
        setIsPlaying(true);
        if (videoRef.current) {
          videoRef.current.play();
        }
      }, 2500); // Show feedback for 2.5 seconds then continue
    }
  };
  
  const handleContinueAfterQuickQuestionExplanation = () => {
    setQuestionState('none');
    setCurrentInteraction(null);
    setCurrentInteractionType('none');
    setTextAnswer('');
    setQuickQuestionImage(null);
    setIsRecordingQuickQuestion(false);
    setShowQuickQuestionEvaluation(false);
    setIsQuickQuestionAudioPlaying(false);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };
  
  const handleContinueAfterExplanation = () => {
    setQuestionState('none');
    setCurrentInteraction(null);
    setCurrentInteractionType('none');
    setSelectedAnswer(null);
    setCountdown(10);
    setIsExplanationAudioPlaying(false);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play();
    }
  };
  
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        // Check if fullscreen is supported and allowed
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {
            // Silently handle fullscreen permission errors
            // Fallback: just toggle the state for UI purposes
            setIsFullscreen(!isFullscreen);
          });
          setIsFullscreen(true);
        } else {
          // Fallback for environments without fullscreen support
          setIsFullscreen(!isFullscreen);
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {
            // Silently handle exit errors
          });
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      // Silently handle fullscreen API unavailability
      // Fallback: just toggle the UI state
      setIsFullscreen(!isFullscreen);
    }
  };
  
  const handleLeaveClass = () => {
    // Intercept the navigate-away to surface the feedback sheet first.
    // The sheet handles dismiss (skip) and submit — both close + navigate.
    setShowLeaveConfirm(false);
    setShowFeedback(true);
  };

  const finalizeExit = () => {
    setShowFeedback(false);
    setShowShareChain(false);
    // Record the class exit so the course-review auto-rise system can decide
    // whether to surface the review sheet on the next learning-path mount.
    // Course id was stashed by learning-path on its mount.
    recordClassExit(getCurrentCourseId());
    navigate('/learning-path', { replace: true });
  };

  // Post-positive-feedback chain. Per PRD §4: feedback rating ≥ 4 →
  // success state → 600ms → share sheet rises. Two sheets sequenced,
  // never merged. ≤ 3 ratings register a 14-day suppression and skip
  // straight to exit.
  const handleFeedbackSubmitted = (rating: number) => {
    setShowFeedback(false);
    if (rating <= 3) {
      registerLowRating();
      finalizeExit();
      return;
    }
    if (hasFiredThisSession() || isAnyCooldownActive()) {
      finalizeExit();
      return;
    }
    markFiredThisSession();
    // Brief pause so the feedback success state can clear visually before
    // the share sheet rises. Matches PRD "submit feedback → success state
    // → 600ms → share rises".
    setTimeout(() => setShowShareChain(true), 600);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getChapterProgress = () => {
    const chapter = LIVE_CLASS_DATA.chapters[currentChapter];
    if (!chapter) return 0;
    
    const chapterElapsed = currentTime - chapter.timestamp;
    return Math.min(100, (chapterElapsed / chapter.duration) * 100);
  };

  return (
    <div
      className="w-full min-h-screen flex justify-center items-center"
      style={{
        backgroundColor: isLandscape ? 'var(--video-background)' : 'var(--background)',
      }}
    >
      <div
        id="live-class-container"
        className="relative w-full h-screen overflow-hidden"
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          backgroundColor: isLandscape ? 'var(--video-background)' : 'var(--background)',
          display: 'flex',
          flexDirection: isDesktopLandscape ? 'row' : 'column',
        }}
      >
        {!isLandscape && <StatusBar />}

        {/* ══ STARTING SOON overlay (early join) ══════════════════════════════ */}
        <AnimatePresence>
          {joinPhase === 'early' && (
            <motion.div
              key="starting-soon"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.6 } }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
              style={{
                zIndex: 120,
                backgroundColor: 'var(--background)',
              }}
            >
              <AnimatePresence mode="wait">
                {earlyCountdown > 7 ? (
                  /* ── Far state: logo + title + simple timer ── */
                  <motion.div
                    key="far"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col items-center"
                  >
                    {/* Glowing logo */}
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 80, height: 80, borderRadius: '50%',
                        backgroundColor: 'var(--primary-alpha-15)',
                        border: '1.5px solid var(--primary-alpha-30)',
                        marginBottom: 28,
                        boxShadow: '0 0 32px var(--primary-alpha-20)',
                      }}
                    >
                      <GraduationCap style={{ width: 34, height: 34, color: 'var(--primary)' }} />
                    </div>

                    <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', letterSpacing: '0.1em', marginBottom: 8 }}>
                      STARTING SOON
                    </div>
                    <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', textAlign: 'center', lineHeight: 1.3, marginBottom: 28, maxWidth: 280 }}>
                      {LIVE_CLASS_DATA.topic}
                    </div>

                    {/* Simple digital timer */}
                    <div className="flex flex-col items-center gap-1">
                      <span style={{
                        fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xl)',
                        fontWeight: 'var(--font-weight-bold)',
                        color: 'var(--foreground)', letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums',
                      }}>
                        {String(Math.floor(earlyCountdown / 60)).padStart(2, '0')}:{String(earlyCountdown % 60).padStart(2, '0')}
                      </span>
                      <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                        starts in
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  /* ── Close state: no logo, highlighted countdown ── */
                  <motion.div
                    key="close"
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35 }}
                    className="flex flex-col items-center"
                  >
                    <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', letterSpacing: '0.1em', marginBottom: 8 }}>
                      STARTING SOON
                    </div>
                    <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--foreground)', textAlign: 'center', lineHeight: 1.3, marginBottom: 36, maxWidth: 280 }}>
                      {LIVE_CLASS_DATA.topic}
                    </div>

                    {/* Glowing countdown */}
                    <motion.div
                      animate={{ boxShadow: ['0 0 24px var(--primary-alpha-30)', '0 0 48px var(--primary-alpha-15)', '0 0 24px var(--primary-alpha-30)'] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="flex flex-col items-center justify-center"
                      style={{
                        width: 112, height: 112, borderRadius: '50%',
                        backgroundColor: 'var(--primary-alpha-10)',
                        border: '2px solid var(--primary-alpha-40)',
                      }}
                    >
                      <motion.span
                        key={earlyCountdown}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-3xl)', fontWeight: 'var(--font-weight-bold)', color: 'var(--primary)', lineHeight: 1 }}
                      >
                        {earlyCountdown}
                      </motion.span>
                      <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', color: 'var(--primary)', opacity: 0.7, marginTop: 4 }}>seconds</span>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ CATCHING UP overlay (late join) ═════════════════════════════════ */}
        <AnimatePresence>
          {showCatchingUp && (
            <motion.div
              key="catching-up"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-4"
              style={{
                zIndex: 110,
                backgroundColor: 'color-mix(in srgb, var(--black) 82%, transparent)',
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 48, height: 48, borderRadius: '50%',
                  border: '3px solid var(--border)',
                  borderTopColor: 'var(--primary)',
                }}
              />
              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)' }}>Catching up to live…</div>
              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--white-alpha-60)' }}>Jumping to the current point in class</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ JOIN BANNER toast ════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showJoinBanner && (
            <motion.div
              key="join-banner"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
              style={{
                position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
                zIndex: 105,
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 24, padding: '8px 16px',
                boxShadow: `0 4px 20px var(--black-alpha-40)`,
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: joinBannerText.includes('joined') ? 'var(--warning)' : 'var(--primary)', flexShrink: 0 }}
              />
              <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                {joinBannerText}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ TUTOR PAUSE prompt ═══════════════════════════════════════════════ */}
        <AnimatePresence>
          {showTutorPause && (
            <motion.div
              key="tutor-pause"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="flex items-start gap-2"
              style={{
                position: 'absolute', bottom: 100, left: 16, right: 16, zIndex: 105,
                backgroundColor: 'var(--card)',
                border: '1px solid var(--primary-alpha-30)',
                borderRadius: 12, padding: '12px 16px',
                boxShadow: `0 4px 20px var(--black-alpha-30)`,
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: 28, height: 28, borderRadius: 8,
                  backgroundColor: 'var(--primary-alpha-15)',
                  border: '1px solid var(--primary-alpha-30)',
                }}
              >
                <GraduationCap style={{ width: 15, height: 15, color: 'var(--primary)' }} />
              </div>
              <div className="flex-1">
                <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', marginBottom: 4 }}>TUTOR</div>
                <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--foreground)', lineHeight: 1.45 }}>{tutorPauseText}</div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowTutorPause(false)}
                className="shrink-0 cursor-pointer"
                style={{ background: 'none', border: 'none', padding: 2 }}
              >
                <XIcon style={{ width: 14, height: 14, color: 'var(--muted-foreground)' }} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══ Top Bar - Portrait: removed (overlay handles title/live badge) ══ */}

      
      {/* Video Player Area */}
      {isLandscape ? (
        /* Landscape - YouTube-style layout with resizing video + panels */
        <div
          onClick={toggleControls}
          className="absolute top-0 left-0 bottom-0 flex items-center justify-center overflow-hidden cursor-pointer"
          style={{
            right: (showChatPanel || showParticipantsPanel || showDoubtResolution || questionState !== 'none') && isDesktopLandscape ? '30%' : 0,
            backgroundColor: 'var(--video-background)',
            zIndex: 1,
            transition: 'right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                backgroundColor: 'var(--video-background)',
              }}
              controls={false}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
            >
            </video>
            
            {/* Teacher Video PIP (Picture-in-Picture) - Top Right */}
            {isDesktopLandscape && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 160, height: 148,
                  background: '#0d1117',
                  borderRadius: 8, overflow: 'hidden',
                  boxShadow: `0 8px 24px var(--black-alpha-50), 0 0 0 1px var(--white-alpha-16)`,
                  zIndex: 50, pointerEvents: 'none',
                }}
              >
                <img
                  src="/tutor-avatar.png"
                  alt="Tutor"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                />
                {/* Name label */}
                <div
                  className="flex items-center gap-1"
                  style={{
                    position: 'absolute', bottom: 8, left: 8,
                    backgroundColor: 'color-mix(in srgb, var(--black) 70%, transparent)',
                    backdropFilter: 'blur(8px)',
                    padding: '4px 8px', borderRadius: 8,
                  }}
                >
                  <motion.div
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--primary)', boxShadow: '0 0 6px var(--primary)', flexShrink: 0 }}
                  />
                  <span style={{
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--white)',
                  }}>
                    {LIVE_CLASS_DATA.tutor.name}
                  </span>
                </div>
              </motion.div>
            )}
          
          {/* Top Overlay - Title and Info (Google Meet style) */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="absolute top-0 left-0 right-0 flex items-center justify-between"
                style={{
                  padding: '16px 20px',
                  background: `linear-gradient(180deg, color-mix(in srgb, var(--black) 80%, transparent) 0%, var(--black-alpha-40) 70%, transparent 100%)`,
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {/* Left: Topic Title */}
                <div
                  className="flex items-center gap-3"
                  style={{
                    backgroundColor: 'var(--overlay-heavy)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    backdropFilter: 'blur(12px)',
                    pointerEvents: 'auto',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--white)',
                  }}>
                    {LIVE_CLASS_DATA.topic}
                  </span>
                </div>
                
                {/* Right: Live Indicator + Participant Count */}
                <div
                  className="flex items-center gap-4"
                  style={{
                    backgroundColor: 'var(--overlay-heavy)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    backdropFilter: 'blur(12px)',
                    pointerEvents: 'auto',
                  }}
                >
                  {/* Live Dot */}
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1], scale: [1, 0.9, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="shrink-0"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'var(--error)',
                    }}
                  />
                  
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* In-Video Question Overlay — Landscape */}
          <AnimatePresence>
            {questionState !== 'none' && currentInteraction && (
              <motion.div
                key="interaction-overlay-ls"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 overflow-y-auto"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--black) 84%, transparent)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  zIndex: 20,
                  padding: '16px 20px',
                }}
              >
                <motion.div
                  initial={{ scale: 0.92, y: 12, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className="w-full flex flex-col gap-2"
                >
                  <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--white)', lineHeight: 1.45 }}>
                    {currentInteraction.question}
                  </div>
                  {(currentInteractionType === 'mcq' || currentInteractionType === 'poll') && questionState === 'asking' && (currentInteraction as any).options && (
                    <div className="flex flex-col gap-2">
                      {(currentInteraction as any).options.map((option: string, idx: number) => {
                        const letters = ['A', 'B', 'C', 'D'];
                        const letterColors = ['var(--primary)', 'var(--warning)', 'var(--success)', 'var(--error)'];
                        return (
                          <motion.button key={idx} whileTap={{ scale: 0.97 }} onClick={() => handleAnswerSubmit(idx)} className="flex items-center gap-2 cursor-pointer text-left" style={{ padding: '8px 12px', backgroundColor: 'var(--white-alpha-8)', border: '1px solid var(--white-alpha-12)', borderRadius: 8, fontFamily: 'var(--font-family-inter)' }}>
                            <div className="flex items-center justify-center shrink-0" style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: `color-mix(in srgb, ${letterColors[idx]} 13%, transparent)`, border: `1.5px solid color-mix(in srgb, ${letterColors[idx]} 33%, transparent)` }}>
                              <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-bold)', color: letterColors[idx] }}>{letters[idx]}</span>
                            </div>
                            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-medium)', color: 'var(--white)', lineHeight: 1.3 }}>{option}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                  {currentInteractionType === 'quick-question' && questionState === 'asking' && !showQuickQuestionEvaluation && (
                    <div className="flex flex-col gap-2">
                      <textarea value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} placeholder={(currentInteraction as any).placeholder || "Type your answer..."} rows={3} style={{ width: '100%', padding: '8px 12px', backgroundColor: 'var(--white-alpha-8)', border: '1px solid var(--white-alpha-20)', borderRadius: 8, fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', lineHeight: 1.5, color: 'var(--white)', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                      <motion.button whileTap={textAnswer.trim() ? { scale: 0.97 } : {}} onClick={() => handleAnswerSubmit()} style={{ padding: 12, backgroundColor: textAnswer.trim() ? 'var(--primary)' : 'var(--white-alpha-8)', border: 'none', borderRadius: 8, cursor: textAnswer.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)', opacity: textAnswer.trim() ? 1 : 0.4 }}>Submit</motion.button>
                    </div>
                  )}
                  {questionState === 'answered-correct' && (
                    <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: [0.85, 1.05, 1], opacity: 1 }} transition={{ duration: 0.4 }} className="flex items-center gap-2" style={{ padding: '12px 16px', backgroundColor: currentInteractionType === 'poll' ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'color-mix(in srgb, var(--success) 20%, transparent)', border: `1.5px solid ${currentInteractionType === 'poll' ? 'color-mix(in srgb, var(--primary) 50%, transparent)' : 'color-mix(in srgb, var(--success) 50%, transparent)'}`, borderRadius: 12 }}>
                      <Check style={{ width: 20, height: 20, color: currentInteractionType === 'poll' ? 'var(--primary)' : 'var(--success)', strokeWidth: 3, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)' }}>{currentInteractionType === 'poll' ? 'Vote recorded!' : 'Correct!'}</span>
                    </motion.div>
                  )}
                  {questionState === 'answered-wrong' && (
                    <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2" style={{ padding: '12px 16px', backgroundColor: 'color-mix(in srgb, var(--error) 18%, transparent)', border: '1.5px solid color-mix(in srgb, var(--error) 45%, transparent)', borderRadius: 12 }}>
                      <XIcon style={{ width: 20, height: 20, color: 'var(--error)', strokeWidth: 3, flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)' }}>Not quite</span>
                    </motion.div>
                  )}
                  {questionState === 'showing-explanation' && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
                      <div style={{ padding: '12px 16px', backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', borderRadius: 8 }}>
                        <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--white-alpha-85)', margin: 0, lineHeight: 1.55 }}>
                          {currentInteractionType === 'quick-question' ? "Newton's Third Law: for every action, there's an equal and opposite reaction." : (currentInteraction as any).explanation}
                        </p>
                      </div>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={currentInteractionType === 'mcq' ? handleContinueAfterExplanation : handleContinueAfterQuickQuestionExplanation} className="cursor-pointer" style={{ padding: 12, backgroundColor: 'var(--primary)', border: 'none', borderRadius: 8, fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)', boxShadow: '0 2px 16px color-mix(in srgb, var(--primary) 40%, transparent)' }}>Continue</motion.button>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* Mobile/Portrait - flex:1 column: header top + video centered + fills remaining */
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{ backgroundColor: 'var(--background)', position: 'relative' }}
        >
          {/* Thin header: title + LIVE badge */}
          <div
            className="shrink-0 flex items-center justify-between"
            style={{
              height: 48,
              padding: '0 16px',
              backgroundColor: 'var(--background)',
            }}
          >
            <span style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-sm)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flex: 1, marginRight: 12,
            }}>
              {LIVE_CLASS_DATA.topic}
            </span>
            <div
              className="flex items-center gap-1 shrink-0"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--foreground) 8%, transparent)',
                padding: '4px 8px', borderRadius: 999,
              }}
            >
              <motion.div
                animate={{ opacity: [1, 0.4, 1], scale: [1, 0.9, 1] }}
                transition={{ duration: joinPhase === 'early' ? 3 : 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: joinPhase === 'early' ? 'var(--warning)' : 'var(--error)' }}
              />
              <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)',
                color: joinPhase === 'early' ? 'var(--warning)' : 'var(--error)', letterSpacing: '0.04em' }}>
                {joinPhase === 'early' ? 'SOON' : 'LIVE'}
              </span>
            </div>
          </div>

          {/* Tutor PIP — page-level, top-right below LIVE tag */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.3, type: 'spring', stiffness: 300, damping: 24 }}
            style={{
              position: 'absolute', top: 56, right: 16,
              width: 120, height: 96,
              background: '#0d1117',
              borderRadius: 8, overflow: 'hidden',
              boxShadow: `0 8px 20px color-mix(in srgb, var(--foreground) 18%, transparent), 0 0 0 1px color-mix(in srgb, var(--foreground) 12%, transparent)`,
              zIndex: 10, pointerEvents: 'none',
            }}
          >
            <img
              src="/tutor-avatar.png"
              alt="Tutor"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
            />
            {/* Speaking indicator */}
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', bottom: 6, left: 6,
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: 'var(--primary)',
                boxShadow: '0 0 6px var(--primary)',
              }}
            />
          </motion.div>

          {/* Centered video area */}
          <div className="flex-1 flex items-center justify-center">
            <div style={{
              width: '100%',
              aspectRatio: '16 / 9',
              position: 'relative',
              backgroundColor: 'var(--video-background)',
            }}>
              {/* Hidden video keeps the stream for timeupdate → timed interactions */}
              <video ref={videoRef} style={{ display: 'none' }} muted playsInline />
              {/* Canvas drawn directly — avoids captureStream rendering issues on Safari */}
              <canvas
                ref={portraitDisplayCanvasRef}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
              />

              {/* Fullscreen button - bottom right of video */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleFullscreen}
                aria-label="Toggle fullscreen"
                className="flex items-center justify-center cursor-pointer"
                style={{
                  position: 'absolute', bottom: 8, right: 8,
                  width: 32, height: 32,
                  backgroundColor: 'var(--overlay-heavy)', backdropFilter: 'blur(8px)',
                  border: 'none', borderRadius: 8,
                  zIndex: 6,
                }}
              >
                <Maximize style={{ width: 16, height: 16, color: 'var(--white)', strokeWidth: 2 }} />
              </motion.button>

              {/* In-Video Question Overlay — Portrait */}
              <AnimatePresence>
                {questionState !== 'none' && currentInteraction && (
                  <motion.div
                    key="interaction-overlay-pt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 overflow-y-auto"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--black) 86%, transparent)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      zIndex: 20,
                      padding: '12px',
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0.94, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.96, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="w-full flex flex-col gap-2"
                    >
                      {/* Question */}
                      <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--white)', lineHeight: 1.35 }}>
                        {currentInteraction.question}
                      </div>

                      {/* MCQ/Poll — 2×2 grid */}
                      {(currentInteractionType === 'mcq' || currentInteractionType === 'poll') && questionState === 'asking' && (currentInteraction as any).options && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                          {(currentInteraction as any).options.map((option: string, idx: number) => {
                            const letters = ['A', 'B', 'C', 'D'];
                            const letterColors = ['var(--primary)', 'var(--warning)', 'var(--success)', 'var(--error)'];
                            return (
                              <motion.button key={idx} whileTap={{ scale: 0.96 }} onClick={() => handleAnswerSubmit(idx)} className="flex items-center gap-1 cursor-pointer text-left"
                                style={{ padding: '8px', backgroundColor: 'var(--white-alpha-8)', border: '1px solid var(--white-alpha-12)', borderRadius: 8, fontFamily: 'var(--font-family-inter)' }}>
                                <div className="flex items-center justify-center shrink-0" style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: `color-mix(in srgb, ${letterColors[idx]} 13%, transparent)`, border: `1.5px solid color-mix(in srgb, ${letterColors[idx]} 33%, transparent)` }}>
                                  <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-bold)', color: letterColors[idx] }}>{letters[idx]}</span>
                                </div>
                                <span style={{ fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--white)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{option}</span>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}

                      {/* Quick Question */}
                      {currentInteractionType === 'quick-question' && questionState === 'asking' && !showQuickQuestionEvaluation && (
                        <div className="flex flex-col gap-1">
                          <textarea value={textAnswer} onChange={(e) => setTextAnswer(e.target.value)} placeholder={(currentInteraction as any).placeholder || "Type your answer..."} rows={2} style={{ width: '100%', padding: '8px', backgroundColor: 'var(--white-alpha-8)', border: '1px solid var(--white-alpha-20)', borderRadius: 8, fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', lineHeight: 1.4, color: 'var(--white)', resize: 'none', outline: 'none', boxSizing: 'border-box' }} />
                          <motion.button whileTap={textAnswer.trim() ? { scale: 0.97 } : {}} onClick={() => handleAnswerSubmit()} style={{ padding: '8px', backgroundColor: textAnswer.trim() ? 'var(--primary)' : 'var(--white-alpha-8)', border: 'none', borderRadius: 8, cursor: textAnswer.trim() ? 'pointer' : 'default', fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)', opacity: textAnswer.trim() ? 1 : 0.4 }}>Submit</motion.button>
                        </div>
                      )}

                      {/* Correct */}
                      {questionState === 'answered-correct' && (
                        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: [0.85, 1.05, 1], opacity: 1 }} transition={{ duration: 0.35 }} className="flex items-center gap-2" style={{ padding: '8px 12px', backgroundColor: currentInteractionType === 'poll' ? 'color-mix(in srgb, var(--primary) 20%, transparent)' : 'color-mix(in srgb, var(--success) 20%, transparent)', border: `1.5px solid ${currentInteractionType === 'poll' ? 'color-mix(in srgb, var(--primary) 50%, transparent)' : 'color-mix(in srgb, var(--success) 50%, transparent)'}`, borderRadius: 8 }}>
                          <Check style={{ width: 16, height: 16, color: currentInteractionType === 'poll' ? 'var(--primary)' : 'var(--success)', strokeWidth: 3, flexShrink: 0 }} />
                          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)' }}>{currentInteractionType === 'poll' ? 'Vote recorded!' : 'Correct!'}</span>
                        </motion.div>
                      )}

                      {/* Wrong */}
                      {questionState === 'answered-wrong' && (
                        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-2" style={{ padding: '8px 12px', backgroundColor: 'color-mix(in srgb, var(--error) 18%, transparent)', border: '1.5px solid color-mix(in srgb, var(--error) 45%, transparent)', borderRadius: 8 }}>
                          <XIcon style={{ width: 16, height: 16, color: 'var(--error)', strokeWidth: 3, flexShrink: 0 }} />
                          <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)' }}>Not quite</span>
                        </motion.div>
                      )}

                      {/* Explanation */}
                      {questionState === 'showing-explanation' && (
                        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-1">
                          <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', color: 'var(--white-alpha-80)', margin: 0, lineHeight: 1.5, padding: '8px', backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)', borderRadius: 8 }}>
                            {currentInteractionType === 'quick-question' ? "Newton's Third Law: for every action, there's an equal and opposite reaction." : (currentInteraction as any).explanation}
                          </p>
                          <motion.button whileTap={{ scale: 0.97 }} onClick={currentInteractionType === 'mcq' ? handleContinueAfterExplanation : handleContinueAfterQuickQuestionExplanation} className="cursor-pointer" style={{ padding: '8px', backgroundColor: 'var(--primary)', border: 'none', borderRadius: 8, fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-bold)', color: 'var(--white)' }}>Continue</motion.button>
                        </motion.div>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      
      {/* Bottom Control Bar */}
      {!isFullscreen && (
        isLandscape ? (
          /* Landscape - Google Meet-style Bottom Bar (auto-hide, hidden when chat is open) */
          <AnimatePresence>
            {showControls && !showChatPanel && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                onMouseEnter={resetControlsTimer}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-2"
                style={{
                  position: 'absolute',
                  bottom: 24,
                  left: (showChatPanel || showParticipantsPanel || showDoubtResolution || questionState !== 'none') && isDesktopLandscape ? '35%' : '50%',
                  x: '-50%',
                  backgroundColor: 'var(--card)',
                  backdropFilter: 'blur(24px)',
                  borderRadius: 16,
                  padding: '12px 20px',
                  boxShadow: `0 8px 24px color-mix(in srgb, var(--foreground) 18%, transparent)`,
                  border: '1px solid var(--border)',
                  zIndex: tourActive && (tourStep === 2 || tourStep === 3) ? 155 : 10,
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Hand Raise */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={toggleHandRaise}
                  aria-label="Raise hand"
                  aria-pressed={handRaised}
                  animate={handRaised ? { scale: [1, 1.05, 1] } : {}}
                  transition={handRaised ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: handRaised ? 'var(--warning)' : 'color-mix(in srgb, var(--foreground) 10%, transparent)',
                    border: 'none',
                    borderRadius: 12,
                    transition: 'all 0.2s ease',
                    ...(tourActive && tourStep === 3 ? {
                      boxShadow: '0 0 0 3px var(--warning), 0 0 20px var(--warning-alpha-30)',
                    } : {}),
                  }}
                >
                  <Hand style={{ width: 20, height: 20, color: handRaised ? 'var(--warning-950)' : 'var(--foreground)', strokeWidth: 2 }} />
                </motion.button>

                {/* Chat */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => {
                    if (tourActive && tourStep === 2 && !tourTyping) {
                      advanceTour();
                      return;
                    }
                    setShowChatPanel(!showChatPanel);
                    if (!showChatPanel) setShowParticipantsPanel(false);
                  }}
                  aria-label="Toggle chat"
                  aria-pressed={showChatPanel}
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: showChatPanel ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 10%, transparent)',
                    border: 'none',
                    borderRadius: 12,
                    transition: 'all 0.2s ease',
                    ...(tourActive && tourStep === 2 ? {
                      boxShadow: '0 0 0 3px var(--primary), 0 0 20px var(--primary-alpha-40)',
                    } : {}),
                  }}
                >
                  <MessageCircle style={{ width: 20, height: 20, color: showChatPanel ? 'var(--white)' : 'var(--foreground)', strokeWidth: 2 }} />
                </motion.button>

                {/* Leave Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setShowLeaveConfirm(true)}
                  aria-label="Leave class"
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: 'color-mix(in srgb, var(--error) 20%, transparent)',
                    border: 'none',
                    borderRadius: 12,
                    transition: 'all 0.2s ease',
                    ...(tourActive && (tourStep === 2 || tourStep === 3) ? { pointerEvents: 'none' as const, opacity: 0.3 } : {}),
                  }}
                >
                  <LogOut style={{ width: 20, height: 20, color: 'var(--error)', strokeWidth: 2 }} />
                </motion.button>

              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          /* Mobile/Portrait - Same compact pill controls as landscape */
          <div
            className="shrink-0 flex items-center justify-center"
            style={{
              backgroundColor: 'var(--background)',
              padding: '12px 16px 20px',
              // Elevate above tour overlay when highlighting these buttons
              ...(tourActive && (tourStep === 2 || tourStep === 3) ? { position: 'relative' as const, zIndex: 155 } : {}),
            }}
          >
            <div
              className="flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--card)',
                backdropFilter: 'blur(24px)',
                borderRadius: 16,
                padding: '12px 20px',
                boxShadow: `0 8px 24px color-mix(in srgb, var(--foreground) 18%, transparent)`,
                border: '1px solid var(--border)',
              }}
            >
              {/* Hand Raise */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  toggleHandRaise();
                }}
                aria-label="Raise hand"
                aria-pressed={handRaised}
                animate={
                  handShaking ? { x: [0, -5, 5, -5, 5, 0] } :
                  handRaised ? { scale: [1, 1.05, 1] } : {}
                }
                transition={
                  handShaking ? { duration: 0.35, ease: 'easeInOut' } :
                  handRaised ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } :
                  { duration: 0.2 }
                }
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: handRaised ? 'var(--warning)' : 'color-mix(in srgb, var(--foreground) 10%, transparent)',
                  border: 'none',
                  borderRadius: 12,
                  transition: 'all 0.2s ease',
                  ...(tourActive && tourStep === 3 ? {
                    boxShadow: '0 0 0 3px var(--warning), 0 0 20px var(--warning-alpha-30)',
                  } : {}),
                }}
              >
                <Hand style={{ width: 20, height: 20, color: handRaised ? 'var(--warning-950)' : 'var(--foreground)', strokeWidth: 2 }} />
              </motion.button>

              {/* Chat */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => {
                  if (tourActive && tourStep === 2 && !tourTyping) {
                    advanceTour();
                    return;
                  }
                  setShowChatPanel(!showChatPanel);
                  if (!showChatPanel) setShowParticipantsPanel(false);
                }}
                animate={chatShaking ? { x: [0, -5, 5, -5, 5, 0] } : {}}
                transition={chatShaking ? { duration: 0.35, ease: 'easeInOut' } : { duration: 0.2 }}
                aria-label="Toggle chat"
                aria-pressed={showChatPanel}
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: showChatPanel ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 10%, transparent)',
                  border: 'none',
                  borderRadius: 12,
                  transition: 'all 0.2s ease',
                  ...(tourActive && tourStep === 2 ? {
                    boxShadow: '0 0 0 3px var(--primary), 0 0 20px var(--primary-alpha-40)',
                  } : {}),
                }}
              >
                <MessageCircle style={{ width: 20, height: 20, color: showChatPanel ? 'var(--white)' : 'var(--foreground)', strokeWidth: 2 }} />
              </motion.button>

              {/* Leave */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setShowLeaveConfirm(true)}
                aria-label="Leave class"
                className="flex items-center justify-center cursor-pointer"
                style={{
                  width: 48,
                  height: 48,
                  backgroundColor: 'color-mix(in srgb, var(--error) 14%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--error) 32%, transparent)',
                  borderRadius: 12,
                  transition: 'all 0.2s ease',
                  ...(tourActive && (tourStep === 2 || tourStep === 3) ? { pointerEvents: 'none' as const, opacity: 0.3 } : {}),
                }}
              >
                <LogOut style={{ width: 20, height: 20, color: 'var(--error)', strokeWidth: 2 }} />
              </motion.button>

            </div>
          </div>
        )
      )}

      {/* Participants Panel */}
      <AnimatePresence>
        {showParticipantsPanel && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="absolute top-0 right-0 bottom-0 flex flex-col"
            style={{
              width: isDesktopLandscape ? '30%' : '85%',
              minWidth: isDesktopLandscape ? 360 : undefined,
              maxWidth: isDesktopLandscape ? 450 : 360,
              backgroundColor: 'var(--card)',
              borderLeft: '1px solid var(--border)',
              zIndex: isDesktopLandscape ? 100 : 50,
              boxShadow: isDesktopLandscape ? `-8px 0 32px var(--black-alpha-30)` : 'var(--elevation-xl)',
            }}
          >
            {/* Participants Header */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <h3 style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: 0,
              }}>
                Participants
              </h3>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowParticipantsPanel(false);
                  // Resume video
                  setIsPlaying(true);
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }}
                aria-label="Close participants"
                className="flex items-center cursor-pointer"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 4,
                }}
              >
                <XIcon style={{ width: 20, height: 20, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
              </motion.button>
            </div>
            
            {/* Participants List */}
            <div className="flex-1 overflow-y-auto">
              {PARTICIPANTS.map(participant => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3"
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'var(--secondary-bg)',
                    }}
                  >
                    {participant.avatar === 'tutor' ? (
                      <GraduationCap style={{ width: 16, height: 16, color: 'var(--primary)' }} />
                    ) : (
                      <User style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <div style={{
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 'var(--text-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--foreground)',
                    }}>
                      {participant.name}
                      {participant.role === 'Tutor' && (
                        <span style={{
                          marginLeft: 6,
                          fontSize: 'var(--text-2xs)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--primary)',
                          backgroundColor: 'var(--primary-alpha-15)',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}>
                          HOST
                        </span>
                      )}
                    </div>
                  </div>
                  {participant.name === "You" && handRaised && (
                    <Hand style={{ width: 16, height: 16, color: 'var(--warning)', strokeWidth: 2 }} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Leave Class Confirmation Modal */}
      <AnimatePresence>
        {showLeaveConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{
                backgroundColor: 'var(--overlay-strong)',
                zIndex: 100,
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => {
                setShowLeaveConfirm(false);
                // Resume video
                setIsPlaying(true);
                if (videoRef.current) {
                  videoRef.current.play();
                }
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute inset-0"
              style={{
                margin: 'auto',
                width: 'calc(100% - 32px)',
                maxWidth: 400,
                height: 'fit-content',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 24,
                zIndex: 101,
                boxShadow: 'var(--elevation-xl)',
              }}
            >
              <div
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'var(--warning-alpha-15)',
                  marginBottom: 16,
                }}
              >
                <AlertCircle style={{ width: 24, height: 24, color: 'var(--warning)', strokeWidth: 2 }} />
              </div>
              
              <h2 style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--foreground)',
                margin: '0 0 8px 0',
              }}>
                Leave Live Class?
              </h2>
              <p style={{
                fontFamily: 'var(--font-family-inter)',
                fontSize: 'var(--text-sm)',
                color: 'var(--muted-foreground)',
                margin: '0 0 24px 0',
              }}>
                You'll lose your current progress. We'll ask for a quick 15-second feedback on your way out.
              </p>
              
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowLeaveConfirm(false);
                    // Resume video
                    setIsPlaying(true);
                    if (videoRef.current) {
                      videoRef.current.play();
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    backgroundColor: 'var(--primary)',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--primary-foreground)',
                    boxShadow: 'var(--glow-primary)',
                  }}
                >
                  Stay
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLeaveClass}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    backgroundColor: 'var(--muted-alpha-8)',
                    border: '1px solid var(--error)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--font-weight-semibold)',
                    color: 'var(--error)',
                  }}
                >
                  Leave Class
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Hand Raise Notification */}
      <AnimatePresence>
        {showHandRaiseNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex items-center gap-2"
            style={{
              position: 'absolute',
              bottom: 92,
              left: 16,
              right: 16,
              margin: '0 auto',
              width: 'auto',
              maxWidth: 300,
              backgroundColor: 'var(--card)',
              border: '2px solid var(--warning)',
              borderRadius: 12,
              padding: '12px',
              zIndex: 102,
              boxShadow: 'var(--elevation-xl)',
            }}
          >
            <Hand style={{ width: 18, height: 18, color: 'var(--warning)', strokeWidth: 2.5 }} />
            <span style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--foreground)',
            }}>
              Hand raised - tutor will see it
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Chat Panel backdrop (portrait only) */}
      <AnimatePresence>
        {showChatPanel && !isDesktopLandscape && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowChatPanel(false); setHandRaised(false); setMicUnlocked(false); setMicActive(false); }}
            className="fixed inset-0"
            style={{ backgroundColor: 'var(--overlay-dark)', zIndex: 199 }}
          />
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {showChatPanel && (
              <motion.div
                initial={isDesktopLandscape ? { x: '100%' } : { y: '100%' }}
                animate={isDesktopLandscape ? { x: 0 } : { y: 0 }}
                exit={isDesktopLandscape ? { x: '100%' } : { y: '100%' }}
                transition={{ type: 'tween', duration: 0.3 }}
                className="flex flex-col"
                style={isDesktopLandscape ? {
                  /* Desktop Landscape - Right Sidebar */
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: '30%',
                  minWidth: 360,
                  maxWidth: 450,
                  backgroundColor: 'var(--card)',
                  borderLeft: '1px solid var(--border)',
                  zIndex: 100,
                  boxShadow: `-8px 0 32px var(--black-alpha-30)`,
                } : {
                  /* Portrait - Bottom Sheet */
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: chatInputFocused ? 'calc(100% - 48px)' : '72%',
                  backgroundColor: 'var(--card)',
                  borderRadius: '20px 20px 0 0',
                  borderTop: '1px solid var(--border)',
                  zIndex: 200,
                  boxShadow: `0 -8px 40px var(--black-alpha-50)`,
                  transition: 'height 0.25s ease',
                }}
              >
              
              {/* Top bar — title + close */}
              <div
                className="shrink-0 flex items-center justify-between"
                style={{
                  padding: isDesktopLandscape ? '12px 16px' : '14px 16px',
                  borderBottom: '0.5px solid var(--border)',
                }}
              >
                <span style={{
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--foreground)',
                }}>
                  Class Chat
                </span>
                {/* Close button */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => {
                    setShowChatPanel(false);
                    setHandRaised(false);
                    setMicUnlocked(false);
                    setMicActive(false);
                    setIsPlaying(true);
                    if (videoRef.current) videoRef.current.play();
                  }}
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 4,
                  }}
                >
                  <XIcon style={{ width: 20, height: 20, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
                </motion.button>
              </div>
              
              {/* Chat Messages - Scrollable */}
              <div
                ref={chatMessagesRef}
                className="flex-1 overflow-y-auto flex flex-col gap-3"
                style={{
                  padding: '16px',
                }}
              >
                {chatMessages.map((msg) => {
                  const isMe = msg.user === 'You';
                  const isTutor = msg.isTutor;
                  return (
                    <div
                      key={msg.id}
                      className="flex flex-col gap-1"
                      style={{
                        alignItems: isMe ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {/* Sender label (tutor only — never show "You") */}
                      {isTutor && (
                        <div className="flex items-center gap-1" style={{ paddingLeft: 4 }}>
                          <GraduationCap style={{ width: 11, height: 11, color: 'var(--primary)' }} />
                          <span style={{
                            fontFamily: 'var(--font-family-inter)',
                            fontSize: 'var(--text-2xs)',
                            fontWeight: 'var(--font-weight-semibold)',
                            color: 'var(--primary)',
                          }}>Tutor</span>
                        </div>
                      )}

                      {/* Message bubble */}
                      <div style={{
                        maxWidth: '78%',
                        padding: '8px 12px',
                        backgroundColor: isMe
                          ? 'var(--primary)'
                          : isTutor
                          ? 'var(--primary-alpha-15)'
                          : 'var(--secondary)',
                        border: isMe
                          ? 'none'
                          : `1px solid ${isTutor ? 'var(--primary-alpha-30)' : 'var(--border)'}`,
                        borderRadius: isMe
                          ? '14px 14px 4px 14px'
                          : '14px 14px 14px 4px',
                      }}>
                        <p style={{
                          fontFamily: 'var(--font-family-inter)',
                          fontSize: 'var(--text-sm)',
                          color: isMe ? 'var(--primary-foreground)' : 'var(--foreground)',
                          margin: 0,
                          lineHeight: 1.45,
                        }}>
                          {msg.message}
                        </p>
                      </div>

                      {/* Timestamp */}
                      <span style={{
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-2xs)',
                        color: 'var(--muted-foreground)',
                        opacity: 0.6,
                        paddingLeft: isMe ? 0 : 4,
                        paddingRight: isMe ? 4 : 0,
                      }}>
                        {msg.time}
                      </span>
                    </div>
                  );
                })}
              </div>
              

              {/* Mic disabled toast */}
              <AnimatePresence>
                {showMicToast && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    className="shrink-0 flex items-center gap-2"
                    style={{
                      margin: '0 12px 6px',
                      backgroundColor: 'var(--secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '8px 12px',
                    }}
                  >
                    <Hand style={{ width: 14, height: 14, color: 'var(--warning)', strokeWidth: 2.5, flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', color: 'var(--muted-foreground)' }}>
                      Raise your hand first to use the mic
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Chat Input - Fixed at bottom */}
              <div
                className="shrink-0 flex items-stretch gap-1"
                style={{
                  padding: '8px 12px 4px',
                  borderTop: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                }}
              >
                {/* Left button: Hand raise OR Mic toggle */}
                {micEnabled ? (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setMicActive(prev => !prev)}
                    className="flex items-center justify-center shrink-0 cursor-pointer"
                    style={{
                      width: 40,
                      height: 40,
                      backgroundColor: micActive ? 'var(--error)' : 'var(--secondary)',
                      border: `1px solid ${micActive ? 'color-mix(in srgb, var(--error) 60%, transparent)' : 'var(--border)'}`,
                      borderRadius: 8,
                      boxShadow: micActive ? `0 0 14px color-mix(in srgb, var(--error) 40%, transparent)` : 'none',
                      transition: 'background-color 0.2s, border-color 0.2s, box-shadow 0.2s',
                    }}
                  >
                    {micActive
                      ? <Mic style={{ width: 16, height: 16, color: 'var(--white)', strokeWidth: 2 }} />
                      : <MicOff style={{ width: 16, height: 16, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
                    }
                  </motion.button>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    animate={handRaised ? { scale: [1, 1.1, 1] } : {}}
                    transition={handRaised ? { duration: 1.4, repeat: Infinity } : {}}
                    onClick={toggleHandRaise}
                    className="flex items-center justify-center shrink-0 cursor-pointer"
                    style={{
                      width: 40,
                      backgroundColor: handRaised ? 'var(--warning-alpha-15)' : 'var(--secondary)',
                      border: `1px solid ${handRaised ? 'var(--warning)' : 'var(--border)'}`,
                      borderRadius: 8,
                      transition: 'background-color 0.2s, border-color 0.2s',
                    }}
                  >
                    <Hand style={{
                      width: 16, height: 16, strokeWidth: 2,
                      color: handRaised ? 'var(--warning)' : 'var(--muted-foreground)',
                    }} />
                  </motion.button>
                )}

                {/* Text input with attachment icon inside */}
                <div className="flex-1 relative" style={{ height: 40 }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onBlur={() => setChatInputFocused(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChat();
                      }
                    }}
                    readOnly={micActive}
                    placeholder={micActive ? 'Listening... (tap to type instead)' : 'Type a message...'}
                    onFocus={() => {
                      if (micActive) {
                        setMicActive(false);
                        setChatInput('');
                      }
                      setChatInputFocused(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '0 36px 0 12px',
                      height: 40,
                      backgroundColor: micActive ? 'color-mix(in srgb, var(--error) 6%, transparent)' : 'var(--muted-alpha-8)',
                      border: `1px solid ${micActive ? 'color-mix(in srgb, var(--error) 25%, transparent)' : 'var(--border)'}`,
                      borderRadius: 8,
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--foreground)',
                      outline: 'none',
                      cursor: micActive ? 'default' : 'text',
                      transition: 'background-color 0.3s ease, border-color 0.3s ease',
                      boxSizing: 'border-box',
                    }}
                  />
                  {/* Paperclip — inside input, right side */}
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setShowAttachSheet(true)}
                    className="flex items-center justify-center cursor-pointer"
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      width: 24,
                      height: 24,
                    }}
                  >
                    <Paperclip style={{ width: 15, height: 15, color: 'var(--muted-foreground)', strokeWidth: 2 }} />
                  </motion.button>
                </div>

                {/* Send button — always visible, active when mic on or text present */}
                {(() => {
                  const canSend = micActive || !!chatInput.trim();
                  return (
                    <motion.button
                      whileTap={canSend ? { scale: 0.92 } : {}}
                      onClick={canSend ? handleSendChat : undefined}
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: canSend ? 'var(--primary)' : 'transparent',
                        border: canSend ? '1px solid transparent' : '1px solid var(--border)',
                        borderRadius: 8,
                        cursor: canSend ? 'pointer' : 'default',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <Send style={{ width: 16, height: 16, color: canSend ? 'var(--primary-foreground)' : 'var(--muted-foreground)', strokeWidth: 2.5, opacity: canSend ? 1 : 0.3 }} />
                    </motion.button>
                  );
                })()}
              </div>

              {/* Mic info hint — shown when hand not raised */}
              {!micEnabled && (
                <div style={{ padding: '0 14px 6px', flexShrink: 0 }}>
                  <span style={{
                    fontFamily: 'var(--font-family-inter)',
                    fontSize: 'var(--text-2xs)',
                    color: 'var(--muted-foreground)',
                    opacity: 0.55,
                  }}>
                    Raise your hand to ask with mic
                  </span>
                </div>
              )}

              {/* Attachment sheet */}
              <AnimatePresence>
                {showAttachSheet && (
                  <>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowAttachSheet(false)}
                      style={{ position: 'fixed', inset: 0, backgroundColor: 'var(--overlay-dark)', zIndex: 300 }}
                    />
                    <motion.div
                      initial={{ y: '100%' }}
                      animate={{ y: 0 }}
                      exit={{ y: '100%' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 38 }}
                      style={{
                        position: 'fixed', bottom: 0, left: 0, right: 0,
                        backgroundColor: 'var(--card)',
                        borderRadius: '18px 18px 0 0',
                        padding: '16px 20px 36px',
                        zIndex: 301,
                      }}
                    >
                      <div style={{ width: 32, height: 4, borderRadius: 2, backgroundColor: 'var(--border)', margin: '0 auto 20px' }} />
                      <p style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--muted-foreground)', margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attach</p>
                      <div className="flex gap-3">
                        {[
                          { icon: <Camera style={{ width: 22, height: 22, strokeWidth: 1.8 }} />, label: 'Camera' },
                          { icon: <ImageIcon style={{ width: 22, height: 22, strokeWidth: 1.8 }} />, label: 'Gallery' },
                          { icon: <File style={{ width: 22, height: 22, strokeWidth: 1.8 }} />, label: 'Document' },
                        ].map(({ icon, label }) => (
                          <motion.button
                            key={label}
                            whileTap={{ scale: 0.93 }}
                            onClick={() => setShowAttachSheet(false)}
                            className="flex-1 flex flex-col items-center gap-2 cursor-pointer"
                            style={{
                              backgroundColor: 'var(--secondary)',
                              border: '1px solid var(--border)',
                              borderRadius: 12,
                              padding: '12px 8px',
                              color: 'var(--foreground)',
                            }}
                          >
                            {icon}
                            <span style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-medium)', color: 'var(--muted-foreground)' }}>{label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Simulated keyboard — portrait only, not shown in desktop landscape sidebar */}
              <AnimatePresence>
                {chatInputFocused && !micActive && !isDesktopLandscape && (
                  <motion.div
                    key="sim-kb"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 300, opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'tween', duration: 0.22 }}
                    className="shrink-0 overflow-hidden flex flex-col items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'var(--secondary)',
                      borderTop: '1px solid var(--white-alpha-8)',
                      padding: '8px',
                    }}
                  >
                    {[
                      ['Q','W','E','R','T','Y','U','I','O','P'],
                      ['A','S','D','F','G','H','J','K','L'],
                      ['Z','X','C','V','B','N','M'],
                    ].map((row, ri) => (
                      <div key={ri} className="flex justify-center gap-1">
                        {row.map(k => (
                          <div
                            key={k}
                            className="flex items-center justify-center"
                            style={{
                              width: isLandscape ? 36 : 30,
                              height: isLandscape ? 34 : 40,
                              backgroundColor: 'var(--card)',
                              borderRadius: 4,
                              fontFamily: 'var(--font-family-inter)',
                              fontSize: isLandscape ? 'var(--text-xs)' : 'var(--text-sm)',
                              fontWeight: 'var(--font-weight-medium)',
                              color: 'var(--white)',
                              boxShadow: `0 1px 0 var(--black-alpha-50)`,
                            }}
                          >{k}</div>
                        ))}
                      </div>
                    ))}
                    <div className="flex w-full gap-1" style={{ paddingLeft: 4, paddingRight: 4 }}>
                      <div className="flex items-center justify-center" style={{ width: 40, height: isLandscape ? 32 : 40, backgroundColor: 'var(--card)', borderRadius: 4, fontSize: 'var(--text-xs)', color: 'var(--white)', boxShadow: `0 1px 0 var(--black-alpha-50)` }}>123</div>
                      <div className="flex-1 flex items-center justify-center" style={{ height: isLandscape ? 32 : 40, backgroundColor: 'var(--card)', borderRadius: 4, fontSize: 'var(--text-xs)', color: 'var(--white)', boxShadow: `0 1px 0 var(--black-alpha-50)` }}>space</div>
                      <div className="flex items-center justify-center" style={{ width: 80, height: isLandscape ? 32 : 40, backgroundColor: 'var(--card)', borderRadius: 4, fontSize: 'var(--text-xs)', color: 'var(--white)', boxShadow: `0 1px 0 var(--black-alpha-50)` }}>return</div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
        )}
      </AnimatePresence>

      {/* Doubt Resolution Flow - Right Sidebar (Landscape) */}
      <AnimatePresence>
        {showDoubtResolution && (
          <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="absolute top-0 right-0 bottom-0 flex flex-col gap-4 overflow-y-auto"
              style={{
                width: '30%',
                minWidth: 360,
                maxWidth: 450,
                backgroundColor: 'var(--card)',
                borderLeft: '1px solid var(--border)',
                padding: '20px',
                zIndex: 100,
                boxShadow: '-8px 0 32px var(--black-alpha-30)',
              }}
            >
              
              {/* Header with Close Button */}
              <div
                className="flex items-center justify-between"
                style={{
                  paddingBottom: 12,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: 'var(--error-alpha-15)',
                    }}
                  >
                    <Mic style={{ width: 20, height: 20, color: 'var(--error)', strokeWidth: 2.5 }} />
                  </div>
                  <div>
                    <h3 style={{
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--foreground)',
                      margin: 0,
                    }}>
                      Ask Your Question
                    </h3>
                    <p style={{
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--muted-foreground)',
                      margin: 0,
                    }}>
                      Tutor is listening
                    </p>
                  </div>
                </div>
                
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowDoubtResolution(false);
                    setHandRaised(false);
                    setDoubtText('');
                    setDoubtImage(null);
                    setIsRecordingAudio(false);
                    setDoubtSubmitted(false);
                    setIsFollowUpQuestion(false);
                    setDoubtContext('');
                    setShowDoubtExplanation(false);
                    setIsDoubtAudioPlaying(false);
                    // Resume video
                    setIsPlaying(true);
                    if (videoRef.current) {
                      videoRef.current.play();
                    }
                  }}
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 36,
                    height: 36,
                    backgroundColor: 'var(--secondary-bg)',
                    border: 'none',
                    borderRadius: '50%',
                  }}
                >
                  <XIcon style={{ width: 20, height: 20, color: 'var(--foreground)', strokeWidth: 2 }} />
                </motion.button>
              </div>

              {!doubtSubmitted ? (
                <>
                  {/* Mic is Listening - Compact for Sidebar */}
                  <div
                    className="flex flex-col items-center gap-4"
                    style={{
                      padding: '32px 16px',
                      backgroundColor: 'var(--secondary-bg)',
                      borderRadius: 16,
                    }}
                  >
                    {/* Animated Mic Icon with Pulsing Rings */}
                    <div className="relative flex items-center justify-center">
                      {/* Outer pulsing ring */}
                      <motion.div
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.6, 0, 0.6],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        style={{
                          position: 'absolute',
                          width: 120,
                          height: 120,
                          borderRadius: '50%',
                          backgroundColor: 'var(--error-alpha-20)',
                          border: '3px solid var(--error-alpha-40)',
                        }}
                      />
                      
                      {/* Middle pulsing ring */}
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.7, 0, 0.7],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: 0.3,
                        }}
                        style={{
                          position: 'absolute',
                          width: 96,
                          height: 96,
                          borderRadius: '50%',
                          backgroundColor: 'var(--error-alpha-30)',
                          border: '2px solid var(--error-alpha-50)',
                        }}
                      />
                      
                      {/* Inner mic circle */}
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                        className="flex items-center justify-center"
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          backgroundColor: 'var(--error)',
                          boxShadow: '0 8px 32px var(--error-alpha-60)',
                          zIndex: 1,
                        }}
                      >
                        <Mic style={{
                          width: 32,
                          height: 32,
                          color: 'var(--white)',
                          strokeWidth: 2.5,
                        }} />
                      </motion.div>
                    </div>
                    
                    {/* Listening Text */}
                    <motion.div
                      animate={{
                        opacity: [1, 0.6, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <div style={{
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--error)',
                        textAlign: 'center',
                      }}>
                        Mic is ON • Listening...
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--muted-foreground)',
                        textAlign: 'center',
                      }}>
                        Speak your question clearly
                      </div>
                    </motion.div>
                    
                    {/* Audio Waveform Visual (decorative) */}
                    <div className="flex items-center justify-center gap-1" style={{ height: 28 }}>
                      {[...Array(9)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            height: ['6px', '28px', '6px'],
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: i * 0.1,
                          }}
                          style={{
                            width: 3,
                            backgroundColor: 'var(--error)',
                            borderRadius: 2,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Optional: Add Photo to Question */}
                  <div className="flex flex-col gap-3">
                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--border)' }} />
                      <span style={{
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: 'var(--muted-foreground)',
                      }}>
                        Optional
                      </span>
                      <div className="flex-1" style={{ height: 1, backgroundColor: 'var(--border)' }} />
                    </div>
                    
                    {/* Image Upload Button */}
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      onClick={() => imageInputRef.current?.click()}
                      className="flex items-center justify-center gap-2 cursor-pointer"
                      style={{
                        padding: '12px 16px',
                        backgroundColor: doubtImage ? 'var(--success-alpha-15)' : 'var(--secondary-bg)',
                        border: doubtImage ? '2px solid var(--success)' : '2px solid var(--border)',
                        borderRadius: 12,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <ImageIcon style={{ 
                        width: 20, 
                        height: 20, 
                        color: doubtImage ? 'var(--success)' : 'var(--foreground)',
                        strokeWidth: 2,
                      }} />
                      <span style={{
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-weight-medium)',
                        color: doubtImage ? 'var(--success)' : 'var(--foreground)',
                      }}>
                        {doubtImage ? 'Photo Added' : 'Add Photo (Optional)'}
                      </span>
                    </motion.button>
                    
                    {/* Hidden file input */}
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    
                    {/* Image Preview */}
                    {doubtImage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                          position: 'relative',
                          width: '100%',
                          maxWidth: 200,
                          borderRadius: 12,
                          overflow: 'hidden',
                          border: '2px solid var(--success)',
                          alignSelf: 'center',
                        }}
                      >
                        <img
                          src={doubtImage}
                          alt="Question Context"
                          style={{
                            width: '100%',
                            height: 'auto',
                            display: 'block',
                          }}
                        />
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setDoubtImage(null)}
                          className="flex items-center justify-center cursor-pointer"
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 28,
                            height: 28,
                            backgroundColor: 'var(--error)',
                            border: 'none',
                            borderRadius: '50%',
                          }}
                        >
                          <XIcon style={{ width: 16, height: 16, color: 'var(--white)', strokeWidth: 2.5 }} />
                        </motion.button>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Submit Question Button */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDoubtSubmit}
                    style={{
                      padding: '16px 20px',
                      backgroundColor: 'var(--primary)',
                      border: 'none',
                      borderRadius: 12,
                      cursor: 'pointer',
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--primary-foreground)',
                      boxShadow: '0 4px 20px var(--primary-alpha-40)',
                      transition: 'all 0.2s ease',
                      marginTop: 8,
                    }}
                  >
                    Submit Question
                  </motion.button>
                </>
              ) : !showDoubtExplanation ? (
                /* Submission Success */
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                  style={{
                    padding: 20,
                    textAlign: 'center',
                  }}
                >
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      backgroundColor: 'var(--success-alpha-15)',
                    }}
                  >
                    <Check style={{ width: 36, height: 36, color: 'var(--success)', strokeWidth: 3 }} />
                  </div>
                  
                  <div>
                    <h3 style={{
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 'var(--text-lg)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--success)',
                      margin: '0 0 8px 0',
                    }}>
                      Doubt Received!
                    </h3>
                    <p style={{
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--muted-foreground)',
                      margin: 0,
                    }}>
                      The tutor is preparing to explain...
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Tutor's Explanation */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4"
                >
                  {/* Tutor Explanation Card */}
                  <div style={{
                    padding: 16,
                    backgroundColor: 'var(--primary-alpha-15)',
                    border: '2px solid var(--primary-alpha-30)',
                    borderRadius: 16,
                    boxShadow: 'var(--elevation-md)',
                  }}>
                    {/* Tutor Header */}
                    <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                      <div
                        className="flex items-center justify-center"
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: 'var(--primary)',
                        }}
                      >
                        <GraduationCap style={{ width: 20, height: 20, color: 'var(--primary-foreground)' }} />
                      </div>
                      <div>
                        <div style={{
                          fontFamily: 'var(--font-family-inter)',
                          fontSize: 'var(--text-sm)',
                          fontWeight: 'var(--font-weight-semibold)',
                          color: 'var(--primary)',
                        }}>
                          Tutor's Response
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-family-inter)',
                          fontSize: 'var(--text-xs)',
                          color: 'var(--muted-foreground)',
                        }}>
                          Physics Expert
                        </div>
                      </div>
                    </div>
                    
                    {/* Explanation Text */}
                    <p style={{
                      fontFamily: 'var(--font-family-inter)',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--foreground)',
                      margin: 0,
                      lineHeight: 1.6,
                      fontWeight: 'var(--font-weight-medium)',
                    }}>
                      Great question! Let me explain this concept clearly. When dealing with electromagnetic induction, remember that the induced EMF depends on the rate of change of magnetic flux. The key formula is Faraday's Law: ε = -dΦ/dt.
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3">
                    {/* Continue Button */}
                    <motion.button
                      whileTap={!isDoubtAudioPlaying ? { scale: 0.98 } : {}}
                      onClick={handleContinueAfterDoubt}
                      disabled={isDoubtAudioPlaying}
                      style={{
                        padding: '12px 20px',
                        backgroundColor: isDoubtAudioPlaying 
                          ? 'var(--disabled-bg)' 
                          : 'var(--primary)',
                        border: 'none',
                        borderRadius: 12,
                        cursor: isDoubtAudioPlaying ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-base)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: isDoubtAudioPlaying
                          ? 'var(--disabled-text)'
                          : 'var(--primary-foreground)',
                        opacity: 1,
                        transition: 'all 0.3s ease',
                        boxShadow: isDoubtAudioPlaying 
                          ? 'none' 
                          : '0 6px 24px var(--primary-alpha-40)',
                      }}
                    >
                      Continue Learning
                    </motion.button>
                    
                    {/* Ask Follow-up Question Button */}
                    <motion.button
                      whileTap={!isDoubtAudioPlaying ? { scale: 0.98 } : {}}
                      onClick={() => {
                        if (isDoubtAudioPlaying) return;
                        // Reset to ask another doubt
                        setShowDoubtExplanation(false);
                        setDoubtSubmitted(false);
                        setIsDoubtAudioPlaying(false);
                        setDoubtText('');
                        setDoubtImage(null);
                        setIsRecordingAudio(false);
                        setIsFollowUpQuestion(true); // Mark as follow-up
                      }}
                      disabled={isDoubtAudioPlaying}
                      className="flex items-center justify-center gap-2"
                      style={{
                        padding: '12px 20px',
                        backgroundColor: 'transparent',
                        border: isDoubtAudioPlaying
                          ? '2px solid var(--border)'
                          : '2px solid var(--primary-alpha-50)',
                        borderRadius: 12,
                        cursor: isDoubtAudioPlaying ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: isDoubtAudioPlaying
                          ? 'var(--muted-foreground)'
                          : 'var(--primary)',
                        opacity: isDoubtAudioPlaying ? 0.5 : 1,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <MessageCircle style={{ width: 18, height: 18, strokeWidth: 2.5 }} />
                      Still have doubts? Ask again
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>
        )}
      </AnimatePresence>
      
      {/* ══ GUIDED TOUR OVERLAY ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {tourActive && (() => {
          const step = TOUR_STEPS[tourStep];
          if (!step) return null;

          if (step.type === 'fullscreen') {
            return (
              <>
                {/* Backdrop — keeps live class visible behind sheet */}
                <motion.div
                  key={`tour-backdrop-full-${tourStep}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0"
                  style={{ zIndex: 198, backgroundColor: 'color-mix(in srgb, var(--background) 55%, transparent)' }}
                />
                {/* Bottom sheet / Center modal */}
                <motion.div
                  key={`tour-full-${tourStep}`}
                  initial={isLandscape ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
                  animate={isLandscape ? { opacity: 1, scale: 1 } : { y: 0 }}
                  exit={isLandscape ? { opacity: 0, scale: 0.95 } : { y: '100%' }}
                  transition={isLandscape
                    ? { duration: 0.18, ease: 'easeOut' }
                    : { duration: 0.35, ease: [0.32, 0.72, 0, 1] }
                  }
                  className="absolute flex flex-col items-center"
                  style={isLandscape ? {
                    top: '50%', left: '50%',
                    x: '-50%', y: '-50%',
                    width: 'calc(100% - 32px)',
                    maxWidth: 480,
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    zIndex: 200,
                    backgroundColor: 'var(--background)',
                    borderRadius: 24,
                    padding: '12px 24px 32px',
                    border: '1px solid var(--white-alpha-8)',
                  } : {
                    left: 0, right: 0, bottom: 0,
                    zIndex: 200,
                    backgroundColor: 'var(--background)',
                    borderTopLeftRadius: 24,
                    borderTopRightRadius: 24,
                    padding: '12px 24px 44px',
                    borderTop: '1px solid var(--white-alpha-8)',
                  }}
                >
                  {/* Handle */}
                  <div style={{
                    width: 36, height: 4, borderRadius: 9999,
                    backgroundColor: 'var(--white-alpha-20)',
                    marginBottom: 20,
                  }} />

                  {/* Tutor avatar */}
                  <div className="relative flex items-center justify-center" style={{ width: 88, height: 88, marginBottom: 16 }}>
                    {/* Outer glow pulse — speaking only */}
                    <AnimatePresence>
                      {isSpeaking && (
                        <motion.div
                          key="speak-ring-outer"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: [1, 1.4, 1], opacity: [0, 1, 0] }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                          style={{
                            position: 'absolute', inset: -14, borderRadius: 9999,
                            background: 'radial-gradient(circle, var(--primary-alpha-60) 0%, transparent 68%)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}
                    </AnimatePresence>
                    {/* Border ring — breathes while speaking */}
                    <motion.div
                      animate={isSpeaking
                        ? { scale: [1, 1.15, 1], opacity: [0, 1, 0] }
                        : { scale: 1, opacity: 0 }}
                      transition={isSpeaking
                        ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                        : { duration: 0.3 }}
                      style={{
                        position: 'absolute', inset: -5, borderRadius: 9999,
                        border: '3px solid var(--primary)',
                        pointerEvents: 'none',
                      }}
                    />
                    <div style={{
                      width: 80, height: 80, borderRadius: 9999,
                      overflow: 'hidden',
                      border: '2px solid var(--primary-alpha-40)',
                      boxShadow: '0 4px 16px color-mix(in srgb, var(--foreground) 15%, transparent)',
                    }}>
                      <img
                        src="/tutor-avatar.png"
                        alt="Tutor"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  {step.title && (
                    <div style={{
                      fontSize: 'var(--text-xl)',
                      fontWeight: 'var(--font-weight-bold)',
                      color: 'var(--foreground)',
                      textAlign: 'center',
                      marginBottom: 8,
                      lineHeight: 1.3,
                    }}>{step.title}</div>
                  )}

                  {/* Message */}
                  <div style={{
                    fontSize: 'var(--text-base)',
                    color: 'var(--muted-foreground)',
                    textAlign: 'center',
                    maxWidth: 280,
                    lineHeight: 1.6,
                    marginBottom: 20,
                  }}>{step.message}</div>

                  {/* Step dots */}
                  <div className="flex items-center gap-2" style={{ marginBottom: 20 }}>
                    {TOUR_STEPS.map((_, i) => (
                      <div key={i} style={{
                        width: i === tourStep ? 20 : 8,
                        height: 8,
                        borderRadius: 9999,
                        backgroundColor: i === tourStep ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 20%, transparent)',
                        transition: 'all 0.3s ease',
                      }} />
                    ))}
                  </div>

                  {/* CTA */}
                  <motion.button
                    whileTap={tourTyping ? {} : { scale: 0.97 }}
                    onClick={tourTyping ? undefined : advanceTour}
                    disabled={tourTyping}
                    className="cursor-pointer w-full"
                    style={{
                      height: 44,
                      background: tourTyping
                        ? 'var(--primary-alpha-40)'
                        : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-600) 100%)',
                      color: 'var(--white)',
                      border: 'none',
                      borderRadius: 12,
                      fontSize: 'var(--text-base)',
                      fontWeight: 'var(--font-weight-bold)',
                      fontFamily: 'var(--font-family-inter)',
                      boxShadow: tourTyping ? 'none' : '0 4px 24px var(--primary-alpha-40)',
                      cursor: tourTyping ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {step.cta}
                  </motion.button>
                </motion.div>
              </>
            );
          }

          // Bubble mode (steps 1–4)
          return (
            <>
              {/* Semi-dark backdrop (stops short of control bar — control bar elevated via zIndex) */}
              <motion.div
                key="tour-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0"
                style={{ zIndex: 148, backgroundColor: 'color-mix(in srgb, var(--background) 60%, transparent)' }}
              />

              {/* Floating bubble card */}
              <motion.div
                key={`tour-bubble-${tourStep}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.25 }}
                className="absolute"
                style={{
                  bottom: 116, left: 16, right: 16, zIndex: 150,
                }}
              >
                <div style={{
                  backgroundColor: 'var(--card)',
                  borderRadius: 20,
                  padding: 16,
                  border: '1px solid var(--primary-alpha-20)',
                  boxShadow: '0 8px 24px color-mix(in srgb, var(--foreground) 18%, transparent)',
                }}>
                  {/* Row: tutor icon + content */}
                  <div className="flex items-start gap-3">
                    {/* Tutor avatar — pulse ring when speaking */}
                    <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
                      <AnimatePresence>
                        {isSpeaking && (
                          <motion.div
                            key="bubble-speak-ring"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                            style={{
                              position: 'absolute', inset: -6, borderRadius: 9999,
                              border: '2px solid var(--primary)',
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                      </AnimatePresence>
                      <div style={{
                        width: 40, height: 40, borderRadius: 9999,
                        overflow: 'hidden',
                        border: '2px solid var(--primary-alpha-40)',
                      }}>
                        <img
                          src="/tutor-avatar.png"
                          alt="Tutor"
                          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1" style={{ minWidth: 0 }}>
                      <div style={{
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-2xs)',
                        fontWeight: 'var(--font-weight-semibold)',
                        color: 'var(--primary)',
                        letterSpacing: '0.08em',
                        marginBottom: 4,
                      }}>TUTOR</div>

                      <AnimatePresence mode="wait">
                        {tourTyping ? (
                          <motion.div
                            key="typing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex items-center gap-1"
                            style={{ paddingTop: 4 }}
                          >
                            {[0, 1, 2].map(i => (
                              <motion.div
                                key={i}
                                animate={{ y: [0, -4, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
                                style={{
                                  width: 8, height: 8, borderRadius: 9999,
                                  backgroundColor: 'var(--muted-foreground)',
                                }}
                              />
                            ))}
                          </motion.div>
                        ) : (
                          <motion.div
                            key={`msg-${tourStep}`}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              fontFamily: 'var(--font-family-inter)',
                              fontSize: 'var(--text-sm)',
                              color: 'var(--foreground)',
                              lineHeight: 1.5,
                            }}
                          >
                            {step.message}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Footer: dots + action */}
                  <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
                    {/* Step dots */}
                    <div className="flex items-center gap-1">
                      {TOUR_STEPS.map((_, i) => (
                        <div key={i} style={{
                          width: i === tourStep ? 16 : 4,
                          height: 4,
                          borderRadius: 9999,
                          backgroundColor: i === tourStep ? 'var(--primary)' : 'color-mix(in srgb, var(--foreground) 20%, transparent)',
                          transition: 'all 0.3s ease',
                        }} />
                      ))}
                    </div>

                    <motion.button
                      whileTap={tourTyping ? {} : { scale: 0.97 }}
                      onClick={tourTyping ? undefined : advanceTour}
                      disabled={tourTyping}
                      style={{
                        backgroundColor: tourTyping ? 'var(--primary-alpha-40)' : 'var(--primary)',
                        color: tourTyping ? 'var(--white-alpha-60)' : 'var(--white)',
                        border: 'none',
                        borderRadius: 12,
                        padding: '10px 20px',
                        cursor: tourTyping ? 'default' : 'pointer',
                        fontFamily: 'var(--font-family-inter)',
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-weight-semibold)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {step.cta}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ══ NUDGE OVERLAY (smart contextual nudges) ═══════════════════════════ */}
      <AnimatePresence>
        {activeNudge && (
          <motion.div
            key={activeNudge}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-3"
            style={{
              position: 'absolute', bottom: 100, left: 16, right: 16, zIndex: 120,
              backgroundColor: 'var(--card)',
              border: '1px solid var(--primary-alpha-30)',
              borderRadius: 12, padding: '12px 16px',
              boxShadow: '0 4px 20px var(--black-alpha-30)',
            }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 9999, overflow: 'hidden', flexShrink: 0, border: '1.5px solid var(--primary-alpha-40)' }}>
              <img src="/tutor-avatar.png" alt="Tutor" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block' }} />
            </div>
            <div className="flex-1">
              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-2xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--primary)', marginBottom: 4 }}>TUTOR</div>
              <div style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)', color: 'var(--foreground)', lineHeight: 1.45 }}>
                {NUDGE_MESSAGES[activeNudge]}
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => { setActiveNudge(null); activeNudgeRef.current = null; }}
              aria-label="Dismiss"
              className="shrink-0 cursor-pointer flex items-center justify-center"
              style={{ background: 'none', border: 'none', padding: '12px', margin: '-12px' }}
            >
              <XIcon style={{ width: 16, height: 16, color: 'var(--muted-foreground)' }} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Audio Elements for Feedback */}
      <audio ref={correctAnswerAudioRef} preload="auto" className="hidden">
        <source src="https://actions.google.com/sounds/v1/human_voices/human_congratulations.ogg" type="audio/ogg" />
      </audio>
      <audio ref={pollSubmitAudioRef} preload="auto" className="hidden">
        <source src="https://actions.google.com/sounds/v1/impacts/air_swoosh.ogg" type="audio/ogg" />
      </audio>
      <audio ref={questionAppearAudioRef} preload="auto" className="hidden">
        <source src="https://actions.google.com/sounds/v1/cartoon/notification_ding.ogg" type="audio/ogg" />
      </audio>
      {/* Hidden canvas that generates the physics lecture animation */}
      <canvas ref={lectureCanvasRef} style={{ display: 'none' }} />
      </div>

      {/* Post-live-class feedback sheet — auto-rises when user confirms Leave.
          On rating ≥ 4 we chain into ShareSheet via handleFeedbackSubmitted;
          skip + low-rating paths short-circuit straight to finalizeExit. */}
      <LiveClassFeedbackSheet
        open={showFeedback}
        onClose={finalizeExit}
        onSubmitted={handleFeedbackSubmitted}
        classId="physics-rotational-dynamics"
        teacherName="Priya"
      />

      {/* Post-positive-feedback share chain — only rises after a ≥ 4-star
          submit. Sheet handles its own cooldown writes; skip + send both
          land on finalizeExit. */}
      <ShareSheet
        open={showShareChain}
        onClose={finalizeExit}
        trigger="post-feedback"
        productKind="crash-course"
        productName="JEE Crash Course"
      />
    </div>
  );
}
