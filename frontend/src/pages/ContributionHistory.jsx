import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SpotlightCard from '../components/SpotlightCard';
import TransactionHistoryList from '../components/TransactionHistoryList';
import { useWallet } from '../hooks/useWallet';

export default function ContributionHistory() {
  const navigate = useNavigate();
  const { walletConnected, userRole, myActivity } = useWallet();

  useEffect(() => {
    if (!walletConnected) {
      navigate('/');
      return;
    }
    if (userRole === 'admin') {
      navigate('/admin');
    }
  }, [navigate, userRole, walletConnected]);

  return (
    <div className="isdasure-shell">
      <Navbar />
      <main className="space-y-8 py-6 md:py-10">
        <SpotlightCard className="space-y-4">
          <p className="linear-kicker">User records</p>
          <h1 className="linear-heading max-w-2xl text-4xl sm:text-5xl md:text-6xl">Contribution History</h1>
          <p className="linear-lead max-w-2xl">All your contribution transactions are stored and shown here in a scrollable list.</p>
        </SpotlightCard>

        <TransactionHistoryList title="Contribution History" items={myActivity} emptyText="No contributions yet" />
      </main>
    </div>
  );
}
