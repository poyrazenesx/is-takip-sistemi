'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Star, Gift, Heart } from 'lucide-react';

interface SpecialDay {
  date: string; // YYYY-MM-DD format
  title: string;
  type: 'holiday' | 'birthday' | 'event' | 'national';
  icon?: string;
}

interface CalendarProps {
  className?: string;
}

const Calendar: React.FC<CalendarProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Özel günler ve resmi tatiller
  const specialDays: SpecialDay[] = [
    // 2025 Resmi Tatiller (Doğru Tarihler)
    { date: '2025-01-01', title: 'Yılbaşı', type: 'holiday', icon: '★' },
    { date: '2025-04-23', title: 'Ulusal Egemenlik ve Çocuk Bayramı', type: 'national', icon: '●' },
    { date: '2025-05-01', title: 'Emek ve Dayanışma Günü', type: 'holiday', icon: '★' },
    { date: '2025-05-19', title: 'Atatürk\'ü Anma Gençlik ve Spor Bayramı', type: 'national', icon: '●' },
    { date: '2025-08-30', title: 'Zafer Bayramı', type: 'national', icon: '●' },
    { date: '2025-10-29', title: 'Cumhuriyet Bayramı', type: 'national', icon: '●' },
    
    // 2025 Dini Bayramlar (Doğru Tarihler)
    { date: '2025-03-30', title: 'Ramazan Bayramı 1. Gün', type: 'holiday', icon: '◐' },
    { date: '2025-03-31', title: 'Ramazan Bayramı 2. Gün', type: 'holiday', icon: '◐' },
    { date: '2025-04-01', title: 'Ramazan Bayramı 3. Gün', type: 'holiday', icon: '◐' },
    { date: '2025-06-06', title: 'Kurban Bayramı 1. Gün', type: 'holiday', icon: '◑' },
    { date: '2025-06-07', title: 'Kurban Bayramı 2. Gün', type: 'holiday', icon: '◑' },
    { date: '2025-06-08', title: 'Kurban Bayramı 3. Gün', type: 'holiday', icon: '◑' },
    { date: '2025-06-09', title: 'Kurban Bayramı 4. Gün', type: 'holiday', icon: '◑' },
    
    // Özel Günler
    { date: '2025-02-14', title: 'Sevgililer Günü', type: 'event', icon: '♥' },
    { date: '2025-03-08', title: 'Kadınlar Günü', type: 'event', icon: '♀' },
    { date: '2025-10-24', title: 'Öğretmenler Günü', type: 'event', icon: '♦' },
    { date: '2025-11-10', title: 'Atatürk\'ü Anma Günü', type: 'national', icon: '●' },
    { date: '2025-12-31', title: 'Yılbaşı Arifesi', type: 'event', icon: '★' },
  ];

  // Ayları ve günleri Türkçe isimleri
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  
  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  // Mevcut ay bilgileri
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  // Ayın ilk günü ve son günü
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  // Ayın ilk gününün haftanın hangi günü olduğu (Pazartesi = 0)
  const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7;

  // Takvim günlerini oluştur
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Önceki ayın son günleri
    for (let i = firstDayWeekday - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date: date.getDate(),
        isCurrentMonth: false,
        fullDate: date,
        dateString: date.toISOString().split('T')[0]
      });
    }
    
    // Bu ayın günleri
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        fullDate: date,
        dateString: date.toISOString().split('T')[0]
      });
    }
    
    // Sonraki ayın ilk günleri (42 gün tamamlanana kadar)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        fullDate: date,
        dateString: date.toISOString().split('T')[0]
      });
    }
    
    return days;
  }, [year, month, daysInMonth, firstDayWeekday]);

  // Önceki/sonraki ay navigasyonu
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

  // Bugüne git
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Belirli bir günün özel gün olup olmadığını kontrol et
  const getSpecialDay = (dateString: string) => {
    return specialDays.find(day => day.date === dateString);
  };

  // Günün stil class'ını belirle
  const getDayClassName = (day: any) => {
    const baseClass = 'calendar-day';
    const isToday = day.fullDate.toDateString() === today.toDateString();
    const specialDay = getSpecialDay(day.dateString);
    
    let classes = [baseClass];
    
    if (!day.isCurrentMonth) {
      classes.push('other-month');
    }
    
    if (isToday) {
      classes.push('today');
    }
    
    if (specialDay) {
      classes.push(`special-${specialDay.type}`);
    }
    
    return classes.join(' ');
  };

  return (
    <div className={`calendar-widget ${className}`}>
      <style jsx>{`
        .calendar-widget {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          padding: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          font-family: 'Alumni Sans', sans-serif;
          max-width: 240px;
          width: 100%;
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .calendar-title {
          font-size: 0.8rem;
          font-weight: 700;
          color: #1a202c;
          margin: 0;
        }

        .nav-buttons {
          display: flex;
          gap: 8px;
        }

        .nav-button {
          background: rgba(26, 32, 44, 0.1);
          border: none;
          border-radius: 4px;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #4a5568;
        }

        .nav-button:hover {
          background: rgba(26, 32, 44, 0.2);
          transform: scale(1.05);
        }

        .today-button {
          background: linear-gradient(135deg, #1e3a5f 0%, #2c5282 100%);
          color: white;
          border: none;
          border-radius: 4px;
          padding: 2px 6px;
          font-size: 0.6rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .today-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(30, 58, 95, 0.3);
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 1px;
        }

        .weekday {
          text-align: center;
          padding: 2px 1px;
          font-size: 0.55rem;
          font-weight: 600;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          font-size: 0.6rem;
          font-weight: 500;
          min-height: 22px;
        }

        .calendar-day:hover {
          background: rgba(72, 202, 178, 0.1);
          transform: scale(1.05);
        }

        .calendar-day.other-month {
          color: #cbd5e0;
          opacity: 0.5;
        }

        .calendar-day.today {
          background: linear-gradient(135deg, #48cab2 0%, #54a0ff 100%);
          color: white;
          font-weight: 700;
          box-shadow: 0 4px 12px rgba(72, 202, 178, 0.3);
        }

        .calendar-day.special-holiday {
          background: linear-gradient(135deg, #ff6b6b 0%, #ff8787 100%);
          color: white;
        }

        .calendar-day.special-national {
          background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
          color: white;
        }

        .calendar-day.special-event {
          background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
          color: white;
        }

        .calendar-day.special-birthday {
          background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
          color: white;
        }

        .day-number {
          font-size: 0.6rem;
          font-weight: 600;
        }

        .day-icon {
          font-size: 0.4rem;
          margin-top: 0px;
        }

        .special-days-list {
          margin-top: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          padding-top: 16px;
        }

        .special-days-title {
          font-size: 1rem;
          font-weight: 700;
          color: #1a202c;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .special-day-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 8px;
          margin-bottom: 4px;
          background: rgba(72, 202, 178, 0.1);
          font-size: 0.85rem;
        }

        .special-day-date {
          font-weight: 600;
          color: #2d3748;
          min-width: 40px;
        }

        .special-day-title {
          color: #4a5568;
          flex: 1;
        }

        @media (max-width: 768px) {
          .calendar-widget {
            padding: 6px;
            max-width: 200px;
          }
          
          .calendar-title {
            font-size: 0.7rem;
          }
          
          .calendar-day {
            min-height: 18px;
            font-size: 0.5rem;
          }
          
          .day-number {
            font-size: 0.5rem;
          }
          
          .day-icon {
            font-size: 0.35rem;
          }
          
          .nav-button {
            width: 18px;
            height: 18px;
          }
          
          .today-button {
            padding: 1px 4px;
            font-size: 0.5rem;
          }
        }
      `}</style>

      {/* Header */}
      <div className="calendar-header">
        <h3 className="calendar-title">
          {months[month]} {year}
        </h3>
        <div className="nav-buttons">
          <button 
            className="nav-button"
            onClick={() => navigateMonth('prev')}
            title="Önceki Ay"
          >
            <ChevronLeft size={10} />
          </button>
          <button 
            className="today-button"
            onClick={goToToday}
            title="Bugüne Git"
          >
            Bugün
          </button>
          <button 
            className="nav-button"
            onClick={() => navigateMonth('next')}
            title="Sonraki Ay"
          >
            <ChevronRight size={10} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Weekday Headers */}
        {weekDays.map(day => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
        
        {/* Calendar Days */}
        {calendarDays.map((day, index) => {
          const specialDay = getSpecialDay(day.dateString);
          return (
            <div 
              key={index} 
              className={getDayClassName(day)}
              title={specialDay ? specialDay.title : ''}
            >
              <span className="day-number">{day.date}</span>
              {specialDay && (
                <span className="day-icon">{specialDay.icon}</span>
              )}
            </div>
          );
        })}
      </div>


    </div>
  );
};

export default Calendar;