'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  className?: string;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // 2025 Türkiye resmi tatilleri - DOĞRU TARİHLER
  const holidays: { [key: string]: string } = {
    '2025-01-01': '🎊', // Yılbaşı
    '2025-04-23': '🇹🇷', // 23 Nisan Ulusal Egemenlik ve Çocuk Bayramı
    '2025-05-01': '⚒️', // İşçi Bayramı
    '2025-05-19': '🇹🇷', // 19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı
    '2025-08-30': '🇹🇷', // 30 Ağustos Zafer Bayramı
    '2025-10-29': '🇹🇷', // 29 Ekim Cumhuriyet Bayramı
    // Ramazan Bayramı 2025 (30 Mart - 1 Nisan)
    '2025-03-30': '🌙', // Ramazan Bayramı 1. gün
    '2025-03-31': '🌙', // Ramazan Bayramı 2. gün
    '2025-04-01': '🌙', // Ramazan Bayramı 3. gün
    // Kurban Bayramı 2025 (6-9 Haziran)
    '2025-06-06': '🕌', // Kurban Bayramı 1. gün
    '2025-06-07': '🕌', // Kurban Bayramı 2. gün
    '2025-06-08': '🕌', // Kurban Bayramı 3. gün
    '2025-06-09': '🕌', // Kurban Bayramı 4. gün
    // Özel günler
    '2025-02-14': '💝', // Sevgililer Günü
    '2025-03-08': '🌸', // Kadınlar Günü
    '2025-11-24': '👨‍🏫', // Öğretmenler Günü
    '2025-12-31': '🎉', // Yılbaşı Arifesi
  };

  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const weekDays = ['P', 'S', 'Ç', 'P', 'C', 'C', 'P'];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Pazartesi = 0

  const calendarDays = [];
  
  // Önceki ayın son günleri
  for (let i = firstDayWeekday - 1; i >= 0; i--) {
    const date = new Date(year, month, -i);
    calendarDays.push({
      date: date.getDate(),
      isCurrentMonth: false,
      fullDate: date,
    });
  }
  
  // Bu ayın günleri
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    calendarDays.push({
      date: day,
      isCurrentMonth: true,
      fullDate: date,
    });
  }
  
  // Sonraki ayın ilk günleri (42 gün tamamlanana kadar)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day);
    calendarDays.push({
      date: day,
      isCurrentMonth: false,
      fullDate: date,
    });
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const getHoliday = (date: Date) => {
    return holidays[getDateString(date)];
  };

  return (
    <div className={`mini-calendar ${className}`}>
      <style jsx>{`
        .mini-calendar {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          width: 180px;
          font-family: 'Alumni Sans', sans-serif;
        }

        .mini-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .mini-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }

        .mini-nav {
          display: flex;
          gap: 2px;
        }

        .mini-nav-btn {
          background: none;
          border: none;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 2px;
          color: #4a5568;
        }

        .mini-nav-btn:hover {
          background: rgba(74, 85, 104, 0.1);
        }

        .mini-today-btn {
          background: #1e3a5f;
          color: white;
          border: none;
          border-radius: 3px;
          padding: 1px 4px;
          font-size: 0.6rem;
          cursor: pointer;
          font-weight: 600;
        }

        .mini-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
        }

        .mini-weekday {
          text-align: center;
          padding: 2px;
          font-size: 0.6rem;
          font-weight: 600;
          color: #718096;
        }

        .mini-day {
          width: 20px;
          height: 18px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 0.65rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: 2px;
          position: relative;
        }

        .mini-day:hover {
          background: rgba(72, 202, 178, 0.1);
        }

        .mini-day.other-month {
          color: #cbd5e0;
          opacity: 0.6;
        }

        .mini-day.today {
          background: #48cab2;
          color: white;
          font-weight: 700;
        }

        .mini-day.holiday {
          background: #ff6b6b;
          color: white;
          font-weight: 600;
        }

        .mini-day-number {
          font-size: 0.6rem;
          line-height: 1;
        }

        .mini-holiday-icon {
          position: absolute;
          top: -2px;
          right: -2px;
          font-size: 0.5rem;
          line-height: 1;
        }

        @media (max-width: 768px) {
          .mini-calendar {
            width: 150px;
            padding: 6px;
          }
          
          .mini-day {
            width: 16px;
            height: 14px;
          }
          
          .mini-day-number {
            font-size: 0.5rem;
          }
          
          .mini-holiday-icon {
            font-size: 0.4rem;
          }
          
          .mini-title {
            font-size: 0.65rem;
          }
        }
      `}</style>

      {/* Header */}
      <div className="mini-header">
        <h4 className="mini-title">
          {months[month]} {year}
        </h4>
        <div className="mini-nav">
          <button 
            className="mini-nav-btn"
            onClick={() => navigateMonth('prev')}
            title="Önceki Ay"
          >
            <ChevronLeft size={10} />
          </button>
          <button 
            className="mini-today-btn"
            onClick={goToToday}
            title="Bugün"
          >
            Bugün
          </button>
          <button 
            className="mini-nav-btn"
            onClick={() => navigateMonth('next')}
            title="Sonraki Ay"
          >
            <ChevronRight size={10} />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="mini-grid">
        {/* Weekday Headers */}
        {weekDays.map((day, index) => (
          <div key={index} className="mini-weekday">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const holiday = day.isCurrentMonth ? getHoliday(day.fullDate) : null;
          const dayIsToday = day.isCurrentMonth && isToday(day.fullDate);
          
          return (
            <div 
              key={index} 
              className={`mini-day ${!day.isCurrentMonth ? 'other-month' : ''} ${dayIsToday ? 'today' : ''} ${holiday ? 'holiday' : ''}`}
              title={holiday ? 'Özel Gün' : ''}
            >
              <span className="mini-day-number">{day.date}</span>
              {holiday && (
                <span className="mini-holiday-icon">{holiday}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;