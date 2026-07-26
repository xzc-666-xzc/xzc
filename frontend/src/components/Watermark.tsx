import { useState, useEffect } from 'react';

interface WatermarkProps {
  text?: string;
}

export default function Watermark({ text }: WatermarkProps) {
  const [timestamp, setTimestamp] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimestamp(
        now.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="watermark">
      {text || '多模态智能面试评测平台'} · {timestamp}
    </div>
  );
}
