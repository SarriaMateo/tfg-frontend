import { useEffect, useState } from 'react';
import { getHealth } from '../services/healthService';

export default function HealthStatus() {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    getHealth()
      .then(res => setStatus(res.data.status))
      .catch(() => setStatus('error'));
  }, []);

  return <div>Backend status: {status}</div>;
}
