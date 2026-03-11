import React, { useState, useEffect } from 'react';

const RealTimeAgo = ({ date }) => {
    const [timeAgo, setTimeAgo] = useState('');

    useEffect(() => {
        if (!date) return;

        const calculateTimeAgo = () => {
            const now = new Date();
            const pastDate = new Date(date);
            const diffInSeconds = Math.floor((now - pastDate) / 1000);

            if (diffInSeconds < 0) {
                setTimeAgo('Şimdi');
                return;
            }

            const days = Math.floor(diffInSeconds / (3600 * 24));
            const hours = Math.floor((diffInSeconds % (3600 * 24)) / 3600);
            const minutes = Math.floor((diffInSeconds % 3600) / 60);
            const seconds = diffInSeconds % 60;

            let result = '';
            if (days > 0) result += `${days} gün `;
            if (hours > 0 || days > 0) result += `${hours} saat `;
            if (minutes > 0 || hours > 0 || days > 0) result += `${minutes} dk `;
            result += `${seconds} sn önce`;

            setTimeAgo(result);
        };

        // İlk hesaplama
        calculateTimeAgo();

        // Saniyede bir güncelle
        const interval = setInterval(calculateTimeAgo, 1000);

        return () => clearInterval(interval);
    }, [date]);

    return <span>{timeAgo}</span>;
};

export default RealTimeAgo;
