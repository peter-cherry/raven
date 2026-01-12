'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DateTimePickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(value ? new Date(value) : new Date());
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      const hours24 = date.getHours();
      const minutes = date.getMinutes().toString().padStart(2, '0');

      // Convert to 12-hour format
      const hours12 = hours24 === 0 ? 12 : hours24 > 12 ? hours24 - 12 : hours24;
      const period = hours24 >= 12 ? 'PM' : 'AM';

      setHour(hours12.toString().padStart(2, '0'));
      setMinute(minutes);
      setAmpm(period);
      setSelectedTime(`${hours24.toString().padStart(2, '0')}:${minutes}`);
    }
  }, [value]);

  const formatDisplayValue = () => {
    if (!value) return 'Select date and time';
    const date = new Date(value);
    const options: Intl.DateTimeFormatOptions = {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleString('en-US', options);
  };

  const quickPicks = [
    {
      label: 'ASAP',
      getValue: () => {
        const now = new Date();
        return now;
      }
    },
    {
      label: 'Tomorrow 9am',
      getValue: () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0);
        return tomorrow;
      }
    },
    {
      label: 'Next Monday',
      getValue: () => {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(9, 0, 0, 0);
        return nextMonday;
      }
    },
    {
      label: 'Next Week',
      getValue: () => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        nextWeek.setHours(9, 0, 0, 0);
        return nextWeek;
      }
    }
  ];

  const handleQuickPick = (getValue: () => Date) => {
    const date = getValue();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const isoString = `${year}-${month}-${day}T${hours}:${minutes}`;
    onChange(isoString);
    setShowPicker(false);
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={{ width: 36, height: 36 }} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const isToday = dateObj.getTime() === today.getTime();
      const isSelected = dateObj.getDate() === selectedDate.getDate() &&
                        dateObj.getMonth() === selectedDate.getMonth() &&
                        dateObj.getFullYear() === selectedDate.getFullYear();
      const isPast = dateObj < today;

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => {
            const newDate = new Date(year, month, day);
            setSelectedDate(newDate);
          }}
          disabled={isPast}
          style={{
            width: 36,
            height: 36,
            border: 'none',
            borderRadius: '50%',
            background: isSelected ? '#656290' : isToday ? 'rgba(101, 98, 144, 0.2)' : 'transparent',
            color: isSelected ? '#FFFFFF' : isPast ? 'rgba(255, 255, 255, 0.3)' : 'var(--text-primary)',
            fontFamily: 'var(--font-text-body)',
            fontSize: 'var(--font-sm)',
            fontWeight: isToday ? 'var(--font-weight-bold)' : 'var(--font-weight-regular)',
            cursor: isPast ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            opacity: isPast ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            if (!isPast && !isSelected) {
              e.currentTarget.style.background = 'rgba(101, 98, 144, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPast && !isSelected) {
              e.currentTarget.style.background = isToday ? 'rgba(101, 98, 144, 0.2)' : 'transparent';
            }
          }}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const handleApply = () => {
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');

    // Convert 12-hour format to 24-hour format
    let hours24 = parseInt(hour);
    if (ampm === 'PM' && hours24 !== 12) {
      hours24 += 12;
    } else if (ampm === 'AM' && hours24 === 12) {
      hours24 = 0;
    }

    const hours24Str = hours24.toString().padStart(2, '0');
    const isoString = `${year}-${month}-${day}T${hours24Str}:${minute}`;
    onChange(isoString);
    setShowPicker(false);
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div style={{ position: 'relative' }}>
      {/* Input Field */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="text-input"
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: value ? 'var(--text-primary)' : 'var(--text-secondary)'
        }}
      >
        <span>{formatDisplayValue()}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      </button>

      {/* Picker Dropdown */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              zIndex: 1000,
              background: 'rgba(47, 47, 47, 0.95)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              borderRadius: 'var(--container-border-radius)',
              padding: 'var(--spacing-lg)',
              minWidth: 320,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
            }}
          >
            {/* Quick Picks */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily: 'var(--font-text-body)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                Quick Picks
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                {quickPicks.map((pick) => (
                  <button
                    key={pick.label}
                    type="button"
                    onClick={() => handleQuickPick(pick.getValue)}
                    className="outline-button"
                    style={{
                      padding: '6px 12px',
                      fontSize: 'var(--font-sm)'
                    }}
                  >
                    {pick.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Month/Year Selector */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--spacing-md)'
            }}>
              <button
                type="button"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() - 1);
                  setSelectedDate(newDate);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: 'var(--spacing-sm)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <div style={{
                fontFamily: 'var(--font-text-body)',
                fontSize: 'var(--font-md)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)'
              }}>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </div>
              <button
                type="button"
                onClick={() => {
                  const newDate = new Date(selectedDate);
                  newDate.setMonth(newDate.getMonth() + 1);
                  setSelectedDate(newDate);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  padding: 'var(--spacing-sm)'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            {/* Day Labels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)', gap: 4, marginBottom: 'var(--spacing-sm)' }}>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div
                  key={day}
                  style={{
                    width: 36,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-xs)',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-text-body)',
                    fontWeight: 'var(--font-weight-semibold)'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 36px)', gap: 4, marginBottom: 'var(--spacing-lg)' }}>
              {renderCalendar()}
            </div>

            {/* Time Picker */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--text-secondary)',
                marginBottom: 'var(--spacing-sm)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontFamily: 'var(--font-text-body)',
                fontWeight: 'var(--font-weight-semibold)'
              }}>
                Time
              </div>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                {/* Hour Dropdown */}
                <select
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  className="select-input"
                  style={{ flex: 1 }}
                >
                  {Array.from({ length: 12 }, (_, i) => {
                    const h = (i + 1).toString().padStart(2, '0');
                    return <option key={h} value={h}>{h}</option>;
                  })}
                </select>

                {/* Minute Dropdown */}
                <select
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  className="select-input"
                  style={{ flex: 1 }}
                >
                  {['00', '15', '30', '45'].map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>

                {/* AM/PM Dropdown */}
                <select
                  value={ampm}
                  onChange={(e) => setAmpm(e.target.value as 'AM' | 'PM')}
                  className="select-input"
                  style={{ flex: 1 }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="outline-button"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="primary-button"
                style={{ flex: 1 }}
              >
                Apply
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
