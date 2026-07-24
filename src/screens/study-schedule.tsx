/**
 * Study Schedule Settings Screen
 * Allow users to set their preferred study times for auto-scheduling live classes
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { ArrowLeft, Check, Sun, Cloud, Sunset, Moon, Calendar } from 'lucide-react';
import { GlassHeader, StatusBar } from '../shared/premium-ui';

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning', time: '6-9 AM', icon: Sun, color: 'var(--warning-500)' },
  { id: 'afternoon', label: 'Afternoon', time: '2-5 PM', icon: Cloud, color: 'var(--primary)' },
  { id: 'evening', label: 'Evening', time: '6-9 PM', icon: Sunset, color: 'var(--error-500)' },
  { id: 'night', label: 'Night', time: '9-12 PM', icon: Moon, color: 'var(--purple-500)' },
];

const DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
];

export function Component() {
  const navigate = useNavigate();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('evening');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'wed', 'fri']);
  const [saved, setSaved] = useState(false);

  // Load saved preferences
  useEffect(() => {
    const savedTimeSlot = localStorage.getItem('study-time-slot');
    const savedDays = localStorage.getItem('study-days');

    if (savedTimeSlot) setSelectedTimeSlot(savedTimeSlot);
    if (savedDays) setSelectedDays(JSON.parse(savedDays));
  }, []);

  const handleDayToggle = (dayId: string) => {
    setSelectedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => navigate(-1), 1000);
    return () => clearTimeout(timer);
  }, [saved, navigate]);

  const handleSave = () => {
    localStorage.setItem('study-time-slot', selectedTimeSlot);
    localStorage.setItem('study-days', JSON.stringify(selectedDays));
    setSaved(true);
  };

  const getNextClassSchedule = () => {
    if (selectedDays.length === 0) return "No classes scheduled";

    const selectedSlot = TIME_SLOTS.find(slot => slot.id === selectedTimeSlot);
    const sortedDays = DAYS.filter(d => selectedDays.includes(d.id));

    return `Next class: ${sortedDays[0].label} ${selectedSlot?.time}`;
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--background)' }}>
      {/* Header */}
      <GlassHeader>
        <StatusBar />
        <div className="flex items-center gap-3" style={{ height: 52, padding: '0 20px' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="flex items-center justify-center cursor-pointer"
            style={{ background: 'transparent', border: 'none', padding: 0 }}
          >
            <ArrowLeft style={{ width: 22, height: 22, color: 'var(--muted-foreground)', strokeWidth: 1.5 }} />
          </motion.button>
          <h1 style={{ fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--foreground)', margin: 0 }}>
            Study Schedule
          </h1>
        </div>
      </GlassHeader>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 20px 24px' }}>
        {/* Description */}
        <p style={{
          fontFamily: 'var(--font-family-inter)',
          fontSize: 'var(--text-sm)',
          color: 'var(--muted-foreground)',
          margin: '0 0 24px 0',
          lineHeight: 1.6,
        }}>
          Live classes will be automatically scheduled based on your preferred time and days. Join interactive sessions with AI tutor!
        </p>

        {/* Time Slot Selection */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontFamily: 'var(--font-family-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: '0 0 12px 0',
          }}>
            Preferred Time
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}>
            {TIME_SLOTS.map((slot, index) => {
              const Icon = slot.icon;
              const isSelected = selectedTimeSlot === slot.id;

              return (
                <motion.button
                  key={slot.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.3 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedTimeSlot(slot.id)}
                  aria-pressed={isSelected}
                  style={{
                    padding: '16px',
                    background: isSelected
                      ? 'var(--gradient-primary-btn)'
                      : 'linear-gradient(135deg, var(--card) 0%, var(--muted) 100%)',
                    border: isSelected ? '2px solid transparent' : '1px solid var(--border)',
                    borderRadius: 16,
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: isSelected ? 'var(--glow-primary)' : 'var(--elevation-sm)',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {/* Radial glow when selected */}
                  {isSelected && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
                      position: 'absolute', inset: 0,
                      background: 'radial-gradient(circle at 50% 50%, var(--white-alpha-12) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }} />
                  )}

                  <div className="flex items-center gap-2" style={{ marginBottom: 4, position: 'relative', zIndex: 1 }}>
                    <Icon style={{
                      width: 20, height: 20,
                      color: isSelected ? 'var(--white)' : slot.color,
                      strokeWidth: 1.8,
                    }} />
                    <span style={{
                      fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
                      color: isSelected ? 'var(--white)' : 'var(--foreground)',
                    }}>{slot.label}</span>
                  </div>

                  <span style={{
                    fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-sm)',
                    color: isSelected ? 'var(--white-alpha-80)' : 'var(--muted-foreground)',
                    position: 'relative', zIndex: 1,
                  }}>{slot.time}</span>

                  {isSelected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                      className="absolute flex items-center justify-center"
                      style={{
                        top: 12, right: 12,
                        width: 20, height: 20, backgroundColor: 'var(--white-alpha-25)',
                        borderRadius: '50%', zIndex: 1,
                      }}>
                      <Check style={{ width: 12, height: 12, color: 'var(--white)', strokeWidth: 3 }} />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Day Selection */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{
            fontFamily: 'var(--font-family-inter)',
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-weight-semibold)',
            color: 'var(--foreground)',
            margin: '0 0 12px 0',
          }}>
            Study Days
          </h2>

          <div className="flex gap-2">
            {DAYS.map(day => {
              const isSelected = selectedDays.includes(day.id);

              return (
                <motion.button
                  key={day.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDayToggle(day.id)}
                  aria-pressed={isSelected}
                  className="flex items-center justify-center cursor-pointer"
                  style={{
                    width: 44, height: 44,
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--card)',
                    border: isSelected ? 'none' : '1px solid var(--border)',
                    borderRadius: 12,
                    fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-xs)', fontWeight: 'var(--font-weight-semibold)',
                    color: isSelected ? 'var(--white)' : 'var(--muted-foreground)',
                    boxShadow: isSelected ? 'var(--glow-primary)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {day.label}
                </motion.button>
              );
            })}
          </div>

          <p style={{
            fontFamily: 'var(--font-family-inter)',
            fontSize: 'var(--text-xs)',
            color: 'var(--muted-foreground)',
            margin: '8px 0 0 0',
          }}>
            Select at least 2 days for best learning consistency
          </p>
        </div>

        {/* Next Class Preview */}
        <div className="flex items-center gap-3" style={{
          padding: 16,
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 12,
        }}>
          <div className="flex items-center justify-center shrink-0" style={{
            width: 40,
            height: 40,
            backgroundColor: 'var(--primary-alpha-12)',
            borderRadius: 8,
          }}>
            <Calendar style={{ width: 20, height: 20, color: 'var(--primary)', strokeWidth: 2 }} />
          </div>

          <div className="flex-1">
            <div style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: 'var(--foreground)',
              marginBottom: 2,
            }}>
              {getNextClassSchedule()}
            </div>
            <div style={{
              fontFamily: 'var(--font-family-inter)',
              fontSize: 'var(--text-xs)',
              color: 'var(--muted-foreground)',
            }}>
              {/* TODO(api): GET /api/schedule/next-topic */}
              Next scheduled topic
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Save Button */}
      <div className="shrink-0" style={{
        padding: '12px 20px 24px',
        background: 'linear-gradient(to top, var(--background) 70%, transparent)',
      }}>
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={selectedDays.length === 0}
          className="w-full flex items-center justify-center gap-2"
          style={{
            maxWidth: 400, margin: '0 auto',
            padding: 16,
            background: selectedDays.length === 0 ? 'var(--muted)' : 'var(--gradient-primary-btn)',
            color: selectedDays.length === 0 ? 'var(--muted-foreground)' : 'var(--white)',
            border: 'none', borderRadius: 12,
            cursor: selectedDays.length === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-family-inter)', fontSize: 'var(--text-base)', fontWeight: 'var(--font-weight-semibold)',
            boxShadow: selectedDays.length === 0 ? 'none' : 'var(--glow-primary)',
          }}
        >
          {saved ? (
            <><Check style={{ width: 18, height: 18, strokeWidth: 2.5 }} /> Saved!</>
          ) : 'Save Schedule'}
        </motion.button>
      </div>
    </div>
  );
}
